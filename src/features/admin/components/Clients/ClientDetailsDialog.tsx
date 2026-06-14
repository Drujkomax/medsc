import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Package, FileText, AlertCircle, Plus, Users } from 'lucide-react';
import ClientStockTab from './ClientStockTab';
import ClientLeadsTab from './ClientLeadsTab';
import ClientAlertsTab from './ClientAlertsTab';

interface ClientDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: any;
}

export default function ClientDetailsDialog({ open, onOpenChange, client }: ClientDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{client.name}</DialogTitle>
          <DialogDescription>
            {client.legal_name || 'Управление инвентарем и контактами клиники'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="stock" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="stock">
              <Package className="h-4 w-4 mr-2" />
              Инвентарь
            </TabsTrigger>
            <TabsTrigger value="leads">
              <Users className="h-4 w-4 mr-2" />
              Лиды
            </TabsTrigger>
            <TabsTrigger value="alerts">
              <AlertCircle className="h-4 w-4 mr-2" />
              Уведомления
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stock">
            <ClientStockTab clientId={client.id} />
          </TabsContent>

          <TabsContent value="leads">
            <ClientLeadsTab clientId={client.id} />
          </TabsContent>

          <TabsContent value="alerts">
            <ClientAlertsTab clientId={client.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}