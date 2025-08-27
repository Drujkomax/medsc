import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Plus, Settings } from 'lucide-react';

// Моковые данные для услуг
const mockServices = [
  {
    id: 1,
    title: 'Консультации по медицинскому оборудованию',
    description: 'Профессиональные консультации по выбору и использованию медицинского оборудования',
    status: 'active',
    category: 'Консультации',
    price: 'По запросу'
  },
  {
    id: 2,
    title: 'Техническое обслуживание',
    description: 'Регулярное техническое обслуживание медицинского оборудования',
    status: 'active',
    category: 'Обслуживание',
    price: 'От 500,000 сум'
  },
  {
    id: 3,
    title: 'Установка и настройка оборудования',
    description: 'Профессиональная установка и настройка медицинского оборудования',
    status: 'active',
    category: 'Установка',
    price: 'От 1,000,000 сум'
  },
  {
    id: 4,
    title: 'Обучение персонала',
    description: 'Обучение медицинского персонала работе с оборудованием',
    status: 'active',
    category: 'Обучение',
    price: 'От 2,000,000 сум'
  },
];

const AdminServices = () => {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('services.title')}</h1>
          <p className="text-muted-foreground">
            {t('services.subtitle')}
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Добавить услугу
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {mockServices.map((service) => (
          <Card key={service.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-lg">{service.title}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{service.category}</Badge>
                    <Badge variant={service.status === 'active' ? 'default' : 'secondary'}>
                      {service.status === 'active' ? 'Активна' : 'Неактивна'}
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {service.description}
                </p>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-medium">Стоимость:</span>
                  <span className="text-sm font-semibold text-primary">
                    {service.price}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего услуг</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockServices.length}</div>
            <p className="text-xs text-muted-foreground">Активных услуг</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Популярные категории</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Консультации</div>
            <p className="text-xs text-muted-foreground">Наиболее запрашиваемая</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Заявки за месяц</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground">+12% к прошлому месяцу</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminServices;