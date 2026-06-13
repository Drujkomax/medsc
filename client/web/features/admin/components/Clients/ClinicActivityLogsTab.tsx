import { History, Plus, Edit, Trash2, Archive, RotateCcw, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useClinicActivityLogs } from '@/hooks/useClinicActivityLogs';

interface ClinicActivityLogsTabProps {
  clientId: string;
}

const ACTION_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  created: { label: 'Создано', icon: Plus, color: 'bg-green-500' },
  updated: { label: 'Изменено', icon: Edit, color: 'bg-blue-500' },
  deleted: { label: 'Удалено', icon: Trash2, color: 'bg-red-500' },
  archived: { label: 'Архивировано', icon: Archive, color: 'bg-orange-500' },
  restored: { label: 'Восстановлено', icon: RotateCcw, color: 'bg-purple-500' },
};

export const ClinicActivityLogsTab = ({ clientId }: ClinicActivityLogsTabProps) => {
  const { logs, loading } = useClinicActivityLogs(clientId);

  const getActionConfig = (actionType: string) => {
    return ACTION_CONFIG[actionType] || { label: actionType, icon: History, color: 'bg-gray-500' };
  };

  const formatChangedFields = (fields: Record<string, any>) => {
    if (!fields || Object.keys(fields).length === 0) return null;
    
    return Object.entries(fields).map(([key, value]) => {
      const fieldLabels: Record<string, string> = {
        name: 'Название',
        legal_name: 'Юр. название',
        contact_person: 'Контактное лицо',
        email: 'Email',
        phone: 'Телефон',
        address: 'Адрес',
        city: 'Город',
        country: 'Страна',
        inn: 'ИНН',
        notes: 'Заметки',
        contract_status: 'Статус контракта',
        contract_start_date: 'Дата начала контракта',
        contract_end_date: 'Дата окончания контракта',
        cooperation_type: 'Тип сотрудничества',
        assigned_manager: 'Менеджер',
        priority: 'Приоритет',
      };
      
      const label = fieldLabels[key] || key;
      
      if (typeof value === 'object' && value !== null && 'old' in value && 'new' in value) {
        return (
          <span key={key} className="block text-xs text-muted-foreground">
            {label}: <span className="line-through">{String(value.old || '—')}</span> → {String(value.new || '—')}
          </span>
        );
      }
      
      return (
        <span key={key} className="block text-xs text-muted-foreground">
          {label}: {String(value || '—')}
        </span>
      );
    });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <History className="h-5 w-5" />
        <h3 className="text-lg font-semibold">История изменений</h3>
        <Badge variant="secondary">{logs.length}</Badge>
      </div>

      {logs.length === 0 ? (
        <Card className="p-8 text-center">
          <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Нет записей активности</p>
        </Card>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
          
          <div className="space-y-4">
            {logs.map((log) => {
              const config = getActionConfig(log.action_type);
              const Icon = config.icon;
              
              return (
                <div key={log.id} className="relative pl-10">
                  {/* Timeline dot */}
                  <div className={`absolute left-2 top-2 w-5 h-5 rounded-full ${config.color} flex items-center justify-center`}>
                    <Icon className="h-3 w-3 text-white" />
                  </div>
                  
                  <Card className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant="outline">{config.label}</Badge>
                          <span className="text-sm font-medium">{log.action_description}</span>
                        </div>
                        
                        {/* Changed fields details */}
                        <div className="mt-2">
                          {formatChangedFields(log.changed_fields)}
                        </div>
                        
                        {/* User and time info */}
                        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{log.user_name || log.user_email || 'Система'}</span>
                          </div>
                          <span>•</span>
                          <span>
                            {new Date(log.created_at).toLocaleString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
