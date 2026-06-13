import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Edit2, 
  Eye, 
  Archive, 
  Package, 
  AlertCircle,
  Clock,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Product } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useManufacturers } from '@/hooks/useManufacturers';
import { getCountryName } from '@/utils/countries';

interface DraftProductCardProps {
  product: Product;
  onArchive: (productId: string) => void;
  onPublish: (productId: string) => void;
}


const DraftProductCard = ({ product, onArchive, onPublish }: DraftProductCardProps) => {
  const navigate = useNavigate();
  const { categories } = useCategories();
  const { manufacturers } = useManufacturers();

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

  // Проверяем готовность к публикации
  const isReadyToPublish = product.name.ru && 
                          product.description.ru && 
                          product.category &&
                          product.images?.cover;

  const missingFields = [];
  if (!product.name.ru) missingFields.push('Название');
  if (!product.description.ru) missingFields.push('Описание');
  if (!product.category) missingFields.push('Категория');
  if (!product.images?.cover) missingFields.push('Главное изображение');

  return (
    <Card className="hover:shadow-md transition-shadow border-l-4 border-l-orange-500 flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="aspect-[4/5] w-full bg-gray-100 rounded-md mb-3 flex items-center justify-center overflow-hidden">
          {product.images?.cover ? (
            <img 
              src={product.images.cover} 
              alt={product.name.ru || 'Черновик товара'}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center text-gray-400">
              <Package className="w-10 h-10 mb-2" />
              <span className="text-xs">Нет изображения</span>
            </div>
          )}
        </div>
        
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base flex items-center gap-2 line-clamp-2 leading-tight">
              <Clock className="w-3 h-3 text-orange-500 flex-shrink-0" />
              {product.name.ru || 'Без названия'}
            </CardTitle>
            <div className="mt-2 space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="font-medium">Категория:</span>
                <span>{product.category ? getCategoryLabel(product.category) : 'Не указана'}</span>
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
          <div className="flex flex-col gap-1">
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              Черновик
            </Badge>
            {isReadyToPublish ? (
              <Badge variant="outline" className="text-green-600 border-green-600">
                Готов к публикации
              </Badge>
            ) : (
              <Badge variant="outline" className="text-amber-600 border-amber-600">
                Требует доработки
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-4 flex-1">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.description.ru || 'Описание не добавлено'}
          </p>
          
          {/* Статус готовности */}
          {!isReadyToPublish && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 mb-1">
                    Для публикации необходимо:
                  </p>
                  <ul className="text-xs text-amber-700 space-y-1">
                    {missingFields.map((field, index) => (
                      <li key={index} className="flex items-center gap-1">
                        <div className="w-1 h-1 bg-amber-600 rounded-full" />
                        {field}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {/* Информация о цене */}
          {product.price && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-lg font-semibold text-primary">
                {product.price === 'on_request' ? 'По запросу' : `${product.price} ${product.currency}`}
              </span>
            </div>
          )}
        </div>
        
        {/* Кнопки действий - всегда внизу */}
        <div className="flex flex-col gap-2 pt-4 mt-auto">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate(`/admin/products/edit/${product.id}`)}
              className="flex-1"
            >
              <Edit2 className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Изменить</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate(`/admin/products/preview/${product.id}`)}
              className="flex-1"
            >
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Просмотр</span>
            </Button>
          </div>
          
          <div className="flex gap-2">
            {isReadyToPublish && (
              <Button 
                size="sm" 
                onClick={() => onPublish(product.id)}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">Опубликовать</span>
              </Button>
            )}
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => onArchive(product.id)}
                className={isReadyToPublish ? "flex-1" : "w-full"}
              >
                <Archive className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">Архивировать</span>
              </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DraftProductCard;