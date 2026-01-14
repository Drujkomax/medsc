import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Activity, Shield, TrendingUp, Clock, Users, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';

interface SystemLog {
  id: string;
  level: string;
  category: string;
  message: string;
  details: any;
  user_id?: string;
  created_at: string;
}

interface SystemAlert {
  id: string;
  alert_type: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  created_at: string;
}

interface LogStatistics {
  date: string;
  total_logs: number;
  error_count: number;
  warn_count: number;
  info_count: number;
  categories: any;
}

const MonitoringDashboard: React.FC = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [statistics, setStatistics] = useState<LogStatistics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Получаем логи за последние 24 часа
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);
      
      const { data: logsData } = await supabase
        .from('system_logs')
        .select('*')
        .gte('created_at', oneDayAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      // Получаем активные алерты за последние 24 часа
      const { data: alertsData } = await supabase
        .from('system_alerts')
        .select('*')
        .eq('status', 'active')
        .gte('created_at', oneDayAgo.toISOString())
        .order('created_at', { ascending: false });

      // Получаем статистику логов за последние 7 дней
      const { data: statsData } = await supabase
        .rpc('get_log_statistics', {
          p_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          p_end_date: new Date().toISOString().split('T')[0]
        });

      setLogs(logsData || []);
      setAlerts(alertsData || []);
      setStatistics(statsData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const cleanupOldLogs = async (daysToKeep: number = 7) => {
    try {
      // Очистка логов
      const { data: logsDeleted, error: logsError } = await supabase
        .rpc('cleanup_old_logs' as any, { days_to_keep: daysToKeep });

      if (logsError) throw logsError;

      // Очистка старых алертов (удаляем acknowledged/resolved алерты старше указанных дней)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const { data: alertsData, error: alertsError } = await supabase
        .from('system_alerts')
        .delete()
        .or(`status.eq.acknowledged,status.eq.resolved`)
        .lt('created_at', cutoffDate.toISOString())
        .select('id');

      if (alertsError) {
        console.error('Error cleaning alerts:', alertsError);
      }

      const alertsDeleted = alertsData?.length || 0;
      
      toast.success('Данные очищены', {
        description: `Удалено ${logsDeleted || 0} логов и ${alertsDeleted} алертов`
      });
      
      // Обновляем дашборд
      fetchDashboardData();
    } catch (error) {
      console.error('Error cleaning logs:', error);
      toast.error('Ошибка при очистке данных');
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('system_alerts')
        .update({
          status: 'acknowledged',
          acknowledged_by: (await supabase.auth.getUser()).data.user?.id,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (!error) {
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'bg-destructive text-destructive-foreground';
      case 'warn': return 'bg-yellow-500 text-white';
      case 'info': return 'bg-blue-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security': return <Shield className="w-4 h-4" />;
      case 'performance': return <TrendingUp className="w-4 h-4" />;
      case 'auth': return <Users className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Загрузка...</div>;
  }

  const totalErrors = statistics.reduce((sum, stat) => sum + stat.error_count, 0);
  const totalWarnings = statistics.reduce((sum, stat) => sum + stat.warn_count, 0);
  const totalLogs = statistics.reduce((sum, stat) => sum + stat.total_logs, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Мониторинг системы</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Показаны данные за последние 24 часа
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => cleanupOldLogs(7)}
            variant="outline"
            size="sm"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Очистить старые логи
          </Button>
          <Button onClick={fetchDashboardData} size="sm">
            Обновить
          </Button>
        </div>
      </div>

      {/* Активные алерты */}
      {alerts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Активные алерты ({alerts.length})
          </h2>
          {alerts.map((alert) => (
            <Alert key={alert.id} className="border-red-200">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <span className="font-semibold">{alert.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(alert.created_at), 'dd MMM yyyy HH:mm', { locale: ru })}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => acknowledgeAlert(alert.id)}
                >
                  Подтвердить
                </Button>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего логов</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLogs}</div>
            <p className="text-xs text-muted-foreground">За последние 7 дней</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ошибки</CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{totalErrors}</div>
            <p className="text-xs text-muted-foreground">Требуют внимания</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Предупреждения</CardTitle>
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{totalWarnings}</div>
            <p className="text-xs text-muted-foreground">Мониторинг</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активные алерты</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <p className="text-xs text-muted-foreground">Требуют действий</p>
          </CardContent>
        </Card>
      </div>

      {/* Детальная информация */}
      <Tabs defaultValue="logs" className="w-full">
        <TabsList>
          <TabsTrigger value="logs">Системные логи</TabsTrigger>
          <TabsTrigger value="statistics">Статистика</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Последние системные события</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {logs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(log.category)}
                        <Badge className={getLevelColor(log.level)}>
                          {log.level.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">{log.category}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), 'dd MMM HH:mm', { locale: ru })}
                      </span>
                    </div>
                    <p className="text-sm">{log.message}</p>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground">
                          Детали события
                        </summary>
                        <pre className="mt-2 bg-muted p-2 rounded text-xs overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Статистика по дням</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statistics.map((stat) => (
                  <div key={stat.date} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">
                        {format(new Date(stat.date), 'dd MMMM yyyy', { locale: ru })}
                      </h3>
                      <span className="text-sm text-muted-foreground">
                        Всего: {stat.total_logs}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-red-500">
                        Ошибки: {stat.error_count}
                      </div>
                      <div className="text-yellow-500">
                        Предупреждения: {stat.warn_count}
                      </div>
                      <div className="text-blue-500">
                        Информация: {stat.info_count}
                      </div>
                    </div>
                    {stat.categories && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {Object.entries(stat.categories).map(([category, count]) => (
                          <Badge key={category} variant="outline" className="text-xs">
                            {category}: {count as number}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MonitoringDashboard;