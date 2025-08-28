import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Edit2, 
  Eye, 
  Trash2, 
  Package, 
  AlertCircle,
  Clock,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Product } from '@/hooks/useProducts';

interface DraftProductCardProps {
  product: Product;
  onDelete: (productId: string) => void;
  onPublish: (productId: string) => void;
}

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

const DraftProductCard = ({ product, onDelete, onPublish }: DraftProductCardProps) => {
  const navigate = useNavigate();

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
    <Card className="hover:shadow-md transition-shadow border-l-4 border-l-orange-500">
      <CardHeader className="pb-3">
        <div className="aspect-[4/5] w-full bg-gray-100 rounded-md mb-3 flex items-center justify-center overflow-hidden">
          {product.images?.cover ? (
            <img 
              src={product.images.cover} 
              alt={product.name.ru || 'Черновик товара'}
              className="w-full h-full object-cover"
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
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {product.category ? getCategoryLabel(product.category) : 'Категория не указана'}
            </p>
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
      
      <CardContent>
        <div className="space-y-4">
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
          
          {/* Кнопки действий */}
          <div className="flex flex-col gap-2 pt-2">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                className="flex-1"
              >
                <Edit2 className="w-4 h-4 mr-1" />
                Редактировать
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate(`/product/${product.id}`)}
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-1" />
                Предпросмотр
              </Button>
            </div>
            
            <div className="flex gap-2">
              {isReadyToPublish && (
                <Button 
                  size="sm" 
                  onClick={() => onPublish(product.id)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Опубликовать
                </Button>
              )}
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => onDelete(product.id)}
                className={isReadyToPublish ? "flex-1" : "w-full"}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Удалить
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DraftProductCard;