import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useTasks } from '@/hooks/useTasks';
import { useLeads } from '@/hooks/useLeads';
import { useDeals } from '@/hooks/useDeals';
import { useEmployeesByRole } from '@/hooks/useEmployeesByRole';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const taskSchema = z.object({
  title: z.string().min(1, "Название задачи обязательно"),
  description: z.string().optional(),
  assignee_id: z.string().optional(),
  assignee_ids: z.array(z.string()).optional(),
  client_id: z.string().optional(),
  deal_id: z.string().optional(), 
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  due_date: z.date().optional(),
  recurrence_type: z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly']).default('none'),
  recurrence_interval: z.number().min(1).default(1),
  recurrence_end_date: z.date().optional()
});

type TaskFormData = z.infer<typeof taskSchema>;

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTask?: any;
}

export const AddTaskDialog = ({ open, onOpenChange, editingTask }: AddTaskDialogProps) => {
  const { t } = useTranslation();
  const { addTask, updateTask } = useTasks();
  const { leads } = useLeads();
  const { deals } = useDeals();
  const { employees } = useEmployeesByRole();
  const [loading, setLoading] = useState(false);

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: editingTask ? {
      title: editingTask.title,
      description: editingTask.description || '',
      assignee_id: editingTask.assignee_id || '',
      assignee_ids: editingTask.assignee_ids || [],
      client_id: editingTask.client_id || '',
      deal_id: editingTask.deal_id || '',
      status: editingTask.status,
      priority: editingTask.priority,
      due_date: editingTask.due_date ? new Date(editingTask.due_date) : undefined,
      recurrence_type: 'none',
      recurrence_interval: 1,
      recurrence_end_date: undefined
    } : {
      title: '',
      description: '',
      assignee_id: '',
      assignee_ids: [],
      client_id: '',
      deal_id: '',
      status: 'pending',
      priority: 'medium',
      recurrence_type: 'none',
      recurrence_interval: 1
    }
  });

  const watchRecurrenceType = form.watch('recurrence_type');

  const onSubmit = async (data: TaskFormData) => {
    setLoading(true);
    try {
      const taskData = {
        title: data.title,
        description: data.description || undefined,
        status: data.status,
        priority: data.priority,
        due_date: data.due_date?.toISOString(),
        recurrence_type: data.recurrence_type,
        recurrence_interval: data.recurrence_interval,
        recurrence_end_date: data.recurrence_end_date?.toISOString(),
        assignee_id: data.assignee_ids && data.assignee_ids.length > 0 ? data.assignee_ids[0] : (data.assignee_id && data.assignee_id !== '' ? data.assignee_id : undefined),
        assignee_ids: data.assignee_ids || [],
        client_id: data.client_id && data.client_id !== '' ? data.client_id : undefined,
        deal_id: data.deal_id && data.deal_id !== '' && data.deal_id !== 'none' ? data.deal_id : undefined,
        parent_task_id: undefined,
      };

      if (editingTask) {
        await updateTask(editingTask.id, taskData);
        toast({
          title: t('tasks.taskUpdated', 'Задача обновлена'),
          description: t('tasks.taskUpdatedDesc', 'Задача успешно обновлена'),
        });
      } else {
        await addTask(taskData);
        toast({
          title: t('tasks.taskCreated', 'Задача создана'),
          description: t('tasks.taskCreatedDesc', 'Новая задача успешно создана'),
        });
      }
      
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast({
        title: t('common.error', 'Ошибка'),
        description: t('tasks.taskSaveError', 'Не удалось сохранить задачу'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {editingTask ? t('tasks.editTask', 'Редактировать задачу') : t('tasks.newTask', 'Новая задача')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>{t('tasks.taskTitle', 'Название задачи')} *</FormLabel>
                    <FormControl>
                      <Input placeholder={t('tasks.taskTitlePlaceholder', 'Введите название задачи')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>{t('tasks.description', 'Описание')}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={t('tasks.descriptionPlaceholder', 'Описание задачи...')}
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assignee_ids"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>{t('tasks.assignToEmployees', 'Назначить сотрудникам (можно выбрать несколько)')}</FormLabel>
                    <div className="border rounded-md p-3 max-h-[200px] overflow-y-auto space-y-2">
                      {employees && employees.length > 0 ? (
                        employees.map((employee) => (
                          <div key={employee.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`assignee-${employee.id}`}
                              checked={field.value?.includes(employee.id) || false}
                              onChange={(e) => {
                                const currentValues = field.value || [];
                                if (e.target.checked) {
                                  field.onChange([...currentValues, employee.id]);
                                } else {
                                  field.onChange(currentValues.filter(id => id !== employee.id));
                                }
                              }}
                              className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-primary"
                            />
                            <label
                              htmlFor={`assignee-${employee.id}`}
                              className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {employee.email}
                            </label>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">{t('tasks.noEmployeesAvailable', 'Нет доступных сотрудников')}</p>
                      )}
                    </div>
                    <FormDescription>
                      {t('tasks.selectedCount', 'Выбрано')}: {field.value?.length || 0} {t('tasks.employees', 'сотрудников')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('tasks.statusLabel', 'Статус')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('tasks.selectStatus', 'Выберите статус')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">{t('tasks.status.pending', 'В ожидании')}</SelectItem>
                        <SelectItem value="in_progress">{t('tasks.status.in_progress', 'В работе')}</SelectItem>
                        <SelectItem value="completed">{t('tasks.status.completed', 'Выполнено')}</SelectItem>
                        <SelectItem value="cancelled">{t('tasks.status.cancelled', 'Отменено')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('tasks.priorityLabel', 'Приоритет')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('tasks.selectPriority', 'Выберите приоритет')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">{t('tasks.priorities.low', 'Низкий')}</SelectItem>
                        <SelectItem value="medium">{t('tasks.priorities.medium', 'Средний')}</SelectItem>
                        <SelectItem value="high">{t('tasks.priorities.high', 'Высокий')}</SelectItem>
                        <SelectItem value="urgent">{t('tasks.priorities.urgent', 'Срочно')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('tasks.dueDate', 'Срок выполнения')}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd.MM.yyyy")
                            ) : (
                              <span>{t('tasks.selectDate', 'Выберите дату')}</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deal_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('tasks.relatedDeal', 'Связанная сделка')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('tasks.selectDeal', 'Выберите сделку')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">{t('tasks.noDeal', 'Без сделки')}</SelectItem>
                        {deals?.map((deal) => (
                          <SelectItem key={deal.id} value={deal.id}>
                            {deal.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Recurrence Settings */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
              <h3 className="font-semibold text-sm">{t('tasks.recurrenceSettings', 'Настройки повторения')}</h3>
              
              <FormField
                control={form.control}
                name="recurrence_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('tasks.recurrenceType', 'Тип повторения')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('tasks.selectType', 'Выберите тип')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">{t('tasks.recurrence.none', 'Единоразовая задача')}</SelectItem>
                        <SelectItem value="daily">{t('tasks.recurrence.daily', 'Ежедневно')}</SelectItem>
                        <SelectItem value="weekly">{t('tasks.recurrence.weekly', 'Еженедельно')}</SelectItem>
                        <SelectItem value="monthly">{t('tasks.recurrence.monthly', 'Ежемесячно')}</SelectItem>
                        <SelectItem value="yearly">{t('tasks.recurrence.yearly', 'Ежегодно')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchRecurrenceType !== 'none' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="recurrence_interval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('tasks.recurrenceInterval', 'Интервал повторения')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            placeholder="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormDescription>
                          {t('tasks.every', 'Каждые')} {field.value} {
                            watchRecurrenceType === 'daily' ? t('tasks.interval.days', 'дней') :
                            watchRecurrenceType === 'weekly' ? t('tasks.interval.weeks', 'недель') :
                            watchRecurrenceType === 'monthly' ? t('tasks.interval.months', 'месяцев') :
                            t('tasks.interval.years', 'лет')
                          }
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recurrence_end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('tasks.recurrenceEndDate', 'Окончание повторения')}</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "dd.MM.yyyy")
                                ) : (
                                  <span>{t('tasks.noLimit', 'Без ограничений')}</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel', 'Отмена')}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? t('common.saving', 'Сохранение...') : (editingTask ? t('common.save', 'Сохранить') : t('common.create', 'Создать'))}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
