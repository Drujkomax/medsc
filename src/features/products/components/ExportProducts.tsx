import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/hooks/useProducts';

interface ExportProductsProps {
  products: Product[];
}

export const ExportProducts = ({ products }: ExportProductsProps) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');

  const exportToCSV = (data: Product[]) => {
    const headers = [
      'ID',
      'Название (RU)',
      'Название (EN)', 
      'Название (UZ)',
      'Описание (RU)',
      'Описание (EN)',
      'Описание (UZ)',
      'Категория',
      'Страна',
      'Статус',
      'Характеристики (RU)',
      'Характеристики (EN)',
      'Характеристики (UZ)',
      'Обложка',
      'Галерея',
      'Дата создания',
      'Дата обновления'
    ];

    const rows = data.map(product => [
      product.id,
      product.name.ru,
      product.name.en,
      product.name.uz,
      product.description.ru,
      product.description.en,
      product.description.uz,
      product.category,
      product.country || '',
      product.status,
      product.features?.ru.join('; ') || '',
      product.features?.en.join('; ') || '',
      product.features?.uz.join('; ') || '',
      product.images?.cover || '',
      product.images?.gallery.join('; ') || '',
      new Date(product.created_at).toLocaleDateString('ru-RU'),
      new Date(product.updated_at).toLocaleDateString('ru-RU')
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return csvContent;
  };

  const exportToJSON = (data: Product[]) => {
    return JSON.stringify(data, null, 2);
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (products.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Нет товаров для экспорта'
      });
      return;
    }

    setIsExporting(true);

    try {
      const timestamp = new Date().toISOString().split('T')[0];
      
      if (exportFormat === 'csv') {
        const csvContent = exportToCSV(products);
        downloadFile(csvContent, `products_${timestamp}.csv`, 'text/csv;charset=utf-8;');
      } else {
        const jsonContent = exportToJSON(products);
        downloadFile(jsonContent, `products_${timestamp}.json`, 'application/json');
      }

      toast({
        title: 'Успешно!',
        description: `Экспортировано ${products.length} товар(ов) в формате ${exportFormat.toUpperCase()}`
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Не удалось экспортировать товары'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getCategoryStats = () => {
    const categoryCounts = products.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count,
      percentage: ((count / products.length) * 100).toFixed(1)
    }));
  };

  const statusStats = {
    active: products.filter(p => p.status === 'active').length,
    draft: products.filter(p => p.status === 'draft').length,
    archived: products.filter(p => p.status === 'archived').length
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Экспорт товаров
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Controls */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Формат экспорта</label>
            <Select value={exportFormat} onValueChange={(value: 'csv' | 'json') => setExportFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    CSV (Excel)
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    JSON
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col justify-end">
            <Button
              onClick={handleExport}
              disabled={isExporting || products.length === 0}
              className="min-w-[120px]"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Экспорт...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Экспорт
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Export Summary */}
        <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
          <h4 className="font-medium">Сводка экспорта</h4>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Всего товаров:</span>
              <span className="ml-2 font-medium">{products.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Активные:</span>
              <span className="ml-2 font-medium text-green-600">{statusStats.active}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Черновики:</span>
              <span className="ml-2 font-medium text-yellow-600">{statusStats.draft}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Архив:</span>
              <span className="ml-2 font-medium text-gray-600">{statusStats.archived}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Категории:</span>
              <span className="ml-2 font-medium">{Object.keys(products.reduce((acc, p) => ({ ...acc, [p.category]: true }), {})).length}</span>
            </div>
          </div>

          {/* Top Categories */}
          {getCategoryStats().length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Топ категории:</p>
              <div className="space-y-1">
                {getCategoryStats().slice(0, 3).map(({ category, count, percentage }) => {
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
                    <div key={category} className="flex justify-between text-xs">
                      <span>{label}</span>
                      <span className="text-muted-foreground">{count} ({percentage}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Format Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          {exportFormat === 'csv' ? (
            <>
              <p>• CSV файл можно открыть в Excel или Google Sheets</p>
              <p>• Включает все поля товаров в табличном формате</p>
              <p>• Кодировка UTF-8 с поддержкой русских символов</p>
            </>
          ) : (
            <>
              <p>• JSON файл содержит все данные в структурированном формате</p>
              <p>• Подходит для резервного копирования или импорта</p>
              <p>• Сохраняет полную структуру данных</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};