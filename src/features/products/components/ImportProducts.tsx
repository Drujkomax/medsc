import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, AlertCircle, CheckCircle, X, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProducts } from '@/hooks/useProducts';

interface ImportError {
  row: number;
  field: string;
  message: string;
}

interface ImportResult {
  success: boolean;
  total: number;
  imported: number;
  errors: ImportError[];
}

export const ImportProducts = () => {
  const { toast } = useToast();
  const { addProduct } = useProducts();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const validateProductData = (data: any, rowIndex: number): ImportError[] => {
    const errors: ImportError[] = [];
    
    // Required fields validation
    if (!data['Название (RU)']?.trim()) {
      errors.push({ row: rowIndex, field: 'Название (RU)', message: 'Обязательное поле' });
    }
    if (!data['Описание (RU)']?.trim()) {
      errors.push({ row: rowIndex, field: 'Описание (RU)', message: 'Обязательное поле' });
    }
    if (!data['Категория']?.trim()) {
      errors.push({ row: rowIndex, field: 'Категория', message: 'Обязательное поле' });
    }

    // Category validation
    const validCategories = ['diagnostic', 'surgical', 'monitoring', 'laboratory', 'rehabilitation', 'dental', 'ophthalmology', 'furniture'];
    if (data['Категория'] && !validCategories.includes(data['Категория'])) {
      errors.push({ row: rowIndex, field: 'Категория', message: `Недопустимая категория. Допустимые: ${validCategories.join(', ')}` });
    }

    // Status validation
    const validStatuses = ['active', 'draft', 'archived'];
    if (data['Статус'] && !validStatuses.includes(data['Статус'])) {
      errors.push({ row: rowIndex, field: 'Статус', message: `Недопустимый статус. Допустимые: ${validStatuses.join(', ')}` });
    }

    return errors;
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  const processCSVFile = async (file: File): Promise<any[]> => {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('Файл должен содержать заголовки и хотя бы одну строку данных');
    }

    const headers = parseCSVLine(lines[0]);
    const rows = lines.slice(1).map(line => parseCSVLine(line));
    
    return rows.map(row => {
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });
  };

  const convertToProductFormat = (data: any) => {
    return {
      name: {
        ru: data['Название (RU)'] || '',
        en: data['Название (EN)'] || '',
        uz: data['Название (UZ)'] || ''
      },
      description: {
        ru: data['Описание (RU)'] || '',
        en: data['Описание (EN)'] || '',
        uz: data['Описание (UZ)'] || ''
      },
      category: data['Категория'] || '',
      country: data['Страна'] || null,
      price: data['Цена'] ? parseFloat(data['Цена']) : null,
      status: (data['Статус'] as 'active' | 'draft' | 'archived') || 'draft',
      features: {
        ru: data['Характеристики (RU)'] ? data['Характеристики (RU)'].split(';').map((f: string) => f.trim()).filter(Boolean) : [],
        en: data['Характеристики (EN)'] ? data['Характеристики (EN)'].split(';').map((f: string) => f.trim()).filter(Boolean) : [],
        uz: data['Характеристики (UZ)'] ? data['Характеристики (UZ)'].split(';').map((f: string) => f.trim()).filter(Boolean) : []
      },
      images: {
        cover: data['Обложка'] || null,
        gallery: data['Галерея'] ? data['Галерея'].split(';').map((url: string) => url.trim()).filter(Boolean) : []
      }
    };
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        toast({
          variant: 'destructive',
          title: 'Ошибка',
          description: 'Пожалуйста, выберите CSV файл'
        });
        return;
      }
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Выберите файл для импорта'
      });
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      const csvData = await processCSVFile(selectedFile);
      const errors: ImportError[] = [];
      let importedCount = 0;

      for (let i = 0; i < csvData.length; i++) {
        const rowData = csvData[i];
        const rowErrors = validateProductData(rowData, i + 2); // +2 because row 1 is headers
        
        if (rowErrors.length > 0) {
          errors.push(...rowErrors);
          continue;
        }

        try {
          const productData = convertToProductFormat(rowData);
          await addProduct(productData);
          importedCount++;
        } catch (error) {
          errors.push({
            row: i + 2,
            field: 'общее',
            message: error instanceof Error ? error.message : 'Ошибка при создании товара'
          });
        }

        setImportProgress(((i + 1) / csvData.length) * 100);
      }

      const result: ImportResult = {
        success: errors.length === 0,
        total: csvData.length,
        imported: importedCount,
        errors
      };

      setImportResult(result);

      if (result.success) {
        toast({
          title: 'Успешно!',
          description: `Импортировано ${importedCount} товар(ов)`
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Импорт завершен с ошибками',
          description: `Импортировано ${importedCount} из ${csvData.length} товар(ов)`
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ошибка импорта',
        description: error instanceof Error ? error.message : 'Не удалось обработать файл'
      });
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  const downloadTemplate = () => {
    const templateData = `"Название (RU)","Название (EN)","Название (UZ)","Описание (RU)","Описание (EN)","Описание (UZ)","Категория","Страна","Цена","Статус","Характеристики (RU)","Характеристики (EN)","Характеристики (UZ)","Обложка","Галерея"
"Аппарат УЗИ","Ultrasound Machine","Ultratovush apparati","Современный аппарат УЗИ","Modern ultrasound machine","Zamonaviy ultratovush apparati","diagnostic","US","1500.00","active","Высокое разрешение; Портативный","High resolution; Portable","Yuqori aniqlik; Portativ","",""
"Хирургический аппарат","Surgical Machine","Jarrohlik apparati","Высокоточный хирургический аппарат","High precision surgical machine","Yuqori aniqlikdagi jarrohlik apparati","surgical","DE","2500.50","active","Точность; Надежность","Precision; Reliability","Aniqlik; Ishonchlilik","",""`;  

    const blob = new Blob([templateData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'products_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resetImport = () => {
    setSelectedFile(null);
    setImportResult(null);
    setImportProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Импорт товаров
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template Download */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-900">Шаблон для импорта</h4>
              <p className="text-sm text-blue-700 mt-1">
                Загрузите шаблон CSV файла с правильной структурой полей
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                className="mt-2"
              >
                <Download className="w-4 h-4 mr-2" />
                Скачать шаблон
              </Button>
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Выберите CSV файл</label>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              disabled={isImporting}
            />
          </div>

          {selectedFile && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Выбран файл: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Import Progress */}
        {isImporting && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Импорт в процессе...</span>
              <span>{Math.round(importProgress)}%</span>
            </div>
            <Progress value={importProgress} />
          </div>
        )}

        {/* Import Results */}
        {importResult && (
          <div className="space-y-4">
            <Alert className={importResult.success ? "border-green-200" : "border-red-200"}>
              {importResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription>
                {importResult.success ? (
                  `Успешно импортировано ${importResult.imported} товар(ов)`
                ) : (
                  `Импортировано ${importResult.imported} из ${importResult.total} товар(ов). ${importResult.errors.length} ошибок.`
                )}
              </AlertDescription>
            </Alert>

            {importResult.errors.length > 0 && (
              <div className="max-h-64 overflow-y-auto border rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  Ошибки импорта
                </h4>
                <div className="space-y-2 text-sm">
                  {importResult.errors.map((error, index) => (
                    <div key={index} className="flex gap-2 text-red-600">
                      <span className="font-mono bg-red-50 px-2 py-1 rounded">
                        Строка {error.row}
                      </span>
                      <span className="font-medium">{error.field}:</span>
                      <span>{error.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={resetImport}
            disabled={isImporting}
          >
            <X className="w-4 h-4 mr-2" />
            Сброс
          </Button>
          
          <Button
            onClick={handleImport}
            disabled={!selectedFile || isImporting}
          >
            <Upload className="w-4 h-4 mr-2" />
            {isImporting ? 'Импорт...' : 'Импортировать'}
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1 border-t pt-4">
          <p><strong>Инструкции по импорту:</strong></p>
          <p>• Скачайте и заполните шаблон CSV файла</p>
          <p>• Обязательные поля: Название (RU), Описание (RU), Категория</p>
          <p>• Характеристики разделяйте точкой с запятой (;)</p>
          <p>• URL изображений разделяйте точкой с запятой (;)</p>
          <p>• Допустимые категории: diagnostic, surgical, monitoring, laboratory, rehabilitation, dental, ophthalmology, furniture</p>
          <p>• Допустимые статусы: active, draft, archived</p>
        </div>
      </CardContent>
    </Card>
  );
};