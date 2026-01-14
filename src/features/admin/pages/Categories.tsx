import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Loader2, Package, AlertTriangle, Building2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCategories } from '@/hooks/useCategories';
import { useToast } from '@/hooks/use-toast';
import ManufacturersTab from './ManufacturersTab';

const Categories = () => {
  const { t } = useTranslation();
  const { categories, loading, addCategory, deleteCategory, updateCategory } = useCategories();
  const { toast } = useToast();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    value: '',
    name: { ru: '', en: '', uz: '' }
  });

  const resetForm = () => {
    setFormData({
      value: '',
      name: { ru: '', en: '', uz: '' }
    });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.value.trim() || !formData.name.ru.trim()) {
      toast({
        variant: 'destructive',
        title: t('common.validationError', 'Ошибка валидации'),
        description: t('categories.fillRequiredFields', 'Заполните обязательные поля: значение и название на русском')
      });
      return;
    }

    setSubmitting(true);
    try {
      await addCategory(formData);
      toast({
        title: t('common.success', 'Успешно!'),
        description: t('categories.categoryAdded', 'Категория добавлена')
      });
      resetForm();
      setShowAddDialog(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('common.error', 'Ошибка'),
        description: error instanceof Error ? error.message : t('categories.failedToAdd', 'Не удалось добавить категорию')
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingCategory || !formData.value.trim() || !formData.name.ru.trim()) {
      toast({
        variant: 'destructive',
        title: t('common.validationError', 'Ошибка валидации'),
        description: t('categories.fillRequiredFields', 'Заполните обязательные поля')
      });
      return;
    }

    setSubmitting(true);
    try {
      await updateCategory(editingCategory.id, formData);
      toast({
        title: t('common.success', 'Успешно!'),
        description: t('categories.categoryUpdated', 'Категория обновлена')
      });
      resetForm();
      setShowEditDialog(false);
      setEditingCategory(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('common.error', 'Ошибка'),
        description: error instanceof Error ? error.message : t('categories.failedToUpdate', 'Не удалось обновить категорию')
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    try {
      await deleteCategory(categoryId);
      toast({
        title: t('common.success', 'Успешно!'),
        description: t('categories.categoryDeleted', 'Категория удалена')
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('common.error', 'Ошибка'),
        description: error instanceof Error ? error.message : t('categories.failedToDelete', 'Не удалось удалить категорию')
      });
    }
  };

  const openEditDialog = (category: any) => {
    setEditingCategory(category);
    setFormData({
      value: category.value,
      name: category.name
    });
    setShowEditDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>{t('categories.loading', 'Загрузка категорий...')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('categories.title', 'Категории и производители')}</h1>
        <p className="text-muted-foreground">{t('categories.description', 'Управление категориями товаров и производителями')}</p>
      </div>

      <Tabs defaultValue="categories" className="space-y-6">
        <TabsList>
          <TabsTrigger value="categories">
            <Package className="w-4 h-4 mr-2" />
            {t('categories.productCategories', 'Категории товаров')}
          </TabsTrigger>
          <TabsTrigger value="manufacturers">
            <Building2 className="w-4 h-4 mr-2" />
            {t('categories.manufacturers', 'Производители')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-6">
          <div className="flex items-center justify-between">
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('categories.addCategory', 'Добавить категорию')}
                </Button>
              </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('categories.addNewCategory', 'Добавить новую категорию')}</DialogTitle>
              <DialogDescription>
                {t('categories.addCategoryDescription', 'Создайте новую категорию для товаров. Заполните название на всех языках.')}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <Label htmlFor="value">{t('categories.valueLabel', 'Значение (латиницей)')} *</Label>
                <Input
                  id="value"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  placeholder={t('categories.valuePlaceholder', 'например: cardiology')}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="name-ru">{t('categories.nameRu', 'Название (RU)')} *</Label>
                <Input
                  id="name-ru"
                  value={formData.name.ru}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    name: { ...prev.name, ru: e.target.value }
                  }))}
                  placeholder={t('categories.nameRuPlaceholder', 'Кардиология')}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="name-en">{t('categories.nameEn', 'Название (EN)')}</Label>
                <Input
                  id="name-en"
                  value={formData.name.en}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    name: { ...prev.name, en: e.target.value }
                  }))}
                  placeholder={t('categories.nameEnPlaceholder', 'Cardiology')}
                />
              </div>
              
              <div>
                <Label htmlFor="name-uz">{t('categories.nameUz', 'Название (UZ)')}</Label>
                <Input
                  id="name-uz"
                  value={formData.name.uz}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    name: { ...prev.name, uz: e.target.value }
                  }))}
                  placeholder={t('categories.nameUzPlaceholder', 'Kardiologiya')}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  {t('common.cancel', 'Отмена')}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {t('common.add', 'Добавить')}
                </Button>
              </DialogFooter>
            </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Categories Table */}
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            {t('categories.productCategories', 'Категории товаров')} ({categories.length})
          </CardTitle>
          <CardDescription>
            {t('categories.manageCategories', 'Управляйте категориями для классификации товаров в каталоге')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">{t('categories.noCategories', 'Категорий пока нет')}</p>
              <p className="text-sm text-muted-foreground">{t('categories.addFirstCategory', 'Добавьте первую категорию для начала работы')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('categories.value', 'Значение')}</TableHead>
                  <TableHead>{t('categories.nameRu', 'Название (RU)')}</TableHead>
                  <TableHead>{t('categories.nameEn', 'Название (EN)')}</TableHead>
                  <TableHead>{t('categories.nameUz', 'Название (UZ)')}</TableHead>
                  <TableHead>{t('categories.created', 'Создано')}</TableHead>
                  <TableHead className="text-right">{t('common.actions', 'Действия')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-mono text-sm">{category.value}</TableCell>
                    <TableCell className="font-medium">{category.name.ru}</TableCell>
                    <TableCell>{category.name.en || '—'}</TableCell>
                    <TableCell>{category.name.uz || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(category.created_at).toLocaleDateString('ru-RU')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(category)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-destructive" />
                                {t('categories.deleteCategory', 'Удалить категорию?')}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('categories.deleteConfirmPart1', 'Вы действительно хотите удалить категорию')} <strong>"{category.name.ru}"</strong>?
                                <br />
                                {t('categories.deleteConfirmPart2', 'Это действие нельзя отменить. Категория будет удалена только если она не используется в товарах.')}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('common.cancel', 'Отмена')}</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(category.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {t('common.delete', 'Удалить')}
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

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('categories.editCategory', 'Редактировать категорию')}</DialogTitle>
            <DialogDescription>
              {t('categories.editCategoryDescription', 'Измените информацию о категории. Обязательные поля отмечены звездочкой.')}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <Label htmlFor="edit-value">{t('categories.valueLabel', 'Значение (латиницей)')} *</Label>
              <Input
                id="edit-value"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                placeholder={t('categories.valuePlaceholder', 'например: cardiology')}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="edit-name-ru">{t('categories.nameRu', 'Название (RU)')} *</Label>
              <Input
                id="edit-name-ru"
                value={formData.name.ru}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  name: { ...prev.name, ru: e.target.value }
                }))}
                placeholder={t('categories.nameRuPlaceholder', 'Кардиология')}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="edit-name-en">{t('categories.nameEn', 'Название (EN)')}</Label>
              <Input
                id="edit-name-en"
                value={formData.name.en}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  name: { ...prev.name, en: e.target.value }
                }))}
                placeholder={t('categories.nameEnPlaceholder', 'Cardiology')}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-name-uz">{t('categories.nameUz', 'Название (UZ)')}</Label>
              <Input
                id="edit-name-uz"
                value={formData.name.uz}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  name: { ...prev.name, uz: e.target.value }
                }))}
                placeholder={t('categories.nameUzPlaceholder', 'Kardiologiya')}
              />
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowEditDialog(false);
                  setEditingCategory(null);
                  resetForm();
                }}
              >
                {t('common.cancel', 'Отмена')}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t('common.save', 'Сохранить')}
              </Button>
            </DialogFooter>
          </form>
          </DialogContent>
        </Dialog>
        </TabsContent>

        <TabsContent value="manufacturers">
          <ManufacturersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Categories;