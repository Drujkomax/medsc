import { Card, CardContent } from '@/components/ui/card';
import { Package, Eye, TrendingUp, Archive } from 'lucide-react';
import { Product } from '@/hooks/useProducts';

interface ProductStatsProps {
  products: Product[];
}

export const ProductStats = ({ products }: ProductStatsProps) => {
  const activeProducts = products.filter(p => p.status === 'active').length;
  const draftProducts = products.filter(p => p.status === 'draft').length;
  const archivedProducts = products.filter(p => p.archived === true).length;
  
  // Group by categories
  const categoryCounts = products.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCategory = Object.entries(categoryCounts).sort(([,a], [,b]) => b - a)[0];

  const stats = [
    {
      title: 'Всего товаров',
      value: products.length,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Активные',
      value: activeProducts,
      icon: Eye,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Черновики',
      value: draftProducts,
      icon: TrendingUp,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Архив',
      value: archivedProducts,
      icon: Archive,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Распределение по категориям</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(categoryCounts).map(([category, count]) => {
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
                
                const label = categoryLabels[category as keyof typeof categoryLabels] || category;
                
                return (
                  <div key={category} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-sm text-muted-foreground">{count} товар(ов)</span>
                  </div>
                );
              })}
            </div>
            
            {topCategory && (
              <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Популярная категория:</span>{' '}
                  {topCategory[0]} ({topCategory[1]} товар(ов))
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};