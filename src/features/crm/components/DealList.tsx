import { useState } from 'react';
import { useDeals } from '@/hooks/useDeals';
import { useLeads } from '@/hooks/useLeads';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { Search, Plus, DollarSign, TrendingUp, Calendar, Eye, Edit, Trash2, User } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface DealListProps {
  onAddDeal: () => void;
  onEditDeal: (deal: any) => void;
  onViewDeal: (deal: any) => void;
}

const DealList = ({ onAddDeal, onEditDeal, onViewDeal }: DealListProps) => {
  const { t } = useTranslation();
  const { deals, loading, deleteDeal } = useDeals();
  const { leads } = useLeads();
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');

  const stages = ['lead', 'qualified', 'proposal', 'negotiation', 'closed', 'lost'];
  
  const filteredDeals = deals.filter(deal => {
    const matchesSearch = deal.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = stageFilter === 'all' || deal.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const getLeadName = (leadId: string) => {
    if (!leadId) return t('common.unknown');
    const lead = leads.find(l => l.id === leadId);
    return lead?.name || t('common.unknown');
  };

  const getStageColor = (stage: string) => {
    const colors = {
      lead: 'bg-blue-100 text-blue-800',
      qualified: 'bg-green-100 text-green-800',
      proposal: 'bg-yellow-100 text-yellow-800',
      negotiation: 'bg-orange-100 text-orange-800',
      closed: 'bg-emerald-100 text-emerald-800',
      lost: 'bg-red-100 text-red-800'
    };
    return colors[stage as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const totalValue = deals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
  const closedDeals = deals.filter(deal => deal.stage === 'closed');
  const closedValue = closedDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0);

  const handleDeleteDeal = async (id: string, title: string) => {
    if (confirm(t('common.confirmDelete', { name: title }))) {
      try {
        await deleteDeal(id);
        toast.success(t('deals.deleted'));
      } catch (error) {
        toast.error(t('common.error'));
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('deals.title')}</h1>
          <p className="text-muted-foreground">{t('deals.subtitle')}</p>
        </div>
        <Button onClick={onAddDeal} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          {t('deals.addDeal')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('deals.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={t('deals.filterByStage')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            {stages.map(stage => (
              <SelectItem key={stage} value={stage}>
                {t(`deals.stages.${stage}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {t('deals.totalValue')}
                </p>
                <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {t('deals.closedValue')}
                </p>
                <p className="text-2xl font-bold">${closedValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {t('deals.total')}
                </p>
                <p className="text-2xl font-bold">{deals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {t('deals.closed')}
                </p>
                <p className="text-2xl font-bold">{closedDeals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deals List */}
      {filteredDeals.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-foreground">
                {t('deals.notFound')}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('deals.notFoundDescription')}
              </p>
              <div className="mt-6">
                <Button onClick={onAddDeal}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('deals.addDeal')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDeals.map((deal) => (
            <Card key={deal.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="truncate">{deal.title}</span>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onViewDeal(deal)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onEditDeal(deal)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteDeal(deal.id, deal.title)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge className={getStageColor(deal.stage)}>
                    {t(`deals.stages.${deal.stage}`)}
                  </Badge>
                  {deal.amount && (
                    <span className="font-semibold text-lg">
                      ${deal.amount.toLocaleString()}
                    </span>
                  )}
                </div>
                
                {deal.client_id && (
                  <div className="flex items-center text-sm">
                    <User className="w-4 h-4 text-muted-foreground mr-2" />
                    <span className="truncate">{getLeadName(deal.client_id)}</span>
                  </div>
                )}
                
                {deal.probability && (
                  <div className="flex items-center text-sm">
                    <TrendingUp className="w-4 h-4 text-muted-foreground mr-2" />
                    <span>{deal.probability}% {t('deals.probability')}</span>
                  </div>
                )}
                
                {deal.close_date && (
                  <div className="flex items-center text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground mr-2" />
                    <span>{format(new Date(deal.close_date), 'dd.MM.yyyy')}</span>
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground pt-2">
                  {t('deals.createdAt')}: {format(new Date(deal.created_at), 'dd.MM.yyyy')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DealList;