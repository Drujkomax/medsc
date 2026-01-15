import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLeads } from "@/hooks/useLeads";
import { useTranslation } from "react-i18next";
import { Plus, User, Phone, Building, FileText, Tag, MapPin, Mail, Briefcase, Clock, DollarSign } from "lucide-react";

interface AddLeadDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddLeadDialog = ({ open, onClose, onSuccess }: AddLeadDialogProps) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { addLead } = useLeads();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    company: "",
    position: "",
    city: "",
    equipment_interest: "",
    budget_range: "",
    timeline: "",
    notes: "",
    source: "manual",
    stage: "new",
    lead_quality: "",
    lead_created_date: new Date().toISOString().slice(0, 16),
  });

  const leadSources = [
    {
      value: "manual",
      label: t("leads.addLeadDialog.sources.manual", "Ручной ввод"),
    },
    {
      value: "website_form",
      label: t("leads.addLeadDialog.sources.website_form", "Форма на сайте"),
    },
    {
      value: "phone_call",
      label: t("leads.addLeadDialog.sources.phone_call", "Телефонный звонок"),
    },
    { value: "email", label: t("leads.addLeadDialog.sources.email", "Email") },
    {
      value: "social_media",
      label: t("leads.addLeadDialog.sources.social_media", "Социальные сети"),
    },
    {
      value: "referral",
      label: t("leads.addLeadDialog.sources.referral", "Рекомендация"),
    },
    { value: "other", label: t("leads.addLeadDialog.sources.other", "Другое") },
  ];

  const leadStages = [
    { value: "new", label: t("leads.stages.new", "Новый") },
    { value: "contacted", label: t("leads.stages.contacted", "Связались") },
    {
      value: "qualified",
      label: t("leads.stages.qualified", "Квалифицирован"),
    },
    { value: "proposal", label: t("leads.stages.proposal", "Отправил КП") },
    {
      value: "negotiation",
      label: t("leads.stages.negotiation", "Переговоры"),
    },
  ];

  const budgetRanges = [
    {
      value: "under_10k",
      label: t("leads.addLeadDialog.budgetRanges.under_10k", "До $10,000"),
    },
    {
      value: "10k_50k",
      label: t("leads.addLeadDialog.budgetRanges.10k_50k", "$10,000 - $50,000"),
    },
    {
      value: "50k_100k",
      label: t("leads.addLeadDialog.budgetRanges.50k_100k", "$50,000 - $100,000"),
    },
    {
      value: "100k_500k",
      label: t("leads.addLeadDialog.budgetRanges.100k_500k", "$100,000 - $500,000"),
    },
    {
      value: "over_500k",
      label: t("leads.addLeadDialog.budgetRanges.over_500k", "Свыше $500,000"),
    },
    {
      value: "not_specified",
      label: t("leads.addLeadDialog.budgetRanges.not_specified", "Не указан"),
    },
  ];

  const timelines = [
    {
      value: "immediate",
      label: t("leads.addLeadDialog.timelines.immediate", "Немедленно"),
    },
    {
      value: "1_month",
      label: t("leads.addLeadDialog.timelines.1_month", "В течение месяца"),
    },
    {
      value: "3_months",
      label: t("leads.addLeadDialog.timelines.3_months", "В течение 3 месяцев"),
    },
    {
      value: "6_months",
      label: t("leads.addLeadDialog.timelines.6_months", "В течение 6 месяцев"),
    },
    {
      value: "1_year",
      label: t("leads.addLeadDialog.timelines.1_year", "В течение года"),
    },
    {
      value: "not_specified",
      label: t("leads.addLeadDialog.timelines.not_specified", "Не указан"),
    },
  ];

  const equipmentTypes = [
    {
      value: "mri",
      label: t("leads.addLeadDialog.equipmentTypes.mri", "МРТ оборудование"),
    },
    {
      value: "ct",
      label: t("leads.addLeadDialog.equipmentTypes.ct", "КТ сканеры"),
    },
    {
      value: "ultrasound",
      label: t("leads.addLeadDialog.equipmentTypes.ultrasound", "УЗИ аппараты"),
    },
    {
      value: "xray",
      label: t("leads.addLeadDialog.equipmentTypes.xray", "Рентген оборудование"),
    },
    {
      value: "laboratory",
      label: t("leads.addLeadDialog.equipmentTypes.laboratory", "Лабораторное оборудование"),
    },
    {
      value: "surgical",
      label: t("leads.addLeadDialog.equipmentTypes.surgical", "Хирургическое оборудование"),
    },
    {
      value: "other",
      label: t("leads.addLeadDialog.equipmentTypes.other", "Другое"),
    },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: t("common.error", "Ошибка"),
        description: t("leads.addLeadDialog.validation.nameRequired", "Имя клиента обязательно для заполнения"),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await addLead({
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        company: formData.company.trim() || undefined,
        position: formData.position.trim() || undefined,
        city: formData.city.trim() || undefined,
        equipment_interest: formData.equipment_interest || undefined,
        budget_range: formData.budget_range || undefined,
        timeline: formData.timeline || undefined,
        notes: formData.notes.trim() || undefined,
        source: formData.source,
        stage: formData.stage,
        lead_quality: formData.lead_quality ? (formData.lead_quality as "A" | "B" | "C") : undefined,
        lead_created_date: formData.lead_created_date || undefined,
      });

      toast({
        title: t("common.success", "Успешно"),
        description: t("leads.leadAdded", "Лид успешно добавлен"),
      });

      // Reset form
      setFormData({
        name: "",
        phone: "",
        email: "",
        company: "",
        position: "",
        city: "",
        equipment_interest: "",
        budget_range: "",
        timeline: "",
        notes: "",
        source: "manual",
        stage: "new",
        lead_quality: "",
        lead_created_date: new Date().toISOString().slice(0, 16),
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      toast({
        title: t("common.error", "Ошибка"),
        description:
          error instanceof Error ? error.message : t("leads.addLeadDialog.error", "Ошибка при добавлении лида"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {t("leads.addLead", "Добавить лида")}
          </DialogTitle>
          <DialogDescription>
            {t("leads.addLeadDialog.description", "Заполните информацию для создания нового лида")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Основная информация */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              {t("leads.addLeadDialog.sections.basicInfo", "Основная информация")}
            </h3>

            <div className="space-y-2">
              <Label htmlFor="lead_created_date" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t("leads.leadCreatedDate", "Дата создания лида")}
              </Label>
              <Input
                id="lead_created_date"
                type="datetime-local"
                value={formData.lead_created_date}
                onChange={(e) => handleInputChange("lead_created_date", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t("leads.name", "Имя")} *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder={t("leads.addLeadDialog.placeholders.name", "Введите имя клиента")}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  {t("leads.addLeadDialog.fields.position", "Должность")}
                </Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => handleInputChange("position", e.target.value)}
                  placeholder={t("leads.addLeadDialog.placeholders.position", "Должность в компании")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {t("leads.phone", "Телефон")}
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder={t("leads.addLeadDialog.placeholders.phone", "+998 (xx) xxx-xx-xx")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {t("leads.addLeadDialog.fields.email", "Email")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder={t("leads.addLeadDialog.placeholders.email", "email@example.com")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  {t("leads.company", "Компания")}
                </Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                  placeholder={t("leads.addLeadDialog.placeholders.company", "Название компании")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {t("leads.city", "Город")}
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder={t("leads.addLeadDialog.placeholders.city", "Город")}
                />
              </div>
            </div>
          </div>

          {/* Интересы и потребности */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              {t("leads.addLeadDialog.sections.interests", "Интересы и потребности")}
            </h3>

            <div className="space-y-2">
              <Label htmlFor="equipment_interest" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                {t("leads.addLeadDialog.fields.equipmentInterest", "Интересующее оборудование")}
              </Label>
              <Select
                value={formData.equipment_interest}
                onValueChange={(value) => handleInputChange("equipment_interest", value)}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("leads.addLeadDialog.placeholders.equipmentInterest", "Выберите тип оборудования")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {equipmentTypes.map((equipment) => (
                    <SelectItem key={equipment.value} value={equipment.value}>
                      {equipment.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget_range" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {t("leads.addLeadDialog.fields.budgetRange", "Бюджет")}
                </Label>
                <Select
                  value={formData.budget_range}
                  onValueChange={(value) => handleInputChange("budget_range", value)}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("leads.addLeadDialog.placeholders.budgetRange", "Выберите диапазон бюджета")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {budgetRanges.map((budget) => (
                      <SelectItem key={budget.value} value={budget.value}>
                        {budget.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lead_quality" className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  {t("leads.leadQuality", "Качество лида")}
                </Label>
                <Select
                  value={formData.lead_quality}
                  onValueChange={(value) => handleInputChange("lead_quality", value)}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("leads.addLeadDialog.placeholders.leadQuality", "Выберите качество лида")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">{t("leads.qualityA", "A - Целевой")}</SelectItem>
                    <SelectItem value="B">{t("leads.qualityB", "B - Потенциальный")}</SelectItem>
                    <SelectItem value="C">{t("leads.qualityC", "C - Мусор")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeline" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t("leads.addLeadDialog.fields.timeline", "Временные рамки")}
              </Label>
              <Select value={formData.timeline} onValueChange={(value) => handleInputChange("timeline", value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("leads.addLeadDialog.placeholders.timeline", "Выберите сроки")} />
                </SelectTrigger>
                <SelectContent>
                  {timelines.map((timeline) => (
                    <SelectItem key={timeline.value} value={timeline.value}>
                      {timeline.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Дополнительная информация */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              {t("leads.addLeadDialog.sections.additionalInfo", "Дополнительная информация")}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source" className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  {t("leads.addLeadDialog.fields.source", "Источник")}
                </Label>
                <Select value={formData.source} onValueChange={(value) => handleInputChange("source", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("leads.addLeadDialog.placeholders.source", "Выберите источник")} />
                  </SelectTrigger>
                  <SelectContent>
                    {leadSources.map((source) => (
                      <SelectItem key={source.value} value={source.value}>
                        {source.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stage" className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  {t("leads.status", "Статус")}
                </Label>
                <Select value={formData.stage} onValueChange={(value) => handleInputChange("stage", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("leads.addLeadDialog.placeholders.stage", "Выберите статус")} />
                  </SelectTrigger>
                  <SelectContent>
                    {leadStages.map((stage) => (
                      <SelectItem key={stage.value} value={stage.value}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t("leads.addLeadDialog.fields.notes", "Заметки")}
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder={t(
                  "leads.addLeadDialog.placeholders.notes",
                  "Дополнительная информация о лиде, особые требования, заметки с переговоров",
                )}
                rows={4}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel", "Отмена")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? t("leads.addLeadDialog.adding", "Добавление...")
                : t("leads.addLeadDialog.addButton", "Добавить лида")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
