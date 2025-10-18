import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Loader2,
  Package
} from 'lucide-react';
import { useAdminProducts, Product } from '@/hooks/useProducts';
import { useManufacturers } from '@/hooks/useManufacturers';
import { useToast } from '@/hooks/use-toast';
import DraftProductCard from './DraftProductCard';

const DraftManager = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [manufacturerFilter, setManufacturerFilter] = useState<string>('all');
  const { products, loading, error, archiveProduct, updateProduct } = useAdminProducts();
  const { manufacturers } = useManufacturers();

  // Фильтруем только черновики
  const draftProducts = products.filter(product => product.status === 'draft');
  
  // Применяем поиск и фильтры
  const filteredDrafts = draftProducts.filter(product => {
    const matchesSearch = !searchTerm || (
      product.name.ru.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.name.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.name.uz.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    const matchesManufacturer = manufacturerFilter === 'all' || product.manufacturer_id === manufacturerFilter;
    
    return matchesSearch && matchesManufacturer;
  });

  // Считаем статистику
  const readyToPublish = filteredDrafts.filter(product => 
    product.name.ru && 
    product.description.ru && 
    product.category &&
    product.images?.cover
  );

  const needsWork = filteredDrafts.filter(product => 
    !product.name.ru || 
    !product.description.ru || 
    !product.category ||
    !product.images?.cover
  );

  const handleArchiveProduct = async (productId: string) => {
    if (window.confirm('Вы уверены, что хотите архивировать этот черновик?')) {
      try {
        await archiveProduct(productId);
        toast({
          title: 'Успешно!',
          description: 'Черновик архивирован'
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Ошибка',
          description: 'Не удалось архивировать черновик'
        });
      }
    }
  };

  const handlePublishProduct = async (productId: string) => {
    try {
      await updateProduct(productId, { status: 'active' });
      toast({
        title: 'Успешно!',
        description: 'Товар опубликован'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Не удалось опубликовать товар'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-lg">Загружаем черновики...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-destructive mb-2">Ошибка загрузки</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Поиск и фильтры */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Поиск черновиков по названию или категории..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={manufacturerFilter} onValueChange={setManufacturerFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Производитель" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все производители</SelectItem>
                {manufacturers.map(manufacturer => (
                  <SelectItem key={manufacturer.id} value={manufacturer.id}>
                    {manufacturer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Список черновиков */}
      {filteredDrafts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDrafts.map((product) => (
            <DraftProductCard
              key={product.id}
              product={product}
              onArchive={handleArchiveProduct}
              onPublish={handlePublishProduct}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            {draftProducts.length === 0 ? (
              <div className="flex flex-col items-center gap-4">
                <Package className="w-16 h-16 text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Нет черновиков</h3>
                  <p className="text-muted-foreground">
                    Все ваши товары опубликованы или у вас пока нет созданных товаров
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <Search className="w-16 h-16 text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Черновики не найдены</h3>
                  <p className="text-muted-foreground">
                    Попробуйте изменить параметры поиска
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DraftManager;