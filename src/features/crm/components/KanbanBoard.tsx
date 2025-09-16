import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Phone, Building, Eye } from 'lucide-react';
import { useLeads, Lead } from '@/hooks/useLeads';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useAuth } from '@/hooks/useAuth';
import { useDuplicateDetection } from '@/hooks/useDuplicateDetection';
import { useToast } from '@/hooks/use-toast';
import { EnhancedLeadModal } from './EnhancedLeadModal';
import { DuplicateAlert } from './DuplicateAlert';

// Unified lead stages with modern colors
const stages = [
  { id: 'new', title: 'Новый лид', color: 'from-blue-500 to-blue-600' },
  { id: 'contacted', title: 'Связались', color: 'from-yellow-500 to-amber-500' },
  { id: 'qualified', title: 'Квалифицирован', color: 'from-purple-500 to-violet-600' },
  { id: 'proposal', title: 'Предложение', color: 'from-orange-500 to-red-500' },
  { id: 'negotiation', title: 'Переговоры', color: 'from-indigo-500 to-blue-600' },
  { id: 'closed', title: 'Закрыт', color: 'from-green-500 to-emerald-600' },
  { id: 'lost', title: 'Потерян', color: 'from-red-500 to-rose-600' }
];

const KanbanBoard = () => {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { leads, loading, changeLeadStage, refetch } = useLeads();
  const { hasPermission } = useUserPermissions();
  const { user } = useAuth();
  const { duplicateGroups } = useDuplicateDetection(leads);
  const { toast } = useToast();

  // Filter out archived leads and apply user access permissions
  const visibleLeads = leads.filter(lead => {
    if (lead.archived) return false;
    
    // If user is salesperson, only show assigned leads
    if (!hasPermission('view_all_leads') && lead.assigned_to !== user?.id) {
      return false;
    }
    
    return true;
  });

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const leadId = draggableId;
    const newStage = destination.droppableId;
    
    // Check if user has permission to change stage
    const lead = visibleLeads.find(l => l.id === leadId);
    if (!lead) return;
    
    const canEdit = hasPermission('manage_all_leads') || 
                   (hasPermission('view_all_leads') && lead.assigned_to === user?.id);
    
    if (!canEdit) {
      toast({
        title: "Нет прав",
        description: "У вас нет прав для изменения этапа этого лида",
        variant: "destructive",
      });
      return;
    }

    try {
      await changeLeadStage(leadId, newStage);
      toast({
        title: "Успешно",
        description: "Этап лида обновлен",
      });
    } catch (error) {
      console.error('Error updating lead stage:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить этап лида",
        variant: "destructive",
      });
    }
  };

  const getLeadsByStage = (stageId: string) => {
    return visibleLeads.filter(lead => lead.stage === stageId);
  };

  const openLeadModal = (lead?: Lead) => {
    setSelectedLead(lead || null);
    setIsModalOpen(true);
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '';
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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
      {/* Duplicate alerts */}
      {duplicateGroups.length > 0 && (
        <div className="space-y-2">
          {duplicateGroups.slice(0, 3).map((group, index) => (
            <DuplicateAlert key={index} duplicateGroup={group} />
          ))}
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="overflow-x-auto">
          <div className="flex gap-4 pb-4 min-w-max">
          {stages.map((stage, index) => (
            <div 
              key={stage.id} 
              className={`glass-card min-w-80 flex-shrink-0 p-4 animate-fade-in kanban-${stage.id}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center mb-4">
                <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${stage.color} mr-3 animate-glow`}></div>
                <h3 className="font-heading text-foreground font-semibold">{stage.title}</h3>
                <Badge 
                  variant="secondary" 
                  className="ml-auto bg-white/10 text-foreground border-white/20"
                >
                  {getLeadsByStage(stage.id).length}
                </Badge>
              </div>

              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[300px] transition-all duration-300 rounded-lg p-2 ${
                      snapshot.isDraggingOver ? 'bg-white/10' : ''
                    }`}
                  >
                    {getLeadsByStage(stage.id).map((lead, index) => (
                      <Draggable key={lead.id} draggableId={lead.id} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`mb-3 cursor-pointer card-${stage.id} hover-glow smooth-transition ${
                              snapshot.isDragging ? 'rotate-2 scale-105' : ''
                            }`}
                            onClick={() => openLeadModal(lead)}
                          >
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium text-foreground">
                                {lead.name}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="space-y-2 text-xs text-muted-foreground">
                                {lead.company && (
                                  <div className="flex items-center">
                                    <Building className="mr-2 h-3 w-3 text-primary" />
                                    <span className="truncate">{lead.company}</span>
                                  </div>
                                )}
                                {lead.phone && (
                                  <div className="flex items-center">
                                    <Phone className="mr-2 h-3 w-3 text-accent" />
                                    <span>{lead.phone}</span>
                                  </div>
                                )}
                                <div className="text-xs text-muted-foreground">
                                  {new Date(lead.created_at).toLocaleDateString()}
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
        </div>
      </DragDropContext>

      <EnhancedLeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        lead={selectedLead}
        onLeadUpdate={refetch}
      />
    </div>
  );
};

export default KanbanBoard;