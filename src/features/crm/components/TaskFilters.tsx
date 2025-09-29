import { Search, Filter, Calendar, User, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface TaskFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (value: string) => void;
  dueDateFilter: Date | undefined;
  onDueDateFilterChange: (date: Date | undefined) => void;
  assigneeFilter: string;
  onAssigneeFilterChange: (value: string) => void;
  overdueOnly: boolean;
  onOverdueOnlyChange: (value: boolean) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
}

export const TaskFilters = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  dueDateFilter,
  onDueDateFilterChange,
  assigneeFilter,
  onAssigneeFilterChange,
  overdueOnly,
  onOverdueOnlyChange,
  onClearFilters,
  activeFiltersCount
}: TaskFiltersProps) => {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Поиск задач..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="pending">В ожидании</SelectItem>
            <SelectItem value="in_progress">В работе</SelectItem>
            <SelectItem value="completed">Выполнено</SelectItem>
            <SelectItem value="cancelled">Отменено</SelectItem>
          </SelectContent>
        </Select>

        {/* Priority Filter */}
        <Select value={priorityFilter} onValueChange={onPriorityFilterChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Приоритет" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все приоритеты</SelectItem>
            <SelectItem value="urgent">Срочно</SelectItem>
            <SelectItem value="high">Высокий</SelectItem>
            <SelectItem value="medium">Средний</SelectItem>
            <SelectItem value="low">Низкий</SelectItem>
          </SelectContent>
        </Select>

        {/* Due Date Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-52 justify-start">
              <Calendar className="mr-2 h-4 w-4" />
              {dueDateFilter ? (
                format(dueDateFilter, "dd MMM yyyy", { locale: ru })
              ) : (
                "Срок выполнения"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={dueDateFilter}
              onSelect={onDueDateFilterChange}
              initialFocus
            />
            {dueDateFilter && (
              <div className="p-3 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onDueDateFilterChange(undefined)}
                  className="w-full"
                >
                  Очистить
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Assignee Filter */}
        <Select value={assigneeFilter} onValueChange={onAssigneeFilterChange}>
          <SelectTrigger className="w-40">
            <User className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Исполнитель" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все исполнители</SelectItem>
            <SelectItem value="assigned">Назначенные</SelectItem>
            <SelectItem value="unassigned">Неназначенные</SelectItem>
            <SelectItem value="me">Мои задачи</SelectItem>
          </SelectContent>
        </Select>

        {/* Overdue Filter */}
        <Button
          variant={overdueOnly ? "default" : "outline"}
          onClick={() => onOverdueOnlyChange(!overdueOnly)}
          className="flex items-center gap-2"
        >
          <AlertCircle className="h-4 w-4" />
          Просроченные
        </Button>

        {/* Active Filters Badge */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <Badge variant="secondary">
              {activeFiltersCount} фильтр{activeFiltersCount > 1 ? 'ов' : ''}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClearFilters}
              className="h-8 px-2"
            >
              Очистить
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};