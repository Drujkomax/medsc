import { useState, useEffect, useMemo } from 'react';
import { useClients, type ClientWithStockInfo, type Client } from '@/hooks/useClients';
import { useEmployeesByRole } from '@/hooks/useEmployeesByRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Building2, Plus, Search, Archive, Edit, Trash2, AlertTriangle, User } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import AddClientDialog from '@/features/admin/components/Clients/AddClientDialog';
import EditClientDialog from '@/features/admin/components/Clients/EditClientDialog';
import ClinicDetailView from '@/features/admin/components/Clients/ClinicDetailView';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const CONTRACT_STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Активный', variant: 'default' },
  onboarding: { label: 'Онбординг', variant: 'secondary' },
  suspended: { label: 'Приостановлен', variant: 'destructive' },
  expired: { label: 'Истёк', variant: 'outline' },
};

export default function Clinics() {
  const { clients, loading, addClient, updateClient, deleteClient, archiveClient, getClientsWithLowStock, refetch } = useClients();
  const { employees } = useEmployeesByRole();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [viewingClientId, setViewingClientId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [lowStockClients, setLowStockClients] = useState<ClientWithStockInfo[]>([]);

  useEffect(() => {
    loadLowStockClients();
  }, []);

  const loadLowStockClients = async () => {
    const data = await getClientsWithLowStock();
    setLowStockClients(data);
  };

  const filteredClients = useMemo(() => {
    return clients.filter(client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  const getManagerName = (managerId?: string) => {
    if (!managerId) return null;
    const manager = employees.find(e => e.id === managerId);
    return manager?.full_name || manager?.email || null;
  };

  const handleArchive = async (id: string) => {
    if (confirm('Вы уверены, что хотите архивировать эту клинику?')) {
      await archiveClient(id);
      refetch();
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmId) {
      await deleteClient(deleteConfirmId);
      setDeleteConfirmId(null);
      refetch();
    }
  };

  // Show detail view if viewing a client
  if (viewingClientId) {
    return (
      <ClinicDetailView
        clientId={viewingClientId}
        onBack={() => {
          setViewingClientId(null);
          refetch();
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Клиники
          </h1>
          <p className="text-muted-foreground mt-1">
            Управление клиентами и их инвентарем
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить клинику
        </Button>
      </div>

      {/* Low Stock Alerts */}
      {lowStockClients.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Низкие остатки у клиник:</strong>{' '}
            {lowStockClients.map((c, i) => (
              <span key={c.client_id}>
                {i > 0 && ', '}
                {c.client_name} ({c.critical_count} критических, {c.low_stock_count} низких)
              </span>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Всего клиник</CardDescription>
            <CardTitle className="text-3xl">{clients.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>С низкими остатками</CardDescription>
            <CardTitle className="text-3xl text-orange-500">{lowStockClients.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Критические остатки</CardDescription>
            <CardTitle className="text-3xl text-red-500">
              {lowStockClients.reduce((sum, c) => sum + (c.critical_count || 0), 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск клиник..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? 'Клиники не найдены' : 'Нет клиник. Добавьте первую клинику.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client: Client) => {
            const lowStockInfo = lowStockClients.find(c => c.client_id === client.id);
            const contractStatus = CONTRACT_STATUS_LABELS[client.contract_status || 'onboarding'];
            const managerName = getManagerName(client.assigned_manager);

            return (
              <Card key={client.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader onClick={() => setViewingClientId(client.id)}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">{client.name}</CardTitle>
                        {lowStockInfo && (
                          <Badge variant={lowStockInfo.critical_count! > 0 ? 'destructive' : 'secondary'} className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {lowStockInfo.critical_count! + lowStockInfo.low_stock_count!}
                          </Badge>
                        )}
                      </div>
                      {client.legal_name && (
                        <CardDescription className="mt-1">{client.legal_name}</CardDescription>
                      )}
                    </div>
                    <Badge variant={contractStatus.variant} className="shrink-0">
                      {contractStatus.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent onClick={() => setViewingClientId(client.id)}>
                  <div className="space-y-2 text-sm">
                    {client.city && (
                      <p className="text-muted-foreground">📍 {client.city}</p>
                    )}
                    {managerName && (
                      <p className="text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {managerName}
                      </p>
                    )}
                    {client.phone && (
                      <p className="text-muted-foreground">📞 {client.phone}</p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingClient(client);
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Изменить
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArchive(client.id);
                      }}
                    >
                      <Archive className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(client.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialogs */}
      <AddClientDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAdd={async (data) => {
          await addClient(data);
          refetch();
        }}
      />

      {editingClient && (
        <EditClientDialog
          open={!!editingClient}
          onOpenChange={(open) => !open && setEditingClient(null)}
          client={editingClient}
          onUpdate={async (data) => {
            await updateClient(editingClient.id, data);
            setEditingClient(null);
            refetch();
          }}
        />
      )}

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить клинику?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Все данные клиники и её инвентарь будут безвозвратно удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
