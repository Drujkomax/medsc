import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLeads } from '@/hooks/useLeads';
import { 
  Search, 
  Edit,
  Trash2,
  Eye,
  User,
  Phone,
  Mail,
  Building,
  Calendar,
  TrendingUp,
  Filter
} from 'lucide-react';

const Leads = () => {
  const { toast } = useToast();
  const { leads, loading, deleteLead, changeLeadStage } = useLeads();
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');

  const stages = {
    new: { label: 'Новый', color: 'bg-blue-500' },
    contacted: { label: 'Связались', color: 'bg-yellow-500' },
    qualified: { label: 'Квалифицирован', color: 'bg-purple-500' },
    proposal: { label: 'Предложение', color: 'bg-orange-500' },
    negotiation: { label: 'Переговоры', color: 'bg-indigo-500' },
    closed: { label: 'Закрыт', color: 'bg-green-500' },
    lost: { label: 'Потерян', color: 'bg-red-500' }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.includes(searchTerm) ||
      lead.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStage = stageFilter === 'all' || lead.stage === stageFilter;
    
    return matchesSearch && matchesStage;
  });

  const handleDeleteLead = async (id: string) => {
    try {
      await deleteLead(id);
      toast({
        title: 'Успешно',
        description: 'Лид успешно удален',
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Ошибка при удалении лида',
        variant: 'destructive',
      });
    }
  };

  const handleStageChange = async (leadId: string, newStage: string) => {
    try {
      await changeLeadStage(leadId, newStage);
      toast({
        title: 'Успешно',
        description: 'Статус лида обновлен',
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Ошибка при обновлении статуса',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Загрузка...</p>
      </div>
    );
  }

  const leadCounts = Object.keys(stages).reduce((acc, stage) => {
    acc[stage] = leads.filter(lead => lead.stage === stage).length;
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {Object.entries(stages).map(([stage, config]) => (
          <Card key={stage}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${config.color}`} />
                <div>
                  <p className="text-sm font-medium">{config.label}</p>
                  <p className="text-2xl font-bold">{leadCounts[stage] || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Поиск по имени, email, телефону или компании..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Фильтр по статусу" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  {Object.entries(stages).map(([stage, config]) => (
                    <SelectItem key={stage} value={stage}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLeads.map((lead) => {
          const stageConfig = stages[lead.stage as keyof typeof stages] || stages.new;
          
          return (
            <Card key={lead.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{lead.name}</CardTitle>
                      {lead.company && (
                        <p className="text-sm text-muted-foreground flex items-center">
                          <Building className="w-3 h-3 mr-1" />
                          {lead.company}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge 
                    className={`${stageConfig.color} text-white`}
                  >
                    {stageConfig.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lead.email && (
                    <div className="flex items-center text-sm">
                      <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span>{lead.email}</span>
                    </div>
                  )}
                  {lead.phone && (
                    <div className="flex items-center text-sm">
                      <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span>{lead.phone}</span>
                    </div>
                  )}
                  {lead.source && (
                    <div className="flex items-center text-sm">
                      <TrendingUp className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span>Источник: {lead.source === 'website_form' ? 'Форма сайта' : lead.source}</span>
                    </div>
                  )}
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Создан: {new Date(lead.created_at).toLocaleDateString('ru-RU')}</span>
                  </div>
                  
                  {lead.notes && (
                    <div className="text-sm bg-muted p-2 rounded">
                      <strong>Заметки:</strong> {lead.notes}
                    </div>
                  )}

                  {/* Stage Change */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Изменить статус:</Label>
                    <Select 
                      value={lead.stage} 
                      onValueChange={(value) => handleStageChange(lead.id, value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(stages).map(([stage, config]) => (
                          <SelectItem key={stage} value={stage}>
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${config.color}`} />
                              <span>{config.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="w-4 h-4 mr-1" />
                      Просмотр
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="w-4 h-4 mr-1" />
                      Редактировать
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDeleteLead(lead.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredLeads.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              {searchTerm || stageFilter !== 'all' 
                ? 'Лиды не найдены по заданным критериям' 
                : 'Нет лидов. Лиды будут появляться здесь после заполнения форм на сайте.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Leads;