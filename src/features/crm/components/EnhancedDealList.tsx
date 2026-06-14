import { useState } from 'react';
import { useDeals } from '@/hooks/useDeals';
import { useLeads } from '@/hooks/useLeads';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  Plus, 
  MoreHorizontal,
  Eye, 
  Edit, 
  Trash2, 
  User, 
  Calendar,
  DollarSign,
  TrendingUp,
  Filter,
  ArrowUpDown,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Deal } from '@/types/crm';

interface EnhancedDealListProps {
  onEditDeal: (deal: Deal) => void;
  onViewDeal: (deal: Deal) => void;
}

type SortField = 'created_at' | 'amount' | 'title' | 'stage';
type SortOrder = 'asc' | 'desc';

const EnhancedDealList = ({ onEditDeal, onViewDeal }: EnhancedDealListProps) => {
  const { t } = useTranslation();
  const { deals, loading, deleteDeal } = useDeals();
  const { leads } = useLeads();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [amountFilter, setAmountFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedDeals, setSelectedDeals] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const stages = ['lead', 'qualified', 'proposal', 'negotiation', 'closed', 'lost'];
  const amountRanges = [
    { value: 'all', label: t('common.all') },
    { value: '0-10000', label: '< $10,000' },
    { value: '10000-50000', label: '$10,000 - $50,000' },
    { value: '50000-100000', label: '$50,000 - $100,000' },
    { value: '100000+', label: '> $100,000' }
  ];

  // Filter and sort deals
  const filteredAndSortedDeals = deals
    .filter(deal => {
      const matchesSearch = deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           getLeadName(deal.lead_id).toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStage = stageFilter === 'all' || deal.stage === stageFilter;
      
      let matchesAmount = true;
      if (amountFilter !== 'all' && deal.amount) {
        const amount = deal.amount;
        switch (amountFilter) {
          case '0-10000':
            matchesAmount = amount < 10000;
            break;
          case '10000-50000':
            matchesAmount = amount >= 10000 && amount < 50000;
            break;
          case '50000-100000':
            matchesAmount = amount >= 50000 && amount < 100000;
            break;
          case '100000+':
            matchesAmount = amount >= 100000;
            break;
        }
      }
      
      return matchesSearch && matchesStage && matchesAmount;
    })
    .sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      if (sortField === 'created_at') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (sortField === 'amount') {
        aValue = aValue || 0;
        bValue = bValue || 0;
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const getLeadName = (leadId?: string) => {
    if (!leadId) return t('common.unknown');
    const lead = leads.find(l => l.id === leadId);
    return lead?.name || t('common.unknown');
  };

  const getStageColor = (stage: string) => {
    const colors = {
      lead: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      qualified: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      proposal: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      negotiation: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      closed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
      lost: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return colors[stage as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleSelectDeal = (dealId: string, checked: boolean) => {
    if (checked) {
      setSelectedDeals([...selectedDeals, dealId]);
    } else {
      setSelectedDeals(selectedDeals.filter(id => id !== dealId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDeals(filteredAndSortedDeals.map(deal => deal.id));
    } else {
      setSelectedDeals([]);
    }
  };

  const handleDeleteDeal = async (id: string, title: string) => {
    if (confirm(t('common.confirmDelete', { name: title }))) {
      try {
        await deleteDeal(id);
        toast.success(t('deals.deleted'));
        setSelectedDeals(selectedDeals.filter(selectedId => selectedId !== id));
      } catch (error) {
        toast.error(t('common.error'));
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDeals.length === 0) return;
    
    if (confirm(t('common.confirmBulkDelete', { count: selectedDeals.length }))) {
      try {
        await Promise.all(selectedDeals.map(id => deleteDeal(id)));
        toast.success(t('deals.bulkDeleted', { count: selectedDeals.length }));
        setSelectedDeals([]);
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
      {/* Header with Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t('deals.listView', 'Список')}</h2>
          <p className="text-muted-foreground">
            {t('deals.list.showing', '{{filtered}} из {{total}} сделок', { filtered: filteredAndSortedDeals.length, total: deals.length })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedDeals.length > 0 && (
            <Button variant="destructive" onClick={handleBulkDelete} size="sm">
              <Trash2 className="w-4 h-4 mr-2" />
              {t('common.delete')} ({selectedDeals.length})
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} size="sm">
            <Filter className="w-4 h-4 mr-2" />
            {t('common.filters')}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            {t('common.export')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('deals.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger>
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

              <Select value={amountFilter} onValueChange={setAmountFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t('deals.filterByAmount')} />
                </SelectTrigger>
                <SelectContent>
                  {amountRanges.map(range => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setStageFilter('all');
                  setAmountFilter('all');
                }}
              >
                {t('common.clearFilters')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deals Table */}
      {filteredAndSortedDeals.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">
                {t('deals.notFound')}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('deals.notFoundDescription')}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedDeals.length === filteredAndSortedDeals.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center gap-2">
                    {t('deals.title')}
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('stage')}
                >
                  <div className="flex items-center gap-2">
                    {t('deals.stage')}
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </TableHead>
                <TableHead>{t('deals.client')}</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center gap-2">
                    {t('deals.amount')}
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </TableHead>
                <TableHead>{t('deals.probability')}</TableHead>
                <TableHead>{t('deals.closeDate')}</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center gap-2">
                    {t('deals.createdAt')}
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </TableHead>
                <TableHead className="w-20">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedDeals.map((deal) => (
                <TableRow key={deal.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Checkbox
                      checked={selectedDeals.includes(deal.id)}
                      onCheckedChange={(checked) => handleSelectDeal(deal.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-48">{deal.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStageColor(deal.stage)}>
                      {t(`deals.stages.${deal.stage}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="truncate max-w-32">{getLeadName(deal.lead_id)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {deal.amount ? (
                      <div className="flex items-center gap-1 font-medium">
                        {deal.amount.toLocaleString()} UZS
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {deal.probability ? (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        {deal.probability}%
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {deal.close_date ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {format(new Date(deal.close_date), 'dd.MM.yyyy')}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(deal.created_at), 'dd.MM.yyyy')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewDeal(deal)}>
                          <Eye className="w-4 h-4 mr-2" />
                          {t('common.view')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditDeal(deal)}>
                          <Edit className="w-4 h-4 mr-2" />
                          {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteDeal(deal.id, deal.title)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default EnhancedDealList;