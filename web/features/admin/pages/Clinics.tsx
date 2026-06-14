'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useClients, type ClientWithStockInfo, type Client } from '@/hooks/useClients';
import { useEmployeesByRole } from '@/hooks/useEmployeesByRole';
import { logClinicActivity } from '@/hooks/useClinicActivityLogs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Building2, Plus, Search, Archive, Edit, Trash2, AlertTriangle, User, Package, FileText, BarChart3 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import AddClientDialog from '@/features/admin/components/Clients/AddClientDialog';
import EditClientDialog from '@/features/admin/components/Clients/EditClientDialog';
import ClinicDetailView from '@/features/admin/components/Clients/ClinicDetailView';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function Clinics() {
  const { t } = useTranslation();
  const { clients, loading, addClient, updateClient, deleteClient, archiveClient, getClientsWithLowStock, refetch } = useClients();
  const { employees } = useEmployeesByRole();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [viewingClientId, setViewingClientId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [lowStockClients, setLowStockClients] = useState<ClientWithStockInfo[]>([]);

  const CONTRACT_STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    active: { label: t('clinics.status.active', 'Активный'), variant: 'default' },
    onboarding: { label: t('clinics.status.onboarding', 'Онбординг'), variant: 'secondary' },
    suspended: { label: t('clinics.status.suspended', 'Приостановлен'), variant: 'destructive' },
    expired: { label: t('clinics.status.expired', 'Истёк'), variant: 'outline' },
  };

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
    const clientToArchive = clients.find(c => c.id === id);
    if (confirm(t('clinics.confirmArchive', 'Вы уверены, что хотите архивировать эту клинику?'))) {
      await archiveClient(id);
      if (clientToArchive) {
        await logClinicActivity(id, 'archived', `Клиника "${clientToArchive.name}" архивирована`);
      }
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
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            {t('clinics.title', 'Клиники — Управление клиентами')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('clinics.subtitle', 'Управление клиентами и их инвентарем медицинского оборудования')}
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('clinics.addClinic', 'Добавить клинику')}
        </Button>
      </header>

      {/* Internal Navigation Links */}
      <nav className="flex flex-wrap gap-2" aria-label={t('clinics.relatedSections', 'Связанные разделы')}>
        <Link href="/admin/warehouse" className="text-sm text-primary hover:underline flex items-center gap-1">
          <Package className="h-4 w-4" />
          {t('admin.warehouse', 'Склад')}
        </Link>
        <Link href="/admin/leads" className="text-sm text-primary hover:underline flex items-center gap-1">
          <FileText className="h-4 w-4" />
          {t('admin.leads', 'Лиды')}
        </Link>
      </nav>

      {/* Low Stock Alerts */}
      {lowStockClients.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{t('clinics.lowStockAlert', 'Низкие остатки у клиник:')}</strong>{' '}
            {lowStockClients.map((c, i) => (
              <span key={c.client_id}>
                {i > 0 && ', '}
                {c.client_name} ({c.critical_count} {t('clinics.critical', 'критических')}, {c.low_stock_count} {t('clinics.low', 'низких')})
              </span>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Section */}
      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="text-xl font-semibold mb-4">{t('clinics.stats.title', 'Статистика клиник')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>{t('clinics.stats.total', 'Всего клиник')}</CardDescription>
              <CardTitle className="text-3xl">{clients.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>{t('clinics.stats.lowStock', 'С низкими остатками')}</CardDescription>
              <CardTitle className="text-3xl text-orange-500">{lowStockClients.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>{t('clinics.stats.critical', 'Критические остатки')}</CardDescription>
              <CardTitle className="text-3xl text-red-500">
                {lowStockClients.reduce((sum, c) => sum + (c.critical_count || 0), 0)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Search Section */}
      <section aria-labelledby="search-heading">
        <h2 id="search-heading" className="sr-only">{t('clinics.search', 'Поиск клиник')}</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('clinics.searchPlaceholder', 'Поиск клиник...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </section>

      {/* Clients Grid Section */}
      <section aria-labelledby="clients-heading">
        <h2 id="clients-heading" className="text-xl font-semibold mb-4">{t('clinics.list', 'Список клиник')}</h2>
        {filteredClients.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? t('clinics.notFound', 'Клиники не найдены') : t('clinics.noClients', 'Нет клиник. Добавьте первую клинику.')}
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
                        setEditingClient({ ...client });
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      {t('common.edit', 'Изменить')}
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
      </section>

      {/* Dialogs */}
      <AddClientDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAdd={async (data) => {
          const newClient = await addClient(data);
          if (newClient?.id) {
            await logClinicActivity(newClient.id, 'created', `Клиника "${data.name}" создана`);
          }
          refetch();
        }}
      />

      {editingClient && (
        <EditClientDialog
          open={!!editingClient}
          onOpenChange={(open) => !open && setEditingClient(null)}
          client={editingClient}
          onUpdate={async (data) => {
            const changedFields: Record<string, { old: any; new: any }> = {};
            const fieldKeys = ['name', 'legal_name', 'contact_person', 'email', 'phone', 'address', 'city', 'country', 'inn', 'notes', 'contract_status', 'contract_start_date', 'contract_end_date', 'cooperation_type', 'assigned_manager', 'priority'];
            
            fieldKeys.forEach(key => {
              const oldVal = (editingClient as any)[key];
              const newVal = (data as any)[key];
              if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                changedFields[key] = { old: oldVal, new: newVal };
              }
            });
            
            await updateClient(editingClient.id, data);
            
            if (Object.keys(changedFields).length > 0) {
              await logClinicActivity(
                editingClient.id,
                'updated',
                `Информация о клинике "${editingClient.name}" обновлена`,
                changedFields
              );
            }
            
            setEditingClient(null);
            refetch();
          }}
        />
      )}

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('clinics.deleteTitle', 'Удалить клинику?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('clinics.deleteDescription', 'Это действие нельзя отменить. Все данные клиники и её инвентарь будут безвозвратно удалены.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Отмена')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {t('common.delete', 'Удалить')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}