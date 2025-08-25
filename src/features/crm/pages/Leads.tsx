import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLeads, Lead } from '@/hooks/useLeads';
import { useDuplicateDetection } from '@/hooks/useDuplicateDetection';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useAuth } from '@/hooks/useAuth';
import { useLeadMerge } from '@/hooks/useLeadMerge';
import { supabase } from '@/integrations/supabase/client';
import RoleBasedAccess from '@/components/auth/RoleBasedAccess';
import { LeadHybridCard } from '../components/LeadHybridCard';
import { DuplicateAlert } from '../components/DuplicateAlert';
import { 
  Search, 
  Edit,
  Archive,
  Eye,
  User,
  Phone,
  Building,
  Calendar,
  Filter,
  AlertTriangle,
  LayoutGrid
} from 'lucide-react';

const Leads = () => {
  // Force cache refresh
  const { toast } = useToast();
  const { leads, loading, deleteLead, archiveLead, changeLeadStage, refetch } = useLeads();
  const { duplicateGroups, hasDuplicates } = useDuplicateDetection(leads);
  const { hasPermission, role } = useUserPermissions();
  const { user } = useAuth();
  const { mergeLeads, loading: merging } = useLeadMerge();
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [employees, setEmployees] = useState<Array<{id: string, email: string, role: string}>>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const leadStages = [
    { value: 'new', label: 'Новые', count: 0, color: 'bg-blue-500' },
    { value: 'contacted', label: 'Связались', count: 0, color: 'bg-yellow-500' },
    { value: 'qualified', label: 'Квалифицированы', count: 0, color: 'bg-purple-500' },
    { value: 'proposal', label: 'Предложение', count: 0, color: 'bg-orange-500' },
    { value: 'negotiation', label: 'Переговоры', count: 0, color: 'bg-indigo-500' },
    { value: 'closed', label: 'Закрыты', count: 0, color: 'bg-green-500' },
    { value: 'lost', label: 'Потеряны', count: 0, color: 'bg-red-500' },
  ];

  useEffect(() => {
    if (hasPermission('assign_leads')) {
      fetchEmployees();
    }
  }, [hasPermission]);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('role', 'salesperson');

      if (error) throw error;
      
      const employeesData = data?.map(item => ({
        id: item.user_id,
        email: `user-${item.user_id.slice(0, 8)}@company.com`,
        role: item.role
      })) || [];
      
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const filteredLeads = leads.filter(lead => {
    // Filter out archived leads
    if (lead.archived) return false;
    
    // Продавцы видят только назначенных им лидов
    if (role === 'salesperson' && lead.assigned_to !== user?.id) {
      return false;
    }

    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.includes(searchTerm) ||
      lead.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStage = stageFilter === 'all' || lead.stage === stageFilter;
    
    return matchesSearch && matchesStage;
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

  const handleMergeDuplicates = async (duplicateGroup: any) => {
    await mergeLeads(duplicateGroup, refetch);
  };

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
    // TODO: Open view modal
  };

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead);
    // TODO: Open edit modal
  };

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
          <h2 className="text-3xl font-bold">Лиды</h2>
          <p className="text-muted-foreground">Управление заявками клиентов</p>
        </div>
      </div>

      {/* Duplicate Alerts */}
      {hasDuplicates && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-semibold">Обнаружены дубликаты</h3>
          </div>
          {duplicateGroups.slice(0, 3).map((group, index) => (
            <DuplicateAlert 
              key={index} 
              duplicateGroup={group}
              onMergeDuplicates={handleMergeDuplicates}
            />
          ))}
          {duplicateGroups.length > 3 && (
            <p className="text-sm text-muted-foreground">
              И еще {duplicateGroups.length - 3} групп дубликатов...
            </p>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 md:gap-4">
        {leadStages.map((stage) => (
          <Card key={stage.value}>
            <CardContent className="p-2 md:p-4">
              <div className="flex items-center space-x-1 md:space-x-2">
                <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${stage.color}`} />
                <div>
                  <p className="text-xs md:text-sm font-medium leading-tight">{stage.label}</p>
                  <p className="text-lg md:text-2xl font-bold">{leadCounts[stage.value] || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Поиск..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full">
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Фильтр по статусу" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  {leadStages.map((stage) => (
                    <SelectItem key={stage.value} value={stage.value}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Grid */}
      <div className="grid gap-4 md:gap-6">
        {filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Лиды не найдены</h3>
              <p className="text-muted-foreground text-center">
                Попробуйте изменить фильтры или добавить новых лидов
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredLeads.map((lead) => (
            <LeadHybridCard
              key={lead.id}
              lead={lead}
              allLeads={leads}
              onView={() => console.log('View lead:', lead)}
              onEdit={() => console.log('Edit lead:', lead)}
              onArchive={handleArchiveLead}
              onStageChange={handleStageChange}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Leads;