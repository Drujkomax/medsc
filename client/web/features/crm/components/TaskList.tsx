import { useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useDeals } from '@/hooks/useDeals';
import { useLeads } from '@/hooks/useLeads';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { Search, Plus, CheckCircle, Clock, AlertCircle, User, Calendar, Eye, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface TaskListProps {
  onAddTask: () => void;
  onEditTask: (task: any) => void;
  onViewTask: (task: any) => void;
}

const TaskList = ({ onAddTask, onEditTask, onViewTask }: TaskListProps) => {
  const { t } = useTranslation();
  const { tasks, loading, deleteTask, updateTask } = useTasks();
  const { leads } = useLeads();
  const { deals } = useDeals();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const statuses = ['pending', 'in_progress', 'completed', 'cancelled'];
  const priorities = ['low', 'medium', 'high', 'urgent'];
  
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getLeadName = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    return lead?.name || t('common.unknown');
  };

  const getDealTitle = (dealId: string) => {
    const deal = deals.find(d => d.id === dealId);
    return deal?.title || t('common.unknown');
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const pendingTasks = tasks.filter(task => task.status === 'pending');
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
  const completedTasks = tasks.filter(task => task.status === 'completed');
  const overdueTasks = tasks.filter(task => 
    task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'
  );

  const handleDeleteTask = async (id: string, title: string) => {
    if (confirm(t('common.confirmDelete', { name: title }))) {
      try {
        await deleteTask(id);
        toast.success(t('tasks.deleted'));
      } catch (error) {
        toast.error(t('common.error'));
      }
    }
  };

  const handleCompleteTask = async (id: string) => {
    try {
      await updateTask(id, { status: 'completed', completed_at: new Date().toISOString() });
      toast.success(t('tasks.completed'));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('tasks.title')}</h1>
          <p className="text-muted-foreground">{t('tasks.subtitle')}</p>
        </div>
        <Button onClick={onAddTask} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          {t('tasks.addTask')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('tasks.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder={t('tasks.filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              {statuses.map(status => (
                <SelectItem key={status} value={status}>
                  {t(`tasks.status.${status}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder={t('tasks.filterByPriority')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              {priorities.map(priority => (
                <SelectItem key={priority} value={priority}>
                  {t(`tasks.priorities.${priority}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {t('tasks.pending')}
                </p>
                <p className="text-2xl font-bold">{pendingTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {t('tasks.inProgress')}
                </p>
                <p className="text-2xl font-bold">{inProgressTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {t('tasks.completed')}
                </p>
                <p className="text-2xl font-bold">{completedTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {t('tasks.overdue')}
                </p>
                <p className="text-2xl font-bold text-red-500">{overdueTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-foreground">
                {t('tasks.notFound')}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('tasks.notFoundDescription')}
              </p>
              <div className="mt-6">
                <Button onClick={onAddTask}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('tasks.addTask')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="truncate">{task.title}</span>
                  <div className="flex items-center gap-1">
                    {task.status !== 'completed' && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleCompleteTask(task.id)}
                        className="text-green-600 hover:text-green-800"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onViewTask(task)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onEditTask(task)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteTask(task.id, task.title)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge className={getStatusColor(task.status)}>
                    {t(`tasks.status.${task.status}`)}
                  </Badge>
                  <Badge className={getPriorityColor(task.priority)}>
                    {t(`tasks.priorities.${task.priority}`)}
                  </Badge>
                </div>
                
                {task.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {task.description}
                  </p>
                )}
                
                {task.client_id && (
                  <div className="flex items-center text-sm">
                    <User className="w-4 h-4 text-muted-foreground mr-2" />
                    <span className="truncate">{getLeadName(task.client_id)}</span>
                  </div>
                )}
                
                {task.deal_id && (
                  <div className="flex items-center text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground mr-2" />
                    <span className="truncate">{getDealTitle(task.deal_id)}</span>
                  </div>
                )}
                
                {task.due_date && (
                  <div className="flex items-center text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground mr-2" />
                    <span className={
                      new Date(task.due_date) < new Date() && task.status !== 'completed' 
                        ? 'text-red-500 font-medium' 
                        : ''
                    }>
                      {format(new Date(task.due_date), 'dd.MM.yyyy HH:mm')}
                    </span>
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground pt-2">
                  {t('tasks.createdAt')}: {format(new Date(task.created_at), 'dd.MM.yyyy')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskList;