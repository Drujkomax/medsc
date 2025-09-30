import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import EnhancedDealList from '../components/EnhancedDealList';
import UnifiedDealDialog from '../components/UnifiedDealDialog';
import EnhancedViewDealModal from '../components/EnhancedViewDealModal';
import DealAnalytics from '../components/DealAnalytics';
import { Deal } from '@/types/crm';
import { useDeals } from '@/hooks/useDeals';
import { useTranslation } from 'react-i18next';
import RoleBasedAccess from '@/components/auth/RoleBasedAccess';
import { 
  LayoutList, 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar,
  Plus,
  Filter,
  Download
} from 'lucide-react';

const DealsPage = () => {
  const { t } = useTranslation();
  const { deals } = useDeals();
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [viewingDeal, setViewingDeal] = useState<Deal | null>(null);

  // Calculate quick stats
  const totalDeals = deals.length;
  const totalValue = deals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
  const closedDeals = deals.filter(deal => deal.stage === 'closed');
  const wonValue = closedDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
  const avgDealValue = totalDeals > 0 ? totalValue / totalDeals : 0;
  const conversionRate = totalDeals > 0 ? (closedDeals.length / totalDeals * 100) : 0;

  const handleAddDeal = () => {
    setEditingDeal(null);
    setShowAddDialog(true);
  };

  const handleEditDeal = (deal: Deal) => {
    setEditingDeal(deal);
    setViewingDeal(null);
    setShowAddDialog(true);
  };

  const handleViewDeal = (deal: Deal) => {
    setViewingDeal(deal);
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setEditingDeal(null);
    setViewingDeal(null);
  };

  const quickStats = [
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
    <RoleBasedAccess permissions={['view_all_leads']}>
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
            <Button onClick={handleAddDeal}>
              <Plus className="w-4 h-4 mr-2" />
              {t('deals.addDeal')}
            </Button>
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
                  </div>
                  <div className={`p-3 rounded-full ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

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
              <span className="hidden sm:inline">Аналитика</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <DealAnalytics />
          </TabsContent>
          
          <TabsContent value="list" className="space-y-6">
            <EnhancedDealList 
              onAddDeal={handleAddDeal}
              onEditDeal={handleEditDeal}
              onViewDeal={handleViewDeal}
            />
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-6">
            <DealAnalytics detailed />
          </TabsContent>
        </Tabs>

        <UnifiedDealDialog
          open={showAddDialog}
          onClose={handleCloseDialog}
          deal={editingDeal}
        />

        <EnhancedViewDealModal
          open={!!viewingDeal}
          onClose={handleCloseDialog}
          deal={viewingDeal}
          onEdit={handleEditDeal}
        />
      </div>
    </RoleBasedAccess>
  );
};

export default DealsPage;