import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Phone, Building, Eye, User } from 'lucide-react';
import { useLeads, Lead } from '@/hooks/useLeads';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useAuth } from '@/hooks/useAuth';
import { useDuplicateDetection } from '@/hooks/useDuplicateDetection';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AddLeadDialog } from './AddLeadDialog';
import { UnifiedLeadModal } from './UnifiedLeadModal';
import { DuplicateAlert } from './DuplicateAlert';
import { CongratulationsDialog } from './CongratulationsDialog';
import { useNavigate } from 'react-router-dom';

// Unified lead stages
const stages = [
  { id: 'new', title: 'Новый лид', color: 'bg-blue-500' },
  { id: 'contacted', title: 'Связались', color: 'bg-yellow-500' },
  { id: 'qualified', title: 'Квалифицирован', color: 'bg-purple-500' },
  { id: 'proposal', title: 'Отправил КП', color: 'bg-orange-500' },
  { id: 'negotiation', title: 'Переговоры', color: 'bg-indigo-500' },
  { id: 'closed', title: 'Успешно', color: 'bg-green-500' },
  { id: 'lost', title: 'Отказ', color: 'bg-red-500' }
];

interface KanbanBoardProps {
  showNavigation?: boolean;
}

const KanbanBoard = ({ showNavigation = false }: KanbanBoardProps) => {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isCongratulationsOpen, setIsCongratulationsOpen] = useState(false);
  const [congratsLead, setCongratsLead] = useState<Lead | null>(null);
  const [employees, setEmployees] = useState<Array<{id: string, email: string, full_name: string}>>([]);
  const { leads, loading, changeLeadStage, refetch } = useLeads();
  const { hasPermission } = useUserPermissions();
  const { user } = useAuth();
  const { duplicateGroups } = useDuplicateDetection(leads);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch employee profiles for assigned users display
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, email, full_name');

        if (error) throw error;
        setEmployees(profiles || []);
      } catch (error) {
        console.error('Error fetching employee profiles:', error);
      }
    };

    fetchEmployees();
  }, []);

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
      
      // Show congratulations dialog when moving from qualified to proposal
      if (source.droppableId === 'qualified' && newStage === 'proposal') {
        setCongratsLead(lead);
        setIsCongratulationsOpen(true);
      } else {
        toast({
          title: "Успешно",
          description: "Этап лида обновлен",
        });
      }
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
    if (lead) {
      // Открываем модал просмотра/редактирования
      setSelectedLead(lead);
      setIsModalOpen(true);
    } else {
      // Открываем модал создания нового лида
      setIsAddLeadOpen(true);
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '';
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getAssignedUserName = (userId: string) => {
    const employee = employees.find(emp => emp.id === userId);
    return employee ? employee.email : 'Назначен';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const scrollToStage = (stageId: string) => {
    const element = document.querySelector(`[data-stage-id="${stageId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  return (
    <div className="relative">
      {/* Fixed navigation panel - centered on screen */}
      {showNavigation && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-background/95 backdrop-blur-sm border rounded-full shadow-lg px-4 py-2 flex items-center gap-2">
          {stages.map((stage) => (
            <Button
              key={stage.id}
              variant="ghost"
              size="sm"
              className="rounded-full"
              onClick={() => scrollToStage(stage.id)}
            >
              <div className={`w-2 h-2 rounded-full ${stage.color} mr-2`}></div>
              {stage.title}
            </Button>
          ))}
        </div>
      )}

      <div className="p-6">
        {/* Duplicate alerts */}
        {duplicateGroups.length > 0 && (
          <div className="mb-6 space-y-2">
            {duplicateGroups.slice(0, 3).map((group, index) => (
              <DuplicateAlert key={index} duplicateGroup={group} />
            ))}
          </div>
        )}

        {/* Add lead button */}
        {hasPermission('manage_all_leads') && (
          <div className="mb-6">
            <Button onClick={() => openLeadModal()}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить лид
            </Button>
          </div>
        )}

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="overflow-x-auto">
          
          <div className="flex gap-6 pb-4 min-w-max">
          {stages.map((stage) => (
            <div key={stage.id} data-stage-id={stage.id} className="bg-gray-50 rounded-lg p-4 min-w-80 flex-shrink-0">
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
                              <div className="flex items-start justify-between">
                                <CardTitle className="text-sm font-medium">
                                  {lead.name}
                                </CardTitle>
                                {lead.assigned_to && (
                                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                    <User className="mr-1 h-3 w-3" />
                                    {getAssignedUserName(lead.assigned_to).split(' ')[0] || 'Назначен'}
                                  </Badge>
                                )}
                              </div>
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
                                {lead.city && (
                                  <div className="flex items-center">
                                    <Building className="mr-1 h-3 w-3" />
                                    {lead.city}
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
      </div>

      <AddLeadDialog
        open={isAddLeadOpen}
        onClose={() => setIsAddLeadOpen(false)}
        onSuccess={refetch}
      />

      <UnifiedLeadModal
        lead={selectedLead}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLead(null);
        }}
        onLeadUpdate={refetch}
      />

      <CongratulationsDialog
        open={isCongratulationsOpen}
        onClose={() => {
          setIsCongratulationsOpen(false);
          setCongratsLead(null);
        }}
        lead={congratsLead}
        onCreateDeal={() => {
          setIsCongratulationsOpen(false);
          navigate('/admin/deals/create', { state: { leadId: congratsLead?.id } });
        }}
      />
    </div>
  );
};

export default KanbanBoard;