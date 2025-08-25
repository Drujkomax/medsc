import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Users } from 'lucide-react';
import { DuplicateGroup } from '@/hooks/useDuplicateDetection';

interface DuplicateAlertProps {
  duplicateGroup: DuplicateGroup;
  onViewDuplicates?: () => void;
}

export const DuplicateAlert = ({ duplicateGroup, onViewDuplicates }: DuplicateAlertProps) => {
  const { leads, duplicateType, score } = duplicateGroup;

  const getBadgeVariant = () => {
    if (score >= 90) return 'destructive';
    if (score >= 80) return 'secondary';
    return 'outline';
  };

  const getTypeText = () => {
    switch (duplicateType) {
      case 'both': return 'Имя и телефон';
      case 'name': return 'Имя';
      case 'phone': return 'Телефон';
      default: return 'Неизвестно';
    }
  };

  return (
    <Alert className="border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>Найдено {leads.length} похожих лидов</span>
          <Badge variant={getBadgeVariant()}>
            {getTypeText()} ({score}%)
          </Badge>
        </div>
        {onViewDuplicates && (
          <button
            onClick={onViewDuplicates}
            className="text-sm text-orange-700 hover:text-orange-800 underline"
          >
            Посмотреть
          </button>
        )}
      </AlertDescription>
    </Alert>
  );
};