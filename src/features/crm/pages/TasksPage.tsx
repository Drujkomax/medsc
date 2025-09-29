import { useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useLeads } from '@/hooks/useLeads';
import { useDeals } from '@/hooks/useDeals';
import { AddTaskDialog } from '../components/AddTaskDialog';
import { ViewTaskModal } from '../components/ViewTaskModal';
import { TaskFilters } from '../components/TaskFilters';
import { TaskCard } from '../components/TaskCard';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, CheckCircle, Clock, AlertTriangle, Calendar, BarChart3 } from "lucide-react";
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const TasksPage = () => {
  const { tasks, loading, deleteTask, completeTask } = useTasks();
  const { leads } = useLeads();
  const { deals } = useDeals();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [viewingTask, setViewingTask] = useState<any>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dueDateFilter, setDueDateFilter] = useState<Date | undefined>();
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [overdueOnly, setOverdueOnly] = useState(false);

  const handleAddTask = () => {
    setEditingTask(null);
    setShowAddDialog(true);
  };

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setShowAddDialog(true);
  };

  const handleViewTask = (task: any) => {
    setViewingTask(task);
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      toast({
        title: "Задача удалена",
        description: "Задача успешно удалена",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить задачу",
        variant: "destructive",
      });
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTask(taskId);
      toast({
        title: "Задача выполнена",
        description: "Задача отмечена как выполненная",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус задачи",
        variant: "destructive",
      });
    }
  };

  // Filter tasks
  const filteredTasks = tasks?.filter(task => {
    // Search filter
    if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !task.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Status filter
    if (statusFilter !== 'all' && task.status !== statusFilter) {
      return false;
    }

    // Priority filter
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
      return false;
    }

    // Due date filter
    if (dueDateFilter) {
      const taskDueDate = task.due_date ? new Date(task.due_date).toDateString() : null;
      if (taskDueDate !== dueDateFilter.toDateString()) {
        return false;
      }
    }

    // Assignee filter
    if (assigneeFilter !== 'all') {
      if (assigneeFilter === 'assigned' && !task.assignee_id) return false;
      if (assigneeFilter === 'unassigned' && task.assignee_id) return false;
      // TODO: Add 'me' filter when user context is available
    }

    // Overdue filter
    if (overdueOnly) {
      const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
      if (!isOverdue) return false;
    }

    return true;
  }) || [];

  // Calculate statistics
  const stats = {
    total: tasks?.length || 0,
    pending: tasks?.filter(t => t.status === 'pending').length || 0,
    inProgress: tasks?.filter(t => t.status === 'in_progress').length || 0,
    completed: tasks?.filter(t => t.status === 'completed').length || 0,
    overdue: tasks?.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length || 0,
  };

  const activeFiltersCount = [
    searchTerm,
    statusFilter !== 'all' ? statusFilter : null,
    priorityFilter !== 'all' ? priorityFilter : null,
    dueDateFilter,
    assigneeFilter !== 'all' ? assigneeFilter : null,
    overdueOnly
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setDueDateFilter(undefined);
    setAssigneeFilter('all');
    setOverdueOnly(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Управление задачами</h1>
          <p className="text-muted-foreground">
            {stats.total} {stats.total === 1 ? 'задача' : stats.total < 5 ? 'задачи' : 'задач'} • 
            {stats.overdue > 0 && (
              <span className="text-red-600 ml-1">
                {stats.overdue} просроченных
              </span>
            )}
          </p>
        </div>
        <Button onClick={handleAddTask} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Новая задача
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего задач</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">В ожидании</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">В работе</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Выполнено</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Просрочено</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Фильтры</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            priorityFilter={priorityFilter}
            onPriorityFilterChange={setPriorityFilter}
            dueDateFilter={dueDateFilter}
            onDueDateFilterChange={setDueDateFilter}
            assigneeFilter={assigneeFilter}
            onAssigneeFilterChange={setAssigneeFilter}
            overdueOnly={overdueOnly}
            onOverdueOnlyChange={setOverdueOnly}
            activeFiltersCount={activeFiltersCount}
            onClearFilters={clearFilters}
          />
        </CardContent>
      </Card>

      {/* Tasks Grid */}
      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {tasks?.length === 0 ? 'Пока нет задач' : 'Задачи не найдены'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {tasks?.length === 0 
                ? 'Создайте первую задачу для начала работы'
                : 'Попробуйте изменить фильтры поиска'
              }
            </p>
            {tasks?.length === 0 && (
              <Button onClick={handleAddTask}>
                <Plus className="h-4 w-4 mr-2" />
                Создать задачу
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onView={handleViewTask}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              onComplete={handleCompleteTask}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <AddTaskDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        editingTask={editingTask}
      />

      <ViewTaskModal
        task={viewingTask}
        open={!!viewingTask}
        onOpenChange={(open) => !open && setViewingTask(null)}
        onEdit={handleEditTask}
        onDelete={handleDeleteTask}
        onComplete={handleCompleteTask}
      />
    </div>
  );
};

export default TasksPage;