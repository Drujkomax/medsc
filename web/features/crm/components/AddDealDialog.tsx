import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDeals } from "@/hooks/useDeals";
import { useLeads } from "@/hooks/useLeads";
import { Deal } from "@/types/crm";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface AddDealDialogProps {
  open: boolean;
  onClose: () => void;
  deal?: Deal | null;
}

const AddDealDialog = ({ open, onClose, deal }: AddDealDialogProps) => {
  const { t } = useTranslation();
  const { addDeal, updateDeal } = useDeals();
  const { leads } = useLeads();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: deal?.title || "",
    lead_id: deal?.lead_id || "none",
    amount: deal?.amount?.toString() || "",
    stage: deal?.stage || "lead",
    probability: deal?.probability?.toString() || "",
    close_date: deal?.close_date ? new Date(deal.close_date).toISOString().split("T")[0] : "",
    notes: deal?.notes || "",
  });

  // Update form data when deal prop changes
  useEffect(() => {
    if (deal) {
      setFormData({
        title: deal.title || "",
        lead_id: deal.lead_id || "none",
        amount: deal.amount?.toString() || "",
        stage: deal.stage || "lead",
        probability: deal.probability?.toString() || "",
        close_date: deal.close_date ? new Date(deal.close_date).toISOString().split("T")[0] : "",
        notes: deal.notes || "",
      });
    } else {
      setFormData({
        title: "",
        lead_id: "none",
        amount: "",
        stage: "lead",
        probability: "",
        close_date: "",
        notes: "",
      });
    }
  }, [deal]);

  const stages = [
    { value: "lead", label: t("deals.stages.lead") },
    { value: "qualified", label: t("deals.stages.qualified") },
    { value: "proposal", label: t("deals.stages.proposal") },
    { value: "negotiation", label: t("deals.stages.negotiation") },
    { value: "closed", label: t("deals.stages.closed") },
    { value: "lost", label: t("deals.stages.lost") },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dealData = {
        title: formData.title,
        lead_id: formData.lead_id === "none" ? undefined : formData.lead_id,
        amount: formData.amount ? parseFloat(formData.amount) : undefined,
        stage: formData.stage as Deal["stage"],
        probability: formData.probability ? parseInt(formData.probability) : undefined,
        close_date: formData.close_date || undefined,
        notes: formData.notes || undefined,
      };

      if (deal) {
        await updateDeal(deal.id, dealData);
        toast.success(t("deals.updated"));
      } else {
        await addDeal(dealData);
        toast.success(t("deals.created"));
      }

      onClose();
      setFormData({
        title: "",
        lead_id: "none",
        amount: "",
        stage: "lead",
        probability: "",
        close_date: "",
        notes: "",
      });
    } catch (error) {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{deal ? t("deals.editDeal") : t("deals.addDeal")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="title">{t("deals.title")} *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder={t("deals.titlePlaceholder")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client">{t("deals.client")}</Label>
            <Select value={formData.lead_id} onValueChange={(value) => handleInputChange("lead_id", value)}>
              <SelectTrigger>
                <SelectValue placeholder={t("deals.selectClient")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("deals.noClient")}</SelectItem>
                {leads.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.name} {lead.company && `(${lead.company})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">{t("deals.amount")}</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => handleInputChange("amount", e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="probability">{t("deals.probability")} (%)</Label>
              <Input
                id="probability"
                type="number"
                value={formData.probability}
                onChange={(e) => handleInputChange("probability", e.target.value)}
                placeholder="0"
                min="0"
                max="100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stage">{t("deals.stage")} *</Label>
            <Select value={formData.stage} onValueChange={(value) => handleInputChange("stage", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stages.map((stage) => (
                  <SelectItem key={stage.value} value={stage.value}>
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="close_date">{t("deals.closeDate")}</Label>
            <Input
              id="close_date"
              type="date"
              value={formData.close_date}
              onChange={(e) => handleInputChange("close_date", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t("deals.notes")}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder={t("deals.notesPlaceholder")}
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? t("common.saving") : deal ? t("common.save") : t("common.create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddDealDialog;
