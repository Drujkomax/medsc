import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Heart, ShoppingCart } from "lucide-react";

interface CatalogProps {
  language: 'ru' | 'en' | 'uz';
}

interface Product {
  id: number;
  name: { ru: string; en: string; uz: string };
  description: { ru: string; en: string; uz: string };
  category: string;
  price: string;
  image: string;
  features: { ru: string[]; en: string[]; uz: string[] };
  inStock: boolean;
}

const products: Product[] = [
  {
    id: 1,
    name: { 
      ru: "Цифровой рентген-аппарат DR-X1", 
      en: "Digital X-Ray System DR-X1", 
      uz: "Raqamli rentgen apparati DR-X1" 
    },
    description: { 
      ru: "Современная цифровая рентгенография с высоким разрешением", 
      en: "Modern digital radiography with high resolution", 
      uz: "Yuqori aniqlikdagi zamonaviy raqamli rentgenografiya" 
    },
    category: "diagnostic",
    price: "от 2 500 000 ₽",
    image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop",
    features: {
      ru: ["Высокое качество изображения", "Низкая доза излучения", "Быстрая обработка"],
      en: ["High image quality", "Low radiation dose", "Fast processing"],
      uz: ["Yuqori surat sifati", "Past radiatsiya dozasi", "Tez ishlov berish"]
    },
    inStock: true
  },
  {
    id: 2,
    name: { 
      ru: "УЗИ-сканер ProScan 3000", 
      en: "Ultrasound Scanner ProScan 3000", 
      uz: "UZI skaneri ProScan 3000" 
    },
    description: { 
      ru: "Профессиональный ультразвуковой сканер для всех видов исследований", 
      en: "Professional ultrasound scanner for all types of examinations", 
      uz: "Barcha turdagi tekshiruvlar uchun professional ultratovush skaneri" 
    },
    category: "diagnostic",
    price: "от 1 800 000 ₽",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop",
    features: {
      ru: ["4D визуализация", "Допплеровское исследование", "Портативность"],
      en: ["4D visualization", "Doppler examination", "Portability"],
      uz: ["4D vizualizatsiya", "Doppler tekshiruvi", "Ko'chma"]
    },
    inStock: true
  },
  {
    id: 3,
    name: { 
      ru: "Хирургический стол OT-2000", 
      en: "Surgical Table OT-2000", 
      uz: "Jarrohlik stoli OT-2000" 
    },
    description: { 
      ru: "Многофункциональный операционный стол с электрическим приводом", 
      en: "Multifunctional operating table with electric drive", 
      uz: "Elektr haydovchili ko'p funksiyali operatsiya stoli" 
    },
    category: "surgical",
    price: "от 950 000 ₽",
    image: "https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=400&h=300&fit=crop",
    features: {
      ru: ["Электрическая регулировка", "Рентгенопрозрачность", "Простота управления"],
      en: ["Electric adjustment", "Radiolucent", "Easy control"],
      uz: ["Elektr sozlash", "Rentgen o'tkazuvchan", "Oson boshqarish"]
    },
    inStock: true
  },
  {
    id: 4,
    name: { 
      ru: "Анестезиологическая станция AS-500", 
      en: "Anesthesia Station AS-500", 
      uz: "Anesteziologik stansiya AS-500" 
    },
    description: { 
      ru: "Современная анестезиологическая станция с мониторингом", 
      en: "Modern anesthesia station with monitoring", 
      uz: "Monitoring bilan zamonaviy anesteziologik stansiya" 
    },
    category: "surgical",
    price: "от 3 200 000 ₽",
    image: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=400&h=300&fit=crop",
    features: {
      ru: ["Точное дозирование", "Мониторинг пациента", "Сенсорный экран"],
      en: ["Precise dosing", "Patient monitoring", "Touch screen"],
      uz: ["Aniq dozalash", "Bemor monitoringi", "Sensorli ekran"]
    },
    inStock: false
  },
  {
    id: 5,
    name: { 
      ru: "Электрокардиограф ECG-12", 
      en: "Electrocardiograph ECG-12", 
      uz: "Elektrokardiograf ECG-12" 
    },
    description: { 
      ru: "12-канальный ЭКГ с автоматической интерпретацией", 
      en: "12-channel ECG with automatic interpretation", 
      uz: "Avtomatik talqin bilan 12 kanalli EKG" 
    },
    category: "monitoring",
    price: "от 280 000 ₽",
    image: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=300&fit=crop",
    features: {
      ru: ["12 отведений", "Автоматический анализ", "Печать отчетов"],
      en: ["12 leads", "Automatic analysis", "Report printing"],
      uz: ["12 ta o'tkazgich", "Avtomatik tahlil", "Hisobot chop etish"]
    },
    inStock: true
  },
  {
    id: 6,
    name: { 
      ru: "Реанимационная кровать ICU-Pro", 
      en: "ICU Bed ICU-Pro", 
      uz: "Reanimatsiya karavoti ICU-Pro" 
    },
    description: { 
      ru: "Функциональная кровать для отделения интенсивной терапии", 
      en: "Functional bed for intensive care unit", 
      uz: "Intensiv terapiya bo'limi uchun funktsional karават" 
    },
    category: "furniture",
    price: "от 420 000 ₽",
    image: "https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=400&h=300&fit=crop",
    features: {
      ru: ["Электрические приводы", "Весы встроенные", "Боковые ограждения"],
      en: ["Electric drives", "Built-in scales", "Side rails"],
      uz: ["Elektr haydovchilar", "O'rnatilgan tarozilar", "Yon panjaralar"]
    },
    inStock: true
  }
];

const categories = {
  all: { ru: "Все категории", en: "All categories", uz: "Barcha kategoriyalar" },
  diagnostic: { ru: "Диагностическое оборудование", en: "Diagnostic Equipment", uz: "Diagnostika uskunalari" },
  surgical: { ru: "Хирургическое оборудование", en: "Surgical Equipment", uz: "Jarrohlik uskunalari" },
  monitoring: { ru: "Мониторинг", en: "Monitoring", uz: "Monitoring" },
  furniture: { ru: "Медицинская мебель", en: "Medical Furniture", uz: "Tibbiy mebel" }
};

const translations = {
  title: { ru: "Каталог медицинского оборудования", en: "Medical Equipment Catalog", uz: "Tibbiy asbob-uskunalar katalogi" },
  subtitle: { ru: "Профессиональное медицинское оборудование от ведущих производителей", en: "Professional medical equipment from leading manufacturers", uz: "Yetakchi ishlab chiqaruvchilardan professional tibbiy asbob-uskunalar" },
  search: { ru: "Поиск по каталогу...", en: "Search catalog...", uz: "Katalogda qidirish..." },
  category: { ru: "Категория", en: "Category", uz: "Kategoriya" },
  features: { ru: "Особенности", en: "Features", uz: "Xususiyatlar" },
  inStock: { ru: "В наличии", en: "In Stock", uz: "Mavjud" },
  outOfStock: { ru: "Под заказ", en: "On Order", uz: "Buyurtma bo'yicha" },
  addToCart: { ru: "В корзину", en: "Add to Cart", uz: "Savatga qo'shish" },
  requestQuote: { ru: "Запросить цену", en: "Request Quote", uz: "Narx so'rash" },
  noProducts: { ru: "Товары не найдены", en: "No products found", uz: "Mahsulotlar topilmadi" }
};

const Catalog = ({ language }: CatalogProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [favorites, setFavorites] = useState<number[]>([]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name[language].toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description[language].toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFavorite = (productId: number) => {
    setFavorites(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            {translations.title[language]}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {translations.subtitle[language]}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={translations.search[language]}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-64">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={translations.category[language]} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(categories).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  {value[language]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground">{translations.noProducts[language]}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="relative overflow-hidden rounded-t-lg">
                  <img
                    src={product.image}
                    alt={product.name[language]}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-background/80 backdrop-blur-sm"
                      onClick={() => toggleFavorite(product.id)}
                    >
                      <Heart 
                        className={`h-4 w-4 ${favorites.includes(product.id) ? 'fill-red-500 text-red-500' : ''}`} 
                      />
                    </Button>
                  </div>
                  <div className="absolute top-4 left-4">
                    <Badge variant={product.inStock ? "default" : "secondary"}>
                      {product.inStock ? translations.inStock[language] : translations.outOfStock[language]}
                    </Badge>
                  </div>
                </div>
                
                <CardHeader>
                  <CardTitle className="text-lg">{product.name[language]}</CardTitle>
                  <CardDescription>{product.description[language]}</CardDescription>
                  <div className="text-xl font-bold text-primary">{product.price}</div>
                </CardHeader>
                
                <CardContent>
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">{translations.features[language]}:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {product.features[language].map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button className="flex-1" disabled={!product.inStock}>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {translations.addToCart[language]}
                    </Button>
                    <Button variant="outline">
                      {translations.requestQuote[language]}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Catalog;