import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Edit2,
  Archive,
  Eye,
  Package,
  Loader2,
  MoreHorizontal,
  FileText
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAdminProducts } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useManufacturers } from '@/hooks/useManufacturers';
import { useCategories } from '@/hooks/useCategories';
import { AddProductDialog } from '../components/AddProductDialog';
import DraftManager from '../components/DraftManager';
import { getCountryName } from '@/utils/countries';

const AdminProducts = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = useUserPermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [manufacturerFilter, setManufacturerFilter] = useState<string>('all');

  const { products, loading, error, archiveProduct } = useAdminProducts();
  const { manufacturers } = useManufacturers();
  const { categories } = useCategories();

  const getCategoryLabel = (category: string) => {
    const found = categories.find(c => c.value === category || c.id === category);
    if (found) return found.name.ru;

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">{t('products.status.active', 'Активный')}</Badge>;
      case 'draft':
        return <Badge variant="secondary">{t('products.status.draft', 'Черновик')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Фильтрация товаров
  const filteredProducts = products.filter(product => {
    const matchesSearch = searchTerm === '' || 
      product.name.ru.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.name.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.name.uz.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    const matchesManufacturer = manufacturerFilter === 'all' || product.manufacturer_id === manufacturerFilter;

    return matchesSearch && matchesCategory && matchesStatus && matchesManufacturer;
  });

  const handleArchiveProduct = async (productId: string) => {
    if (window.confirm('Вы уверены, что хотите архивировать этот товар?')) {
      await archiveProduct(productId);
    }
  };

  // Активные товары
  const activeProducts = filteredProducts.filter(product => product.status === 'active');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-lg">{t('products.loading', 'Загружаем товары...')}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-destructive mb-2">{t('common.loadError', 'Ошибка загрузки')}</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('products.title', 'Управление товарами')}</h1>
          <p className="text-muted-foreground">{t('products.subtitle', 'Создавайте, редактируйте и управляйте товарами в каталоге')}</p>
        </div>
        {hasPermission('manage_products') && <AddProductDialog />}
      </div>

      {/* Статистика товаров */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              {t('products.stats.total', 'Всего товаров')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="w-4 h-4 text-green-500" />
              {t('products.stats.active', 'Активные')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {products.filter(p => p.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-500" />
              {t('products.stats.drafts', 'Черновики')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {products.filter(p => p.status === 'draft').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Archive className="w-4 h-4 text-red-500" />
              {t('products.stats.archived', 'В архиве')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {products.filter(p => p.archived).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Tabs defaultValue="active" className="w-full">
          <TabsList className={`grid w-full ${hasPermission('view_products') && hasPermission('view_archive') ? 'grid-cols-3' : hasPermission('view_products') || hasPermission('view_archive') ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <TabsTrigger value="active">{t('products.tabs.active', 'Активные')}</TabsTrigger>
            {hasPermission('view_products') && <TabsTrigger value="drafts">{t('products.tabs.drafts', 'Черновики')}</TabsTrigger>}
            {hasPermission('view_archive') && <TabsTrigger value="archived">{t('products.tabs.archived', 'Архив')}</TabsTrigger>}
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('products.activeProducts', 'Активные товары')}</CardTitle>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder={t('products.searchPlaceholder', 'Поиск товаров...')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Выберите категорию" />
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
              </CardHeader>
              <CardContent>
                {activeProducts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeProducts.map((product) => (
                      <Card key={product.id} className="hover:shadow-md transition-shadow flex flex-col h-full">
                        <CardHeader className="pb-3">
                          <div className="aspect-[4/5] w-full bg-gray-100 rounded-md mb-3 flex items-center justify-center overflow-hidden relative">
                            {product.images?.cover ? (
                              <img 
                                src={product.images.cover} 
                                alt={product.name.ru}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <Package className="w-10 h-10 text-gray-400" />
                            )}
                            
                            {/* Счетчики просмотров и запросов КП */}
                            <div className="absolute top-2 left-2 flex flex-col gap-1">
                              <div className="bg-background/90 backdrop-blur-sm rounded-md px-2 py-1 flex items-center gap-1 text-xs shadow-sm border">
                                <Eye className="w-3 h-3 text-muted-foreground" />
                                <span className="font-medium text-foreground">{product.views_count || 0}</span>
                              </div>
                              <div className="bg-background/90 backdrop-blur-sm rounded-md px-2 py-1 flex items-center gap-1 text-xs shadow-sm border">
                                <FileText className="w-3 h-3 text-muted-foreground" />
                                <span className="font-medium text-foreground">{product.quote_requests_count || 0}</span>
                              </div>
                            </div>
                            
                            {/* Статус товара */}
                            <div className="absolute top-2 right-2">
                              {getStatusBadge(product.status)}
                            </div>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base line-clamp-2 leading-tight">{product.name.ru}</CardTitle>
                              <div className="mt-2 space-y-1">
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <span className="font-medium">Категория:</span>
                                  <span>{getCategoryLabel(product.category)}</span>
                                </p>
                                {product.manufacturer_id && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <span className="font-medium">Производитель:</span>
                                    <span>
                                      {manufacturers.find(m => m.id === product.manufacturer_id)?.name || 'Не указан'}
                                      {(() => {
                                        const manufacturer = manufacturers.find(m => m.id === product.manufacturer_id);
                                        const countryName = manufacturer?.country_code ? getCountryName(manufacturer.country_code, 'ru') : null;
                                        return countryName ? ` (${countryName})` : '';
                                      })()}
                                    </span>
                                  </p>
                                )}
                              </div>
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
                          <div className="flex flex-col gap-2 pt-4 mt-auto">
                            <div className="flex gap-2">
                              {hasPermission('manage_products') && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                                  className="flex-1"
                                >
                                  <Edit2 className="w-4 h-4 mr-1" />
                                  <span className="hidden sm:inline">Изменить</span>
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => navigate(`/admin/products/preview/${product.id}`)}
                                className="flex-1"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                <span className="hidden sm:inline">Просмотр</span>
                              </Button>
                              {hasPermission('manage_products') && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleArchiveProduct(product.id)}>
                                      <Archive className="w-4 h-4 mr-2" />
                                      Архивировать
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-muted-foreground">Нет активных товаров</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {hasPermission('view_products') && (
            <TabsContent value="drafts">
              <DraftManager />
            </TabsContent>
          )}

          {hasPermission('view_archive') && (
            <TabsContent value="archived">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <Archive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium mb-2">Архивированные товары</p>
                    <p className="text-muted-foreground mb-4">
                      Для просмотра архивированных товаров перейдите в раздел "Архив"
                    </p>
                    <Button onClick={() => navigate('/admin/archived')}>
                      Перейти к архиву
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default AdminProducts;