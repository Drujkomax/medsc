import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useLeads } from '@/hooks/useLeads';
import { useDeals } from '@/hooks/useDeals';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  Users, 
  Calendar,
  Award,
  BarChart3,
  Zap
} from 'lucide-react';

const DirectorDashboardMetrics = () => {
  const { t } = useTranslation();
  const { leads } = useLeads();
  const { deals } = useDeals();
  const { hasPermission } = useUserPermissions();
  const { user } = useAuth();
  const [salesManagersData, setSalesManagersData] = useState<any[]>([]);

  // Calculate metrics
  const totalLeads = leads.length;
  const closedDeals = deals.filter(deal => deal.stage === 'closed');
  const totalDealValue = deals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
  const closedDealValue = closedDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
  
  const conversionRate = totalLeads > 0 ? (closedDeals.length / totalLeads) * 100 : 0;
  const avgDealSize = closedDeals.length > 0 ? closedDealValue / closedDeals.length : 0;

  // This month metrics
  const thisMonth = new Date();
  thisMonth.setDate(1);
  const thisMonthDeals = closedDeals.filter(deal => 
    new Date(deal.created_at) >= thisMonth
  );
  const monthlyRevenue = thisMonthDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0);

  // Pipeline metrics
  const qualifiedDeals = deals.filter(deal => deal.stage === 'qualified');
  const proposalDeals = deals.filter(deal => deal.stage === 'proposal');
  const negotiationDeals = deals.filter(deal => deal.stage === 'negotiation');

  const pipelineValue = [...qualifiedDeals, ...proposalDeals, ...negotiationDeals]
    .reduce((sum, deal) => sum + (deal.amount || 0), 0);

  // Fetch sales managers performance data
  useEffect(() => {
    const fetchSalesManagersData = async () => {
      try {
        // Get all sales managers
        const { data: salesManagers, error: managersError } = await supabase
          .from('user_roles')
          .select(`
            user_id,
            role
          `)
          .eq('role', 'sales_manager');

        if (managersError) {
          console.error('Error fetching sales managers:', managersError);
          return;
        }

        if (!salesManagers || salesManagers.length === 0) {
          setSalesManagersData([]);
          return;
        }

        // Get auth users info for these managers
        const managerIds = salesManagers.map(sm => sm.user_id);
        
        // Get deals created by these managers
        const { data: managerDeals, error: dealsError } = await supabase
          .from('deals')
          .select('*')
          .in('created_by', managerIds);

        if (dealsError) {
          console.error('Error fetching manager deals:', dealsError);
          return;
        }

        // Get leads assigned to these managers
        const { data: managerLeads, error: leadsError } = await supabase
          .from('leads')
          .select('*')
          .in('assigned_to', managerIds);

        if (leadsError) {
          console.error('Error fetching manager leads:', leadsError);
          return;
        }

        // Calculate performance for each manager
        const managersPerformance = await Promise.all(
          salesManagers.map(async (manager) => {
            // Get user info from auth
            const { data: authUser } = await supabase.auth.admin.getUserById(manager.user_id);
            
            const userDeals = managerDeals?.filter(deal => deal.created_by === manager.user_id) || [];
            const userLeads = managerLeads?.filter(lead => lead.assigned_to === manager.user_id) || [];
            const closedDeals = userDeals.filter(deal => deal.stage === 'closed');
            
            const totalValue = closedDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
            const conversionRate = userLeads.length > 0 ? (closedDeals.length / userLeads.length) * 100 : 0;

            return {
              name: authUser?.user?.email?.split('@')[0] || 'Менеджер',
              deals: closedDeals.length,
              value: totalValue,
              conversion: Math.round(conversionRate)
            };
          })
        );

        setSalesManagersData(managersPerformance);
      } catch (error) {
        console.error('Error in fetchSalesManagersData:', error);
        setSalesManagersData([]);
      }
    };

    if (hasPermission('view_analytics')) {
      fetchSalesManagersData();
    }
  }, [hasPermission]);

  // Only show for directors
  if (!hasPermission('view_analytics')) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('director.totalRevenue')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalDealValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {t('director.allTime')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('director.monthlyRevenue')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {t('director.thisMonth')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('director.conversionRate')}</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {t('director.leadToDeal')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('director.avgDealSize')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${avgDealSize.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {t('director.average')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t('director.salesPipeline')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{qualifiedDeals.length}</div>
              <div className="text-sm text-muted-foreground">{t('deals.stages.qualified')}</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{proposalDeals.length}</div>
              <div className="text-sm text-muted-foreground">{t('deals.stages.proposal')}</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{negotiationDeals.length}</div>
              <div className="text-sm text-muted-foreground">{t('deals.stages.negotiation')}</div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-xl font-semibold">{t('director.pipelineValue')}: ${pipelineValue.toLocaleString()}</div>
          </div>
        </CardContent>
      </Card>

      {/* Team Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('director.teamPerformance')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {salesManagersData.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                {t('director.noSalesManagers', 'Нет данных о менеджерах продаж')}
              </div>
            ) : (
              salesManagersData.map((member, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{member.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {member.deals} {t('director.salesManagerDeals', 'закрытых сделок')}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">${member.value.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {member.conversion}% {t('director.managerConversion', 'конверсия')}
                  </div>
                </div>
              </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('director.quickActions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2"
              onClick={() => window.location.href = '/admin/deals'}
            >
              <DollarSign className="h-6 w-6" />
              {t('director.viewAllDeals')}
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2"
              onClick={() => window.location.href = '/admin/leads'}
            >
              <Target className="h-6 w-6" />
              {t('director.viewAllLeads')}
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2"
              onClick={() => window.location.href = '/admin/employees'}
            >
              <Users className="h-6 w-6" />
              {t('director.manageTeam')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DirectorDashboardMetrics;