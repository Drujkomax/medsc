import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import {
  FileText, 
  Clock, 
  User,
  Edit,
  Plus,
  Trash2,
  ArrowRightLeft,
  CreditCard,
  UserPlus,
  TrendingUp
} from 'lucide-react';

interface AuditLogEntry {
  id: string;
  deal_id: string;
  user_id: string | null;
  action_type: string;
  old_values: any;
  new_values: any;
  changed_fields: string[];
  user_email: string | null;
  user_role: string | null;
  created_at: string;
}

interface DealAuditLogProps {
  dealId: string;
}

const DealAuditLog = ({ dealId }: DealAuditLogProps) => {
  const { t } = useTranslation();
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditLogs();
  }, [dealId]);

  const loadAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('deal_audit_log')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (actionType: string) => {
    const iconMap: { [key: string]: any } = {
      created: Plus,
      updated: Edit,
      deleted: Trash2,
      stage_changed: ArrowRightLeft,
      payment_status_changed: CreditCard,
      assigned: UserPlus
    };
    const Icon = iconMap[actionType] || FileText;
    return <Icon className="w-4 h-4" />;
  };

  const getActionColor = (actionType: string) => {
    const colorMap: { [key: string]: string } = {
      created: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      updated: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      deleted: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      stage_changed: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      payment_status_changed: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      assigned: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
    };
    return colorMap[actionType] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const getActionLabel = (actionType: string) => {
    const labelMap: { [key: string]: string } = {
      created: t('deals.audit.created', 'Создана'),
      updated: t('deals.audit.updated', 'Обновлена'),
      deleted: t('deals.audit.deleted', 'Удалена'),
      stage_changed: t('deals.audit.stageChanged', 'Изменен статус'),
      payment_status_changed: t('deals.audit.paymentStatusChanged', 'Изменен статус оплаты'),
      assigned: t('deals.audit.assigned', 'Назначение изменено')
    };
    return labelMap[actionType] || actionType;
  };

  const getFieldLabel = (field: string) => {
    const labelMap: { [key: string]: string } = {
      title: t('deals.audit.fields.title', 'Название'),
      amount: t('deals.audit.fields.amount', 'Сумма'),
      stage: t('deals.audit.fields.stage', 'Статус'),
      payment_status: t('deals.audit.fields.paymentStatus', 'Статус оплаты'),
      debt_amount: t('deals.audit.fields.debtAmount', 'Сумма задолженности'),
      assignments: t('deals.audit.fields.assignments', 'Назначения'),
      notes: t('deals.audit.fields.notes', 'Заметки'),
      probability: t('deals.audit.fields.probability', 'Вероятность')
    };
    return labelMap[field] || field;
  };

  const renderChangeDetails = (log: AuditLogEntry) => {
    if (log.action_type === 'created') {
      return (
        <div className="text-sm text-muted-foreground">
          {t('deals.audit.dealCreatedBy', 'Сделка создана пользователем {{email}}', { email: log.user_email })}
        </div>
      );
    }

    if (!log.changed_fields || log.changed_fields.length === 0) {
      return null;
    }

    return (
      <div className="mt-2 space-y-2">
        {log.changed_fields.map((field) => {
          const oldValue = log.old_values?.[field];
          const newValue = log.new_values?.[field];
          
          return (
            <div key={field} className="text-sm p-2 bg-muted/30 rounded">
              <div className="font-medium text-muted-foreground mb-1">
                {getFieldLabel(field)}:
              </div>
              <div className="flex items-center gap-2">
                {oldValue !== undefined && oldValue !== null && (
                  <>
                    <span className="text-red-600 line-through">
                      {typeof oldValue === 'object' ? JSON.stringify(oldValue) : String(oldValue)}
                    </span>
                    <ArrowRightLeft className="w-3 h-3 text-muted-foreground" />
                  </>
                )}
                <span className="text-green-600 font-medium">
                  {typeof newValue === 'object' ? JSON.stringify(newValue) : String(newValue)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {t('deals.audit.title', 'Аудит изменений')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            {t('common.loading', 'Загрузка...')}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (auditLogs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {t('deals.audit.title', 'Аудит изменений')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            {t('deals.audit.empty', 'История изменений пуста')}
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
          {t('deals.audit.title', 'Аудит изменений')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {auditLogs.map((log, index) => (
              <div key={log.id}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Badge className={getActionColor(log.action_type)}>
                        <div className="flex items-center gap-1">
                          {getActionIcon(log.action_type)}
                          <span>{getActionLabel(log.action_type)}</span>
                        </div>
                      </Badge>
                      {log.user_role && (
                        <Badge variant="outline" className="text-xs">
                          {log.user_role}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {format(new Date(log.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                    </div>
                  </div>

                  {log.user_email && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{log.user_email}</span>
                    </div>
                  )}

                  {renderChangeDetails(log)}
                </div>

                {index < auditLogs.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default DealAuditLog;
