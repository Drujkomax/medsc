import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Edit, Plus, Trash2, Eye } from 'lucide-react';
import { useServices } from '@/hooks/useServices';
import { AddServiceDialog } from '@/features/admin/components/Services/AddServiceDialog';
import { EditServiceDialog } from '@/features/admin/components/Services/EditServiceDialog';
import { useToast } from '@/hooks/use-toast';

const AdminServices = () => {
  const { t, i18n } = useTranslation();
  const { services, loading, deleteService } = useServices();
  const { toast } = useToast();
  const [selectedService, setSelectedService] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleDeleteService = async (serviceId: string) => {
    try {
      await deleteService(serviceId);
      toast({
        title: t('common.success'),
        description: t('services.serviceDeleted'),
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: 'Ошибка при удалении услуги',
      });
    }
  };

  const getLocalizedText = (jsonText: any) => {
    if (typeof jsonText === 'string') return jsonText;
    if (typeof jsonText === 'object' && jsonText !== null) {
      return jsonText[i18n.language] || jsonText['ru'] || jsonText['en'] || '';
    }
    return '';
  };

  if (loading) {
    return <div className="flex justify-center p-8">{t('common.loading')}</div>;
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('services.title')}</h1>
          <p className="text-muted-foreground">
            {t('services.subtitle')}
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {t('services.addService')}
        </Button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('services.totalServices')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{services?.length || 0}</div>
            <p className="text-xs text-muted-foreground">{t('services.activeServices')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('services.popularCategory', 'Самая популярная категория')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{t('services.consultations', 'Консультации')}</div>
            <p className="text-xs text-muted-foreground">{t('services.mostRequested', 'Наиболее запрашиваемая')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('services.avgCost', 'Средняя стоимость')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,200,000</div>
            <p className="text-xs text-muted-foreground">{t('services.perService', 'сум за услугу')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Таблица услуг */}
      <Card>
        <CardHeader>
          <CardTitle>{t('services.servicesList', 'Список услуг')}</CardTitle>
        </CardHeader>
        <CardContent>
          {!services || services.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold">{t('services.noServices')}</h3>
              <p className="text-muted-foreground">{t('services.noServicesDescription')}</p>
              <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {t('services.addService')}
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('services.serviceTitle')}</TableHead>
                  <TableHead>{t('services.serviceCategory')}</TableHead>
                  <TableHead>{t('services.servicePrice')}</TableHead>
                  <TableHead>{t('services.serviceStatus')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{getLocalizedText(service.title)}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {getLocalizedText(service.description)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {t(`services.categories.${service.category}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {service.price ? `${service.price} ${service.currency}` : t('common.onRequest', 'По запросу')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={service.status === 'active' ? 'default' : 'secondary'}>
                        {service.status === 'active' ? t('services.active') : t('services.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedService(service);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('services.deleteService')}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('services.deleteConfirm')}
                                <br />
                                {t('services.deleteConfirmDescription')}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteService(service.id)}>
                                {t('common.delete')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Диалоги */}
      <AddServiceDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen}
      />
      {selectedService && (
        <EditServiceDialog 
          open={isEditDialogOpen} 
          onOpenChange={setIsEditDialogOpen}
          service={selectedService}
        />
      )}
    </div>
  );
};

export default AdminServices;