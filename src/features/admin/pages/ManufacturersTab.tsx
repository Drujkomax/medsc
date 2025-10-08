import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/common/ImageUpload';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useManufacturers, Manufacturer } from '@/hooks/useManufacturers';
import { countries } from '@/utils/countries';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ManufacturersTab() {
  const { toast } = useToast();
  const { manufacturers, loading, addManufacturer, updateManufacturer, deleteManufacturer } = useManufacturers();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedManufacturer, setSelectedManufacturer] = useState<Manufacturer | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    countryCode: '',
    logoUrl: '',
    slug: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      countryCode: '',
      logoUrl: '',
      slug: ''
    });
  };

  const handleAdd = async () => {
    try {
      if (!formData.name || !formData.countryCode || !formData.slug) {
        toast({
          title: 'Ошибка',
          description: 'Пожалуйста, заполните все обязательные поля',
          variant: 'destructive',
        });
        return;
      }

      await addManufacturer({
        name: formData.name,
        country_code: formData.countryCode,
        logo_url: formData.logoUrl || undefined,
        slug: formData.slug
      });

      toast({
        title: 'Успешно',
        description: 'Производитель добавлен',
      });

      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось добавить производителя',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = async () => {
    if (!selectedManufacturer) return;

    try {
      if (!formData.name || !formData.countryCode || !formData.slug) {
        toast({
          title: 'Ошибка',
          description: 'Пожалуйста, заполните все обязательные поля',
          variant: 'destructive',
        });
        return;
      }

      await updateManufacturer(selectedManufacturer.id, {
        name: formData.name,
        country_code: formData.countryCode,
        logo_url: formData.logoUrl || undefined,
        slug: formData.slug
      });

      toast({
        title: 'Успешно',
        description: 'Производитель обновлен',
      });

      setIsEditDialogOpen(false);
      setSelectedManufacturer(null);
      resetForm();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось обновить производителя',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedManufacturer) return;

    try {
      await deleteManufacturer(selectedManufacturer.id);
      toast({
        title: 'Успешно',
        description: 'Производитель удален',
      });
      setIsDeleteDialogOpen(false);
      setSelectedManufacturer(null);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось удалить производителя',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (manufacturer: Manufacturer) => {
    setSelectedManufacturer(manufacturer);
    setFormData({
      name: manufacturer.name,
      countryCode: manufacturer.country_code,
      logoUrl: manufacturer.logo_url || '',
      slug: manufacturer.slug
    });
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить производителя
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Добавить производителя</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Название производителя *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Название производителя"
                />
              </div>

              <div>
                <Label htmlFor="countryCode">Страна производителя *</Label>
                <Select value={formData.countryCode} onValueChange={(value) => setFormData({ ...formData, countryCode: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите страну" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {`${country.flag} ${country.name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="slug">Строчное название (slug) *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  placeholder="manufacturer-name"
                />
              </div>

              <ImageUpload
                label="Логотип производителя"
                value={formData.logoUrl}
                onChange={(url) => setFormData({ ...formData, logoUrl: url || '' })}
                imageType="cover"
              />

              <Button onClick={handleAdd} className="w-full">
                Добавить
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список производителей</CardTitle>
        </CardHeader>
        <CardContent>
          {manufacturers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Производители не найдены
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Логотип</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead>Страна</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {manufacturers.map((manufacturer) => {
                  const country = countries.find(c => c.code === manufacturer.country_code);
                  return (
                    <TableRow key={manufacturer.id}>
                      <TableCell>
                        {manufacturer.logo_url ? (
                          <img src={manufacturer.logo_url} alt={manufacturer.name} className="h-10 w-10 object-contain" />
                        ) : (
                          <div className="h-10 w-10 bg-muted rounded flex items-center justify-center text-xs">
                            No logo
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{manufacturer.name}</TableCell>
                      <TableCell>
                        {country ? `${country.flag} ${country.name}` : manufacturer.country_code}
                      </TableCell>
                      <TableCell><code className="text-xs">{manufacturer.slug}</code></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(manufacturer)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedManufacturer(manufacturer);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактировать производителя</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editName">Название производителя *</Label>
              <Input
                id="editName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="editCountryCode">Страна производителя *</Label>
              <Select value={formData.countryCode} onValueChange={(value) => setFormData({ ...formData, countryCode: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {`${country.flag} ${country.name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="editSlug">Строчное название (slug) *</Label>
              <Input
                id="editSlug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
              />
            </div>

            <ImageUpload
              label="Логотип производителя"
              value={formData.logoUrl}
              onChange={(url) => setFormData({ ...formData, logoUrl: url || '' })}
              imageType="cover"
            />

            <Button onClick={handleEdit} className="w-full">
              Сохранить
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Производитель будет удален навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
