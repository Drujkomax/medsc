import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Lead } from "@/hooks/useLeads";
import { User, Phone, Building, Calendar, FileText, Target, DollarSign, Clock } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

interface ViewLeadModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

interface AssignedUserDisplayProps {
  userId: string;
}

const AssignedUserDisplay = ({ userId }: AssignedUserDisplayProps) => {
  const { t } = useTranslation();
  const [userData, setUserData] = useState<{
    full_name?: string;
    email?: string;
  } | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data, error } = await supabase.from("profiles").select("full_name, email").eq("id", userId).single();

        if (error) {
          console.error("Error fetching user data:", error);
          setUserData(null);
        } else {
          setUserData(data);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUserData(null);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  if (!userData) {
    return <span className="text-sm text-muted-foreground">{t("leads.viewLeadModal.loading", "Загрузка...")}</span>;
  }

  return <span className="text-sm">{userData.email || userId}</span>;
};

const stageColors = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  qualified: "bg-purple-100 text-purple-800",
  proposal: "bg-orange-100 text-orange-800",
  negotiation: "bg-indigo-100 text-indigo-800",
  closed: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
};

export const ViewLeadModal = ({ lead, isOpen, onClose }: ViewLeadModalProps) => {
  const { t } = useTranslation();

  const stageLabels = {
    new: t("stages.new", "Новый"),
    contacted: t("stages.contacted", "Связались"),
    qualified: t("stages.qualified", "Квалифицирован"),
    proposal: t("stages.proposal", "Предложение"),
    negotiation: t("stages.negotiation", "Переговоры"),
    closed: t("leads.stages.closed", "Закрыт"),
    lost: t("stages.lost", "Потерян"),
  };

  if (!lead) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t("leads.viewLeadModal.title", "Просмотр лида")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Основная информация */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("leads.viewLeadModal.fields.name", "Имя")}
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{lead.name}</span>
                </div>
              </div>

              {lead.phone && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t("leads.viewLeadModal.fields.phone", "Телефон")}
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{lead.phone}</span>
                  </div>
                </div>
              )}

              {lead.company && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t("leads.viewLeadModal.fields.company", "Компания")}
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{lead.company}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("leads.viewLeadModal.fields.status", "Статус")}
                </label>
                <div className="mt-1">
                  <Badge className={stageColors[lead.stage as keyof typeof stageColors] || "bg-gray-100 text-gray-800"}>
                    {stageLabels[lead.stage as keyof typeof stageLabels] || lead.stage}
                  </Badge>
                </div>
              </div>

              {lead.lead_quality && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t("leads.viewLeadModal.fields.leadQuality", "Качество лида")}
                  </label>
                  <div className="mt-1">
                    <Badge
                      className={
                        lead.lead_quality === "A"
                          ? "bg-green-100 text-green-800 border-green-200"
                          : lead.lead_quality === "B"
                            ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                            : "bg-red-100 text-red-800 border-red-200"
                      }
                    >
                      {lead.lead_quality === "A"
                        ? t("leads.viewLeadModal.qualityA", "A - Целевой")
                        : lead.lead_quality === "B"
                          ? t("leads.viewLeadModal.qualityB", "B - Потенциальный")
                          : t("leads.viewLeadModal.qualityC", "C - Мусор")}
                    </Badge>
                  </div>
                </div>
              )}

              {lead.lead_created_date && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t("leads.viewLeadModal.fields.leadCreatedDate", "Дата создания лида")}
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
                  {t("leads.viewLeadModal.fields.createdInCRM", "Создан в CRM")}
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {format(new Date(lead.created_at), "dd.MM.yyyy HH:mm", {
                      locale: ru,
                    })}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("leads.viewLeadModal.fields.lastUpdated", "Последнее обновление")}
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {format(new Date(lead.updated_at), "dd.MM.yyyy HH:mm", {
                      locale: ru,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Заметки */}
          {lead.notes && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t("leads.viewLeadModal.fields.notes", "Заметки")}
              </label>
              <div className="flex gap-2 mt-1">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="text-sm bg-muted p-3 rounded-md flex-1">{lead.notes}</div>
              </div>
            </div>
          )}

          {/* Дополнительная информация */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            {lead.assigned_to && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("leads.viewLeadModal.fields.assigned", "Назначен")}
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <AssignedUserDisplay userId={lead.assigned_to} />
                </div>
              </div>
            )}

            {lead.closed_at && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("leads.viewLeadModal.fields.closedDate", "Дата закрытия")}
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
