import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Edit,
  Trash2,
  Eye,
  Package,
  Loader2
} from 'lucide-react';
import { useAdminProducts, Product } from '@/hooks/useProducts';
import { AddProductDialog } from '../components/AddProductDialog';
import { EditProductDialog } from '../components/EditProductDialog';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { products, loading, error } = useAdminProducts();

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

  const filteredProducts = products.filter(product =>
    product.name.ru.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.name.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.name.uz.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCategoryLabel(product.category).toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <AddProductDialog />
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Всего товаров</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Активные</p>
                <p className="text-2xl font-bold">
                  {products.filter(p => p.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="w-8 h-8 text-gray-600" />
              <div>
                <p className="text-sm text-muted-foreground">Черновики</p>
                <p className="text-2xl font-bold">
                  {products.filter(p => p.status === 'draft').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={t('products.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="aspect-video w-full bg-gray-100 rounded-md mb-4 flex items-center justify-center">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{product.name.ru}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{getCategoryLabel(product.category)}</p>
                </div>
                <div className="flex flex-col gap-1">
                  {getStatusBadge(product.status)}
                  <Badge variant="outline" className="text-xs">
                    {getCategoryLabel(product.category)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {product.description.ru}
                </p>
                
                  <div className="flex space-x-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="w-4 h-4 mr-1" />
                      {t('common.view')}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setEditingProduct(product)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      {t('common.edit')}
                    </Button>
                  </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">{t('products.notFound')}</p>
          </CardContent>
        </Card>
      )}

      <EditProductDialog 
        product={editingProduct}
        open={!!editingProduct}
        onOpenChange={(open) => !open && setEditingProduct(null)}
      />
    </div>
  );
};

export default AdminProducts;