import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useLeads, Lead } from '@/hooks/useLeads';
import { useDuplicateDetection, DuplicateGroup } from '@/hooks/useDuplicateDetection';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useAuth } from '@/hooks/useAuth';
import { useLeadMerge } from '@/hooks/useLeadMerge';
import { supabase } from '@/integrations/supabase/client';
import RoleBasedAccess from '@/components/auth/RoleBasedAccess';
import { LeadHybridCard } from '../components/LeadHybridCard';
import { DuplicateAlert } from '../components/DuplicateAlert';
import { DuplicateDetailModal } from '../components/DuplicateDetailModal';
import { UnifiedLeadModal } from '../components/UnifiedLeadModal';
import CreateDealFromLeadDialog from '../components/CreateDealFromLeadDialog';
import { AddLeadDialog } from '../components/AddLeadDialog';
import {
  Search, 
  Edit,
  Archive,
  Eye,
  User,
  Phone,
  Building,
  CalendarIcon,
  Filter,
  AlertTriangle,
  LayoutGrid,
  Plus,
  MoreHorizontal,
  ChevronDown,
  ArrowUpDown
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const Leads = () => {
  const { t } = useTranslation();
  // Force cache refresh
  const { toast } = useToast();
  const { leads, loading, deleteLead, archiveLead, changeLeadStage, refetch } = useLeads();
  const { duplicateGroups, hasDuplicates } = useDuplicateDetection(leads);
  const { hasPermission, role } = useUserPermissions();
  const { user } = useAuth();
  const { mergeLeads, loading: merging } = useLeadMerge();
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [assignedFilter, setAssignedFilter] = useState<string>('all');
  const [qualityFilter, setQualityFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [employees, setEmployees] = useState<Array<{id: string, email: string, full_name: string, role: string}>>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [createDealLead, setCreateDealLead] = useState<Lead | null>(null);
  const [addLeadModalOpen, setAddLeadModalOpen] = useState(false);
  const [selectedDuplicateGroup, setSelectedDuplicateGroup] = useState<DuplicateGroup | null>(null);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<'name' | 'company' | 'city' | 'created_at' | 'lead_created_date'>('lead_created_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Helper functions for lead stages
  const getStageLabel = (stage: string) => {
    const stageMap: Record<string, string> = {
      new: t('leads.stages.new', 'Новый'),
      contacted: t('leads.stages.contacted', 'Связались'),
      qualified: t('leads.stages.qualified', 'Квалифицирован'),
      proposal: t('leads.stages.proposal', 'Отправил КП'),
      negotiation: t('leads.stages.negotiation', 'Переговоры'),
      closed: t('leads.stages.closed', 'Успешно'),
      lost: t('leads.stages.lost', 'Отказ')
    };
    return stageMap[stage] || stage;
  };

  const getStageColor = (stage: string) => {
    const colorMap: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800 border-blue-200',
      contacted: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      qualified: 'bg-purple-100 text-purple-800 border-purple-200',
      proposal: 'bg-orange-100 text-orange-800 border-orange-200',
      negotiation: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      closed: 'bg-green-100 text-green-800 border-green-200',
      lost: 'bg-red-100 text-red-800 border-red-200'
    };
    return colorMap[stage] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getAssignedUserName = (userId: string) => {
    const employee = employees.find(emp => emp.id === userId);
    return employee ? employee.email : t('leads.assigned', 'Назначен');
  };

  const handleAssignLead = async (leadId: string, assigneeId: string | null) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          assigned_to: assigneeId,
          assigned_by: user?.id
        })
        .eq('id', leadId);

      if (error) throw error;
      
      await refetch();
      toast({
        title: t('common.success', 'Успешно'),
        description: assigneeId ? t('leads.leadAssigned', 'Лид назначен') : t('leads.leadUnassigned', 'Назначение лида снято'),
      });
    } catch (error) {
      console.error('Error assigning lead:', error);
      toast({
        title: t('common.error', 'Ошибка'),
        description: t('leads.assignError', 'Ошибка при назначении лида'),
        variant: 'destructive',
      });
    }
  };

  const leadStages = [
    { value: 'new', label: t('leads.stages.new', 'Новые'), count: 0, color: 'bg-blue-500' },
    { value: 'contacted', label: t('leads.stages.contacted', 'Связались'), count: 0, color: 'bg-yellow-500' },
    { value: 'qualified', label: t('leads.stages.qualified', 'Квалифицированы'), count: 0, color: 'bg-purple-500' },
    { value: 'proposal', label: t('leads.stages.proposal', 'Отправил КП'), count: 0, color: 'bg-orange-500' },
    { value: 'negotiation', label: t('leads.stages.negotiation', 'Переговоры'), count: 0, color: 'bg-indigo-500' },
    { value: 'closed', label: t('leads.stages.closed', 'Успешно'), count: 0, color: 'bg-green-500' },
    { value: 'lost', label: t('leads.stages.lost', 'Отказ'), count: 0, color: 'bg-red-500' },
  ];

  useEffect(() => {
    if (hasPermission('assign_leads')) {
      fetchEmployees();
    }
  }, [hasPermission]);

  const fetchEmployees = async () => {
    try {
      // Получаем сначала роли продавцов
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('role', 'salesperson');

      if (rolesError) throw rolesError;

      if (!userRoles || userRoles.length === 0) {
        setEmployees([]);
        return;
      }

      // Получаем профили этих пользователей
      const userIds = userRoles.map(role => role.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Объединяем данные
      const employeesData = userRoles.map(role => {
        const profile = profiles?.find(p => p.id === role.user_id);
        return {
          id: role.user_id,
          email: profile?.email || 'Неизвестный email',
          full_name: profile?.full_name || profile?.email || 'Неизвестный пользователь',
          role: role.role
        };
      });
      
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleSort = (field: 'name' | 'company' | 'city' | 'created_at' | 'lead_created_date') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredAndSortedLeads = leads
    .filter(lead => {
      // Filter out archived leads
      if (lead.archived) return false;
      
      // Продавцы видят только назначенных им лидов
      if (role === 'salesperson' && lead.assigned_to !== user?.id) {
        return false;
      }

      const matchesSearch = 
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone?.includes(searchTerm) ||
        lead.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.company?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStage = stageFilter === 'all' || lead.stage === stageFilter;
      
      const matchesAssigned = assignedFilter === 'all' || 
        (assignedFilter === 'unassigned' && !lead.assigned_to) ||
        (assignedFilter !== 'unassigned' && lead.assigned_to === assignedFilter);
      
      const matchesQuality = qualityFilter === 'all' || lead.lead_quality === qualityFilter;
      
      const leadDate = new Date(lead.created_at);
      const matchesDateRange = (!startDate || leadDate >= startDate) && 
                               (!endDate || leadDate <= endDate);
      
      return matchesSearch && matchesStage && matchesAssigned && matchesQuality && matchesDateRange;
    })
    .sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'company':
          aValue = a.company || '';
          bValue = b.company || '';
          break;
        case 'city':
          aValue = a.city || '';
          bValue = b.city || '';
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'lead_created_date':
          aValue = a.lead_created_date ? new Date(a.lead_created_date).getTime() : 0;
          bValue = b.lead_created_date ? new Date(b.lead_created_date).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'asc' 
          ? aValue - bValue
          : bValue - aValue;
      }
    });

  const handleArchiveLead = async (id: string) => {
    try {
      await archiveLead(id);
      toast({
        title: 'Успешно',
        description: 'Лид архивирован',
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Ошибка при архивировании лида',
        variant: 'destructive',
      });
    }
  };

  const handleStageChange = async (leadId: string, newStage: string) => {
    try {
      console.log('Changing lead stage:', { leadId, newStage });
      await changeLeadStage(leadId, newStage);
      toast({
        title: 'Успешно',
        description: 'Статус лида обновлен',
      });
    } catch (error) {
      console.error('Stage change error:', error);
      toast({
        title: 'Ошибка',
        description: `Ошибка при обновлении статуса: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
        variant: 'destructive',
      });
    }
  };

  const handleViewDuplicateDetails = (duplicateGroup: DuplicateGroup) => {
    setSelectedDuplicateGroup(duplicateGroup);
    setIsDuplicateModalOpen(true);
  };

  const handleMergeDuplicates = async (duplicateGroup: any) => {
    await mergeLeads(duplicateGroup, refetch);
  };

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
    setLeadModalOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead);
    setLeadModalOpen(true);
  };

  const handleCloseLeadModal = () => {
    setLeadModalOpen(false);
    setSelectedLead(null);
  };

  const handleLeadUpdate = () => {
    refetch(); // Refresh leads data
  };

  const handleCreateDeal = (lead: Lead) => {
    setCreateDealLead(lead);
  };

  const handleDealSuccess = () => {
    setCreateDealLead(null);
    toast({
      title: 'Успешно',
      description: 'Сделка создана. Переходим к разделу сделок...',
    });
    // Небольшая задержка для показа уведомления
    setTimeout(() => {
      window.location.href = '/admin/deals';
    }, 1500);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeadIds(filteredAndSortedLeads.map(lead => lead.id));
    } else {
      setSelectedLeadIds([]);
    }
  };

  const handleSelectLead = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeadIds(prev => [...prev, leadId]);
    } else {
      setSelectedLeadIds(prev => prev.filter(id => id !== leadId));
    }
  };

  const handleBulkAssign = async (assignToId: string) => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Пользователь не авторизован');

      // Если выбрано "unassign", убираем назначение
      const assignValue = assignToId === 'unassign' ? null : assignToId;

      const updates = selectedLeadIds.map(leadId => 
        supabase
          .from('leads')
          .update({ 
            assigned_to: assignValue,
            assigned_by: assignValue ? currentUser.id : null
          })
          .eq('id', leadId)
      );

      await Promise.all(updates);

      toast({
        title: "Успешно",
        description: assignValue 
          ? `${selectedLeadIds.length} лидов назначено`
          : `Назначение снято у ${selectedLeadIds.length} лидов`,
      });

      setSelectedLeadIds([]);
      refetch();
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось назначить лидов",
        variant: "destructive",
      });
    }
  };

  const handleBulkArchive = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Пользователь не авторизован');

      const updates = selectedLeadIds.map(leadId => 
        supabase.rpc('archive_lead', { lead_id: leadId, user_id: currentUser.id })
      );

      await Promise.all(updates);

      toast({
        title: "Успешно",
        description: `${selectedLeadIds.length} лидов архивировано`,
      });

      setSelectedLeadIds([]);
      refetch();
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось архивировать лидов",
        variant: "destructive",
      });
    }
  };

  const isDirector = role === 'director';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Загрузка...</p>
      </div>
    );
  }

  const leadCounts = leadStages.reduce((acc, stage) => {
    acc[stage.value] = leads.filter(lead => lead.stage === stage.value && !lead.archived).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">{t('leads.title', 'Лиды')}</h2>
          <p className="text-muted-foreground">
            {t('leads.subtitle', 'Управление заявками клиентов')}
            {selectedLeadIds.length > 0 && ` | ${t('leads.selected', 'Выбрано')}: ${selectedLeadIds.length}`}
          </p>
        </div>
        <RoleBasedAccess roles={['director', 'admin', 'sales_manager', 'salesperson']}>
          <Button onClick={() => setAddLeadModalOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t('leads.addLead', 'Добавить лида')}
          </Button>
        </RoleBasedAccess>
      </div>

      {/* Bulk Actions Panel */}
      {isDirector && selectedLeadIds.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3 items-center">
              <span className="text-sm font-medium">{t('leads.bulkActions', 'Массовые действия')}:</span>
              <Select onValueChange={handleBulkAssign}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder={t('leads.assignTo', 'Назначить на...')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassign">
                    ❌ {t('leads.removeAssignment', 'Снять назначение')}
                  </SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="destructive" onClick={handleBulkArchive}>
                <Archive className="mr-2 h-4 w-4" />
                {t('leads.archive', 'Архивировать')} ({selectedLeadIds.length})
              </Button>
              <Button variant="outline" onClick={() => setSelectedLeadIds([])}>
                {t('leads.cancelSelection', 'Отменить выбор')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Duplicate Alerts */}
      {hasDuplicates && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-semibold">{t('leads.duplicatesDetected', 'Обнаружены дубликаты')}</h3>
          </div>
          {duplicateGroups.slice(0, 3).map((group, index) => (
            <DuplicateAlert 
              key={index} 
              duplicateGroup={group}
              onViewDetails={() => handleViewDuplicateDetails(group)}
            />
          ))}
          {duplicateGroups.length > 3 && (
            <p className="text-sm text-muted-foreground">
              {t('leads.moreDuplicates', 'И еще {{count}} групп дубликатов...', { count: duplicateGroups.length - 3 })}
            </p>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2 md:gap-4">
        {/* Total Leads Card - для всех ролей */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-2 md:p-4">
            <div className="flex items-center space-x-1 md:space-x-2">
              <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-primary" />
              <div>
                <p className="text-xs md:text-sm font-medium leading-tight">
                  {role === 'salesperson' ? t('leads.myLeads', 'Мои лиды') : t('leads.totalLeads', 'Всего лидов')}
                </p>
                <p className="text-lg md:text-2xl font-bold">
                  {role === 'salesperson' 
                    ? leads.filter(lead => !lead.archived && lead.assigned_to === user?.id).length
                    : leads.filter(lead => !lead.archived).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {leadStages.map((stage) => (
          <Card key={stage.value}>
            <CardContent className="p-2 md:p-4">
              <div className="flex items-center space-x-1 md:space-x-2">
                <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${stage.color}`} />
                <div>
                  <p className="text-xs md:text-sm font-medium leading-tight">{stage.label}</p>
                  <p className="text-lg md:text-2xl font-bold">
                    {role === 'salesperson' 
                      ? leads.filter(lead => lead.stage === stage.value && !lead.archived && lead.assigned_to === user?.id).length
                      : (leadCounts[stage.value] || 0)
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={t('common.search', 'Поиск...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder={t('leads.filterByStatus', 'Фильтр по статусу')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('leads.allStatuses', 'Все статусы')}</SelectItem>
                  {leadStages.map((stage) => (
                    <SelectItem key={stage.value} value={stage.value}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={qualityFilter} onValueChange={setQualityFilter}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder={t('leads.leadQuality', 'Качество лида')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('leads.allQualities', 'Все качества')}</SelectItem>
                  <SelectItem value="A">{t('leads.qualityA', 'A - Целевой')}</SelectItem>
                  <SelectItem value="B">{t('leads.qualityB', 'B - Потенциальный')}</SelectItem>
                  <SelectItem value="C">{t('leads.qualityC', 'C - Мусор')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <RoleBasedAccess roles={['director', 'admin', 'sales_manager']}>
              <div>
                <Select value={assignedFilter} onValueChange={setAssignedFilter}>
                  <SelectTrigger>
                    <User className="w-4 h-4 mr-2" />
                    <SelectValue placeholder={t('leads.assignedTo', 'Назначен')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('common.all', 'Все')}</SelectItem>
                    <SelectItem value="unassigned">{t('leads.notAssigned', 'Не назначен')}</SelectItem>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </RoleBasedAccess>

            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd.MM.yyyy") : "От"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd.MM.yyyy") : "До"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardContent className="p-0">
          {filteredAndSortedLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">{t('leads.noLeadsFound', 'Лиды не найдены')}</h3>
              <p className="text-muted-foreground text-center">
                {t('leads.tryFilters', 'Попробуйте изменить фильтры или добавить новых лидов')}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {isDirector && (
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedLeadIds.length === filteredAndSortedLeads.length && filteredAndSortedLeads.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                  )}
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      Имя
                      {sortField === 'name' && <ArrowUpDown className="h-4 w-4" />}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('company')}
                  >
                    <div className="flex items-center gap-2">
                      Компания
                      {sortField === 'company' && <ArrowUpDown className="h-4 w-4" />}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('city')}
                  >
                    <div className="flex items-center gap-2">
                      Город
                      {sortField === 'city' && <ArrowUpDown className="h-4 w-4" />}
                    </div>
                  </TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Качество</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('lead_created_date')}
                  >
                    <div className="flex items-center gap-2">
                      Дата создания лида
                      {sortField === 'lead_created_date' && <ArrowUpDown className="h-4 w-4" />}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center gap-2">
                      Создан в CRM
                      {sortField === 'created_at' && <ArrowUpDown className="h-4 w-4" />}
                    </div>
                  </TableHead>
                  <RoleBasedAccess roles={['director', 'admin', 'sales_manager']}>
                    <TableHead>Назначен</TableHead>
                  </RoleBasedAccess>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedLeads.map((lead) => (
                  <TableRow 
                    key={lead.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={(e) => {
                      // Проверяем, что клик не по dropdown меню или кнопкам или чекбоксам
                      const target = e.target as HTMLElement;
                      const isInteractiveClick = target.closest('[role="combobox"]') || 
                                              target.closest('[data-radix-collection-item]') ||
                                              target.closest('button') ||
                                              target.closest('[role="menuitem"]') ||
                                              target.closest('[role="checkbox"]');
                      
                      if (!isInteractiveClick) {
                        handleViewLead(lead);
                      }
                    }}
                  >
                    {isDirector && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox 
                          checked={selectedLeadIds.includes(lead.id)}
                          onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>{lead.company || '-'}</TableCell>
                    <TableCell>{lead.city || '-'}</TableCell>
                    <TableCell>{lead.phone || '-'}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className={`h-8 px-3 text-xs font-medium border ${getStageColor(lead.stage)} hover:opacity-80`}
                          >
                            {getStageLabel(lead.stage)}
                            <ChevronDown className="ml-1 h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="bg-background border shadow-md z-50">
                          {leadStages.map((stage) => (
                            <DropdownMenuItem 
                              key={stage.value}
                              onClick={() => handleStageChange(lead.id, stage.value)}
                              className="hover:bg-accent"
                            >
                              <Badge 
                                variant="outline" 
                                className={`mr-2 ${getStageColor(stage.value)}`}
                              >
                                {stage.label}
                              </Badge>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell>
                      {lead.lead_quality ? (
                        <Badge 
                          variant="outline" 
                          className={
                            lead.lead_quality === 'A' ? 'bg-green-100 text-green-800 border-green-200' :
                            lead.lead_quality === 'B' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            'bg-red-100 text-red-800 border-red-200'
                          }
                        >
                          {lead.lead_quality}
                        </Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        if (!lead.lead_created_date) return '-';
                        const date = new Date(lead.lead_created_date);
                        return isNaN(date.getTime()) ? '-' : format(date, 'dd.MM.yyyy HH:mm', { locale: ru });
                      })()}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const date = new Date(lead.created_at);
                        return isNaN(date.getTime()) ? '-' : format(date, 'dd.MM.yyyy', { locale: ru });
                      })()}
                    </TableCell>
                    <RoleBasedAccess roles={['director', 'admin', 'sales_manager']}>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              className="h-8 px-3 text-xs font-medium hover:bg-accent"
                            >
                              {lead.assigned_to ? getAssignedUserName(lead.assigned_to) : 'Не назначен'}
                              <ChevronDown className="ml-1 h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="bg-background border shadow-md z-50">
                            <DropdownMenuItem 
                              onClick={() => handleAssignLead(lead.id, null)}
                              className="hover:bg-accent"
                            >
                              <User className="mr-2 h-4 w-4" />
                              Не назначен
                            </DropdownMenuItem>
                             {employees.map((employee) => (
                              <DropdownMenuItem 
                                key={employee.id}
                                onClick={() => handleAssignLead(lead.id, employee.id)}
                                className="hover:bg-accent"
                              >
                                <User className="mr-2 h-4 w-4" />
                                {employee.email}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </RoleBasedAccess>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewLead(lead)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Посмотреть
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditLead(lead)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Редактировать
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCreateDeal(lead)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Создать сделку
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleArchiveLead(lead.id)}
                            className="text-destructive"
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Архивировать
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Модальные окна */}
      <UnifiedLeadModal 
        lead={selectedLead}
        isOpen={leadModalOpen}
        onClose={handleCloseLeadModal}
        onLeadUpdate={handleLeadUpdate}
      />

      <CreateDealFromLeadDialog
        open={!!createDealLead}
        onClose={() => setCreateDealLead(null)}
        lead={createDealLead}
        onSuccess={handleDealSuccess}
      />

      <AddLeadDialog
        open={addLeadModalOpen}
        onClose={() => setAddLeadModalOpen(false)}
        onSuccess={() => {
          refetch();
          toast({
            title: 'Успешно',
            description: 'Лид успешно добавлен',
          });
        }}
      />

      <DuplicateDetailModal
        duplicateGroup={selectedDuplicateGroup}
        isOpen={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
        onMergeComplete={refetch}
      />
    </div>
  );
};

export default Leads;