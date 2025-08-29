import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Edit2,
  Trash2,
  Eye,
  Package,
  Loader2,
  MoreHorizontal
} from 'lucide-react';
import { useAdminProducts, Product } from '@/hooks/useProducts';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BulkActions } from '../components/BulkActions';
import { ProductStats } from '../components/ProductStats';
import { ExportProducts } from '../components/ExportProducts';
import { ImportProducts } from '../components/ImportProducts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DraftManager from '../components/DraftManager';

const getCategoryLabel = (category: string) => {
  const categoryLabels = {
    diagnostic: 'Диагностическое',
    surgical: 'Хирургическое',
    monitoring: 'Мониторинг',
    laboratory: 'Лабораторное',
    rehabilitation: 'Реабилитационное',
    dental: 'Стоматологическое',
    ophthalmology: 'Офтальмологическое',
    furniture: 'Медицинская мебель'
  };
  
  return categoryLabels[category as keyof typeof categoryLabels] || category;
};

const AdminProducts = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('grid');
  const { products, loading, error, deleteProduct, updateProduct } = useAdminProducts();

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      draft: 'secondary',
      archived: 'outline',
    } as const;
    
    const labels = {
      active: 'Активный',
      draft: 'Черновик',
      archived: 'Архив',
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm || (
      product.name.ru.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.name.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.name.uz.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCategoryLabel(product.category).toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || product.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот товар?')) {
      try {
        await deleteProduct(productId);
        toast({
          title: 'Успешно!',
          description: 'Товар удален успешно'
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Ошибка',
          description: 'Не удалось удалить товар'
        });
      }
    }
  };

  const handleBulkAction = async (action: string, productIds: string[]) => {
    try {
      if (action === 'delete') {
        for (const id of productIds) {
          await deleteProduct(id);
        }
      } else if (action === 'activate') {
        for (const id of productIds) {
          await updateProduct(id, { status: 'active' });
        }
      } else if (action === 'archive') {
        for (const id of productIds) {
          await updateProduct(id, { status: 'archived' });
        }
      }
    } catch (error) {
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-lg">Загружаем товары...</span>
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">{t('products.title')}</h2>
          <p className="text-muted-foreground">{t('products.subtitle')}</p>
        </div>
        <Button onClick={() => navigate('/admin/products/add')}>
          Добавить товар
        </Button>
      </div>

      {/* Statistics */}
      <ProductStats products={products} />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Поиск товаров по названию или категории..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Все категории" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все категории</SelectItem>
                  <SelectItem value="diagnostic">Диагностическое</SelectItem>
                  <SelectItem value="surgical">Хирургическое</SelectItem>
                  <SelectItem value="monitoring">Мониторинг</SelectItem>
                  <SelectItem value="laboratory">Лабораторное</SelectItem>
                  <SelectItem value="rehabilitation">Реабилитационное</SelectItem>
                  <SelectItem value="dental">Стоматологическое</SelectItem>
                  <SelectItem value="ophthalmology">Офтальмологическое</SelectItem>
                  <SelectItem value="furniture">Медицинская мебель</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  <SelectItem value="active">Активные</SelectItem>
                  <SelectItem value="draft">Черновики</SelectItem>
                  <SelectItem value="archived">Архив</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="grid">Все товары</TabsTrigger>
          <TabsTrigger value="drafts">Черновики</TabsTrigger>
          <TabsTrigger value="bulk">Массовые операции</TabsTrigger>
          <TabsTrigger value="export">Экспорт</TabsTrigger>
          <TabsTrigger value="import">Импорт</TabsTrigger>
        </TabsList>
        
        <TabsContent value="grid" className="space-y-6">
          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-md transition-shadow flex flex-col h-full">
                <CardHeader className="pb-3">
                  <div className="aspect-[4/5] w-full bg-gray-100 rounded-md mb-3 flex items-center justify-center overflow-hidden">
                    {product.images?.cover ? (
                      <img 
                        src={product.images.cover} 
                        alt={product.name.ru}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-10 h-10 text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base line-clamp-2 leading-tight">{product.name.ru}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{getCategoryLabel(product.category)}</p>
                    </div>
                    <div className="flex flex-col gap-1 ml-2">
                      {getStatusBadge(product.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 flex-1 flex flex-col">
                  <div className="space-y-3 flex-1">
                    <p className="text-sm text-muted-foreground line-clamp-2">{product.description.ru}</p>
                    {product.price && (
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-primary">
                          {product.price === 'on_request' ? 'По запросу' : `${product.price} ${product.currency}`}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Кнопки действий - всегда внизу */}
                  <div className="flex gap-2 pt-4 mt-auto">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                      className="flex-1"
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Изменить
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate(`/product/${product.id}`)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Просмотр
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleDeleteProduct(product.id)}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="drafts" className="space-y-6">
          <DraftManager />
        </TabsContent>

        <TabsContent value="bulk" className="space-y-6">
          <BulkActions
            products={filteredProducts}
            selectedProducts={selectedProducts}
            onSelectionChange={setSelectedProducts}
            onBulkAction={handleBulkAction}
          />
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <ExportProducts products={filteredProducts} />
        </TabsContent>

        <TabsContent value="import" className="space-y-6">
          <ImportProducts />
        </TabsContent>
      </Tabs>

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">{t('products.notFound')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminProducts;