import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWarehouse } from '@/hooks/useWarehouse';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export const SeedWarehouseButton = () => {
  const { addItem } = useWarehouse();
  const [loading, setLoading] = useState(false);

  const seedSampleData = async () => {
    setLoading(true);
    try {
      const sampleItems = [
        {
          name: {
            ru: "УЗИ аппарат Mindray DC-70",
            en: "Mindray DC-70 Ultrasound System",
            uz: "Mindray DC-70 Ultratovush tizimi"
          },
          description: {
            ru: "Современный ультразвуковой сканер с высоким разрешением для диагностики",
            en: "Modern high-resolution ultrasound scanner for diagnostics",
            uz: "Diagnostika uchun zamonaviy yuqori aniqlikdagi ultratovush skaneri"
          },
          images: {
            cover: "/lovable-uploads/ultrasound-machine.jpg",
            gallery: []
          },
          quantity: 3,
          unit: "шт" as const,
          location: "Стеллаж A1",
          condition: "new" as const,
          status: "in_stock" as const,
          purchase_price: 45000,
          selling_price: 58000,
          notes: "В наличии на складе, готов к отгрузке",
          minimum_stock: 2,
          notify_low_stock: true
        },
        {
          name: {
            ru: "Рентген аппарат GE AMX 4 Plus",
            en: "GE AMX 4 Plus X-Ray System",
            uz: "GE AMX 4 Plus rentgen tizimi"
          },
          description: {
            ru: "Цифровой рентгеновский аппарат для общей рентгенографии",
            en: "Digital X-ray system for general radiography",
            uz: "Umumiy rentgenografiya uchun raqamli rentgen tizimi"
          },
          images: {
            cover: null,
            gallery: []
          },
          quantity: 1,
          unit: "шт" as const,
          location: "Стеллаж B3",
          condition: "refurbished" as const,
          status: "in_stock" as const,
          purchase_price: 35000,
          selling_price: 42000,
          notes: "Восстановлен, проверен, гарантия 12 месяцев",
          minimum_stock: 1,
          notify_low_stock: true
        }
      ];

      for (const item of sampleItems) {
        await addItem(item);
      }

      toast.success('Примеры товаров добавлены на склад');
    } catch (error) {
      console.error('Error seeding data:', error);
      toast.error('Ошибка при добавлении примеров');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={seedSampleData}
      disabled={loading}
    >
      <Sparkles className="h-4 w-4 mr-2" />
      {loading ? 'Добавление...' : 'Добавить примеры'}
    </Button>
  );
};