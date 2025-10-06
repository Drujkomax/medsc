import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  FileText, 
  User, 
  Clock, 
  TrendingUp, 
  CreditCard, 
  UserPlus,
  Edit,
  Trash2,
  AlertCircle
} from 'lucide-react';

interface AuditLogEntry {
  id: string;
  deal_id: string;
  user_id: string | null;
  action_type: string;
  old_values: any;
  new_values: any;
  changed_fields: string[] | null;
  user_email: string | null;
  user_role: string | null;
  created_at: string;
}

interface DealAuditLogProps {
  dealId: string;
}

const DealAuditLog = ({ dealId }: DealAuditLogProps) => {
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditLog();
  }, [dealId]);

  const loadAuditLog = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('deal_audit_log')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAuditLog(data || []);
    } catch (error) {
      console.error('Ошибка загрузки аудита:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (actionType: string) => {
    const icons = {
      created: FileText,
      updated: Edit,
      deleted: Trash2,
      stage_changed: TrendingUp,
      payment_status_changed: CreditCard,
      assigned: UserPlus
    };
    const Icon = icons[actionType as keyof typeof icons] || Edit;
    return <Icon className="w-4 h-4" />;
  };

  const getActionLabel = (actionType: string) => {
    const labels = {
      created: 'Создана',
      updated: 'Обновлена',
      deleted: 'Удалена',
      stage_changed: 'Изменен статус',
      payment_status_changed: 'Изменен статус оплаты',
      assigned: 'Изменено назначение'
    };
    return labels[actionType as keyof typeof labels] || actionType;
  };

  const getActionColor = (actionType: string) => {
    const colors = {
      created: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      updated: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      deleted: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      stage_changed: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      payment_status_changed: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      assigned: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
    };
    return colors[actionType as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  const formatFieldName = (field: string) => {
    const fieldNames: { [key: string]: string } = {
      title: 'Название',
      amount: 'Сумма',
      stage: 'Статус',
      payment_status: 'Статус оплаты',
      assignments: 'Назначения',
      debt_amount: 'Сумма долга',
      notes: 'Примечания'
    };
    return fieldNames[field] || field;
  };

  const formatValue = (value: any, field?: string) => {
    if (value === null || value === undefined) return 'Не указано';
    
    if (field === 'stage') {
      const stageNames: { [key: string]: string } = {
        lead: 'Лид',
        qualified: 'Квалифицирован',
        proposal: 'Предложение',
        negotiation: 'Переговоры',
        closed: 'Закрыто',
        lost: 'Потеряно'
      };
      return stageNames[value] || value;
    }
    
    if (field === 'payment_status') {
      const statusNames: { [key: string]: string } = {
        waiting: 'Ожидание',
        paid: 'Оплачено',
        not_realized: 'Не реализовано',
        debt: 'Задолженность'
      };
      return statusNames[value] || value;
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    
    return String(value);
  };

  const renderChanges = (entry: AuditLogEntry) => {
    if (entry.action_type === 'created') {
      return <p className="text-sm text-muted-foreground">Сделка создана</p>;
    }

    if (entry.action_type === 'deleted') {
      return <p className="text-sm text-muted-foreground">Сделка удалена</p>;
    }

    if (!entry.changed_fields || entry.changed_fields.length === 0) {
      return <p className="text-sm text-muted-foreground">Нет изменений</p>;
    }

    return (
      <div className="space-y-2">
        {entry.changed_fields.map((field) => (
          <div key={field} className="text-sm">
            <p className="font-medium text-foreground">{formatFieldName(field)}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-muted-foreground">
                {formatValue(entry.old_values?.[field], field)}
              </span>
              <span className="text-muted-foreground">→</span>
              <span className="text-foreground font-medium">
                {formatValue(entry.new_values?.[field], field)}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Аудит изменений
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        </CardContent>
      </Card>
    );
  }

  if (auditLog.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Аудит изменений
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="w-4 h-4" />
            <p className="text-sm">История изменений отсутствует</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Аудит изменений
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          История всех изменений сделки
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {auditLog.map((entry, index) => (
              <div key={entry.id}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getActionColor(entry.action_type)}`}>
                        {getActionIcon(entry.action_type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={getActionColor(entry.action_type)}>
                            {getActionLabel(entry.action_type)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{entry.user_email || 'Система'}</span>
                          </div>
                          {entry.user_role && (
                            <Badge variant="secondary" className="text-xs">
                              {entry.user_role}
                            </Badge>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {format(new Date(entry.created_at), 'dd MMM yyyy, HH:mm', { locale: ru })}
                            </span>
                          </div>
                        </div>
                        {renderChanges(entry)}
                      </div>
                    </div>
                  </div>
                </div>
                {index < auditLog.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default DealAuditLog;
