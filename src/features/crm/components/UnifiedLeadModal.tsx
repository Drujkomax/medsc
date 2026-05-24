import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  User,
  Edit3,
  Phone,
  Mail,
  Building,
  DollarSign,
  Calendar,
  MapPin,
  Clock,
  Target,
  Award,
  MessageSquare,
  ChevronDown,
  UserCheck,
} from "lucide-react";
import { Lead, useLeads } from "@/hooks/useLeads";
import { EditLeadModal } from "./EditLeadModal";
import { LeadActivityChat } from "./LeadActivityChat";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useTranslation } from "react-i18next";

interface UnifiedLeadModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdate?: () => void;
}

const stageColors = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  qualified: "bg-green-100 text-green-800",
  proposal: "bg-purple-100 text-purple-800",
  negotiation: "bg-orange-100 text-orange-800",
  closed: "bg-emerald-100 text-emerald-800",
  lost: "bg-red-100 text-red-800",
};

interface StatusDropdownProps {
  currentStage: string;
  leadId: string;
  onStageChange?: () => void;
}

const StatusDropdown = ({ currentStage, leadId, onStageChange }: StatusDropdownProps) => {
  const { changeLeadStage } = useLeads();
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleStageChange = async (newStage: string) => {
    try {
      await changeLeadStage(leadId, newStage);
      toast({
        title: t("common.success", "Успешно"),
        description: t("leads.unifiedLeadModal.statusUpdated", "Статус лида обновлен"),
      });
      onStageChange?.();
    } catch (error) {
      toast({
        title: t("common.error", "Ошибка"),
        description: t("leads.unifiedLeadModal.statusUpdateError", "Ошибка при обновлении статуса"),
        variant: "destructive",
      });
    }
  };

  const currentStageLabel = t(`leads.stages.${currentStage}`, currentStage);
  const currentStageColor = stageColors[currentStage as keyof typeof stageColors] || "bg-gray-100 text-gray-800";

  return (
    <Select value={currentStage} onValueChange={handleStageChange}>
      <SelectTrigger
        className={`w-auto border-none shadow-none ${currentStageColor} px-3 py-1 h-auto text-sm font-medium rounded-full hover:opacity-80 transition-opacity`}
      >
        <SelectValue>{currentStageLabel}</SelectValue>
        <ChevronDown className="h-3 w-3 ml-1" />
      </SelectTrigger>
      <SelectContent className="bg-background z-50">
        {["new", "contacted", "qualified", "proposal", "negotiation", "closed", "lost"].map((stage) => (
          <SelectItem key={stage} value={stage}>
            {t(`leads.stages.${stage}`, stage)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export const UnifiedLeadModal = ({ lead, isOpen, onClose, onLeadUpdate }: UnifiedLeadModalProps) => {
  const { t } = useTranslation();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [assignedUser, setAssignedUser] = useState<{
    id: string;
    email: string;
    full_name: string;
  } | null>(null);

  // Статические объекты с ключами переводов
  const stageLabels = {
    new: t("leads.stages.new", "Новый"),
    contacted: t("leads.stages.contacted", "Связались"),
    qualified: t("leads.stages.qualified", "Квалифицирован"),
    proposal: t("leads.stages.proposal", "Предложение"),
    negotiation: t("leads.stages.negotiation", "Переговоры"),
    closed: t("leads.stages.closed", "Закрыт"),
    lost: t("leads.stages.lost", "Потерян"),
  };

  const budgetLabels = {
    under_50k: t("leads.unifiedLeadModal.budgetRanges.under_50k", "До $50,000"),
    "50k_100k": t("leads.unifiedLeadModal.budgetRanges.50k_100k", "$50,000 - $100,000"),
    "100k_500k": t("leads.unifiedLeadModal.budgetRanges.100k_500k", "$100,000 - $500,000"),
    "500k_1m": t("leads.unifiedLeadModal.budgetRanges.500k_1m", "$500,000 - $1,000,000"),
    over_1m: t("leads.unifiedLeadModal.budgetRanges.over_1m", "Свыше $1,000,000"),
    not_disclosed: t("leads.unifiedLeadModal.budgetRanges.not_disclosed", "Не раскрыт"),
  };

  const equipmentLabels = {
    mrt_mskt: t("leads.unifiedLeadModal.equipmentTypes.mrt_mskt", "МРТ и МСКТ оборудование"),
    gynecology: t("leads.unifiedLeadModal.equipmentTypes.gynecology", "Гинекологическое оборудование"),
    physiotherapy: t("leads.unifiedLeadModal.equipmentTypes.physiotherapy", "Физиотерапевтическое оборудование"),
    resuscitation: t("leads.unifiedLeadModal.equipmentTypes.resuscitation", "Реанимационное оборудование"),
    mri: t("leads.unifiedLeadModal.equipmentTypes.mri", "МРТ оборудование"),
    ct: t("leads.unifiedLeadModal.equipmentTypes.ct", "КТ оборудование"),
    ultrasound: t("leads.unifiedLeadModal.equipmentTypes.ultrasound", "УЗИ оборудование"),
    xray: t("leads.unifiedLeadModal.equipmentTypes.xray", "Рентгеновское оборудование"),
    laboratory: t("leads.unifiedLeadModal.equipmentTypes.laboratory", "Лабораторное оборудование"),
    surgical: t("leads.unifiedLeadModal.equipmentTypes.surgical", "Хирургическое оборудование"),
    anesthesia: t("leads.unifiedLeadModal.equipmentTypes.anesthesia", "Оборудование для анестезии"),
    monitoring: t("leads.unifiedLeadModal.equipmentTypes.monitoring", "Мониторинговое оборудование"),
    rehabilitation: t("leads.unifiedLeadModal.equipmentTypes.rehabilitation", "Реабилитационное оборудование"),
    other: t("leads.unifiedLeadModal.equipmentTypes.other", "Другое"),
  };

  const timelineLabels = {
    immediate: t("leads.unifiedLeadModal.timelines.immediate", "Немедленно"),
    within_month: t("leads.unifiedLeadModal.timelines.within_month", "В течение месяца"),
    within_quarter: t("leads.unifiedLeadModal.timelines.within_quarter", "В течение квартала"),
    within_year: t("leads.unifiedLeadModal.timelines.within_year", "В течение года"),
    over_year: t("leads.unifiedLeadModal.timelines.over_year", "Более года"),
    research: t("leads.unifiedLeadModal.timelines.research", "Пока изучаем рынок"),
  };

  const stages = [
    { value: "new", label: t("leads.stages.new", "Новый") },
    { value: "contacted", label: t("leads.stages.contacted", "Связались") },
    {
      value: "qualified",
      label: t("leads.stages.qualified", "Квалифицирован"),
    },
    { value: "proposal", label: t("leads.stages.proposal", "Предложение") },
    {
      value: "negotiation",
      label: t("leads.stages.negotiation", "Переговоры"),
    },
    { value: "closed", label: t("leads.stages.closed", "Закрыт") },
    { value: "lost", label: t("leads.stages.lost", "Потерян") },
  ];

  // Fetch assigned user information
  useEffect(() => {
    const fetchAssignedUser = async () => {
      if (!lead?.assigned_to) {
        setAssignedUser(null);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("id, email, full_name")
          .eq("id", lead.assigned_to)
          .single();

        if (error) throw error;
        setAssignedUser(profile);
      } catch (error) {
        console.error("Error fetching assigned user:", error);
        setAssignedUser(null);
      }
    };

    if (isOpen && lead) {
      fetchAssignedUser();
    }
  }, [lead?.assigned_to, isOpen]);

  if (!lead) return null;

  const handleLeadUpdate = () => {
    onLeadUpdate?.();
    setEditModalOpen(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] bg-background flex flex-col overflow-hidden">
          <DialogHeader className="pb-4 shrink-0">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="h-6 w-6" />
                <div>
                  <div className="font-semibold text-lg">{lead.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {t("leads.unifiedLeadModal.id", "ID")}: {lead.id.slice(0, 8)}...
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusDropdown currentStage={lead.stage} leadId={lead.id} onStageChange={onLeadUpdate} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  {t("leads.unifiedLeadModal.editButton", "Редактировать")}
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
            {/* Основная информация - 2 колонки */}
            <div className="lg:col-span-2 space-y-6 overflow-y-auto pr-2 min-h-0">
              {/* Контактная информация */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    {t("leads.unifiedLeadModal.sections.contactInfo", "Контактная информация")}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">
                          {t("leads.unifiedLeadModal.fields.email", "Email")}
                        </div>
                        <div className="font-medium">
                          {lead.email || t("leads.unifiedLeadModal.notSpecified", "Не указан")}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">
                          {t("leads.unifiedLeadModal.fields.phone", "Телефон")}
                        </div>
                        <div className="font-medium">
                          {lead.phone || t("leads.unifiedLeadModal.notSpecified", "Не указан")}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">
                          {t("leads.unifiedLeadModal.fields.company", "Компания")}
                        </div>
                        <div className="font-medium">
                          {lead.company || t("leads.unifiedLeadModal.notSpecified", "Не указана")}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">
                          {t("leads.unifiedLeadModal.fields.position", "Должность")}
                        </div>
                        <div className="font-medium">
                          {lead.position || t("leads.unifiedLeadModal.notSpecified", "Не указана")}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">
                          {t("leads.unifiedLeadModal.fields.city", "Город")}
                        </div>
                        <div className="font-medium">
                          {lead.city || t("leads.unifiedLeadModal.notSpecified", "Не указан")}
                        </div>
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
                    {t("leads.unifiedLeadModal.sections.systemInfo", "Системная информация")}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lead.lead_created_date && (
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm text-muted-foreground">
                            {t("leads.unifiedLeadModal.fields.leadCreatedDate", "Дата создания лида")}
                          </div>
                          <div className="font-medium">
                            {format(new Date(lead.lead_created_date), "dd.MM.yyyy HH:mm", { locale: ru })}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">
                          {t("leads.unifiedLeadModal.fields.createdInCRM", "Создан в CRM")}
                        </div>
                        <div className="font-medium">
                          {format(new Date(lead.created_at), "dd.MM.yyyy HH:mm", { locale: ru })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">
                          {t("leads.unifiedLeadModal.fields.updated", "Обновлен")}
                        </div>
                        <div className="font-medium">
                          {format(new Date(lead.updated_at), "dd.MM.yyyy HH:mm", { locale: ru })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">
                          {t("leads.unifiedLeadModal.fields.source", "Источник")}
                        </div>
                        <div className="font-medium">
                          {lead.source === "website_form"
                            ? t("leads.unifiedLeadModal.sources.websiteForm", "Форма сайта")
                            : lead.source || t("leads.unifiedLeadModal.notSpecified", "Не указан")}
                        </div>
                      </div>
                    </div>
                    {lead.value && (
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm text-muted-foreground">
                            {t("leads.unifiedLeadModal.fields.potentialValue", "Потенциальная стоимость")}
                          </div>
                          <div className="font-medium">${lead.value.toLocaleString()}</div>
                        </div>
                      </div>
                    )}
                    {lead.assigned_to && (
                      <div className="flex items-center gap-3">
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm text-muted-foreground">
                            {t("leads.unifiedLeadModal.fields.assignedTo", "Назначен на")}
                          </div>
                          <div className="font-medium">
                            {assignedUser ? assignedUser.email : t("leads.unifiedLeadModal.loading", "Загрузка...")}
                          </div>
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
                      {t("leads.unifiedLeadModal.sections.qualificationData", "Данные квалификации")}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {lead.budget_range && (
                        <div className="flex items-center gap-3">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm text-muted-foreground">
                              {t("leads.unifiedLeadModal.fields.budget", "Бюджет")}
                            </div>
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
                            <div className="text-sm text-muted-foreground">
                              {t("leads.unifiedLeadModal.fields.equipmentInterest", "Интересующее оборудование")}
                            </div>
                            <div className="font-medium">
                              {equipmentLabels[lead.equipment_interest as keyof typeof equipmentLabels] ||
                                lead.equipment_interest}
                            </div>
                          </div>
                        </div>
                      )}
                      {lead.timeline && (
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm text-muted-foreground">
                              {t("leads.unifiedLeadModal.fields.timeline", "Временные рамки")}
                            </div>
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
                      {t("leads.unifiedLeadModal.sections.notes", "Заметки")}
                    </h3>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{lead.notes}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Активность - 1 колонка */}
            <div className="lg:col-span-1 border-l pl-6 overflow-y-auto min-h-0 flex flex-col">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 shrink-0">
                <MessageSquare className="h-5 w-5" />
                {t("leads.unifiedLeadModal.sections.activityHistory", "История активности")}
              </h3>
              <div className="flex-1 min-h-0 overflow-hidden">
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
