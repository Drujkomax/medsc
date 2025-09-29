import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, User, Building, FileText, Repeat, CheckCircle2, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface ViewTaskModalProps {
  task: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (task: any) => void;
  onDelete?: (taskId: string) => void;
  onComplete?: (taskId: string) => void;
}

export const ViewTaskModal = ({ 
  task, 
  open, 
  onOpenChange, 
  onEdit, 
  onDelete, 
  onComplete 
}: ViewTaskModalProps) => {
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
      case 'pending': return 'В ожидании';
      case 'in_progress': return 'В работе';
      case 'completed': return 'Выполнено';
      case 'cancelled': return 'Отменено';
      default: return status;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low': return 'Низкий';
      case 'medium': return 'Средний';
      case 'high': return 'Высокий';
      case 'urgent': return 'Срочно';
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
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">ОПИСАНИЕ</h3>
                <p className="text-sm leading-relaxed bg-muted/30 p-3 rounded-md">
                  {task.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Due Date */}
              {task.due_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Срок выполнения</p>
                    <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                      {format(new Date(task.due_date), 'dd MMMM yyyy', { locale: ru })}
                      {isOverdue && (
                        <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          Просрочено
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
                  <p className="text-xs text-muted-foreground">Создано</p>
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
                    <p className="text-xs text-muted-foreground">Выполнено</p>
                    <p className="text-sm font-medium">
                      {format(new Date(task.completed_at), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                    </p>
                  </div>
                </div>
              )}

              {/* Assignee */}
              {task.assignee_id && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Исполнитель</p>
                    <p className="text-sm font-medium">Назначен</p>
                  </div>
                </div>
              )}

              {/* Deal */}
              {task.deal_id && (
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Связанная сделка</p>
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
              <h3 className="font-semibold text-sm">Повторение задачи</h3>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>Единоразовая задача</p>
              <p className="text-xs mt-1">Эта задача не повторяется</p>
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
                Отметить выполненной
              </Button>
            )}
            
            {onEdit && (
              <Button 
                variant="outline"
                onClick={() => onEdit(task)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Редактировать
              </Button>
            )}
            
            {onDelete && (
              <Button 
                variant="destructive"
                onClick={() => onDelete(task.id)}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Удалить
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};