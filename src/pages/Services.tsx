import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Wrench, GraduationCap, Zap, Calendar, Check, Phone } from "lucide-react";
import { useTranslation } from 'react-i18next';
import SEOHead from "@/components/SEO/SEOHead";
import { formatUzbekPhoneNumber, validateUzbekPhoneNumber, isValidUzbekPhoneLength, isCompleteUzbekPhone } from '@/lib/phoneValidation';

const Services = () => {
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string>("");
  const [phoneValue, setPhoneValue] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const { t, i18n } = useTranslation();

  const content = {
    ru: {
      title: "Наши услуги",
      subtitle: "Комплексное сервисное обслуживание медицинского оборудования",
      services: [
        {
          icon: <Wrench className="w-8 h-8" />,
          title: "Установка и ввод в эксплуатацию",
          price: "от 500$",
          description: "Профессиональная установка медицинского оборудования с последующим вводом в эксплуатацию",
          features: [
            "Подготовка помещения",
            "Установка оборудования",
            "Ввод в эксплуатацию",
            "Гарантия на установку"
          ]
        },
        {
          icon: <GraduationCap className="w-8 h-8" />,
          title: "Обучение персонала",
          price: "от 300$",
          description: "Комплексное обучение медицинского персонала работе с новым оборудованием",
          features: [
            "Теоретический курс",
            "Практические занятия",
            "Сертификация персонала",
            "Учебные материалы"
          ]
        },
        {
          icon: <Zap className="w-8 h-8" />,
          title: "Техническое обслуживание 24/7",
          price: "от 150$",
          description: "Круглосуточная техническая поддержка и обслуживание медицинского оборудования",
          features: [
            "Выезд инженера за 4 часа",
            "Диагностика на месте",
            "Оригинальные запчасти",
            "Удаленная поддержка"
          ]
        },
        {
          icon: <Calendar className="w-8 h-8" />,
          title: "Аренда оборудования",
          price: "от 500$/мес",
          description: "Гибкие условия аренды медицинского оборудования для краткосрочных и долгосрочных проектов",
          features: [
            "Минимальный срок - 1 месяц",
            "Обслуживание включено",
            "Скидка при выкупе",
            "Быстрая замена"
          ]
        }
      ],
      orderService: "Заказать услугу",
      orderForm: {
        title: "Заказать услугу",
        name: "Имя",
        phone: "Телефон",
        email: "Email",
        company: "Организация",
        message: "Сообщение",
        submit: "Отправить заявку",
        success: "Заявка отправлена успешно!"
      }
    },
    en: {
      title: "Our Services",
      subtitle: "Comprehensive service for medical equipment",
      services: [
        {
          icon: <Wrench className="w-8 h-8" />,
          title: "Installation and Commissioning",
          price: "from $500",
          description: "Professional installation of medical equipment with subsequent commissioning",
          features: [
            "Room preparation",
            "Equipment installation",
            "Commissioning",
            "Installation warranty"
          ]
        },
        {
          icon: <GraduationCap className="w-8 h-8" />,
          title: "Staff Training",
          price: "from $300",
          description: "Comprehensive training of medical staff to work with new equipment",
          features: [
            "Theoretical course",
            "Practical sessions",
            "Staff certification",
            "Training materials"
          ]
        },
        {
          icon: <Zap className="w-8 h-8" />,
          title: "24/7 Technical Service",
          price: "from $150",
          description: "Round-the-clock technical support and maintenance of medical equipment",
          features: [
            "Engineer call within 4 hours",
            "On-site diagnostics",
            "Original spare parts",
            "Remote support"
          ]
        },
        {
          icon: <Calendar className="w-8 h-8" />,
          title: "Equipment Rental",
          price: "from $500/month",
          description: "Flexible rental conditions for medical equipment for short-term and long-term projects",
          features: [
            "Minimum term - 1 month",
            "Service included",
            "Discount on purchase",
            "Quick replacement"
          ]
        }
      ],
      orderService: "Order Service",
      orderForm: {
        title: "Order Service",
        name: "Name",
        phone: "Phone",
        email: "Email",
        company: "Organization",
        message: "Message",
        submit: "Submit Request",
        success: "Request sent successfully!"
      }
    },
    uz: {
      title: "Bizning xizmatlarimiz",
      subtitle: "Tibbiy asbob-uskunalar uchun keng qamrovli xizmat",
      services: [
        {
          icon: <Wrench className="w-8 h-8" />,
          title: "O'rnatish va ishga tushirish",
          price: "500$ dan",
          description: "Tibbiy asbob-uskunalarni professional o'rnatish va keyingi ishga tushirish",
          features: [
            "Xonani tayyorlash",
            "Jihozni o'rnatish",
            "Ishga tushirish",
            "O'rnatishga kafolat"
          ]
        },
        {
          icon: <GraduationCap className="w-8 h-8" />,
          title: "Xodimlarni o'qitish",
          price: "300$ dan",
          description: "Tibbiy xodimlarni yangi jihozlar bilan ishlashga keng qamrovli o'qitish",
          features: [
            "Nazariy kurs",
            "Amaliy mashg'ulotlar",
            "Xodimlarni sertifikatlash",
            "O'quv materiallari"
          ]
        },
        {
          icon: <Zap className="w-8 h-8" />,
          title: "24/7 Texnik xizmat",
          price: "150$ dan",
          description: "Tibbiy asbob-uskunalarni 24 soat texnik qo'llab-quvvatlash va xizmat ko'rsatish",
          features: [
            "4 soat ichida muhandis chaqiruvi",
            "Joyida diagnostika",
            "Asl ehtiyot qismlar",
            "Masofaviy qo'llab-quvvatlash"
          ]
        },
        {
          icon: <Calendar className="w-8 h-8" />,
          title: "Jihozlarni ijaraga berish",
          price: "500$/oylik dan",
          description: "Qisqa va uzoq muddatli loyihalar uchun tibbiy asbob-uskunalarni moslashuvchan ijara shartlari",
          features: [
            "Minimal muddat - 1 oy",
            "Xizmat kiritilgan",
            "Sotib olishda chegirma",
            "Tez almashtirish"
          ]
        }
      ],
      orderService: "Xizmat buyurtma qilish",
      orderForm: {
        title: "Xizmat buyurtma qilish",
        name: "Ism",
        phone: "Telefon",
        email: "Email",
        company: "Tashkilot",
        message: "Xabar",
        submit: "So'rov yuborish",
        success: "So'rov muvaffaqiyatli yuborildi!"
      }
    }
  };

  const currentContent = content[i18n.language as 'ru' | 'en' | 'uz'] || content['ru'];

  const handleOrderService = (serviceName: string) => {
    setSelectedService(serviceName);
    setPhoneValue("");
    setPhoneError("");
    setIsOrderDialogOpen(true);
  };

  const handlePhoneChange = (value: string) => {
    if (!isValidUzbekPhoneLength(value)) return;
    
    const formatted = formatUzbekPhoneNumber(value);
    setPhoneValue(formatted);
    
    if (formatted.length > 0) {
      if (!isCompleteUzbekPhone(formatted)) {
        const lang = i18n.language;
        setPhoneError(lang === 'ru' ? 'Номер должен содержать 9 цифр' : lang === 'en' ? 'Number must contain 9 digits' : 'Raqam 9 ta raqamdan iborat bo\'lishi kerak');
      } else if (!validateUzbekPhoneNumber(formatted)) {
        const lang = i18n.language;
        setPhoneError(lang === 'ru' ? 'Неверный формат номера' : lang === 'en' ? 'Invalid phone format' : 'Noto\'g\'ri telefon formati');
      } else {
        setPhoneError('');
      }
    } else {
      setPhoneError('');
    }
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone before submission
    if (phoneValue && (!isCompleteUzbekPhone(phoneValue) || !validateUzbekPhoneNumber(phoneValue))) {
      const lang = i18n.language;
      setPhoneError(lang === 'ru' ? 'Введите корректный узбекский номер' : lang === 'en' ? 'Enter a valid Uzbek number' : 'To\'g\'ri O\'zbek raqamini kiriting');
      return;
    }
    
    toast.success(currentContent.orderForm.success);
    setIsOrderDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-background py-20">
      <SEOHead
        title="Услуги — поставка, аренда и сервис — Med Service Centre"
        description="Поставка медоборудования, аренда ABL800 Flex, внедрение, обучение и сервисное обслуживание по Узбекистану."
        keywords="услуги медоборудование, поставка медоборудования, аренда ABL800 Flex, внедрение оборудования, обучение медперсонала, сервисное обслуживание медтехники"
      />
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-heading font-bold text-foreground mb-6">
            {currentContent.title}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {currentContent.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {currentContent.services.map((service, index) => (
            <Card key={index} className="bg-card/50 backdrop-blur-sm border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 group">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    {service.icon}
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-foreground">
                      {service.title}
                    </CardTitle>
                    <p className="text-lg font-semibold text-primary mt-1">
                      {service.price}
                    </p>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  {service.description}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-6">
                  {service.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
                <Button 
                  onClick={() => handleOrderService(service.title)}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  {currentContent.orderService}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">
              {currentContent.orderForm.title}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitOrder} className="space-y-4">
            <div>
              <Label htmlFor="service">{currentContent.orderForm.title}</Label>
              <Input 
                id="service" 
                value={selectedService} 
                readOnly 
                className="bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="name">{currentContent.orderForm.name}</Label>
              <Input id="name" required />
            </div>
            <div>
              <Label htmlFor="phone">{currentContent.orderForm.phone}</Label>
              <div className="relative">
                <div className="absolute left-3 top-2.5 flex items-center gap-1.5 pointer-events-none">
                  <span className="text-base">🇺🇿</span>
                  <span className="text-sm font-medium">+998</span>
                  <div className="w-px h-3 bg-gray-300 mx-1"></div>
                </div>
                <Input 
                  id="phone" 
                  type="tel" 
                  value={phoneValue}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className={`pl-20 ${phoneError ? 'border-red-500' : ''}`}
                  placeholder="XX XXX XX XX"
                  maxLength={12}
                  required 
                />
                {phoneError && (
                  <p className="text-red-500 text-xs mt-1">{phoneError}</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="email">{currentContent.orderForm.email}</Label>
              <Input id="email" type="email" required />
            </div>
            <div>
              <Label htmlFor="company">{currentContent.orderForm.company}</Label>
              <Input id="company" />
            </div>
            <div>
              <Label htmlFor="message">{currentContent.orderForm.message}</Label>
              <Textarea id="message" rows={3} />
            </div>
            <Button type="submit" className="w-full">
              {currentContent.orderForm.submit}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Services;
