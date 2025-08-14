import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Phone, Mail, Building, DollarSign, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import LeadModal from './LeadModal';

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  stage: string;
  value?: number;
  notes?: string;
  created_at: string;
  assigned_to?: string;
}

const stages = [
  { id: 'new', title: 'Новый лид', color: 'bg-blue-500' },
  { id: 'called', title: 'Позвонил', color: 'bg-yellow-500' },
  { id: 'thinking', title: 'Думает', color: 'bg-orange-500' },
  { id: 'successful', title: 'Успешный', color: 'bg-green-500' },
  { id: 'lost', title: 'Потерян', color: 'bg-red-500' }
];

const KanbanBoard = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить лиды",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const leadId = draggableId;
    const newStage = destination.droppableId;

    try {
      const { error } = await supabase
        .from('leads')
        .update({ stage: newStage })
        .eq('id', leadId);

      if (error) throw error;

      setLeads(prev =>
        prev.map(lead =>
          lead.id === leadId ? { ...lead, stage: newStage } : lead
        )
      );

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
    return leads.filter(lead => lead.stage === stageId);
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Канбан доска лидов</h1>
        <Button onClick={() => openLeadModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить лид
        </Button>
      </div>

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
                                {lead.email && (
                                  <div className="flex items-center">
                                    <Mail className="mr-1 h-3 w-3" />
                                    {lead.email}
                                  </div>
                                )}
                                {lead.value && (
                                  <div className="flex items-center font-medium text-green-600">
                                    <DollarSign className="mr-1 h-3 w-3" />
                                    {formatCurrency(lead.value)}
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

      <LeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        lead={selectedLead}
        onSave={fetchLeads}
      />
    </div>
  );
};

export default KanbanBoard;