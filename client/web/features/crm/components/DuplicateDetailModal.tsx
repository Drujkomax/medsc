import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Phone, User, Building2, Calendar, Merge, X } from 'lucide-react';
import { DuplicateGroup } from '@/hooks/useDuplicateDetection';
import { useLeadMerge } from '@/hooks/useLeadMerge';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

interface DuplicateDetailModalProps {
  duplicateGroup: DuplicateGroup | null;
  isOpen: boolean;
  onClose: () => void;
  onMergeComplete?: () => void;
}

export const DuplicateDetailModal = ({
  duplicateGroup,
  isOpen,
  onClose,
  onMergeComplete
}: DuplicateDetailModalProps) => {
  const { t } = useTranslation();
  const { mergeLeads, loading } = useLeadMerge();
  const [dismissing, setDismissing] = useState(false);

  if (!duplicateGroup) return null;

  const { leads, duplicateType, score } = duplicateGroup;

  const handleMerge = async () => {
    await mergeLeads(duplicateGroup, () => {
      onMergeComplete?.();
      onClose();
    });
  };

  const handleDismiss = async () => {
    setDismissing(true);
    // В реальном приложении здесь бы была логика для пометки как "не дубликат"
    // Пока что просто закрываем модал
    setTimeout(() => {
      setDismissing(false);
      onClose();
    }, 500);
  };

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

  const getScoreColor = () => {
    if (score >= 90) return 'text-red-600';
    if (score >= 80) return 'text-orange-600';
    return 'text-yellow-600';
  };

  const getStageLabel = (stage: string) => {
    return t(`leads.stages.${stage}`, stage);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            {t('leads.duplicates.modal.title', 'Обнаружены дубликаты лидов')}
          </DialogTitle>
          <DialogDescription>
            {t('leads.duplicates.modal.description', 'Найдено {{count}} похожих лидов. Проверьте детали и выберите действие.', { count: leads.length })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Информация о совпадении */}
          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <span>{t('leads.duplicates.modal.matchType', 'Тип совпадения')}:</span>
                  <Badge variant={getBadgeVariant()}>
                    {getTypeText()}
                  </Badge>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1">
                  <span>{t('leads.duplicates.modal.accuracy', 'Точность')}:</span>
                  <span className={`font-bold ${getScoreColor()}`}>{score}%</span>
                </div>
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Список дубликатов */}
          <div className="grid gap-3">
            <h3 className="font-medium text-sm text-muted-foreground">
              {t('leads.duplicates.modal.similarLeads', 'Похожие лиды')} ({leads.length}):
            </h3>
            
            {leads.map((lead, index) => (
              <Card key={lead.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      {t('leads.duplicates.modal.leadNumber', 'Лид #{{number}}', { number: index + 1 })}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      ID: {lead.id.slice(-8)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{lead.name || t('leads.duplicates.modal.notSpecified', 'Не указано')}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{lead.phone || t('leads.duplicates.modal.notSpecified', 'Не указано')}</span>
                      </div>
                      
                      {lead.company && (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{lead.company}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs">
                          {t('leads.duplicates.modal.created', 'Создан')} {formatDistanceToNow(new Date(lead.created_at), { 
                            addSuffix: true, 
                            locale: ru 
                          })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getStageLabel(lead.stage)}
                        </Badge>
                      </div>
                      
                      {lead.notes && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">{t('leads.duplicates.modal.notes', 'Заметки')}:</span> {lead.notes.slice(0, 100)}
                          {lead.notes.length > 100 && '...'}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Предупреждение */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">{t('leads.duplicates.modal.warning', 'Внимание!')}</p>
                <p className="text-yellow-700">
                  {t('leads.duplicates.modal.warningText', 'При слиянии информация из всех лидов будет объединена в один, а остальные будут удалены. Это действие нельзя отменить.')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleDismiss}
            disabled={loading || dismissing}
          >
            <X className="h-4 w-4 mr-2" />
            {dismissing ? t('leads.duplicates.modal.marking', 'Помечаем...') : t('leads.duplicates.modal.notDuplicate', 'Не дубликат')}
          </Button>
          
          <Button
            onClick={handleMerge}
            disabled={loading || dismissing}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Merge className="h-4 w-4 mr-2" />
            {loading ? t('leads.duplicates.modal.merging', 'Объединяем...') : t('leads.duplicates.modal.mergeLeads', 'Объединить лиды')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
