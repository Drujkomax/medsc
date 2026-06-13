import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lead } from "@/hooks/useLeads";
import { LeadActivityChat } from "./LeadActivityChat";
import { EditLeadForm } from "./EditLeadForm";
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
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useTranslation } from "react-i18next";

interface EnhancedLeadModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdate?: () => void;
}

const stageColors = {
  new: "bg-blue-100 text-blue-800 border-blue-200",
  contacted: "bg-yellow-100 text-yellow-800 border-yellow-200",
  qualified: "bg-purple-100 text-purple-800 border-purple-200",
  proposal: "bg-orange-100 text-orange-800 border-orange-200",
  negotiation: "bg-indigo-100 text-indigo-800 border-indigo-200",
  closed: "bg-green-100 text-green-800 border-green-200",
  lost: "bg-red-100 text-red-800 border-red-200",
};

export const EnhancedLeadModal = ({ lead, isOpen, onClose, onLeadUpdate }: EnhancedLeadModalProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("overview");

  // Статические объекты с ключами переводов
  const stageLabels = {
    new: t("stages.new", "Новый"),
    contacted: t("stages.contacted", "Связались"),
    qualified: t("stages.qualified", "Квалифицирован"),
    proposal: t("stages.proposal", "Предложение"),
    negotiation: t("stages.negotiation", "Переговоры"),
    closed: t("stages.closed", "Закрыт"),
    lost: t("stages.lost", "Потерян"),
  };

  const budgetLabels = {
    "3k_5k": t("leads.enhancedLeadModal.budgetRanges.3k_5k", "$3,000 - $5,000"),
    "5k_10k": t("leads.enhancedLeadModal.budgetRanges.5k_10k", "$5,000 - $10,000"),
    under_10k: t("leads.enhancedLeadModal.budgetRanges.under_10k", "До $10,000"),
    "10k_50k": t("leads.enhancedLeadModal.budgetRanges.10k_50k", "$10,000 - $50,000"),
    "50k_100k": t("leads.enhancedLeadModal.budgetRanges.50k_100k", "$50,000 - $100,000"),
    "100k_500k": t("leads.enhancedLeadModal.budgetRanges.100k_500k", "$100,000 - $500,000"),
    over_500k: t("leads.enhancedLeadModal.budgetRanges.over_500k", "Свыше $500,000"),
    not_specified: t("leads.enhancedLeadModal.budgetRanges.not_specified", "Не указан"),
  };

  const equipmentLabels = {
    mrt_mskt: t("leads.enhancedLeadModal.equipmentTypes.mrt_mskt", "МРТ и МСКТ"),
    gynecology: t("leads.enhancedLeadModal.equipmentTypes.gynecology", "Гинекологическое оборудование"),
    physiotherapy: t("leads.enhancedLeadModal.equipmentTypes.physiotherapy", "Физиотерапевтическое оборудование"),
    resuscitation: t("leads.enhancedLeadModal.equipmentTypes.resuscitation", "Реанимационное оборудование"),
    mri: t("leads.enhancedLeadModal.equipmentTypes.mri", "МРТ"),
    ct: t("leads.enhancedLeadModal.equipmentTypes.ct", "КТ"),
    ultrasound: t("leads.enhancedLeadModal.equipmentTypes.ultrasound", "УЗИ"),
    xray: t("leads.enhancedLeadModal.equipmentTypes.xray", "Рентген"),
    mammography: t("leads.enhancedLeadModal.equipmentTypes.mammography", "Маммография"),
    endoscopy: t("leads.enhancedLeadModal.equipmentTypes.endoscopy", "Эндоскопия"),
    laboratory: t("leads.enhancedLeadModal.equipmentTypes.laboratory", "Лабораторное оборудование"),
    other: t("leads.enhancedLeadModal.equipmentTypes.other", "Другое"),
  };

  const timelineLabels = {
    immediate: t("leads.enhancedLeadModal.timelines.immediate", "Немедленно (в течение месяца)"),
    quarter: t("leads.enhancedLeadModal.timelines.quarter", "В течение квартала"),
    half_year: t("leads.enhancedLeadModal.timelines.half_year", "В течение полугода"),
    year: t("leads.enhancedLeadModal.timelines.year", "В течение года"),
    over_year: t("leads.enhancedLeadModal.timelines.over_year", "Более года"),
    research: t("leads.enhancedLeadModal.timelines.research", "Пока изучаем рынок"),
  };

  if (!lead) return null;

  const handleLeadUpdate = () => {
    onLeadUpdate?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] bg-background overflow-hidden">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-6 w-6" />
              <div>
                <div className="font-semibold text-lg">{lead.name}</div>
                <div className="text-sm text-muted-foreground">
                  {t("leads.enhancedLeadModal.id", "ID")}: {lead.id.slice(0, 8)}
                  ...
                </div>
              </div>
            </div>
            <Badge
              className={`px-3 py-1 ${
                stageColors[lead.stage as keyof typeof stageColors] || "bg-gray-100 text-gray-800"
              }`}
            >
              {stageLabels[lead.stage as keyof typeof stageLabels] || lead.stage}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t("leads.enhancedLeadModal.tabs.overview", "Обзор")}
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              {t("leads.enhancedLeadModal.tabs.activity", "Активность")}
            </TabsTrigger>
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              {t("leads.enhancedLeadModal.tabs.edit", "Редактировать")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Основная информация */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {t("leads.enhancedLeadModal.sections.contactInfo", "Контактная информация")}
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {t("leads.enhancedLeadModal.fields.name", "Имя")}
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{lead.name}</span>
                      </div>
                    </div>

                    {lead.phone && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          {t("leads.enhancedLeadModal.fields.phone", "Телефон")}
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{lead.phone}</span>
                        </div>
                      </div>
                    )}

                    {lead.email && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          {t("leads.enhancedLeadModal.fields.email", "Email")}
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm">{lead.email}</span>
                        </div>
                      </div>
                    )}

                    {lead.company && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          {t("leads.enhancedLeadModal.fields.company", "Компания")}
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{lead.company}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    {t("leads.enhancedLeadModal.sections.systemInfo", "Системная информация")}
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {t("leads.enhancedLeadModal.fields.status", "Статус")}
                      </label>
                      <div className="mt-1">
                        <Badge
                          className={`${
                            stageColors[lead.stage as keyof typeof stageColors] || "bg-gray-100 text-gray-800"
                          } border`}
                        >
                          {stageLabels[lead.stage as keyof typeof stageLabels] || lead.stage}
                        </Badge>
                      </div>
                    </div>

                    {lead.lead_created_date && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          {t("leads.enhancedLeadModal.fields.leadCreatedDate", "Дата создания лида")}
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {format(new Date(lead.lead_created_date), "dd.MM.yyyy HH:mm", { locale: ru })}
                          </span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {t("leads.enhancedLeadModal.fields.createdInCRM", "Создан в CRM")}
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {format(new Date(lead.created_at), "dd.MM.yyyy HH:mm", { locale: ru })}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {t("leads.enhancedLeadModal.fields.lastUpdated", "Последнее обновление")}
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {format(new Date(lead.updated_at), "dd.MM.yyyy HH:mm", { locale: ru })}
                        </span>
                      </div>
                    </div>

                    {lead.source && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          {t("leads.enhancedLeadModal.fields.source", "Источник")}
                        </label>
                        <div className="mt-1">
                          <span className="text-sm bg-muted px-2 py-1 rounded">
                            {lead.source === "website_form"
                              ? t("leads.enhancedLeadModal.sources.websiteForm", "Форма на сайте")
                              : lead.source === "manual"
                                ? t("leads.enhancedLeadModal.sources.manual", "Ручной ввод")
                                : lead.source === "phone_call"
                                  ? t("leads.enhancedLeadModal.sources.phoneCall", "Телефонный звонок")
                                  : lead.source}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Квалификация лида */}
            {(lead.budget_range || lead.position || lead.equipment_interest || lead.timeline) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  {t("leads.enhancedLeadModal.sections.leadQualification", "Квалификация лида")}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lead.budget_range && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {t("leads.enhancedLeadModal.fields.budget", "Бюджет")}
                      </label>
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
                      <label className="text-sm font-medium text-muted-foreground">
                        {t("leads.enhancedLeadModal.fields.position", "Позиция/Должность")}
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{lead.position}</span>
                      </div>
                    </div>
                  )}

                  {lead.equipment_interest && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {t("leads.enhancedLeadModal.fields.equipmentInterest", "Интерес к оборудованию")}
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {equipmentLabels[lead.equipment_interest as keyof typeof equipmentLabels] ||
                            lead.equipment_interest}
                        </span>
                      </div>
                    </div>
                  )}

                  {lead.timeline && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {t("leads.enhancedLeadModal.fields.timeline", "Сроки реализации")}
                      </label>
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
                    <label className="text-sm font-medium text-muted-foreground">
                      {t("leads.enhancedLeadModal.fields.qualificationDate", "Дата квалификации")}
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {format(new Date(lead.qualification_date), "dd.MM.yyyy HH:mm", { locale: ru })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Заметки */}
            {lead.notes && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {t("leads.enhancedLeadModal.sections.notes", "Основные заметки")}
                </h3>
                <div className="text-sm bg-muted p-4 rounded-md border">{lead.notes}</div>
              </div>
            )}

            {/* Дополнительная информация */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
              {lead.assigned_to && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t("leads.enhancedLeadModal.fields.assignedTo", "Назначен")}
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{lead.assigned_to}</span>
                  </div>
                </div>
              )}

              {lead.closed_at && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t("leads.enhancedLeadModal.fields.closedDate", "Дата закрытия")}
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {format(new Date(lead.closed_at), "dd.MM.yyyy HH:mm", {
                        locale: ru,
                      })}
                    </span>
                  </div>
                </div>
              )}

              {lead.value && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t("leads.enhancedLeadModal.fields.potentialAmount", "Потенциальная сумма")}
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-semibold">${lead.value}</span>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="overflow-hidden h-full">
            <LeadActivityChat leadId={lead.id} className="border-0 shadow-none" />
          </TabsContent>

          <TabsContent value="edit" className="overflow-y-auto max-h-[calc(90vh-200px)]">
            <EditLeadForm lead={lead} onSuccess={handleLeadUpdate} embedded={true} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
