import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLeads } from '@/hooks/useLeads';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import DirectorDashboardMetrics from './DirectorDashboardMetrics';
import ExecutiveOverview from '../Analytics/ExecutiveOverview';
import { getRoleTranslation } from '@/utils/roleTranslations';
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
  const { t, i18n } = useTranslation();
  const { leads, loading } = useLeads();
  const { role } = useUserPermissions();
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>{t('common.loading', 'Загрузка...')}</p>
      </div>
    );
  }

  const totalLeads = leads.length;
  const newLeads = leads.filter(lead => lead.stage === 'new').length;
  const closedLeads = leads.filter(lead => lead.stage === 'closed').length;
  const lostLeads = leads.filter(lead => lead.stage === 'lost').length;
  const conversionRate = totalLeads > 0 ? ((closedLeads / totalLeads) * 100).toFixed(1) : '0';
  
  const myLeads = leads.filter(lead => lead.assigned_to === user?.id);
  const myNewLeads = myLeads.filter(lead => lead.stage === 'new').length;
  const myClosedLeads = myLeads.filter(lead => lead.stage === 'closed').length;
  const myConversionRate = myLeads.length > 0 ? ((myClosedLeads / myLeads.length) * 100).toFixed(1) : '0';

  const stageStats = {
    new: leads.filter(lead => lead.stage === 'new').length,
    contacted: leads.filter(lead => lead.stage === 'contacted').length,
    qualified: leads.filter(lead => lead.stage === 'qualified').length,
    proposal: leads.filter(lead => lead.stage === 'proposal').length,
    negotiation: leads.filter(lead => lead.stage === 'negotiation').length,
    closed: closedLeads,
    lost: lostLeads
  };

  const stageLabels: Record<string, string> = {
    new: t('leads.stages.new', 'Новые'),
    contacted: t('leads.stages.contacted', 'Связались'),
    qualified: t('leads.stages.qualified', 'Квалифицированы'),
    proposal: t('leads.stages.proposal', 'Предложение'),
    negotiation: t('leads.stages.negotiation', 'Переговоры'),
    closed: t('leads.stages.closed', 'Закрыты'),
    lost: t('leads.stages.lost', 'Потеряны')
  };

  const stageColors: Record<string, string> = {
    new: 'bg-blue-500',
    contacted: 'bg-yellow-500',
    qualified: 'bg-purple-500',
    proposal: 'bg-orange-500',
    negotiation: 'bg-indigo-500',
    closed: 'bg-green-500',
    lost: 'bg-red-500'
  };

  const renderAdminDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('dashboard.totalLeads', 'Всего лидов')}</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalLeads}</div>
          <p className="text-xs text-muted-foreground">
            +{newLeads} {t('dashboard.newLeads', 'новых')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('dashboard.conversion', 'Конверсия')}</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{conversionRate}%</div>
          <p className="text-xs text-muted-foreground">
            {closedLeads} {t('dashboard.outOf', 'из')} {totalLeads}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('dashboard.inProgress', 'В работе')}</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stageStats.contacted + stageStats.qualified + stageStats.proposal + stageStats.negotiation}
          </div>
          <p className="text-xs text-muted-foreground">
            {t('dashboard.activeLeads', 'Активных лидов')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('dashboard.losses', 'Потери')}</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{lostLeads}</div>
          <p className="text-xs text-muted-foreground">
            {totalLeads > 0 ? ((lostLeads / totalLeads) * 100).toFixed(1) : 0}% {t('dashboard.fromTotal', 'от общего')}
          </p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle>{t('dashboard.stageStats', 'Статистика по этапам')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {Object.entries(stageStats).map(([stage, count]) => (
              <div key={stage} className="text-center">
                <div className={`w-3 h-3 rounded-full ${stageColors[stage]} mx-auto mb-2`} />
                <p className="text-sm font-medium">{stageLabels[stage]}</p>
                <p className="text-2xl font-bold">{count}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDirectorDashboard = () => (
    <div className="space-y-6">
      <ExecutiveOverview />
    </div>
  );

  const renderSalesManagerDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('dashboard.team', 'Команда')}</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalLeads}</div>
          <p className="text-xs text-muted-foreground">{t('dashboard.leadsManaged', 'Лидов в управлении')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('dashboard.conversion', 'Конверсия')}</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{conversionRate}%</div>
          <p className="text-xs text-muted-foreground">{t('dashboard.teamEfficiency', 'Эффективность команды')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('leads.newLeads', 'Новые лиды')}</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{newLeads}</div>
          <p className="text-xs text-muted-foreground">{t('dashboard.requireAssignment', 'Требуют назначения')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('dashboard.closed', 'Закрыто')}</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{closedLeads}</div>
          <p className="text-xs text-muted-foreground">{t('dashboard.successfulDeals', 'Успешных сделок')}</p>
        </CardContent>
      </Card>
    </div>
  );

  const renderSalespersonDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('leads.myLeads', 'Мои лиды')}</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{myLeads.length}</div>
          <p className="text-xs text-muted-foreground">{t('dashboard.totalAssigned', 'Всего назначено')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('dashboard.myConversion', 'Моя конверсия')}</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{myConversionRate}%</div>
          <p className="text-xs text-muted-foreground">{t('dashboard.efficiency', 'Эффективность')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('dashboard.new', 'Новые')}</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{myNewLeads}</div>
          <p className="text-xs text-muted-foreground">{t('dashboard.requireProcessing', 'Требуют обработки')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('dashboard.closed', 'Закрыто')}</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{myClosedLeads}</div>
          <p className="text-xs text-muted-foreground">{t('dashboard.successfulDeals', 'Успешных сделок')}</p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle>{t('leads.myLeadsByStage', 'Мои лиды по этапам')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {Object.entries(stageStats).map(([stage]) => {
              const myStageCount = myLeads.filter(lead => lead.stage === stage).length;
              return (
                <div key={stage} className="text-center">
                  <div className={`w-3 h-3 rounded-full ${stageColors[stage]} mx-auto mb-2`} />
                  <p className="text-sm font-medium">{stageLabels[stage]}</p>
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
        <h2 className="text-3xl font-bold">{t('dashboard.title', 'Дашборд')}</h2>
        <div className="flex items-center space-x-2">
          <p className="text-muted-foreground">{t('dashboard.analytics', 'Аналитика и статистика')}</p>
          <Badge variant="secondary">{getRoleTranslation(role || '', i18n.language)}</Badge>
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