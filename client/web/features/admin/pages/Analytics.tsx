import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Users, 
  Package,
  TrendingUp,
  Activity,
  Award
} from 'lucide-react';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import ProductAnalyticsDashboard from '../components/Analytics/ProductAnalyticsDashboard';
import EmployeeActivityDashboard from '../components/Analytics/EmployeeActivityDashboard';
import ExecutiveOverview from '../components/Analytics/ExecutiveOverview';

const Analytics = () => {
  const { t } = useTranslation();
  const { hasPermission, role } = useUserPermissions();

  // Проверяем права доступа к аналитике
  if (!hasPermission('view_analytics')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('admin.noAccess', 'Нет доступа')}</h3>
          <p className="text-gray-500">{t('admin.noAnalyticsPermission', 'У вас нет прав для просмотра аналитики')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.analytics', 'Аналитика')}</h1>
          <p className="text-muted-foreground">{t('admin.analyticsDescription', 'Комплексный анализ эффективности и производительности')}</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {role === 'director' ? t('admin.fullAccess', 'Полный доступ') : t('admin.limitedAccess', 'Ограниченный доступ')}
        </Badge>
      </div>

      {/* Табы аналитики */}
      <Tabs defaultValue={role === 'director' ? 'executive' : 'products'} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          {role === 'director' && (
            <TabsTrigger value="executive" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t('admin.executive', 'Executive')}
            </TabsTrigger>
          )}
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            {t('admin.products', 'Товары')}
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('admin.employees', 'Сотрудники')}
          </TabsTrigger>
        </TabsList>

        {/* Executive Overview - только для директора */}
        {role === 'director' && (
          <TabsContent value="executive">
            <ExecutiveOverview />
          </TabsContent>
        )}

        {/* Аналитика товаров */}
        <TabsContent value="products">
          <ProductAnalyticsDashboard />
        </TabsContent>

        {/* Аналитика сотрудников */}
        <TabsContent value="employees">
          {hasPermission('view_activity_logs') ? (
            <EmployeeActivityDashboard />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{t('admin.noAccess', 'Нет доступа')}</h3>
                  <p className="text-gray-500">{t('admin.noEmployeeActivityPermission', 'У вас нет прав для просмотра активности сотрудников')}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;