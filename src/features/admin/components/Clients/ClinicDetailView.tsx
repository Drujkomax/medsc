import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Client, useClients } from '@/hooks/useClients';
import { useEmployeesByRole } from '@/hooks/useEmployeesByRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Building2, Edit, Package, Truck, FileText, CheckSquare, Briefcase, Receipt, History, User } from 'lucide-react';
import ClientStockTab from './ClientStockTab';
import ClientAlertsTab from './ClientAlertsTab';
import { ClientInteractionLogsTab } from './ClientInteractionLogsTab';
import ClinicShipmentsTab from './ClinicShipmentsTab';
import ClinicDocumentsTab from './ClinicDocumentsTab';
import ClinicTasksTab from './ClinicTasksTab';
import ClinicDealsTab from './ClinicDealsTab';
import ClinicInvoicesTab from './ClinicInvoicesTab';
import EditClientDialog from './EditClientDialog';
import { format } from 'date-fns';

interface ClinicDetailViewProps {
  clientId: string;
  onBack: () => void;
}

const CONTRACT_STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Активный', variant: 'default' },
  onboarding: { label: 'Онбординг', variant: 'secondary' },
  suspended: { label: 'Приостановлен', variant: 'destructive' },
  expired: { label: 'Истёк', variant: 'outline' },
};

const PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
  low: { label: 'Низкий', color: 'text-muted-foreground' },
  medium: { label: 'Средний', color: 'text-yellow-600' },
  high: { label: 'Высокий', color: 'text-red-600' },
};

const COOPERATION_TYPE_LABELS: Record<string, string> = {
  equipment: 'Оборудование',
  consumables: 'Расходники',
  maintenance: 'Обслуживание',
  software: 'ПО',
};

export default function ClinicDetailView({ clientId, onBack }: ClinicDetailViewProps) {
  const { fetchClientById, updateClient } = useClients();
  const { employees } = useEmployeesByRole();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    loadClient();
  }, [clientId]);

  const loadClient = async () => {
    setLoading(true);
    const data = await fetchClientById(clientId);
    setClient(data);
    setLoading(false);
  };

  const getManagerName = (managerId?: string) => {
    if (!managerId) return null;
    const manager = employees.find(e => e.id === managerId);
    return manager?.full_name || manager?.email || 'Неизвестный';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Клиника не найдена</p>
            <Button variant="outline" onClick={onBack} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const contractStatus = CONTRACT_STATUS_LABELS[client.contract_status || 'onboarding'];
  const priority = PRIORITY_LABELS[client.priority || 'medium'];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{client.name}</h1>
              <Badge variant={contractStatus.variant}>{contractStatus.label}</Badge>
              <span className={`text-sm font-medium ${priority.color}`}>● {priority.label}</span>
            </div>
            {client.legal_name && (
              <p className="text-muted-foreground mt-1">{client.legal_name}</p>
            )}
          </div>
        </div>
        <Button onClick={() => setEditDialogOpen(true)}>
          <Edit className="h-4 w-4 mr-2" />
          Редактировать
        </Button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Город</CardDescription>
            <CardTitle className="text-lg">{client.city || '—'}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Менеджер</CardDescription>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-4 w-4" />
              {getManagerName(client.assigned_manager) || '—'}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Контракт</CardDescription>
            <CardTitle className="text-lg">
              {client.contract_start_date 
                ? format(new Date(client.contract_start_date), 'dd.MM.yyyy')
                : '—'
              }
              {client.contract_end_date && (
                <span> — {format(new Date(client.contract_end_date), 'dd.MM.yyyy')}</span>
              )}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Тип сотрудничества</CardDescription>
            <div className="flex flex-wrap gap-1 mt-1">
              {(client.cooperation_type || []).map(type => (
                <Badge key={type} variant="outline" className="text-xs">
                  {COOPERATION_TYPE_LABELS[type] || type}
                </Badge>
              ))}
              {(!client.cooperation_type || client.cooperation_type.length === 0) && (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="profile">
            <Building2 className="h-4 w-4 mr-2 hidden sm:inline" />
            Профиль
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <Package className="h-4 w-4 mr-2 hidden sm:inline" />
            Инвентарь
          </TabsTrigger>
          <TabsTrigger value="shipments">
            <Truck className="h-4 w-4 mr-2 hidden sm:inline" />
            Отгрузки
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="h-4 w-4 mr-2 hidden sm:inline" />
            Документы
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <CheckSquare className="h-4 w-4 mr-2 hidden sm:inline" />
            Задачи
          </TabsTrigger>
          <TabsTrigger value="deals">
            <Briefcase className="h-4 w-4 mr-2 hidden sm:inline" />
            Сделки
          </TabsTrigger>
          <TabsTrigger value="invoices">
            <Receipt className="h-4 w-4 mr-2 hidden sm:inline" />
            Счета
          </TabsTrigger>
          <TabsTrigger value="activity">
            <History className="h-4 w-4 mr-2 hidden sm:inline" />
            Активность
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Информация о клинике</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Контактное лицо</p>
                  <p className="font-medium">{client.contact_person || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Телефон</p>
                  <p className="font-medium">{client.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{client.email || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ИНН</p>
                  <p className="font-medium">{client.inn || '—'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Адрес</p>
                  <p className="font-medium">{client.address || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Страна</p>
                  <p className="font-medium">{client.country || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Заметки</p>
                  <p className="font-medium whitespace-pre-wrap">{client.notes || '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="mt-6">
          <ClientStockTab clientId={clientId} />
        </TabsContent>

        <TabsContent value="shipments" className="mt-6">
          <ClinicShipmentsTab clientId={clientId} />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <ClinicDocumentsTab clientId={clientId} />
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <ClinicTasksTab clientId={clientId} />
        </TabsContent>

        <TabsContent value="deals" className="mt-6">
          <ClinicDealsTab clientId={clientId} />
        </TabsContent>

        <TabsContent value="invoices" className="mt-6">
          <ClinicInvoicesTab clientId={clientId} />
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <ClientInteractionLogsTab clientId={clientId} />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <EditClientDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        client={client}
        onUpdate={async (data) => {
          await updateClient(client.id, data);
          loadClient();
        }}
      />
    </div>
  );
}
