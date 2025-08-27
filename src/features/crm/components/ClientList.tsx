import { useState } from 'react';
import { useClients } from '@/hooks/useClients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { Search, Plus, User, Mail, Phone, Building, Calendar, Eye, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ClientListProps {
  onAddClient: () => void;
  onEditClient: (client: any) => void;
  onViewClient: (client: any) => void;
}

const ClientList = ({ onAddClient, onEditClient, onViewClient }: ClientListProps) => {
  const { t } = useTranslation();
  const { clients, loading, deleteClient } = useClients();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteClient = async (id: string, name: string) => {
    if (confirm(t('common.confirmDelete', { name }))) {
      try {
        await deleteClient(id);
        toast.success(t('clients.deleted'));
      } catch (error) {
        toast.error(t('common.error'));
      }
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
          <h1 className="text-2xl font-bold text-foreground">{t('clients.title')}</h1>
          <p className="text-muted-foreground">{t('clients.subtitle')}</p>
        </div>
        <Button onClick={onAddClient} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          {t('clients.addClient')}
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('clients.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <User className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {t('clients.total')}
                </p>
                <p className="text-2xl font-bold">{clients.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Building className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {t('clients.withCompany')}
                </p>
                <p className="text-2xl font-bold">
                  {clients.filter(c => c.company).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {t('clients.thisMonth')}
                </p>
                <p className="text-2xl font-bold">
                  {clients.filter(c => {
                    const created = new Date(c.created_at);
                    const now = new Date();
                    return created.getMonth() === now.getMonth() && 
                           created.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clients List */}
      {filteredClients.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <User className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-foreground">
                {t('clients.notFound')}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('clients.notFoundDescription')}
              </p>
              <div className="mt-6">
                <Button onClick={onAddClient}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('clients.addClient')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="truncate">{client.name}</span>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onViewClient(client)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onEditClient(client)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteClient(client.id, client.name)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {client.company && (
                  <div className="flex items-center text-sm">
                    <Building className="w-4 h-4 text-muted-foreground mr-2" />
                    <span className="truncate">{client.company}</span>
                  </div>
                )}
                
                {client.email && (
                  <div className="flex items-center text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground mr-2" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                
                {client.phone && (
                  <div className="flex items-center text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground mr-2" />
                    <span>{client.phone}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-muted-foreground">
                    {t('clients.createdAt')}: {format(new Date(client.created_at), 'dd.MM.yyyy')}
                  </div>
                  {client.last_contact && (
                    <Badge variant="secondary" className="text-xs">
                      {t('clients.lastContact')}: {format(new Date(client.last_contact), 'dd.MM')}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientList;