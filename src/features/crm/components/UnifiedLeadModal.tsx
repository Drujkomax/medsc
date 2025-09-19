import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Lead } from '@/hooks/useLeads';
import { EditLeadModal } from './EditLeadModal';
import { LeadActivityChat } from './LeadActivityChat';
import { 
  User, 
  Phone, 
  Building, 
  Calendar, 
  FileText, 
  Target,
  Clock,
  Edit3,
  MessageCircle,
  Settings,
  DollarSign,
  Briefcase,
  Mail
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface UnifiedLeadModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdate?: () => void;
}

const stageLabels = {
  new: 'Новый',
  contacted: 'Связались',
  qualified: 'Квалифицирован',
  proposal: 'Предложение',
  negotiation: 'Переговоры',
  closed: 'Закрыт',
  lost: 'Потерян'
};

const stageColors = {
  new: 'bg-blue-100 text-blue-800 border-blue-200',
  contacted: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  qualified: 'bg-purple-100 text-purple-800 border-purple-200',
  proposal: 'bg-orange-100 text-orange-800 border-orange-200',
  negotiation: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  closed: 'bg-green-100 text-green-800 border-green-200',
  lost: 'bg-red-100 text-red-800 border-red-200'
};

const budgetLabels = {
  'under_10k': 'До $10,000',
  '10k_50k': '$10,000 - $50,000',
  '50k_100k': '$50,000 - $100,000',
  '100k_500k': '$100,000 - $500,000',
  'over_500k': 'Свыше $500,000',
  'not_specified': 'Не указан'
};

const equipmentLabels = {
  'mri': 'МРТ',
  'ct': 'КТ',
  'ultrasound': 'УЗИ',
  'xray': 'Рентген',
  'mammography': 'Маммография',
  'endoscopy': 'Эндоскопия',
  'laboratory': 'Лабораторное оборудование',
  'other': 'Другое'
};

const timelineLabels = {
  'immediate': 'Немедленно (в течение месяца)',
  'quarter': 'В течение квартала',
  'half_year': 'В течение полугода',
  'year': 'В течение года',
  'over_year': 'Более года',
  'research': 'Пока изучаем рынок'
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
                <Badge className={`px-3 py-1 ${stageColors[lead.stage as keyof typeof stageColors] || 'bg-gray-100 text-gray-800'}`}>
                  {stageLabels[lead.stage as keyof typeof stageLabels] || lead.stage}
                </Badge>
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
          
          <div className="flex gap-6 h-full overflow-hidden">
            {/* Левая колонка - Информация о лиде */}
            <div className="flex-1 overflow-y-auto">
              <ScrollArea className="h-[calc(90vh-140px)]">
                <div className="space-y-6 pr-4">
                  {/* Основная информация */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Контактная информация
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Имя</label>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{lead.name}</span>
                        </div>
                      </div>
                      
                      {lead.phone && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Телефон</label>
                          <div className="flex items-center gap-2 mt-1">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{lead.phone}</span>
                          </div>
                        </div>
                      )}

                      {lead.email && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Email</label>
                          <div className="flex items-center gap-2 mt-1">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{lead.email}</span>
                          </div>
                        </div>
                      )}
                      
                      {lead.company && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Компания</label>
                          <div className="flex items-center gap-2 mt-1">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{lead.company}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Системная информация */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Системная информация
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Статус</label>
                        <div className="mt-1">
                          <Badge className={`${stageColors[lead.stage as keyof typeof stageColors] || 'bg-gray-100 text-gray-800'} border`}>
                            {stageLabels[lead.stage as keyof typeof stageLabels] || lead.stage}
                          </Badge>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Дата создания</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {format(new Date(lead.created_at), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Последнее обновление</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {format(new Date(lead.updated_at), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                          </span>
                        </div>
                      </div>

                      {lead.source && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Источник</label>
                          <div className="mt-1">
                            <span className="text-sm bg-muted px-2 py-1 rounded">
                              {lead.source === 'website_form' ? 'Форма на сайте' : 
                               lead.source === 'manual' ? 'Ручной ввод' :
                               lead.source === 'phone_call' ? 'Телефонный звонок' :
                               lead.source}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Квалификация лида */}
                  {(lead.budget_range || lead.position || lead.equipment_interest || lead.timeline) && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Target className="h-5 w-5" />
                          Квалификация лида
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {lead.budget_range && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Бюджет</label>
                              <div className="flex items-center gap-2 mt-1">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {budgetLabels[lead.budget_range as keyof typeof budgetLabels] || lead.budget_range}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {lead.position && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Позиция/Должность</label>
                              <div className="flex items-center gap-2 mt-1">
                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{lead.position}</span>
                              </div>
                            </div>
                          )}
                          
                          {lead.equipment_interest && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Интерес к оборудованию</label>
                              <div className="flex items-center gap-2 mt-1">
                                <Building className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {equipmentLabels[lead.equipment_interest as keyof typeof equipmentLabels] || lead.equipment_interest}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {lead.timeline && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Сроки реализации</label>
                              <div className="flex items-center gap-2 mt-1">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {timelineLabels[lead.timeline as keyof typeof timelineLabels] || lead.timeline}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {lead.qualification_date && (
                          <div className="pt-2 border-t">
                            <label className="text-sm font-medium text-muted-foreground">Дата квалификации</label>
                            <div className="flex items-center gap-2 mt-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {format(new Date(lead.qualification_date), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Заметки */}
                  {lead.notes && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Основные заметки
                        </h3>
                        <div className="text-sm bg-muted p-4 rounded-md border">
                          {lead.notes}
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* Дополнительная информация */}
                  {(lead.assigned_to || lead.closed_at || lead.value) && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Settings className="h-5 w-5" />
                          Дополнительная информация
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {lead.assigned_to && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Назначен</label>
                              <div className="flex items-center gap-2 mt-1">
                                <Target className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{lead.assigned_to}</span>
                              </div>
                            </div>
                          )}
                          
                          {lead.closed_at && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Дата закрытия</label>
                              <div className="flex items-center gap-2 mt-1">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {format(new Date(lead.closed_at), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                                </span>
                              </div>
                            </div>
                          )}

                          {lead.value && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Потенциальная сумма</label>
                              <div className="flex items-center gap-2 mt-1">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-semibold">${lead.value}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Правая колонка - Активность */}
            <div className="w-96 border-l pl-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle className="h-5 w-5" />
                <h3 className="text-lg font-semibold">История активности</h3>
              </div>
              <LeadActivityChat 
                leadId={lead.id} 
                className="border-0 shadow-none h-[calc(90vh-200px)]" 
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Модальное окно редактирования */}
      <EditLeadModal
        lead={lead}
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={handleLeadUpdate}
      />
    </>
  );
};