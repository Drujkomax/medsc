import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Eye, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  Package,
  Award,
  BarChart3,
  Calendar,
  Search
} from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useCategories } from '@/hooks/useCategories';
import { format, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';

const ProductAnalyticsDashboard = () => {
  const { 
    getConversionAnalytics, 
    getTopProductsByConversion, 
    loading 
  } = useAnalytics();
  const { categories } = useCategories();
  
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState('7');
  const [searchTerm, setSearchTerm] = useState('');

  const getCategoryLabel = (category: string) => {
    const found = categories.find(c => c.value === category || c.id === category);
    if (found) return found.name.ru;
    return category;
  };

  useEffect(() => {
    loadAnalytics();
    loadTopProducts();
  }, [dateRange]);

  const loadAnalytics = async () => {
    const endDate = format(new Date(), 'yyyy-MM-dd');
    const startDate = format(subDays(new Date(), parseInt(dateRange)), 'yyyy-MM-dd');
    
    const data = await getConversionAnalytics(startDate, endDate);
    setAnalytics(data);
  };

  const loadTopProducts = async () => {
    const data = await getTopProductsByConversion(10);
    setTopProducts(data);
  };

  const getTotalMetrics = () => {
    const totalViews = analytics.reduce((sum, item) => sum + item.views_count, 0);
    const totalQuotes = analytics.reduce((sum, item) => sum + item.quote_requests_count, 0);
    const averageConversion = totalViews > 0 ? (totalQuotes / totalViews * 100) : 0;
    const totalRevenue = analytics.reduce((sum, item) => sum + Number(item.revenue || 0), 0);

    return { totalViews, totalQuotes, averageConversion, totalRevenue };
  };

  const { totalViews, totalQuotes, averageConversion, totalRevenue } = getTotalMetrics();

  const filteredTopProducts = topProducts.filter(product =>
    searchTerm === '' || 
    product.name?.ru?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.name?.en?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Заголовок и фильтры */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Аналитика товаров</h2>
          <p className="text-muted-foreground">Анализ конверсий и эффективности товаров</p>
        </div>
        <div className="flex gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 дней</SelectItem>
              <SelectItem value="14">14 дней</SelectItem>
              <SelectItem value="30">30 дней</SelectItem>
              <SelectItem value="90">90 дней</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Основные метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общие просмотры</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              За последние {dateRange} дней
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Запросы КП</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuotes.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Всего запросов коммерческих предложений
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Средняя конверсия</CardTitle>
            {averageConversion >= 5 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageConversion.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">
              Просмотры → запросы КП
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общая выручка</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Атрибутированная выручка
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Топ товары по конверсии */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Топ товары по конверсии
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Поиск товаров..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredTopProducts.length > 0 ? (
            <div className="space-y-4">
              {filteredTopProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium">{product.name?.ru || 'Без названия'}</h4>
                      <p className="text-sm text-muted-foreground">{getCategoryLabel(product.category)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Eye className="h-3 w-3" />
                        <span>{product.views_count || 0}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">просмотры</span>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        <span>{product.quote_requests_count || 0}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">запросы КП</span>
                    </div>
                    
                    <Badge 
                      variant={
                        (product.conversion_rate || 0) >= 0.1 ? 'default' :
                        (product.conversion_rate || 0) >= 0.05 ? 'secondary' : 'outline'
                      }
                      className="min-w-16 justify-center"
                    >
                      {((product.conversion_rate || 0) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-muted-foreground">Нет данных для отображения</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductAnalyticsDashboard;