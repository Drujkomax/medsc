import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDeals } from '@/hooks/useDeals';
import { useLeads } from '@/hooks/useLeads';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Deal } from '@/types/crm';
import { useTranslation } from 'react-i18next';
import { DollarSign, Calendar, User, Eye, Edit, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface DealKanbanBoardProps {
  onAddDeal: () => void;
  onEditDeal: (deal: Deal) => void;
  onViewDeal: (deal: Deal) => void;
}

const DealKanbanBoard = ({ onAddDeal, onEditDeal, onViewDeal }: DealKanbanBoardProps) => {
  const { t } = useTranslation();
  const { deals, updateDeal, loading } = useDeals();
  const { leads } = useLeads();
  const { hasPermission } = useUserPermissions();
  const [localDeals, setLocalDeals] = useState<Deal[]>([]);

  const stages = [
    { id: 'lead', title: t('deals.stages.lead'), color: 'deal-lead' },
    { id: 'qualified', title: t('deals.stages.qualified'), color: 'deal-qualified' },
    { id: 'proposal', title: t('deals.stages.proposal'), color: 'deal-proposal' },
    { id: 'negotiation', title: t('deals.stages.negotiation'), color: 'deal-negotiation' },
    { id: 'closed', title: t('deals.stages.closed'), color: 'deal-closed' },
    { id: 'lost', title: t('deals.stages.lost'), color: 'deal-lost' }
  ];

  useEffect(() => {
    setLocalDeals(deals);
  }, [deals]);

  const getLeadName = (leadId: string) => {
    if (!leadId) return '';
    const lead = leads.find(l => l.id === leadId);
    return lead?.name || '';
  };

  const getDealsByStage = (stage: string) => {
    return localDeals.filter(deal => deal.stage === stage);
  };

  const getStageValue = (stage: string) => {
    const stageDeals = getDealsByStage(stage);
    return stageDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('deals.kanban.title')}</h1>
          <p className="text-muted-foreground">{t('deals.kanban.subtitle')}</p>
        </div>
        <Button onClick={onAddDeal}>
          <Plus className="w-4 h-4 mr-2" />
          {t('deals.addDeal')}
        </Button>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map(stage => (
            <div key={stage.id} className="flex-shrink-0 w-80">
              {/* Column Header */}
              <div className={`p-4 rounded-lg border backdrop-blur-xl ${stage.color} mb-4 animate-fade-in`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">{stage.title}</h3>
                  <Badge variant="secondary">
                    {getDealsByStage(stage.id).length}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  ${getStageValue(stage.id).toLocaleString()}
                </div>
              </div>

              {/* Droppable Area */}
              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-2 min-h-[200px] p-2 rounded-lg transition-colors ${
                      snapshot.isDraggingOver ? 'bg-muted/50' : 'bg-transparent'
                    }`}
                  >
                    {getDealsByStage(stage.id).map((deal, index) => (
                      <Draggable key={deal.id} draggableId={deal.id} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`deal-card-${stage.id} transition-shadow smooth-transition hover-glow ${
                              snapshot.isDragging ? 'shadow-lg rotate-2 scale-105' : 'hover:shadow-md'
                            }`}
                          >
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm line-clamp-2">
                                {deal.title}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              {deal.amount && (
                                <div className="flex items-center text-sm font-semibold">
                                  <DollarSign className="w-3 h-3 mr-1" />
                                  ${deal.amount.toLocaleString()}
                                </div>
                              )}
                              
                              {deal.client_id && (
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <User className="w-3 h-3 mr-1" />
                                  <span className="truncate">{getLeadName(deal.client_id)}</span>
                                </div>
                              )}
                              
                              {deal.close_date && (
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {format(new Date(deal.close_date), 'dd.MM')}
                                </div>
                              )}
                              
                              {deal.probability && (
                                <div className="text-xs text-muted-foreground">
                                  {deal.probability}% {t('deals.probability')}
                                </div>
                              )}

                              <div className="flex justify-between items-center pt-2">
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
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default DealKanbanBoard;