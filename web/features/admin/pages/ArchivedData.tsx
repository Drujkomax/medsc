'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useArchivedProducts, useArchivedLeads } from '@/hooks/useArchivedData';
import { useCategories } from '@/hooks/useCategories';
import { 
  Search, 
  Package, 
  RotateCcw, 
  Trash2, 
  Loader2, 
  Users,
  Calendar,
  Eye,
  AlertCircle,
  Edit
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS, uz } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

const ArchivedData = () => {
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [leadSearchTerm, setLeadSearchTerm] = useState('');
  const router = useRouter();
  const { categories } = useCategories();

  const { 
    products, 
    loading: productsLoading, 
    error: productsError,
    unarchiveProduct, 
    deleteProductPermanently 
  } = useArchivedProducts();

  const { 
    leads, 
    loading: leadsLoading, 
    error: leadsError,
    unarchiveLead, 
    deleteLeadPermanently 
  } = useArchivedLeads();

  const getDateLocale = () => {
    switch (i18n.language) {
      case 'en': return enUS;
      case 'uz': return uz;
      default: return ru;
    }
  };

  // Фильтрация товаров
  const filteredProducts = products.filter(product =>
    product.name?.ru?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.ru?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Фильтрация лидов
  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(leadSearchTerm.toLowerCase()) ||
    lead.email?.toLowerCase().includes(leadSearchTerm.toLowerCase()) ||
    lead.company?.toLowerCase().includes(leadSearchTerm.toLowerCase())
  );

  const getCategoryLabel = (category: string) => {
    const found = categories.find(c => c.value === category || c.id === category);
    if (found) return found.name[i18n.language as 'ru' | 'en' | 'uz'] || found.name.ru;

    const categoryLabels: Record<string, string> = {
      diagnostic: t('categories.diagnostic', 'Диагностическое'),
      surgical: t('categories.surgical', 'Хирургическое'),
      monitoring: t('categories.monitoring', 'Мониторинг'),
      laboratory: t('categories.laboratory', 'Лабораторное'),
      rehabilitation: t('categories.rehabilitation', 'Реабилитационное'),
      dental: t('categories.dental', 'Стоматологическое'),
      ophthalmology: t('categories.ophthalmology', 'Офтальмологическое'),
      furniture: t('categories.furniture', 'Медицинская мебель')
    };
    
    return categoryLabels[category] || category;
  };

  const getStageLabel = (stage: string) => {
    const stageLabels: Record<string, string> = {
      new: t('leads.stages.new', 'Новый'),
      contacted: t('leads.stages.contacted', 'Связались'),
      qualified: t('leads.stages.qualified', 'Квалифицирован'),
      proposal: t('leads.stages.proposal', 'Предложение'),
      negotiation: t('leads.stages.negotiation', 'Переговоры'),
      closed_won: t('leads.stages.closedWon', 'Закрыт успешно'),
      closed_lost: t('leads.stages.closedLost', 'Закрыт неуспешно')
    };
    
    return stageLabels[stage] || stage;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('archive.title', 'Архив')}</h1>
          <p className="text-muted-foreground">{t('archive.subtitle', 'Управление архивированными данными')}</p>
        </div>
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            {t('archive.products', 'Товары')} ({products.length})
          </TabsTrigger>
          <TabsTrigger value="leads" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            {t('archive.leads', 'Лиды')} ({leads.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                {t('archive.archivedProducts', 'Архивированные товары')}
              </CardTitle>
              <div className="flex gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder={t('archive.searchProducts', 'Поиск товаров...')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : productsError ? (
                <div className="flex items-center justify-center py-8 text-red-500">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  {productsError}
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProducts.map((product) => (
                    <Card key={product.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="aspect-[4/5] w-full bg-gray-100 rounded-md mb-3 flex items-center justify-center overflow-hidden">
                          {product.images?.cover ? (
                            <img 
                              src={product.images.cover} 
                              alt={product.name?.ru || t('archive.product', 'Товар')}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <Package className="w-10 h-10 text-gray-400" />
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <CardTitle className="text-base line-clamp-2">
                            {product.name?.ru || t('archive.noTitle', 'Без названия')}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {getCategoryLabel(product.category)}
                          </p>
                          <Badge variant="secondary" className="bg-red-100 text-red-800">
                            {t('archive.archived', 'Архивирован')}
                          </Badge>
                          {product.archived_at && (
                            <p className="text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              {formatDistanceToNow(new Date(product.archived_at), { 
                                addSuffix: true, 
                                locale: getDateLocale()
                              })}
                            </p>
                          )}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {product.description?.ru || t('archive.noDescription', 'Описание отсутствует')}
                          </p>
                          
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-1">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => router.push(`/admin/products/preview/${product.id}`)}
                                className="flex-1"
                              >
                                <Eye className="w-3 h-3" />
                                <span className="hidden sm:inline ml-1">{t('common.view', 'Просмотр')}</span>
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => router.push(`/admin/products/edit/${product.id}`)}
                                className="flex-1"
                              >
                                <Edit className="w-3 h-3" />
                                <span className="hidden sm:inline ml-1">{t('common.edit', 'Изменить')}</span>
                              </Button>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => unarchiveProduct(product.id)}
                              className="w-full"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span className="hidden sm:inline ml-1">{t('archive.restore', 'Восстановить')}</span>
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => deleteProductPermanently(product.id)}
                              className="w-full"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="hidden sm:inline ml-1">{t('archive.deletePermanently', 'Удалить навсегда')}</span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('archive.noArchivedProducts', 'Нет архивированных товаров')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                {t('archive.archivedLeads', 'Архивированные лиды')}
              </CardTitle>
              <div className="flex gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder={t('archive.searchLeads', 'Поиск лидов...')}
                    value={leadSearchTerm}
                    onChange={(e) => setLeadSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {leadsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : leadsError ? (
                <div className="flex items-center justify-center py-8 text-red-500">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  {leadsError}
                </div>
              ) : filteredLeads.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredLeads.map((lead) => (
                    <Card key={lead.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="space-y-2">
                          <CardTitle className="text-base">{lead.name}</CardTitle>
                          <div className="space-y-1">
                            {lead.email && (
                              <p className="text-sm text-muted-foreground">{lead.email}</p>
                            )}
                            {lead.phone && (
                              <p className="text-sm text-muted-foreground">{lead.phone}</p>
                            )}
                            {lead.company && (
                              <p className="text-sm text-muted-foreground">{lead.company}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline">
                              {getStageLabel(lead.stage)}
                            </Badge>
                            <Badge variant="secondary" className="bg-red-100 text-red-800">
                              {t('archive.archived', 'Архивирован')}
                            </Badge>
                          </div>
                          {lead.archived_at && (
                            <p className="text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              {formatDistanceToNow(new Date(lead.archived_at), { 
                                addSuffix: true, 
                                locale: getDateLocale()
                              })}
                            </p>
                          )}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {lead.value && (
                            <p className="text-sm font-medium text-primary">
                              ${lead.value}
                            </p>
                          )}
                          
                          {lead.notes && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {lead.notes}
                            </p>
                          )}
                          
                          <div className="flex flex-col gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => unarchiveLead(lead.id)}
                              className="w-full"
                            >
                              <RotateCcw className="w-4 h-4 mr-1" />
                              {t('archive.restore', 'Восстановить')}
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => deleteLeadPermanently(lead.id)}
                              className="w-full"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              {t('archive.deletePermanently', 'Удалить навсегда')}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('archive.noArchivedLeads', 'Нет архивированных лидов')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ArchivedData;