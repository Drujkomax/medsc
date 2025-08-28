import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCategories } from '@/hooks/useCategories';

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryAdded: (categoryValue: string) => void;
}

export const CategoryDialog = ({ open, onOpenChange, onCategoryAdded }: CategoryDialogProps) => {
  const { addCategory } = useCategories();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: { ru: '', en: '', uz: '' },
    value: ''
  });

  const generateValue = (ruName: string) => {
    return ruName
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '')
      .substring(0, 30);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.ru.trim()) {
      toast({
        variant: 'destructive',
        title: 'Ошибка валидации',
        description: 'Название на русском языке обязательно'
      });
      return;
    }

    setLoading(true);
    
    try {
      const categoryValue = formData.value || generateValue(formData.name.ru);
      
      await addCategory({
        value: categoryValue,
        name: {
          ru: formData.name.ru,
          en: formData.name.en || formData.name.ru,
          uz: formData.name.uz || formData.name.ru
        }
      });

      toast({
        title: 'Успешно!',
        description: 'Новая категория создана'
      });
      
      onCategoryAdded(categoryValue);
      onOpenChange(false);
      
      // Reset form
      setFormData({
        name: { ru: '', en: '', uz: '' },
        value: ''
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось создать категорию'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Создать новую категорию</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name-ru">Название (RU) *</Label>
            <Input
              id="name-ru"
              value={formData.name.ru}
              onChange={(e) => {
                const value = e.target.value;
                setFormData(prev => ({
                  ...prev,
                  name: { ...prev.name, ru: value },
                  value: generateValue(value)
                }));
              }}
              required
              placeholder="Название категории"
            />
          </div>
          
          <div>
            <Label htmlFor="name-en">Название (EN)</Label>
            <Input
              id="name-en"
              value={formData.name.en}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                name: { ...prev.name, en: e.target.value }
              }))}
              placeholder="Category name"
            />
          </div>
          
          <div>
            <Label htmlFor="name-uz">Название (UZ)</Label>
            <Input
              id="name-uz"
              value={formData.name.uz}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                name: { ...prev.name, uz: e.target.value }
              }))}
              placeholder="Kategoriya nomi"
            />
          </div>
          
          <div>
            <Label htmlFor="value">Значение (автоматически)</Label>
            <Input
              id="value"
              value={formData.value}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                value: e.target.value
              }))}
              placeholder="category_value"
              disabled
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Plus className="w-4 h-4 mr-2" />
              Создать категорию
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};