import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useDeals } from '@/hooks/useDeals';
import { useLeads } from '@/hooks/useLeads';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Deal } from '@/types/crm';
import { useTranslation } from 'react-i18next';
import { 
  DollarSign, 
  Calendar, 
  User, 
  Eye, 
  Edit, 
  Plus,
  Search,
  MoreHorizontal,
  Clock,
  TrendingUp,
  Filter,
  Users
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface EnhancedDealKanbanProps {
  onAddDeal: () => void;
  onEditDeal: (deal: Deal) => void;
  onViewDeal: (deal: Deal) => void;
}

const EnhancedDealKanban = ({ onAddDeal, onEditDeal, onViewDeal }: EnhancedDealKanbanProps) => {
  const { t } = useTranslation();
  const { deals, updateDeal, loading } = useDeals();
  const { leads } = useLeads();
  const { hasPermission } = useUserPermissions();
  
  const [localDeals, setLocalDeals] = useState<Deal[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const stages = [
    { 
      id: 'lead', 
      title: t('deals.stages.lead'), 
      color: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-900 dark:text-blue-100'
    },
    { 
      id: 'qualified', 
      title: t('deals.stages.qualified'), 
      color: 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900',
      borderColor: 'border-green-200 dark:border-green-800',
      textColor: 'text-green-900 dark:text-green-100'
    },
    { 
      id: 'proposal', 
      title: t('deals.stages.proposal'), 
      color: 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      textColor: 'text-yellow-900 dark:text-yellow-100'
    },
    { 
      id: 'negotiation', 
      title: t('deals.stages.negotiation'), 
      color: 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900',
      borderColor: 'border-orange-200 dark:border-orange-800',
      textColor: 'text-orange-900 dark:text-orange-100'
    },
    { 
      id: 'closed', 
      title: t('deals.stages.closed'), 
      color: 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
      textColor: 'text-emerald-900 dark:text-emerald-100'
    },
    { 
      id: 'lost', 
      title: t('deals.stages.lost'), 
      color: 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-900 dark:text-red-100'
    }
  ];

  useEffect(() => {
    setLocalDeals(deals);
  }, [deals]);

  const filteredDeals = localDeals.filter(deal => {
    const matchesSearch = deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getLeadName(deal.lead_id).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAssignee = assigneeFilter === 'all' || deal.created_by === assigneeFilter;
    return matchesSearch && matchesAssignee;
  });

  const getLeadName = (leadId?: string) => {
    if (!leadId) return '';
    const lead = leads.find(l => l.id === leadId);
    return lead?.name || '';
  };

  const getLeadCompany = (leadId?: string) => {
    if (!leadId) return '';
    const lead = leads.find(l => l.id === leadId);
    return lead?.company || '';
  };

  const getDealsByStage = (stage: string) => {
    return filteredDeals.filter(deal => deal.stage === stage);
  };

  const getStageValue = (stage: string) => {
    const stageDeals = getDealsByStage(stage);
    return stageDeals.reduce((sum, deal) => sum + Number(deal.amount || 0), 0);
  };

  const getStageAvgValue = (stage: string) => {
    const stageDeals = getDealsByStage(stage);
    const totalValue = getStageValue(stage);
    return stageDeals.length > 0 ? totalValue / stageDeals.length : 0;
  };

  const getPriorityColor = (probability?: number) => {
    if (!probability) return 'bg-gray-100 text-gray-600';
    if (probability >= 80) return 'bg-green-100 text-green-700';
    if (probability >= 60) return 'bg-yellow-100 text-yellow-700';
    if (probability >= 40) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Check permissions
    if (!hasPermission('manage_all_leads')) {
      toast.error(t('common.noPermission'));
      return;
    }

    const deal = localDeals.find(d => d.id === draggableId);
    if (!deal) return;

    // Update local state immediately for better UX
    const newDeals = [...localDeals];
    const dealIndex = newDeals.findIndex(d => d.id === draggableId);
    newDeals[dealIndex] = { ...deal, stage: destination.droppableId as Deal['stage'] };
    setLocalDeals(newDeals);

    try {
      await updateDeal(deal.id, { stage: destination.droppableId as Deal['stage'] });
      toast.success(t('deals.stageUpdated'));
    } catch (error) {
      // Revert on error
      setLocalDeals(deals);
      toast.error(t('common.error'));
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
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t('deals.kanbanView')}</h2>
          <p className="text-muted-foreground">
            {filteredDeals.length} сделок на общую сумму ${filteredDeals.reduce((sum, deal) => sum + Number(deal.amount || 0), 0).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} size="sm">
            <Filter className="w-4 h-4 mr-2" />
            {t('common.filters')}
          </Button>
          <Button onClick={onAddDeal}>
            <Plus className="w-4 h-4 mr-2" />
            {t('deals.addDeal')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('deals.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t('deals.filterByAssignee')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value="me">{t('common.me')}</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setAssigneeFilter('all');
                }}
              >
                {t('common.clearFilters')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-4">
          {stages.map(stage => {
            const stageDeals = getDealsByStage(stage.id);
            const stageValue = getStageValue(stage.id);
            const avgValue = getStageAvgValue(stage.id);
            
            return (
              <div key={stage.id} className="flex-shrink-0 w-80">
                {/* Column Header */}
                <div className={`p-4 rounded-xl border-2 ${stage.color} ${stage.borderColor} mb-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`font-bold text-sm ${stage.textColor}`}>{stage.title}</h3>
                    <Badge variant="secondary" className="bg-white/80 dark:bg-black/20">
                      {stageDeals.length}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1">
                    <div className={`text-xs ${stage.textColor} flex items-center gap-1`}>
                      <DollarSign className="w-3 h-3" />
                      <span className="font-semibold">${stageValue.toLocaleString()}</span>
                    </div>
                    
                    {stageDeals.length > 0 && (
                      <div className={`text-xs ${stage.textColor} opacity-80 flex items-center gap-1`}>
                        <TrendingUp className="w-3 h-3" />
                        <span>Сред: ${avgValue.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Droppable Area */}
                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-3 min-h-[300px] p-3 rounded-xl transition-all duration-200 ${
                        snapshot.isDraggingOver 
                          ? 'bg-muted/50 border-2 border-dashed border-muted-foreground/50' 
                          : 'bg-muted/20 border-2 border-transparent'
                      }`}
                    >
                      {stageDeals.map((deal, index) => (
                        <Draggable key={deal.id} draggableId={deal.id} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`transition-all duration-200 cursor-pointer ${
                                snapshot.isDragging 
                                  ? 'shadow-lg rotate-2 scale-105' 
                                  : 'hover:shadow-md hover:-translate-y-1'
                              }`}
                            >
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                  <CardTitle className="text-sm font-medium line-clamp-2 flex-1">
                                    {deal.title}
                                  </CardTitle>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        className="h-6 w-6 p-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <MoreHorizontal className="w-3 h-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => onViewDeal(deal)}>
                                        <Eye className="w-4 h-4 mr-2" />
                                        {t('common.view')}
                                      </DropdownMenuItem>
                                      {hasPermission('manage_all_leads') && (
                                        <DropdownMenuItem onClick={() => onEditDeal(deal)}>
                                          <Edit className="w-4 h-4 mr-2" />
                                          {t('common.edit')}
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </CardHeader>
                              
                              <CardContent className="space-y-3 pt-0">
                                {/* Amount */}
                                {deal.amount && (
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center text-lg font-bold text-green-600">
                                      <DollarSign className="w-4 h-4 mr-1" />
                                      {deal.amount.toLocaleString()}
                                    </div>
                                    {deal.probability && (
                                      <Badge className={`text-xs ${getPriorityColor(deal.probability)}`}>
                                        {deal.probability}%
                                      </Badge>
                                    )}
                                  </div>
                                )}
                                
                                {/* Client */}
                                {deal.lead_id && (
                                  <div className="flex items-center text-sm text-muted-foreground">
                                    <div className="flex items-center flex-1">
                                      <Avatar className="h-6 w-6 mr-2">
                                        <AvatarFallback className="text-xs">
                                          {getLeadName(deal.lead_id).charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 truncate">
                                        <p className="font-medium text-foreground truncate">
                                          {getLeadName(deal.lead_id)}
                                        </p>
                                        {getLeadCompany(deal.lead_id) && (
                                          <p className="text-xs text-muted-foreground truncate">
                                            {getLeadCompany(deal.lead_id)}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Close Date */}
                                {deal.close_date && (
                                  <div className="flex items-center text-xs text-muted-foreground">
                                    <Clock className="w-3 h-3 mr-1" />
                                    <span>{format(new Date(deal.close_date), 'dd.MM.yyyy')}</span>
                                  </div>
                                )}
                                
                                {/* Notes Preview */}
                                {deal.notes && (
                                  <div className="text-xs text-muted-foreground line-clamp-2 bg-muted/50 p-2 rounded">
                                    {deal.notes}
                                  </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex justify-between items-center pt-2 border-t">
                                  <div className="text-xs text-muted-foreground">
                                    {format(new Date(deal.created_at), 'dd.MM')}
                                  </div>
                                  <div className="flex gap-1">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onViewDeal(deal);
                                      }}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Eye className="w-3 h-3" />
                                    </Button>
                                    {hasPermission('manage_all_leads') && (
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onEditDeal(deal);
                                        }}
                                        className="h-6 w-6 p-0"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      
                      {/* Add Deal Button for Empty Columns */}
                      {stageDeals.length === 0 && (
                        <div className="flex items-center justify-center py-8">
                          <Button
                            variant="ghost"
                            onClick={onAddDeal}
                            className="text-muted-foreground hover:text-foreground border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/60"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            {t('deals.addDeal')}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};

export default EnhancedDealKanban;