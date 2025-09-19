import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Edit3, Phone, Mail, Building, DollarSign, Calendar, MapPin, Clock, Target, Award, MessageSquare, ChevronDown } from 'lucide-react';
import { Lead, useLeads } from '@/hooks/useLeads';
import { EditLeadModal } from './EditLeadModal';
import { LeadActivityChat } from './LeadActivityChat';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface UnifiedLeadModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdate?: () => void;
}

const stageLabels = {
  'new': 'Новый',
  'contacted': 'Связались',
  'qualified': 'Квалифицирован',
  'proposal': 'Предложение',
  'negotiation': 'Переговоры',
  'closed': 'Закрыт',
  'lost': 'Потерян'
};

const stageColors = {
  'new': 'bg-blue-100 text-blue-800',
  'contacted': 'bg-yellow-100 text-yellow-800',
  'qualified': 'bg-green-100 text-green-800',
  'proposal': 'bg-purple-100 text-purple-800',
  'negotiation': 'bg-orange-100 text-orange-800',
  'closed': 'bg-emerald-100 text-emerald-800',
  'lost': 'bg-red-100 text-red-800'
};

const budgetLabels = {
  'under_50k': 'До $50,000',
  '50k_100k': '$50,000 - $100,000',
  '100k_500k': '$100,000 - $500,000',
  '500k_1m': '$500,000 - $1,000,000',
  'over_1m': 'Свыше $1,000,000',
  'not_disclosed': 'Не раскрыт'
};

const equipmentLabels = {
  'mri': 'МРТ оборудование',
  'ct': 'КТ оборудование',
  'ultrasound': 'УЗИ оборудование',
  'xray': 'Рентгеновское оборудование',
  'laboratory': 'Лабораторное оборудование',
  'surgical': 'Хирургическое оборудование',
  'anesthesia': 'Оборудование для анестезии',
  'monitoring': 'Мониторинговое оборудование',
  'rehabilitation': 'Реабилитационное оборудование',
  'other': 'Другое'
};

const timelineLabels = {
  'immediate': 'Немедленно',
  'within_month': 'В течение месяца',
  'within_quarter': 'В течение квартала',
  'within_year': 'В течение года',
  'over_year': 'Более года',
  'research': 'Пока изучаем рынок'
};

const stages = [
  { value: 'new', label: 'Новый' },
  { value: 'contacted', label: 'Связались' },
  { value: 'qualified', label: 'Квалифицирован' },
  { value: 'proposal', label: 'Предложение' },
  { value: 'negotiation', label: 'Переговоры' },
  { value: 'closed', label: 'Закрыт' },
  { value: 'lost', label: 'Потерян' }
];

interface StatusDropdownProps {
  currentStage: string;
  leadId: string;
  onStageChange?: () => void;
}

const StatusDropdown = ({ currentStage, leadId, onStageChange }: StatusDropdownProps) => {
  const { changeLeadStage } = useLeads();
  const { toast } = useToast();

  const handleStageChange = async (newStage: string) => {
    try {
      await changeLeadStage(leadId, newStage);
      toast({
        title: 'Успешно',
        description: 'Статус лида обновлен',
      });
      onStageChange?.();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Ошибка при обновлении статуса',
        variant: 'destructive',
      });
    }
  };

  const currentStageLabel = stageLabels[currentStage as keyof typeof stageLabels] || currentStage;
  const currentStageColor = stageColors[currentStage as keyof typeof stageColors] || 'bg-gray-100 text-gray-800';

  return (
    <Select value={currentStage} onValueChange={handleStageChange}>
      <SelectTrigger className={`w-auto border-none shadow-none ${currentStageColor} px-3 py-1 h-auto text-sm font-medium rounded-full hover:opacity-80 transition-opacity`}>
        <SelectValue>{currentStageLabel}</SelectValue>
        <ChevronDown className="h-3 w-3 ml-1" />
      </SelectTrigger>
      <SelectContent className="bg-background z-50">
        {stages.map((stage) => (
          <SelectItem key={stage.value} value={stage.value}>
            {stage.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export const UnifiedLeadModal = ({ lead, isOpen, onClose, onLeadUpdate }: UnifiedLeadModalProps) => {
  const [editModalOpen, setEditModalOpen] = useState(false);

  if (!lead) return null;

  const handleLeadUpdate = () => {
    onLeadUpdate?.();
    setEditModalOpen(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] bg-background overflow-hidden">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="h-6 w-6" />
                <div>
                  <div className="font-semibold text-lg">{lead.name}</div>
                  <div className="text-sm text-muted-foreground">
                    ID: {lead.id.slice(0, 8)}...
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusDropdown 
                  currentStage={lead.stage} 
                  leadId={lead.id} 
                  onStageChange={onLeadUpdate}
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setEditModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  Редактировать
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden h-full">
            {/* Основная информация - 2 колонки */}
            <div className="lg:col-span-2 space-y-6 overflow-y-auto pr-2">
              {/* Контактная информация */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Контактная информация
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Email</div>
                        <div className="font-medium">{lead.email || 'Не указан'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Телефон</div>
                        <div className="font-medium">{lead.phone || 'Не указан'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Компания</div>
                        <div className="font-medium">{lead.company || 'Не указана'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Должность</div>
                        <div className="font-medium">{lead.position || 'Не указана'}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Системная информация */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Системная информация
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Создан</div>
                        <div className="font-medium">
                          {format(new Date(lead.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Обновлен</div>
                        <div className="font-medium">
                          {format(new Date(lead.updated_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Источник</div>
                        <div className="font-medium">
                          {lead.source === 'website_form' ? 'Форма сайта' : lead.source || 'Не указан'}
                        </div>
                      </div>
                    </div>
                    {lead.value && (
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm text-muted-foreground">Потенциальная стоимость</div>
                          <div className="font-medium">${lead.value.toLocaleString()}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Квалификационные данные */}
              {(lead.budget_range || lead.equipment_interest || lead.timeline) && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Данные квалификации
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {lead.budget_range && (
                        <div className="flex items-center gap-3">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm text-muted-foreground">Бюджет</div>
                            <div className="font-medium">
                              {budgetLabels[lead.budget_range as keyof typeof budgetLabels] || lead.budget_range}
                            </div>
                          </div>
                        </div>
                      )}
                      {lead.equipment_interest && (
                        <div className="flex items-center gap-3">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm text-muted-foreground">Интересующее оборудование</div>
                            <div className="font-medium">
                              {equipmentLabels[lead.equipment_interest as keyof typeof equipmentLabels] || lead.equipment_interest}
                            </div>
                          </div>
                        </div>
                      )}
                      {lead.timeline && (
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm text-muted-foreground">Временные рамки</div>
                            <div className="font-medium">
                              {timelineLabels[lead.timeline as keyof typeof timelineLabels] || lead.timeline}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Заметки */}
              {lead.notes && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Заметки
                    </h3>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{lead.notes}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Активность - 1 колонка */}
            <div className="lg:col-span-1 border-l pl-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                История активности
              </h3>
              <div className="h-[500px] overflow-hidden">
                <LeadActivityChat leadId={lead.id} />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <EditLeadModal
        lead={lead}
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={handleLeadUpdate}
      />
    </>
  );
};