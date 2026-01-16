import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PartyPopper, FileText } from 'lucide-react';
import { Lead } from '@/hooks/useLeads';
import { useTranslation } from 'react-i18next';

interface CongratulationsDialogProps {
  open: boolean;
  onClose: () => void;
  lead: Lead | null;
  onCreateDeal: () => void;
}

export const CongratulationsDialog = ({ open, onClose, lead, onCreateDeal }: CongratulationsDialogProps) => {
  const { t } = useTranslation();
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-green-100 p-3">
              <PartyPopper className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">{t('leads.congratulations.title', 'Поздравляем!')}</DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            {t('leads.congratulations.message', 'Вы успешно отправили коммерческое предложение для лида')}{' '}
            <span className="font-semibold text-foreground">{lead?.name}</span>
            {lead?.company && (
              <span> {t('leads.congratulations.fromCompany', 'из компании')} <span className="font-semibold text-foreground">{lead.company}</span></span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-4">
          <Button 
            onClick={onCreateDeal}
            className="w-full"
            size="lg"
          >
            <FileText className="mr-2 h-5 w-5" />
            {t('leads.congratulations.createDeal', 'Создать сделку')}
          </Button>
          
          <Button 
            onClick={onClose}
            variant="outline"
            className="w-full"
            size="lg"
          >
            {t('common.close', 'Закрыть')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
