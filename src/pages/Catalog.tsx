import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Heart, Eye, Loader2, Package } from "lucide-react";
import { useProducts } from '@/hooks/useProducts';
import { toast } from 'sonner';
import { getCountryFlag } from '@/utils/countries';
import QuoteRequestForm from '@/components/forms/QuoteRequestForm';

interface CatalogProps {
  language: 'ru' | 'en' | 'uz';
}

// Categories with tags for equipment
const getCategoryTag = (category: string, language: 'ru' | 'en' | 'uz') => {
  const categoryTags = {
    diagnostic: { ru: 'Диагностическое', en: 'Diagnostic', uz: 'Diagnostika' },
    surgical: { ru: 'Хирургическое', en: 'Surgical', uz: 'Jarrohlik' },
    monitoring: { ru: 'Мониторинг', en: 'Monitoring', uz: 'Monitoring' },
    laboratory: { ru: 'Лабораторное', en: 'Laboratory', uz: 'Laboratoriya' },
    rehabilitation: { ru: 'Реабилитационное', en: 'Rehabilitation', uz: 'Reabilitatsiya' },
    dental: { ru: 'Стоматологическое', en: 'Dental', uz: 'Stomatologiya' },
    ophthalmology: { ru: 'Офтальмологическое', en: 'Ophthalmology', uz: 'Oftalmologiya' },
    furniture: { ru: 'Медицинская мебель', en: 'Medical Furniture', uz: 'Tibbiy mebel' }
  };
  
  return categoryTags[category as keyof typeof categoryTags]?.[language] || category;
};

const categories = {
  all: { ru: "Все категории", en: "All categories", uz: "Barcha kategoriyalar" },
  diagnostic: { ru: "Диагностическое оборудование", en: "Diagnostic Equipment", uz: "Diagnostika uskunalari" },
  surgical: { ru: "Хирургическое оборудование", en: "Surgical Equipment", uz: "Jarrohlik uskunalari" },
  monitoring: { ru: "Мониторинг", en: "Monitoring", uz: "Monitoring" },
  laboratory: { ru: "Лабораторное оборудование", en: "Laboratory Equipment", uz: "Laboratoriya uskunalari" },
  rehabilitation: { ru: "Реабилитационное оборудование", en: "Rehabilitation Equipment", uz: "Reabilitatsiya uskunalari" },
  dental: { ru: "Стоматологическое оборудование", en: "Dental Equipment", uz: "Stomatologiya uskunalari" },
  ophthalmology: { ru: "Офтальмологическое оборудование", en: "Ophthalmology Equipment", uz: "Oftalmologiya uskunalari" },
  furniture: { ru: "Медицинская мебель", en: "Medical Furniture", uz: "Tibbiy mebel" }
};

const translations = {
  title: { ru: "Каталог медицинского оборудования", en: "Medical Equipment Catalog", uz: "Tibbiy asbob-uskunalar katalogi" },
  subtitle: { ru: "Профессиональное медицинское оборудование от ведущих производителей", en: "Professional medical equipment from leading manufacturers", uz: "Yetakchi ishlab chiqaruvchilardan professional tibbiy asbob-uskunalar" },
  search: { ru: "Поиск по каталогу...", en: "Search catalog...", uz: "Katalogda qidirish..." },
  category: { ru: "Категория", en: "Category", uz: "Kategoriya" },
  features: { ru: "Особенности", en: "Features", uz: "Xususiyatlar" },
  details: { ru: "Подробнее", en: "Details", uz: "Batafsil" },
  requestQuote: { ru: "Запросить КП", en: "Request Quote", uz: "KP so'rash" },
  noProducts: { ru: "Товары не найдены", en: "No products found", uz: "Mahsulotlar topilmadi" }
};

const Catalog = ({ language }: CatalogProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  const { products, loading, error } = useProducts();

  // Update selected category when URL changes
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    if (categoryFromUrl && categoryFromUrl !== selectedCategory) {
      setSelectedCategory(categoryFromUrl);
    }
  }, [searchParams, selectedCategory]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name[language].toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description[language].toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFavorite = (productId: string) => {
    setFavorites(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-lg">Загружаем каталог...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Ошибка загрузки</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div 
        className="relative py-16 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/lovable-uploads/4c70d2a2-2735-43a5-904b-62be351fa867.png')`
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
            {translations.title[language]}
          </h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
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
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="relative overflow-hidden rounded-t-lg">
                  {product.images?.cover ? (
                    <img
                      src={product.images.cover}
                      alt={product.name[language]}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  ) : (
                    <div className="w-full h-48 bg-muted flex items-center justify-center">
                      <Package className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
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
                    <Badge variant="default">
                      {getCategoryTag(product.category, language)}
                    </Badge>
                  </div>
                </div>
                
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg flex-1">{product.name[language]}</CardTitle>
                    {product.country && (
                      <div className="bg-black text-white text-xs px-2 py-1 rounded-sm flex items-center gap-1 ml-2">
                        <span className="text-sm">{getCountryFlag(product.country)}</span>
                      </div>
                    )}
                  </div>
                  <CardDescription>{product.description[language]}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  {product.features && product.features[language] && product.features[language].length > 0 && (
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
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1" 
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {translations.details[language]}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowQuoteForm(true);
                      }}
                    >
                      {translations.requestQuote[language]}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quote Request Form */}
      {showQuoteForm && (
        <QuoteRequestForm
          language={language}
          product={selectedProduct}
          onClose={() => {
            setShowQuoteForm(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
};

export default Catalog;