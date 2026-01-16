import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface ReopenTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (comment: string) => void;
  taskTitle: string;
}

export const ReopenTaskDialog = ({ 
  open, 
  onOpenChange, 
  onConfirm, 
  taskTitle 
}: ReopenTaskDialogProps) => {
  const { t } = useTranslation();
  const [comment, setComment] = useState('');

  const handleConfirm = () => {
    onConfirm(comment);
    setComment('');
    onOpenChange(false);
  };

  const handleCancel = () => {
    setComment('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            {t('tasks.sendToRework', 'Отправить на переработку')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              {t('tasks.task', 'Задача')}: <span className="font-medium">{taskTitle}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              {t('tasks.reworkDescription', 'Вы отправляете задачу на переработку. Добавьте комментарий с причиной или дополнительными требованиями.')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">{t('tasks.reworkComment', 'Комментарий к переработке')}</Label>
            <Textarea
              id="comment"
              placeholder={t('tasks.reworkCommentPlaceholder', 'Укажите причину переработки или дополнительные требования...')}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleCancel}>
              {t('common.cancel', 'Отмена')}
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={!comment.trim()}
            >
              {t('tasks.sendToRework', 'Отправить на переработку')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
