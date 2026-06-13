import { useEffect } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useWarehouseActivityLogs } from '@/hooks/useWarehouseActivityLogs';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Pencil, Trash2, Archive, User, Clock } from 'lucide-react';

const ACTION_CONFIG = {
  added: { label: 'Добавлен', icon: Plus, color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  updated: { label: 'Изменён', icon: Pencil, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  deleted: { label: 'Удалён', icon: Trash2, color: 'bg-red-500/10 text-red-600 border-red-500/20' },
  archived: { label: 'Архивирован', icon: Archive, color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
};

export const WarehouseActivityLog = () => {
  const { logs, loading, fetchLogs } = useWarehouseActivityLogs();

  useEffect(() => {
    fetchLogs(30);

    // Subscribe to real-time updates
    const channel = supabase
      .channel('warehouse-activity-logs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'warehouse_activity_logs'
        },
        () => {
          fetchLogs(30);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLogs]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">История действий</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">Загрузка...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          История действий
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {logs.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Нет записей
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const config = ACTION_CONFIG[log.action_type] || ACTION_CONFIG.updated;
                const Icon = config.icon;
                const itemName = typeof log.item_name === 'object' 
                  ? (log.item_name.ru || log.item_name.en || 'Без названия')
                  : String(log.item_name);
                
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className={`p-2 rounded-full ${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={config.color}>
                          {config.label}
                        </Badge>
                        <span className="font-medium truncate">{itemName}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{log.user_name || log.user_email || 'Неизвестно'}</span>
                        <span>•</span>
                        <span>
                          {format(new Date(log.created_at), 'dd MMM yyyy, HH:mm', { locale: ru })}
                        </span>
                      </div>
                      {log.changes && Object.keys(log.changes).length > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Изменения: {Object.keys(log.changes).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
