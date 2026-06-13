import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Users, Eye } from 'lucide-react';
import { DuplicateGroup } from '@/hooks/useDuplicateDetection';
import { useTranslation } from 'react-i18next';

interface DuplicateAlertProps {
  duplicateGroup: DuplicateGroup;
  onViewDetails?: () => void;
}

export const DuplicateAlert = ({ duplicateGroup, onViewDetails }: DuplicateAlertProps) => {
  const { t } = useTranslation();
  const { leads, duplicateType, score } = duplicateGroup;

  const getBadgeVariant = () => {
    if (score >= 90) return 'destructive';
    if (score >= 80) return 'secondary';
    return 'outline';
  };

  const getTypeText = () => {
    switch (duplicateType) {
      case 'both': return t('leads.duplicates.types.both', 'Имя и телефон');
      case 'name': return t('leads.duplicates.types.name', 'Имя');
      case 'phone': return t('leads.duplicates.types.phone', 'Телефон');
      default: return t('leads.duplicates.types.unknown', 'Неизвестно');
    }
  };

  return (
    <Alert className="border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>{t('leads.duplicates.foundCount', 'Найдено {{count}} похожих лидов', { count: leads.length })}</span>
          <Badge variant={getBadgeVariant()}>
            {getTypeText()} ({score}%)
          </Badge>
        </div>
        <div className="flex gap-2">
          {onViewDetails && (
            <Button
              variant="outline"
              size="sm"
              onClick={onViewDetails}
              className="text-orange-700 hover:text-orange-800"
            >
              <Eye className="h-3 w-3 mr-1" />
              {t('leads.duplicates.details', 'Подробности')}
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};
