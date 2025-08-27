import { useState } from 'react';
import ClientList from '../components/ClientList';
import AddClientDialog from '../components/AddClientDialog';
import { Client } from '@/types/crm';

const ClientsPage = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

  const handleAddClient = () => {
    setShowAddDialog(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setShowAddDialog(true);
  };

  const handleViewClient = (client: Client) => {
    setViewingClient(client);
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setEditingClient(null);
    setViewingClient(null);
  };

  return (
    <div className="space-y-6">
      <ClientList 
        onAddClient={handleAddClient}
        onEditClient={handleEditClient}
        onViewClient={handleViewClient}
      />
      
      {showAddDialog && (
        <AddClientDialog
          client={editingClient || undefined}
          open={showAddDialog}
          onOpenChange={handleCloseDialog}
        />
      )}
    </div>
  );
};

export default ClientsPage;