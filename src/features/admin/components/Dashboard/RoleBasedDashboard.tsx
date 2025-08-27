import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLeads } from '@/hooks/useLeads';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useAuth } from '@/hooks/useAuth';
import { 
  TrendingUp, 
  Users, 
  Target, 
  Clock,
  Award,
  BarChart3,
  UserCheck,
  AlertCircle
} from 'lucide-react';

const RoleBasedDashboard = () => {
  const { leads, loading } = useLeads();
  const { role } = useUserPermissions();
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Загрузка...</p>
      </div>
    );
  }

  // Общая статистика
  const totalLeads = leads.length;
  const newLeads = leads.filter(lead => lead.stage === 'new').length;
  const closedLeads = leads.filter(lead => lead.stage === 'closed').length;
  const lostLeads = leads.filter(lead => lead.stage === 'lost').length;
  
  // Конверсия
  const conversionRate = totalLeads > 0 ? ((closedLeads / totalLeads) * 100).toFixed(1) : '0';
  
  // Для продавцов - только их лиды
  const myLeads = leads.filter(lead => lead.assigned_to === user?.id);
  const myNewLeads = myLeads.filter(lead => lead.stage === 'new').length;
  const myClosedLeads = myLeads.filter(lead => lead.stage === 'closed').length;
  const myConversionRate = myLeads.length > 0 ? ((myClosedLeads / myLeads.length) * 100).toFixed(1) : '0';

  // Статистика по этапам
  const stageStats = {
    new: leads.filter(lead => lead.stage === 'new').length,
    contacted: leads.filter(lead => lead.stage === 'contacted').length,
    qualified: leads.filter(lead => lead.stage === 'qualified').length,
    proposal: leads.filter(lead => lead.stage === 'proposal').length,
    negotiation: leads.filter(lead => lead.stage === 'negotiation').length,
    closed: closedLeads,
    lost: lostLeads
  };

  const renderAdminDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Всего лидов</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalLeads}</div>
          <p className="text-xs text-muted-foreground">
            +{newLeads} новых
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Конверсия</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{conversionRate}%</div>
          <p className="text-xs text-muted-foreground">
            {closedLeads} из {totalLeads}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">В работе</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stageStats.contacted + stageStats.qualified + stageStats.proposal + stageStats.negotiation}
          </div>
          <p className="text-xs text-muted-foreground">
            Активных лидов
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Потери</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{lostLeads}</div>
          <p className="text-xs text-muted-foreground">
            {totalLeads > 0 ? ((lostLeads / totalLeads) * 100).toFixed(1) : 0}% от общего
          </p>
        </CardContent>
      </Card>

      {/* Детальная статистика по этапам */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle>Статистика по этапам</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {Object.entries(stageStats).map(([stage, count]) => {
              const stageLabels = {
                new: 'Новые',
                contacted: 'Связались',
                qualified: 'Квалифицированы',
                proposal: 'Предложение',
                negotiation: 'Переговоры',
                closed: 'Закрыты',
                lost: 'Потеряны'
              };
              
              const stageColors = {
                new: 'bg-blue-500',
                contacted: 'bg-yellow-500',
                qualified: 'bg-purple-500',
                proposal: 'bg-orange-500',
                negotiation: 'bg-indigo-500',
                closed: 'bg-green-500',
                lost: 'bg-red-500'
              };

              return (
                <div key={stage} className="text-center">
                  <div className={`w-3 h-3 rounded-full ${stageColors[stage as keyof typeof stageColors]} mx-auto mb-2`} />
                  <p className="text-sm font-medium">{stageLabels[stage as keyof typeof stageLabels]}</p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDirectorDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Общая эффективность</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{conversionRate}%</div>
          <p className="text-xs text-muted-foreground">
            Конверсия команды
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('leads.activeLead')}</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalLeads - closedLeads - lostLeads}
          </div>
          <p className="text-xs text-muted-foreground">
            Требуют внимания
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Результат месяца</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{closedLeads}</div>
          <p className="text-xs text-muted-foreground">
            Закрытых сделок
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const renderSalesManagerDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Команда</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalLeads}</div>
          <p className="text-xs text-muted-foreground">
            Лидов в управлении
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Конверсия</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{conversionRate}%</div>
          <p className="text-xs text-muted-foreground">
            Эффективность команды
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('leads.newLeads')}</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{newLeads}</div>
          <p className="text-xs text-muted-foreground">
            Требуют назначения
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Закрыто</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{closedLeads}</div>
          <p className="text-xs text-muted-foreground">
            Успешных сделок
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const renderSalespersonDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('leads.myLeads')}</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{myLeads.length}</div>
          <p className="text-xs text-muted-foreground">
            Всего назначено
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Моя конверсия</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{myConversionRate}%</div>
          <p className="text-xs text-muted-foreground">
            Эффективность
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Новые</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{myNewLeads}</div>
          <p className="text-xs text-muted-foreground">
            Требуют обработки
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Закрыто</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{myClosedLeads}</div>
          <p className="text-xs text-muted-foreground">
            Успешных сделок
          </p>
        </CardContent>
      </Card>

      {/* Мои лиды по этапам */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle>{t('leads.myLeadsByStage')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {Object.entries(stageStats).map(([stage, count]) => {
              const myStageCount = myLeads.filter(lead => lead.stage === stage).length;
              
              const stageLabels = {
                new: 'Новые',
                contacted: 'Связались',
                qualified: 'Квалифицированы',
                proposal: 'Предложение',
                negotiation: 'Переговоры',
                closed: 'Закрыты',
                lost: 'Потеряны'
              };
              
              const stageColors = {
                new: 'bg-blue-500',
                contacted: 'bg-yellow-500',
                qualified: 'bg-purple-500',
                proposal: 'bg-orange-500',
                negotiation: 'bg-indigo-500',
                closed: 'bg-green-500',
                lost: 'bg-red-500'
              };

              return (
                <div key={stage} className="text-center">
                  <div className={`w-3 h-3 rounded-full ${stageColors[stage as keyof typeof stageColors]} mx-auto mb-2`} />
                  <p className="text-sm font-medium">{stageLabels[stage as keyof typeof stageLabels]}</p>
                  <p className="text-2xl font-bold">{myStageCount}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Дашборд</h2>
        <div className="flex items-center space-x-2">
          <p className="text-muted-foreground">Аналитика и статистика</p>
          <Badge variant="secondary">{role}</Badge>
        </div>
      </div>

      {role === 'admin' && renderAdminDashboard()}
      {role === 'director' && renderDirectorDashboard()}
      {role === 'sales_manager' && renderSalesManagerDashboard()}
      {role === 'salesperson' && renderSalespersonDashboard()}
    </div>
  );
};

export default RoleBasedDashboard;