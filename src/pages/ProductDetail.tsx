import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Heart, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProductDetailProps {
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
  specifications: { ru: { [key: string]: string }; en: { [key: string]: string }; uz: { [key: string]: string } };
  advantages: { ru: string[]; en: string[]; uz: string[] };
  targetAudience: { ru: string[]; en: string[]; uz: string[] };
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
    inStock: true,
    specifications: {
      ru: {
        "Разрешение детектора": "3072 x 3072 пикселей",
        "Размер детектора": "35 x 43 см",
        "Время экспозиции": "0.1 - 6.3 сек",
        "Напряжение трубки": "40-150 кВ",
        "Ток трубки": "10-800 мА"
      },
      en: {
        "Detector Resolution": "3072 x 3072 pixels",
        "Detector Size": "35 x 43 cm",
        "Exposure Time": "0.1 - 6.3 sec",
        "Tube Voltage": "40-150 kV",
        "Tube Current": "10-800 mA"
      },
      uz: {
        "Detektor aniqligigi": "3072 x 3072 piksel",
        "Detektor o'lchami": "35 x 43 sm",
        "Ekspozitsiya vaqti": "0.1 - 6.3 soniya",
        "Trubka kuchlanishi": "40-150 kV",
        "Trubka toki": "10-800 mA"
      }
    },
    advantages: {
      ru: [
        "Снижение дозы облучения пациента до 50%",
        "Мгновенный просмотр изображений",
        "Интеграция с PACS системами",
        "Простота в эксплуатации",
        "Высокая надежность компонентов"
      ],
      en: [
        "Patient radiation dose reduction up to 50%",
        "Instant image viewing",
        "PACS systems integration",
        "Easy operation",
        "High component reliability"
      ],
      uz: [
        "Bemor radiatsiya dozasini 50% gacha kamaytirish",
        "Tezkor tasvir ko'rish",
        "PACS tizimlari bilan integratsiya",
        "Oson foydalanish",
        "Komponentlarning yuqori ishonchliligi"
      ]
    },
    targetAudience: {
      ru: [
        "Больницы и клиники",
        "Диагностические центры",
        "Травматологические пункты",
        "Частные медицинские центры",
        "Поликлиники"
      ],
      en: [
        "Hospitals and clinics",
        "Diagnostic centers", 
        "Trauma units",
        "Private medical centers",
        "Polyclinics"
      ],
      uz: [
        "Kasalxonalar va klinikalar",
        "Diagnostika markazlari",
        "Travmatologiya punktlari",
        "Xususiy tibbiy markazlar",
        "Poliklinikalar"
      ]
    }
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
    inStock: true,
    specifications: {
      ru: {
        "Частотный диапазон": "1-15 МГц",
        "Глубина сканирования": "до 35 см",
        "Количество каналов": "128",
        "Размер экрана": "21.5 дюймов",
        "Вес": "85 кг"
      },
      en: {
        "Frequency Range": "1-15 MHz",
        "Scanning Depth": "up to 35 cm",
        "Number of Channels": "128",
        "Screen Size": "21.5 inches",
        "Weight": "85 kg"
      },
      uz: {
        "Chastota diapazoni": "1-15 MGts",
        "Skanerlash chuqurligi": "35 sm gacha",
        "Kanallar soni": "128",
        "Ekran o'lchami": "21.5 dyuym",
        "Og'irligi": "85 kg"
      }
    },
    advantages: {
      ru: [
        "Превосходное качество изображения",
        "Расширенные возможности Допплера",
        "Интуитивно понятный интерфейс",
        "Быстрая загрузка системы",
        "Энергоэффективность"
      ],
      en: [
        "Superior image quality",
        "Advanced Doppler capabilities",
        "Intuitive interface",
        "Fast system boot",
        "Energy efficiency"
      ],
      uz: [
        "Ajoyib tasvir sifati",
        "Kengaytirilgan Doppler imkoniyatlari",
        "Intuitiv interfeys",
        "Tizimning tez yuklanishi",
        "Energiya tejamkorligi"
      ]
    },
    targetAudience: {
      ru: [
        "Гинекологические отделения",
        "Кардиологические центры",
        "Акушерские клиники",
        "Общие медицинские центры",
        "Урологические отделения"
      ],
      en: [
        "Gynecological departments",
        "Cardiology centers",
        "Obstetric clinics",
        "General medical centers",
        "Urology departments"
      ],
      uz: [
        "Ginekologiya bo'limlari",
        "Kardiologiya markazlari",
        "Akusherlik klinikalari",
        "Umumiy tibbiy markazlar",
        "Urologiya bo'limlari"
      ]
    }
  }
];

const translations = {
  backToCatalog: { ru: "Назад к каталогу", en: "Back to Catalog", uz: "Katalogga qaytish" },
  inStock: { ru: "В наличии", en: "In Stock", uz: "Mavjud" },
  outOfStock: { ru: "Под заказ", en: "On Order", uz: "Buyurtma bo'yicha" },
  specifications: { ru: "Технические характеристики", en: "Technical Specifications", uz: "Texnik xususiyatlar" },
  advantages: { ru: "Преимущества", en: "Advantages", uz: "Afzalliklar" },
  targetAudience: { ru: "Для кого подойдёт?", en: "Who is it for?", uz: "Kim uchun mos?" },
  requestQuote: { ru: "Запросить КП", en: "Request Quote", uz: "KP so'rash" },
  requestQuoteTitle: { ru: "Запрос коммерческого предложения", en: "Request Commercial Proposal", uz: "Tijoriy taklif so'rovi" },
  requestQuoteDesc: { ru: "Заполните форму и мы свяжемся с вами в ближайшее время", en: "Fill out the form and we will contact you soon", uz: "Shaklni to'ldiring va biz tez orada siz bilan bog'lanamiz" },
  companyName: { ru: "Название организации", en: "Company Name", uz: "Tashkilot nomi" },
  contactPerson: { ru: "Контактное лицо", en: "Contact Person", uz: "Aloqa shaxsi" },
  phone: { ru: "Телефон", en: "Phone", uz: "Telefon" },
  email: { ru: "Email", en: "Email", uz: "Email" },
  message: { ru: "Дополнительные пожелания", en: "Additional Requirements", uz: "Qo'shimcha talablar" },
  submit: { ru: "Отправить заявку", en: "Submit Request", uz: "So'rov yuborish" },
  successMessage: { ru: "Заявка отправлена! Мы свяжемся с вами в ближайшее время.", en: "Request sent! We will contact you soon.", uz: "So'rov yuborildi! Biz tez orada siz bilan bog'lanamiz." },
  productNotFound: { ru: "Товар не найден", en: "Product not found", uz: "Mahsulot topilmadi" }
};

const ProductDetail = ({ language }: ProductDetailProps) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    phone: '',
    email: '',
    message: ''
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const product = products.find(p => p.id === parseInt(id || ''));

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">{translations.productNotFound[language]}</h1>
          <Button onClick={() => navigate('/catalog')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {translations.backToCatalog[language]}
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the data to your backend
    toast({
      title: translations.successMessage[language],
      description: `${product.name[language]} - ${formData.companyName}`,
    });
    setIsDialogOpen(false);
    setFormData({
      companyName: '',
      contactPerson: '',
      phone: '',
      email: '',
      message: ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="outline" 
          onClick={() => navigate('/catalog')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {translations.backToCatalog[language]}
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Product Image */}
          <div className="relative">
            <img
              src={product.image}
              alt={product.name[language]}
              className="w-full h-96 object-cover rounded-lg"
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="bg-background/80 backdrop-blur-sm"
                onClick={() => setIsFavorite(!isFavorite)}
              >
                <Heart 
                  className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} 
                />
              </Button>
            </div>
            <div className="absolute top-4 left-4">
              <Badge variant={product.inStock ? "default" : "secondary"}>
                {product.inStock ? translations.inStock[language] : translations.outOfStock[language]}
              </Badge>
            </div>
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-4">
              {product.name[language]}
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              {product.description[language]}
            </p>
            <div className="text-2xl font-bold text-primary mb-6">
              {product.price}
            </div>

            <div className="space-y-4">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    {translations.requestQuote[language]}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{translations.requestQuoteTitle[language]}</DialogTitle>
                    <DialogDescription>
                      {translations.requestQuoteDesc[language]}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="companyName">{translations.companyName[language]}</Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactPerson">{translations.contactPerson[language]}</Label>
                      <Input
                        id="contactPerson"
                        value={formData.contactPerson}
                        onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">{translations.phone[language]}</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">{translations.email[language]}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="message">{translations.message[language]}</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        rows={3}
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      {translations.submit[language]}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="specifications" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="specifications">{translations.specifications[language]}</TabsTrigger>
                <TabsTrigger value="advantages">{translations.advantages[language]}</TabsTrigger>
                <TabsTrigger value="target">{translations.targetAudience[language]}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="specifications" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(product.specifications[language]).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center py-2 border-b border-border">
                      <span className="font-medium text-foreground">{key}:</span>
                      <span className="text-muted-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="advantages" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {product.advantages[language].map((advantage, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                      <span className="text-foreground">{advantage}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="target" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {product.targetAudience[language].map((audience, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0"></div>
                      <span className="text-foreground">{audience}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductDetail;