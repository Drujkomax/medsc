import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { getRoleTranslation } from '@/utils/roleTranslations';
import { 
  Activity, 
  Users, 
  TrendingUp, 
  Calendar,
  Loader2,
  Target,
  FileText,
  Database
} from 'lucide-react';
import SeedActivityButton from '@/components/admin/SeedActivityButton';

interface Employee {
  id: string;
  email: string;
  role?: string;
  created_at: string;
}

interface ActivityLog {
  id: string;
  action_type: string;
  entity_type?: string;
  entity_id?: string;
  created_at: string;
  details?: any;
}

interface EmployeeStats {
  totalLeads: number;
  activeLeads: number;
  closedLeads: number;
  conversionRate: number;
}

interface ViewEmployeeModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
}

const ViewEmployeeModal = ({ employee, isOpen, onClose }: ViewEmployeeModalProps) => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<EmployeeStats>({
    totalLeads: 0,
    activeLeads: 0,
    closedLeads: 0,
    conversionRate: 0
  });

  useEffect(() => {
    if (employee && isOpen) {
      fetchEmployeeData();
    }
  }, [employee, isOpen]);

  const fetchEmployeeData = async () => {
    if (!employee) return;

    setLoading(true);
    try {
      // Получаем логи активности
      const { data: logs, error: logsError } = await supabase
        .from('employee_activity')
        .select('*')
        .eq('user_id', employee.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (logsError) {
        console.error('Error fetching activity logs:', logsError);
      } else {
        setActivityLogs(logs || []);
      }

      // Получаем статистику по лидам
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('id, stage, closed_at')
        .eq('assigned_to', employee.id);

      if (leadsError) {
        console.error('Error fetching leads:', leadsError);
      } else {
        const totalLeads = leadsData?.length || 0;
        const closedLeads = leadsData?.filter(lead => lead.closed_at).length || 0;
        const activeLeads = totalLeads - closedLeads;
        const conversionRate = totalLeads > 0 ? (closedLeads / totalLeads) * 100 : 0;

        setStats({
          totalLeads,
          activeLeads,
          closedLeads,
          conversionRate
        });
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role?: string) => {
    const roles: Record<string, string> = {
      'salesperson': 'Специалист по продажам',
      'sales_manager': 'Руководитель',
      'admin': 'Администратор',
      'director': 'Директор'
    };
    return roles[role || ''] || 'Не назначена';
  };

  const getActionLabel = (actionType: string) => {
    const actions: Record<string, string> = {
      'login': '🔐 Вход в систему',
      'logout': '🚪 Выход из системы',
      'lead_create': '➕ Создал лида',
      'lead_update': '✏️ Обновил лида',
      'lead_assign': '👤 Назначил лида',
      'lead_close': '✅ Закрыл лида',
      'product_create': '📦 Добавил товар',
      'product_update': '🔄 Обновил товар',
      'product_edit': '✏️ Отредактировал товар',
      'client_create': '👥 Добавил клиента',
      'deal_action': '💼 Работа со сделкой',
      'page_view': '👁️ Просмотр страницы',
      'form_submit': '📝 Отправил форму'
    };
    return actions[actionType] || `🔧 ${actionType}`;
  };

  const getActionDescription = (log: ActivityLog) => {
    if (log.details) {
      try {
        const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
        
        switch (log.action_type) {
          case 'lead_create':
            return `Создал лида "${details.name || details.company || 'Без названия'}"`;
          case 'lead_update':
            return `Обновил лида "${details.name || details.company || details.lead_name || 'ID: ' + (details.id || details.lead_id)}"`;
          case 'lead_assign':
            return `Назначил лида "${details.name || details.lead_name || 'ID: ' + details.lead_id}" на сотрудника`;
          case 'lead_close':
            return `Закрыл лида "${details.name || details.lead_name || 'ID: ' + details.id}" со статусом "${details.status || 'завершен'}"`;
          case 'product_create':
          case 'product_edit':
            return `${log.action_type === 'product_create' ? 'Добавил' : 'Отредактировал'} товар "${details.name || details.product_name || 'Без названия'}"`;
          case 'client_create':
            return `Добавил клиента "${details.name || details.company || 'Без названия'}"`;
          case 'deal_action':
            return `Работа со сделкой "${details.title || details.deal_title || 'ID: ' + details.deal_id}"`;
          case 'page_view':
            return `Просмотрел страницу "${details.page || details.url || 'Неизвестная страница'}"`;
          case 'form_submit':
            return `Отправил форму "${details.form_name || details.form_type || 'Неизвестная форма'}"`;
          default:
            return getActionLabel(log.action_type);
        }
      } catch (e) {
        return getActionLabel(log.action_type);
      }
    }
    return getActionLabel(log.action_type);
  };

  // Группируем логи по дням
  const groupLogsByDate = (logs: ActivityLog[]) => {
    const grouped: { [key: string]: ActivityLog[] } = {};
    
    logs.forEach(log => {
      const date = new Date(log.created_at).toLocaleDateString('ru-RU');
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(log);
    });
    
    return grouped;
  };

  // Получаем сводку за день
  const getDailySummary = (logs: ActivityLog[]) => {
    const summary = {
      totalActions: logs.length,
      leads: logs.filter(log => log.action_type.includes('lead')).length,
      products: logs.filter(log => log.action_type.includes('product')).length,
      clients: logs.filter(log => log.action_type.includes('client')).length,
      deals: logs.filter(log => log.action_type.includes('deal')).length,
      logins: logs.filter(log => log.action_type === 'login').length,
      views: logs.filter(log => log.action_type === 'page_view').length
    };
    
    return summary;
  };

  if (!employee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-background max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('employees.viewEmployee')}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Загрузка данных...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Основная информация */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Основная информация</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{employee.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Должность</p>
                    <Badge variant="secondary">
                      {getRoleTranslation(employee.role, i18n.language)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Дата добавления</p>
                    <p className="font-medium">
                      {new Date(employee.created_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Статус</p>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Активен
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="stats" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="stats" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Статистика
                </TabsTrigger>
                <TabsTrigger value="activity" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  История активности
                </TabsTrigger>
              </TabsList>

              <TabsContent value="stats" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">Всего лидов</p>
                          <p className="text-2xl font-bold">{stats.totalLeads}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">Активные</p>
                          <p className="text-2xl font-bold">{stats.activeLeads}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">Закрытые</p>
                          <p className="text-2xl font-bold">{stats.closedLeads}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-orange-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">Конверсия</p>
                          <p className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="activity" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        История активности
                      </div>
                      <SeedActivityButton 
                        userId={employee.id} 
                        userEmail={employee.email} 
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activityLogs.length === 0 ? (
                      <div className="text-center py-8">
                        <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Нет записей активности</p>
                      </div>
                    ) : (
                      <div className="space-y-6 max-h-96 overflow-y-auto">
                        {Object.entries(groupLogsByDate(activityLogs))
                          .sort(([a], [b]) => new Date(b.split('.').reverse().join('-')).getTime() - new Date(a.split('.').reverse().join('-')).getTime())
                          .map(([date, logs]) => {
                            const summary = getDailySummary(logs);
                            return (
                              <div key={date} className="border border-border rounded-lg overflow-hidden">
                                {/* Заголовок дня с сводкой */}
                                <div className="bg-muted/50 p-4 border-b">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                                      <Calendar className="h-4 w-4" />
                                      {date}
                                    </h4>
                                     <div className="flex gap-4 text-sm text-muted-foreground">
                                       <span>Всего: {summary.totalActions}</span>
                                       {summary.leads > 0 && <span>Лиды: {summary.leads}</span>}
                                       {summary.products > 0 && <span>Товары: {summary.products}</span>}
                                       {summary.clients > 0 && <span>Клиенты: {summary.clients}</span>}
                                       {summary.deals > 0 && <span>Сделки: {summary.deals}</span>}
                                       {summary.views > 0 && <span>Просмотры: {summary.views}</span>}
                                       {summary.logins > 0 && <span>Входы: {summary.logins}</span>}
                                     </div>
                                  </div>
                                </div>
                                
                                {/* Список действий за день */}
                                <div className="p-4 space-y-3">
                                  {logs.map((log, index) => (
                                    <div key={log.id} className="flex items-start gap-3">
                                      <div className="flex flex-col items-center">
                                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                                        {index !== logs.length - 1 && (
                                          <div className="w-px h-6 bg-border mt-1" />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex-1">
                                            <p className="text-sm text-foreground leading-tight">
                                              {getActionDescription(log)}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                              {new Date(log.created_at).toLocaleTimeString('ru-RU', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                              })}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ViewEmployeeModal;