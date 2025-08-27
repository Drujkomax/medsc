import { useState } from 'react';
import DealList from '../components/DealList';
import { Deal } from '@/types/crm';

const DealsPage = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [viewingDeal, setViewingDeal] = useState<Deal | null>(null);

  const handleAddDeal = () => {
    setShowAddDialog(true);
  };

  const handleEditDeal = (deal: Deal) => {
    setEditingDeal(deal);
    setShowAddDialog(true);
  };

  const handleViewDeal = (deal: Deal) => {
    setViewingDeal(deal);
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setEditingDeal(null);
    setViewingDeal(null);
  };

  return (
    <div className="space-y-6">
      <DealList 
        onAddDeal={handleAddDeal}
        onEditDeal={handleEditDeal}
        onViewDeal={handleViewDeal}
      />
      
      {/* TODO: Add Deal dialogs */}
    </div>
  );
};

export default DealsPage;