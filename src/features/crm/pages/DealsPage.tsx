import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import EnhancedDealList from '../components/EnhancedDealList';
import EnhancedViewDealModal from '../components/EnhancedViewDealModal';
import UnifiedDealDialog from '../components/UnifiedDealDialog';
import DealAnalytics from '../components/DealAnalytics';
import { Deal } from '@/types/crm';
import { useDeals } from '@/hooks/useDeals';
import { useTranslation } from 'react-i18next';
import RoleBasedAccess from '@/components/auth/RoleBasedAccess';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { 
  LayoutList, 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar,
  Plus,
  Filter,
  Download,
  AlertCircle,
  CreditCard
} from 'lucide-react';

const DealsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { deals } = useDeals();
  const { hasPermission, role } = useUserPermissions();
  const [activeTab, setActiveTab] = useState('overview');
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [viewingDeal, setViewingDeal] = useState<Deal | null>(null);
  
  const isAccountant = role === 'accountant';

  // Calculate quick stats
  const totalDeals = deals.length;
  const totalValue = deals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
  const closedDeals = deals.filter(deal => deal.stage === 'closed');
  const wonValue = closedDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
  const avgDealValue = totalDeals > 0 ? totalValue / totalDeals : 0;
  const conversionRate = totalDeals > 0 ? (closedDeals.length / totalDeals * 100) : 0;
  
  // Payment status stats for accountants
  const waitingDeals = deals.filter(deal => deal.payment_status === 'waiting').length;
  const paidDeals = deals.filter(deal => deal.payment_status === 'paid').length;
  const notRealizedDeals = deals.filter(deal => deal.payment_status === 'not_realized').length;
  const debtDeals = deals.filter(deal => deal.payment_status === 'debt');
  
  // Calculate total debt amount and count of debtors
  const totalDebtAmount = debtDeals.reduce((sum, deal) => sum + (deal.debt_amount || 0), 0);
  const debtorsCount = debtDeals.length;

  const handleCreateDeal = () => {
    navigate('/admin/deals/create');
  };

  const handleEditDeal = (deal: Deal) => {
    setViewingDeal(null); // Закрываем модал просмотра если открыт
    setEditingDeal(deal);
  };

  const handleViewDeal = (deal: Deal) => {
    setViewingDeal(deal);
  };

  const handleCloseDialog = () => {
    setEditingDeal(null);
    setViewingDeal(null);
  };

  const quickStats = isAccountant ? [
    {
      title: t('deals.payment.waiting', 'Ожидание'),
      value: waitingDeals.toString(),
      icon: Calendar,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
      change: '',
      changeType: 'neutral' as const
    },
    {
      title: t('deals.payment.paid', 'Оплачено'),
      value: paidDeals.toString(),
      icon: DollarSign,
      color: 'text-green-600 bg-green-50 dark:bg-green-900/20',
      change: '',
      changeType: 'positive' as const
    },
    {
      title: t('deals.payment.notRealized', 'Не реализовано'),
      value: notRealizedDeals.toString(),
      icon: Users,
      color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20',
      change: '',
      changeType: 'neutral' as const
    },
    {
      title: t('deals.payment.debt', 'Задолженность'),
      value: debtorsCount.toString(),
      icon: TrendingUp,
      color: 'text-red-600 bg-red-50 dark:bg-red-900/20',
      change: '',
      changeType: 'neutral' as const
    }
  ] : [
    {
      title: t('deals.stats.totalDeals'),
      value: totalDeals.toString(),
      icon: Users,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
      change: '+12%',
      changeType: 'positive' as const
    },
    {
      title: t('deals.stats.totalValue'),
      value: `$${totalValue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-600 bg-green-50 dark:bg-green-900/20',
      change: '+8%',
      changeType: 'positive' as const
    },
    {
      title: t('deals.stats.wonValue'),
      value: `$${wonValue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
      change: '+23%',
      changeType: 'positive' as const
    },
    {
      title: t('deals.stats.avgDealValue'),
      value: `$${avgDealValue.toLocaleString()}`,
      icon: BarChart3,
      color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20',
      change: `${conversionRate.toFixed(1)}%`,
      changeType: 'neutral' as const
    }
  ];

  return (
    <RoleBasedAccess permissions={['view_deals']}>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('deals.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('deals.description')}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              {t('common.filters')}
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              {t('common.export')}
            </Button>
            {hasPermission('manage_deals') && (
              <Button onClick={handleCreateDeal}>
                <Plus className="w-4 h-4 mr-2" />
                {t('deals.addDeal')}
              </Button>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickStats.map((stat, index) => (
            <Card key={index} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    {stat.change && (
                      <div className="flex items-center mt-2">
                        <span className={`text-xs font-medium ${
                          stat.changeType === 'positive' ? 'text-green-600' : 'text-muted-foreground'
                        }`}>
                          {stat.change}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">
                          {t('deals.stats.fromLastMonth')}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className={`p-3 rounded-full ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Debt Summary Block - Only for Accountants */}
        {isAccountant && (
          <Card className="relative overflow-hidden border-2 border-red-200 dark:border-red-800 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-orange-50 to-red-50 dark:from-red-950/30 dark:via-orange-950/30 dark:to-red-950/30" />
            <CardContent className="relative p-8">
              <div className="flex items-center justify-center gap-6">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 shadow-xl">
                  <AlertCircle className="w-10 h-10 text-white" />
                </div>
                <div className="text-center">
                <p className="text-sm font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider mb-2">
                    ⚠️ {t('deals.totalDebt', 'Общая сумма задолженности')}
                  </p>
                  <p className="text-5xl font-black text-red-600 dark:text-red-400 tracking-tight">
                    {totalDebtAmount.toLocaleString('ru-RU', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })} 
                    <span className="text-2xl ml-2 font-bold">USD</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">{t('deals.overview')}</span>
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <LayoutList className="w-4 h-4" />
              <span className="hidden sm:inline">{t('deals.listView')}</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">{t('deals.analytics', 'Аналитика')}</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <DealAnalytics />
          </TabsContent>
          
          <TabsContent value="list" className="space-y-6">
            <EnhancedDealList 
              onEditDeal={hasPermission('manage_deals') ? handleEditDeal : undefined}
              onViewDeal={handleViewDeal}
            />
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-6">
            <DealAnalytics detailed />
          </TabsContent>
        </Tabs>

        <EnhancedViewDealModal
          open={!!viewingDeal}
          onClose={handleCloseDialog}
          deal={viewingDeal}
          onEdit={hasPermission('manage_deals') ? handleEditDeal : undefined}
        />

        <UnifiedDealDialog
          open={!!editingDeal}
          onClose={handleCloseDialog}
          deal={editingDeal}
        />
      </div>
    </RoleBasedAccess>
  );
};

export default DealsPage;