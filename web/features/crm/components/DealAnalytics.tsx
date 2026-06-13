import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useDeals } from '@/hooks/useDeals';
import { useTranslation } from 'react-i18next';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock,
  DollarSign,
  Percent,
  Users,
  Calendar
} from 'lucide-react';

interface DealAnalyticsProps {
  detailed?: boolean;
}

const DealAnalytics = ({ detailed = false }: DealAnalyticsProps) => {
  const { t } = useTranslation();
  const { deals } = useDeals();
  const [timeRange, setTimeRange] = useState('30d');

  // Process data for charts
  const stageData = [
    { name: t('deals.stages.lead', 'Лиды'), value: deals.filter(d => d.stage === 'lead').length, color: '#3b82f6' },
    { name: t('deals.stages.qualified', 'Квалифицированы'), value: deals.filter(d => d.stage === 'qualified').length, color: '#10b981' },
    { name: t('deals.stages.proposal', 'Предложения'), value: deals.filter(d => d.stage === 'proposal').length, color: '#f59e0b' },
    { name: t('deals.stages.negotiation', 'Переговоры'), value: deals.filter(d => d.stage === 'negotiation').length, color: '#f97316' },
    { name: t('deals.stages.closed', 'Закрыты'), value: deals.filter(d => d.stage === 'closed').length, color: '#059669' },
    { name: t('deals.stages.lost', 'Потеряны'), value: deals.filter(d => d.stage === 'lost').length, color: '#dc2626' }
  ];

  const monthlyData = [
    { month: t('months.jan', 'Янв'), deals: 12, value: 150000 },
    { month: t('months.feb', 'Фев'), deals: 19, value: 230000 },
    { month: t('months.mar', 'Мар'), deals: 15, value: 180000 },
    { month: t('months.apr', 'Апр'), deals: 22, value: 290000 },
    { month: t('months.may', 'Май'), deals: 18, value: 220000 },
    { month: t('months.jun', 'Июн'), deals: 25, value: 320000 }
  ];

  const conversionFunnel = [
    { stage: t('deals.stages.lead', 'Лиды'), count: deals.filter(d => d.stage === 'lead').length, percentage: 100 },
    { stage: t('deals.stages.qualified', 'Квалифицированы'), count: deals.filter(d => d.stage === 'qualified').length, percentage: 80 },
    { stage: t('deals.stages.proposal', 'Предложения'), count: deals.filter(d => d.stage === 'proposal').length, percentage: 60 },
    { stage: t('deals.stages.negotiation', 'Переговоры'), count: deals.filter(d => d.stage === 'negotiation').length, percentage: 40 },
    { stage: t('deals.stages.closed', 'Закрыты'), count: deals.filter(d => d.stage === 'closed').length, percentage: 25 }
  ];

  // Key metrics
  const totalValue = deals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
  const closedDeals = deals.filter(deal => deal.stage === 'closed');
  const wonValue = closedDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
  const lostDeals = deals.filter(deal => deal.stage === 'lost');
  const avgDealSize = deals.length > 0 ? totalValue / deals.length : 0;
  const winRate = deals.length > 0 ? (closedDeals.length / deals.length * 100) : 0;

  if (!detailed) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              {t('deals.analytics.pipelineOverview', 'Обзор воронки продаж')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stageData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={false}
                >
                  {stageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} ${t('deals.analytics.deals', 'сделок')}`, name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {stageData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="truncate">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {t('deals.analytics.monthlyTrend', 'Месячная динамика')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value, name) => [
                  name === 'deals' ? `${value} ${t('deals.analytics.deals', 'сделок')}` : `$${value.toLocaleString()}`,
                  name === 'deals' ? t('deals.analytics.count', 'Количество') : t('deals.analytics.value', 'Стоимость')
                ]} />
                <Area type="monotone" dataKey="deals" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Area type="monotone" dataKey="value" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quick Metrics */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('deals.analytics.keyMetrics', 'Ключевые показатели')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full mx-auto mb-2">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-2xl font-bold">${wonValue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{t('deals.analytics.wonValue', 'Выигранная сумма')}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full mx-auto mb-2">
                  <Percent className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-2xl font-bold">{winRate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">{t('deals.analytics.winRate', 'Коэффициент побед')}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full mx-auto mb-2">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-2xl font-bold">${avgDealSize.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{t('deals.analytics.avgDealSize', 'Средний размер сделки')}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full mx-auto mb-2">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <p className="text-2xl font-bold">28</p>
                <p className="text-sm text-muted-foreground">{t('deals.analytics.avgCycleTime', 'Среднее время цикла')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">{t('common.last7Days')}</SelectItem>
            <SelectItem value="30d">{t('common.last30Days')}</SelectItem>
            <SelectItem value="90d">{t('common.last90Days')}</SelectItem>
            <SelectItem value="1y">{t('common.lastYear')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversion Funnel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{t('deals.analytics.conversionFunnel')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {conversionFunnel.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.stage}</span>
                  <span className="text-sm text-muted-foreground">{item.count}</span>
                </div>
                <Progress value={item.percentage} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Revenue Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('deals.analytics.revenueTrend')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Stage Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('deals.analytics.stageDistribution')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('deals.analytics.performanceMetrics')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">{t('deals.analytics.salesGrowth', 'Рост продаж')}</span>
                </div>
                <p className="text-2xl font-bold">+23%</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-blue-600 mb-2">
                  <Target className="w-4 h-4" />
                  <span className="text-sm font-medium">{t('deals.analytics.goalAchievement', 'Достижение цели')}</span>
                </div>
                <p className="text-2xl font-bold">87%</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">{t('deals.analytics.leadQuality', 'Качество лидов')}</span>
                <Badge variant="outline" className="text-green-600">{t('deals.analytics.high', 'Высокое')}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">{t('deals.analytics.cycleTime', 'Время цикла')}</span>
                <Badge variant="outline" className="text-blue-600">{t('deals.analytics.days', '{{count}} дней', { count: 28 })}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">{t('deals.analytics.teamActivity', 'Активность команды')}</span>
                <Badge variant="outline" className="text-purple-600">92%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DealAnalytics;