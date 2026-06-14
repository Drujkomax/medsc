import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, User, Building, FileText, Repeat, CheckCircle2, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useTranslation } from 'react-i18next';

interface ViewTaskModalProps {
  task: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (task: any) => void;
  onDelete?: (taskId: string) => void;
  onComplete?: (taskId: string) => void;
  onReopen?: (taskId: string) => void;
}

export const ViewTaskModal = ({ 
  task, 
  open, 
  onOpenChange, 
  onEdit, 
  onDelete, 
  onComplete,
  onReopen 
}: ViewTaskModalProps) => {
  const { t } = useTranslation();
  const { role } = useUserPermissions();
  
  if (!task) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return t('tasks.status.pending', 'В ожидании');
      case 'in_progress': return t('tasks.status.in_progress', 'В работе');
      case 'completed': return t('tasks.status.completed', 'Выполнено');
      case 'cancelled': return t('tasks.status.cancelled', 'Отменено');
      default: return status;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low': return t('tasks.priorities.low', 'Низкий');
      case 'medium': return t('tasks.priorities.medium', 'Средний');
      case 'high': return t('tasks.priorities.high', 'Высокий');
      case 'urgent': return t('tasks.priorities.urgent', 'Срочно');
      default: return priority;
    }
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {task.title}
            </span>
            <div className="flex gap-2">
              <Badge className={getStatusColor(task.status)}>
                {getStatusText(task.status)}
              </Badge>
              <Badge className={getPriorityColor(task.priority)}>
                {getPriorityText(task.priority)}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            {task.description && (
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">{t('tasks.descriptionLabel', 'ОПИСАНИЕ')}</h3>
                <p className="text-sm leading-relaxed bg-muted/30 p-3 rounded-md">
                  {task.description}
                </p>
              </div>
            )}

            {task.comments && (
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">{t('tasks.reworkCommentLabel', 'КОММЕНТАРИЙ К ПЕРЕРАБОТКЕ')}</h3>
                <p className="text-sm leading-relaxed bg-orange-50 border-l-4 border-orange-200 p-3 rounded-md">
                  {task.comments}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Due Date */}
              {task.due_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('tasks.dueDate', 'Срок выполнения')}</p>
                    <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                      {format(new Date(task.due_date), 'dd MMMM yyyy', { locale: ru })}
                      {isOverdue && (
                        <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          {t('tasks.overdue', 'Просрочено')}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Created Date */}
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('tasks.createdLabel', 'Создано')}</p>
                  <p className="text-sm font-medium">
                    {format(new Date(task.created_at), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                  </p>
                </div>
              </div>

              {/* Completed Date */}
              {task.completed_at && (
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('tasks.completedLabel', 'Выполнено')}</p>
                    <p className="text-sm font-medium">
                      {format(new Date(task.completed_at), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                    </p>
                  </div>
                </div>
              )}

              {/* Assignees */}
              {(task.assignee_id || (task.assignee_ids && task.assignee_ids.length > 0)) && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('tasks.assignees', 'Исполнители')}</p>
                    <p className="text-sm font-medium">
                      {task.assignee_ids && task.assignee_ids.length > 0 
                        ? t('tasks.assignedPeople', 'Назначено: {{count}} человек', { count: task.assignee_ids.length })
                        : t('tasks.assigned', 'Назначен')}
                    </p>
                  </div>
                </div>
              )}

              {/* Deal */}
              {task.deal_id && (
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('tasks.relatedDeal', 'Связанная сделка')}</p>
                    <p className="text-sm font-medium">ID: {task.deal_id.slice(0, 8)}...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recurrence Info */}
          <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4" />
              <h3 className="font-semibold text-sm">{t('tasks.taskRecurrence', 'Повторение задачи')}</h3>
            </div>
            
            <div className="text-sm text-muted-foreground">
              {task.recurrence_type && task.recurrence_type !== 'none' ? (
                <div>
                  <p>
                    {t('tasks.repeats', 'Повторяется')} {task.recurrence_type === 'daily' ? t('tasks.recurrence.daily', 'ежедневно') : 
                                task.recurrence_type === 'weekly' ? t('tasks.recurrence.weekly', 'еженедельно') :
                                task.recurrence_type === 'monthly' ? t('tasks.recurrence.monthly', 'ежемесячно') : t('tasks.recurrence.yearly', 'ежегодно')}
                    {task.recurrence_interval && task.recurrence_interval > 1 && (
                      <span> {t('tasks.every', 'каждые')} {task.recurrence_interval} {
                        task.recurrence_type === 'daily' ? t('tasks.interval.days', 'дней') :
                        task.recurrence_type === 'weekly' ? t('tasks.interval.weeks', 'недель') :
                        task.recurrence_type === 'monthly' ? t('tasks.interval.months', 'месяцев') : t('tasks.interval.years', 'лет')
                      }</span>
                    )}
                  </p>
                  {task.recurrence_end_date && (
                    <p className="text-xs mt-1">
                      {t('tasks.until', 'До')}: {format(new Date(task.recurrence_end_date), 'dd MMMM yyyy', { locale: ru })}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <p>{t('tasks.oneTimeTask', 'Единоразовая задача')}</p>
                  <p className="text-xs mt-1">{t('tasks.noRecurrence', 'Эта задача не повторяется')}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {task.status !== 'completed' && onComplete && (
              <Button 
                onClick={() => onComplete(task.id)}
                className="flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                {t('tasks.markCompleted', 'Отметить выполненной')}
              </Button>
            )}

            {task.status === 'completed' && onReopen && (role === 'director' || role === 'sales_manager' || role === 'admin') && (
              <Button 
                variant="outline"
                onClick={() => onReopen(task.id)}
                className="flex items-center gap-2"
              >
                <Repeat className="h-4 w-4" />
                {t('tasks.sendToRework', 'Отправить на переработку')}
              </Button>
            )}
            
            {onEdit && (role === 'director' || role === 'sales_manager') && (
              <Button 
                variant="outline"
                onClick={() => onEdit(task)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                {t('common.edit', 'Редактировать')}
              </Button>
            )}
            
            {onDelete && (role === 'director' || role === 'sales_manager') && (
              <Button 
                variant="destructive"
                onClick={() => onDelete(task.id)}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {t('common.delete', 'Удалить')}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
