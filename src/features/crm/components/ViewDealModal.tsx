import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Deal } from '@/types/crm';
import { useLeads } from '@/hooks/useLeads';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { DollarSign, Calendar, TrendingUp, User, FileText, Edit } from 'lucide-react';

interface ViewDealModalProps {
  open: boolean;
  onClose: () => void;
  deal: Deal | null;
  onEdit?: (deal: Deal) => void;
}

const ViewDealModal = ({ open, onClose, deal, onEdit }: ViewDealModalProps) => {
  const { t } = useTranslation();
  const { leads } = useLeads();

  if (!deal) return null;

  const getLeadName = (leadId: string) => {
    if (!leadId) return t('deals.noClient');
    const lead = leads.find(l => l.id === leadId);
    return lead ? `${lead.name}${lead.company ? ` (${lead.company})` : ''}` : t('common.unknown');
  };

  const getStageColor = (stage: string) => {
    const colors = {
      lead: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      qualified: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      proposal: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      negotiation: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      closed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
      lost: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return colors[stage as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="text-xl font-semibold">{deal.title}</span>
            {onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(deal)}>
                <Edit className="w-4 h-4 mr-2" />
                {t('common.edit')}
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Stage */}
          <div className="flex items-center justify-between">
            <Badge className={getStageColor(deal.stage)}>
              {t(`deals.stages.${deal.stage}`)}
            </Badge>
            {deal.amount && (
              <div className="flex items-center text-lg font-semibold">
                <DollarSign className="w-5 h-5 mr-1" />
                {deal.amount.toLocaleString()}
              </div>
            )}
          </div>

          <Separator />

          {/* Deal Details */}
          <div className="space-y-4">
            {deal.lead_id && (
              <div className="flex items-start">
                <User className="w-5 h-5 text-muted-foreground mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('deals.client')}</p>
                  <p className="text-sm">{getLeadName(deal.lead_id)}</p>
                </div>
              </div>
            )}

            {deal.probability && (
              <div className="flex items-start">
                <TrendingUp className="w-5 h-5 text-muted-foreground mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('deals.probability')}</p>
                  <p className="text-sm">{deal.probability}%</p>
                </div>
              </div>
            )}

            {deal.close_date && (
              <div className="flex items-start">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('deals.closeDate')}</p>
                  <p className="text-sm">{format(new Date(deal.close_date), 'dd.MM.yyyy')}</p>
                </div>
              </div>
            )}

            {deal.notes && (
              <div className="flex items-start">
                <FileText className="w-5 h-5 text-muted-foreground mt-0.5 mr-3" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">{t('deals.notes')}</p>
                  <p className="text-sm whitespace-pre-wrap">{deal.notes}</p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Timestamps */}
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>
              {t('deals.createdAt')}: {format(new Date(deal.created_at), 'dd.MM.yyyy HH:mm')}
            </p>
            <p>
              {t('deals.updatedAt')}: {format(new Date(deal.updated_at), 'dd.MM.yyyy HH:mm')}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewDealModal;