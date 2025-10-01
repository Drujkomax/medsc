import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; 
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar, CheckCircle2, Edit, Eye, MoreVertical, Repeat, Trash2, User, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface TaskCardProps {
  task: any;
  onView: (task: any) => void;
  onEdit?: (task: any) => void;
  onDelete?: (taskId: string) => void;
  onComplete: (taskId: string) => void;
  onReopen?: (taskId: string) => void;
  canComplete?: boolean;
  canReopen?: boolean;
}

export const TaskCard = ({ task, onView, onEdit, onDelete, onComplete, onReopen, canComplete = true, canReopen = false }: TaskCardProps) => {
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
  const isRecurring = task.recurrence_type && task.recurrence_type !== 'none';

  return (
    <Card className={`hover:shadow-md transition-shadow ${isOverdue ? 'border-red-200 bg-red-50/50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base line-clamp-2 mb-2">{task.title}</h3>
            <div className="flex flex-wrap gap-2">
              <Badge className={getStatusColor(task.status)}>
                {getStatusText(task.status)}
              </Badge>
              <Badge className={getPriorityColor(task.priority)}>
                {getPriorityText(task.priority)}
              </Badge>
              {isRecurring && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Repeat className="h-3 w-3" />
                  Периодическая
                </Badge>
              )}
              {isOverdue && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Просрочено
                </Badge>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(task)}>
                <Eye className="mr-2 h-4 w-4" />
                Просмотр
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit && onEdit(task)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Редактировать
                </DropdownMenuItem>
              )}
              {task.status !== 'completed' && (
                <DropdownMenuItem onClick={() => onComplete(task.id)}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Выполнить
                </DropdownMenuItem>
              )}
              {task.status === 'completed' && canReopen && onReopen && (
                <DropdownMenuItem onClick={() => onReopen(task.id)}>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Отправить на переработку
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={() => onDelete && onDelete(task.id)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Удалить
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {task.description}
          </p>
        )}

        <div className="space-y-2 text-xs text-muted-foreground">
          {task.due_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                {format(new Date(task.due_date), 'dd MMM yyyy', { locale: ru })}
              </span>
            </div>
          )}
          
          {(task.assignee_id || (task.assignee_ids && task.assignee_ids.length > 0)) && (
            <div className="flex items-center gap-2">
              <User className="h-3 w-3" />
              <span>
                {task.assignee_ids && task.assignee_ids.length > 0 
                  ? `Назначено (${task.assignee_ids.length})`
                  : 'Назначено'}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span>Создано: {format(new Date(task.created_at), 'dd MMM', { locale: ru })}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mt-4">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onView(task)}
            className="flex-1"
          >
            <Eye className="h-3 w-3 mr-1" />
            Открыть
          </Button>
          {task.status !== 'completed' && (
            <Button 
              size="sm" 
              onClick={() => onComplete(task.id)}
              className="flex-1"
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Выполнить
            </Button>
          )}
          {task.status === 'completed' && canReopen && onReopen && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onReopen(task.id)}
              className="flex-1"
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              На переработку
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};