import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Phone, Building, Eye } from 'lucide-react';
import { useLeads } from '@/hooks/useLeads';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useAuth } from '@/hooks/useAuth';
import { useDuplicateDetection } from '@/hooks/useDuplicateDetection';
import { useToast } from '@/hooks/use-toast';
import { EnhancedLeadModal } from './EnhancedLeadModal';
import { DuplicateAlert } from './DuplicateAlert';

// Unified lead stages
const stages = [
  { id: 'new', title: 'Новый лид', color: 'bg-blue-500' },
  { id: 'contacted', title: 'Связались', color: 'bg-yellow-500' },
  { id: 'qualified', title: 'Квалифицирован', color: 'bg-purple-500' },
  { id: 'proposal', title: 'Предложение', color: 'bg-orange-500' },
  { id: 'negotiation', title: 'Переговоры', color: 'bg-indigo-500' },
  { id: 'closed', title: 'Закрыт', color: 'bg-green-500' },
  { id: 'lost', title: 'Потерян', color: 'bg-red-500' }
];

const KanbanBoard = () => {
  const [selectedLead, setSelectedLead] = useState<any>(null);
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

  const openLeadModal = (lead?: any) => {
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Канбан доска лидов</h1>
        {hasPermission('manage_all_leads') && (
          <Button onClick={() => openLeadModal()}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить лид
          </Button>
        )}
      </div>
      
      {/* Duplicate alerts */}
      {duplicateGroups.length > 0 && (
        <div className="mb-6 space-y-2">
          {duplicateGroups.slice(0, 3).map((group, index) => (
            <DuplicateAlert key={index} duplicateGroup={group} />
          ))}
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="overflow-x-auto">
          <div className="flex gap-6 pb-4 min-w-max">
          {stages.map((stage) => (
            <div key={stage.id} className="bg-gray-50 rounded-lg p-4 min-w-80 flex-shrink-0">
              <div className="flex items-center mb-4">
                <div className={`w-3 h-3 rounded-full ${stage.color} mr-2`}></div>
                <h3 className="font-semibold">{stage.title}</h3>
                <Badge variant="secondary" className="ml-2">
                  {getLeadsByStage(stage.id).length}
                </Badge>
              </div>

              <Droppable droppableId={stage.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="min-h-[200px]"
                  >
                    {getLeadsByStage(stage.id).map((lead, index) => (
                      <Draggable key={lead.id} draggableId={lead.id} index={index}>
                        {(provided) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="mb-3 cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => openLeadModal(lead)}
                          >
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium">
                                {lead.name}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="space-y-1 text-xs text-gray-600">
                                {lead.company && (
                                  <div className="flex items-center">
                                    <Building className="mr-1 h-3 w-3" />
                                    {lead.company}
                                  </div>
                                )}
                                {lead.phone && (
                                  <div className="flex items-center">
                                    <Phone className="mr-1 h-3 w-3" />
                                    {lead.phone}
                                  </div>
                                )}
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