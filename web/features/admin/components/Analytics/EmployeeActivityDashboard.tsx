import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Activity, 
  Users, 
  Clock,
  TrendingUp,
  Calendar,
  Search,
  UserCheck,
  Edit,
  Eye,
  MousePointer
} from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { format, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';

const EmployeeActivityDashboard = () => {
  const { 
    getEmployeeActivity, 
    getEmployeePerformanceMetrics, 
    loading 
  } = useAnalytics();
  
  const [activities, setActivities] = useState<any[]>([]);
  const [employeeMetrics, setEmployeeMetrics] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState('7');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  useEffect(() => {
    loadActivities();
  }, [dateRange, selectedUserId]);

  const loadActivities = async () => {
    const endDate = format(new Date(), 'yyyy-MM-dd');
    const startDate = format(subDays(new Date(), parseInt(dateRange)), 'yyyy-MM-dd');
    
    const data = await getEmployeeActivity(startDate, endDate, selectedUserId || undefined);
    setActivities(data);

    // Получаем уникальных пользователей и их метрики
    const uniqueUsers = [...new Set(data.map(a => a.user_id))];
    const metrics = await Promise.all(
      uniqueUsers.map(async (userId) => {
        const metric = await getEmployeePerformanceMetrics(userId, startDate, endDate);
        return { userId, ...metric };
      })
    );
    setEmployeeMetrics(metrics.filter(m => m.total_actions > 0));
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'login':
        return <UserCheck className="h-4 w-4 text-green-600" />;
      case 'logout':
        return <UserCheck className="h-4 w-4 text-gray-600" />;
      case 'product_edit':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'lead_update':
        return <Users className="h-4 w-4 text-purple-600" />;
      case 'deal_action':
        return <TrendingUp className="h-4 w-4 text-orange-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      'login': 'Вход в систему',
      'logout': 'Выход из системы',
      'product_edit': 'Редактирование товара',
      'lead_update': 'Обновление лида',
      'deal_action': 'Действие со сделкой',
      'view_product': 'Просмотр товара',
      'create_lead': 'Создание лида'
    };
    return labels[actionType] || actionType;
  };

  const filteredActivities = activities.filter(activity =>
    searchTerm === '' || 
    getActionLabel(activity.action_type).toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.entity_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalActions = activities.length;
  const uniqueUsers = new Set(activities.map(a => a.user_id)).size;
  const avgActionsPerUser = uniqueUsers > 0 ? totalActions / uniqueUsers : 0;
  const mostActiveDay = activities.reduce((acc, activity) => {
    const date = activity.date;
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const peakDay = Object.entries(mostActiveDay).sort(([,a], [,b]) => Number(b) - Number(a))[0];

  return (
    <div className="space-y-6">
      {/* Заголовок и фильтры */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Активность сотрудников</h2>
          <p className="text-muted-foreground">Мониторинг и анализ действий персонала</p>
        </div>
        <div className="flex gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Сегодня</SelectItem>
              <SelectItem value="7">7 дней</SelectItem>
              <SelectItem value="14">14 дней</SelectItem>
              <SelectItem value="30">30 дней</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Основные метрики активности */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего действий</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              За последние {dateRange} дней
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активных сотрудников</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueUsers}</div>
            <p className="text-xs text-muted-foreground">
              Уникальных пользователей
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Среднее на человека</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgActionsPerUser.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Действий на сотрудника
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Пиковый день</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{peakDay?.[1] ? String(peakDay[1]) : '0'}</div>
            <p className="text-xs text-muted-foreground">
              {peakDay?.[0] ? format(new Date(peakDay[0]), 'd MMM', { locale: ru }) : 'Нет данных'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Топ сотрудников по активности */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Производительность сотрудников
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : employeeMetrics.length > 0 ? (
            <div className="space-y-4">
              {employeeMetrics
                .sort((a, b) => b.total_actions - a.total_actions)
                .slice(0, 10)
                .map((metric, index) => (
                <div key={metric.userId} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium">Сотрудник {metric.userId.slice(0, 8)}</h4>
                      <p className="text-sm text-muted-foreground">
                        Среднее: {metric.daily_average} действий/день
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="font-medium">{metric.total_actions}</div>
                      <span className="text-xs text-muted-foreground">всего действий</span>
                    </div>
                    
                    <div className="text-center">
                      <div className="font-medium">{metric.activity_breakdown?.login_count || 0}</div>
                      <span className="text-xs text-muted-foreground">входов</span>
                    </div>
                    
                    <div className="text-center">
                      <div className="font-medium">{metric.activity_breakdown?.product_edits || 0}</div>
                      <span className="text-xs text-muted-foreground">изменений товаров</span>
                    </div>
                    
                    <Badge 
                      variant={
                        metric.daily_average >= 10 ? 'default' :
                        metric.daily_average >= 5 ? 'secondary' : 'outline'
                      }
                      className="min-w-16 justify-center"
                    >
                      {metric.daily_average >= 10 ? 'Высокая' :
                       metric.daily_average >= 5 ? 'Средняя' : 'Низкая'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-muted-foreground">Нет данных об активности</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Последние действия */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Последние действия
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Поиск действий..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredActivities.length > 0 ? (
            <div className="space-y-3">
              {filteredActivities.slice(0, 20).map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    {getActionIcon(activity.action_type)}
                    <div>
                      <h4 className="font-medium text-sm">{getActionLabel(activity.action_type)}</h4>
                      <p className="text-xs text-muted-foreground">
                        {activity.entity_type && `${activity.entity_type} • `}
                        {format(new Date(activity.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      Пользователь {activity.user_id.slice(0, 8)}
                    </p>
                    {activity.session_duration && (
                      <p className="text-xs text-muted-foreground">
                        {activity.session_duration} мин
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-muted-foreground">Нет найденных действий</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeActivityDashboard;