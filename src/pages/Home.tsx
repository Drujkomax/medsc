import { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle, Zap, Shield, Headphones, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ROICalculator from '@/components/Calculator/ROICalculator';
import LeadForm from '@/components/forms/LeadForm';

interface HomeProps {
  language: 'ru' | 'en' | 'uz';
}

const Home = ({ language }: HomeProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showConsultationForm, setShowConsultationForm] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const content = {
    ru: {
      hero: {
        title: 'Med Service Centre',
        subtitle: 'Ведущий интегратор медицинского оборудования в Узбекистане',
        description: 'Поставка, инсталляция, обучение персонала и техническое обслуживание медицинского оборудования с 8-летним опытом и 300+ успешными проектами.',
        cta: 'Рассчитать ROI',
        experience: '8 лет опыта',
        projects: '300+ проектов',
        clients: 'Довольных клиентов'
      },
      categories: {
        title: 'Категории оборудования',
        subtitle: 'Широкий спектр медицинского оборудования для всех направлений',
        items: [
          { name: 'Диагностическое оборудование', count: '150+ товаров', icon: '🔬' },
          { name: 'Хирургическое оборудование', count: '80+ товаров', icon: '⚕️' },
          { name: 'Реабилитационное оборудование', count: '60+ товаров', icon: '🏥' },
          { name: 'Лабораторное оборудование', count: '90+ товаров', icon: '🧪' },
          { name: 'Стоматологическое оборудование', count: '70+ товаров', icon: '🦷' },
          { name: 'Офтальмологическое оборудование', count: '40+ товаров', icon: '👁️' },
        ]
      },
      advantages: {
        title: 'Почему выбирают нас',
        subtitle: 'Комплексный подход к решению медицинских задач',
        items: [
          {
            icon: Shield,
            title: 'Гарантия качества',
            description: 'Работаем только с сертифицированным оборудованием ведущих мировых производителей'
          },
          {
            icon: Headphones,
            title: 'Сервис 24/7',
            description: 'Круглосуточная техническая поддержка и оперативное решение любых вопросов'
          },
          {
            icon: Zap,
            title: 'Быстрая установка',
            description: 'Профессиональная команда инженеров обеспечивает быструю инсталляцию и настройку'
          },
          {
            icon: Globe,
            title: 'Логистика по всему Узбекистану',
            description: 'Доставка и установка оборудования в любой регион страны'
          }
        ]
      }
    },
    en: {
      hero: {
        title: 'Med Service Centre',
        subtitle: 'Leading medical equipment integrator in Uzbekistan',
        description: 'Supply, installation, staff training and technical support of medical equipment with 8 years of experience and 300+ successful projects.',
        cta: 'Calculate ROI',
        experience: '8 years experience',
        projects: '300+ projects',
        clients: 'Satisfied clients'
      },
      categories: {
        title: 'Equipment Categories',
        subtitle: 'Wide range of medical equipment for all medical fields',
        items: [
          { name: 'Diagnostic Equipment', count: '150+ products', icon: '🔬' },
          { name: 'Surgical Equipment', count: '80+ products', icon: '⚕️' },
          { name: 'Rehabilitation Equipment', count: '60+ products', icon: '🏥' },
          { name: 'Laboratory Equipment', count: '90+ products', icon: '🧪' },
          { name: 'Dental Equipment', count: '70+ products', icon: '🦷' },
          { name: 'Ophthalmology Equipment', count: '40+ products', icon: '👁️' },
        ]
      },
      advantages: {
        title: 'Why Choose Us',
        subtitle: 'Comprehensive approach to medical solutions',
        items: [
          {
            icon: Shield,
            title: 'Quality Guarantee',
            description: 'We work only with certified equipment from leading global manufacturers'
          },
          {
            icon: Headphones,
            title: '24/7 Service',
            description: 'Round-the-clock technical support and quick resolution of any issues'
          },
          {
            icon: Zap,
            title: 'Fast Installation',
            description: 'Professional team of engineers ensures quick installation and setup'
          },
          {
            icon: Globe,
            title: 'Logistics throughout Uzbekistan',
            description: 'Delivery and installation of equipment in any region of the country'
          }
        ]
      }
    },
    uz: {
      hero: {
        title: 'Med Service Centre',
        subtitle: "O'zbekistondagi yetakchi tibbiy asbob-uskunalar integratori",
        description: "Tibbiy asbob-uskunalarni yetkazib berish, o'rnatish, xodimlarni o'qitish va texnik xizmat ko'rsatish. 8 yillik tajriba va 300+ muvaffaqiyatli loyihalar.",
        cta: 'ROI hisoblash',
        experience: '8 yil tajriba',
        projects: '300+ loyiha',
        clients: 'Mamnun mijozlar'
      },
      categories: {
        title: 'Asbob-uskunalar toifalari',
        subtitle: 'Barcha tibbiy yo\'nalishlar uchun keng assortimentdagi tibbiy asbob-uskunalar',
        items: [
          { name: 'Diagnostika uskunalari', count: '150+ mahsulot', icon: '🔬' },
          { name: 'Jarrohlik uskunalari', count: '80+ mahsulot', icon: '⚕️' },
          { name: 'Reabilitatsiya uskunalari', count: '60+ mahsulot', icon: '🏥' },
          { name: 'Laboratoriya uskunalari', count: '90+ mahsulot', icon: '🧪' },
          { name: 'Stomatologiya uskunalari', count: '70+ mahsulot', icon: '🦷' },
          { name: 'Oftalmologiya uskunalari', count: '40+ mahsulot', icon: '👁️' },
        ]
      },
      advantages: {
        title: 'Nega bizni tanlaydilar',
        subtitle: 'Tibbiy masalalarni hal qilishda kompleks yondashuv',
        items: [
          {
            icon: Shield,
            title: 'Sifat kafolati',
            description: 'Biz faqat yetakchi jahon ishlab chiqaruvchilarning sertifikatlangan uskunalari bilan ishlaymiz'
          },
          {
            icon: Headphones,
            title: '24/7 xizmat',
            description: 'Kundalik texnik yordam va har qanday savollarni tezkor hal qilish'
          },
          {
            icon: Zap,
            title: 'Tezkor o\'rnatish',
            description: 'Professional muhandislar jamoasi tez o\'rnatish va sozlashni ta\'minlaydi'
          },
          {
            icon: Globe,
            title: "Butun O'zbekiston bo'yicha logistika",
            description: 'Mamlakatning istalgan hududiga uskunalarni yetkazib berish va o\'rnatish'
          }
        ]
      }
    }
  };

  const t = content[language];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-msc-primary via-msc-primary/95 to-msc-accent/90 text-white py-20 lg:py-32 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(/lovable-uploads/41f0d478-2266-4aba-bc99-7b40bd7b049e.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className={`space-y-8 ${isVisible ? 'animate-reveal' : ''}`}>
              <div className="space-y-4">
                <h1 className="font-heading text-4xl lg:text-6xl font-bold leading-tight">
                  {t.hero.title}
                </h1>
                <p className="text-xl lg:text-2xl text-white/90 font-medium">
                  {t.hero.subtitle}
                </p>
                <p className="text-lg text-white/80 max-w-xl">
                  {t.hero.description}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-msc-accent">8+</div>
                  <div className="text-sm text-white/80">{t.hero.experience}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-msc-accent">300+</div>
                  <div className="text-sm text-white/80">{t.hero.projects}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-msc-accent">100%</div>
                  <div className="text-sm text-white/80">{t.hero.clients}</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-msc-accent hover:bg-msc-accent/90 text-white font-semibold px-8 py-4 text-lg"
                >
                  {t.hero.cta}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button
                  size="lg"
                  className="bg-white text-msc-primary hover:bg-white/90 font-semibold px-8 py-4 text-lg"
                  onClick={() => setShowConsultationForm(true)}
                >
                  {language === 'ru' ? 'Получить консультацию' : language === 'en' ? 'Get Consultation' : 'Maslahat olish'}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Hero Animation - Logo Video */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative w-64 h-64 lg:w-80 lg:h-80">
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="w-full h-full object-contain"
                >
                  <source src="/logo-animation.mp4" type="video/mp4" />
                  <source src="/logo-animation.webm" type="video/webm" />
                  {/* Fallback if video doesn't load */}
                  <div className="w-full h-full bg-gradient-to-br from-msc-accent to-white/20 hexagon-border animate-glow flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="text-4xl lg:text-6xl font-bold mb-2">MSC</div>
                      <div className="text-sm lg:text-base opacity-80">Medical Excellence</div>
                    </div>
                  </div>
                </video>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator Section */}
      <section className="py-20 bg-gradient-to-br from-msc-bg to-msc-accent/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-msc-primary mb-4">
              {language === 'ru' ? 'Рассчитайте окупаемость' : language === 'en' ? 'Calculate Your ROI' : 'ROI ni hisoblang'}
            </h2>
            <p className="text-lg text-msc-text-light max-w-2xl mx-auto">
              {language === 'ru' 
                ? 'Узнайте, за какой период окупится ваше медицинское оборудование'
                : language === 'en'
                ? 'Find out how long it will take for your medical equipment to pay for itself'
                : 'Tibbiy asbob-uskunangiz qancha vaqtda o\'zini oqlashini bilib oling'
              }
            </p>
          </div>
          
          <div className="flex justify-center">
            <ROICalculator language={language} />
          </div>
          
          {/* Call to Action after Calculator */}
          <div className="text-center mt-12">
            <Button
              size="lg"
              className="bg-msc-accent hover:bg-msc-accent/90 text-white font-semibold px-8 py-4 text-lg shadow-lg"
              onClick={() => setShowConsultationForm(true)}
            >
              {language === 'ru' ? 'Запросить коммерческое предложение' : language === 'en' ? 'Request Commercial Offer' : 'Tijoriy taklif so\'rash'}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <p className="text-sm text-msc-text-light mt-2">
              {language === 'ru' ? 'Получите персональное предложение за 24 часа' : language === 'en' ? 'Get a personalized offer within 24 hours' : '24 soat ichida shaxsiy taklif oling'}
            </p>
          </div>
        </div>
      </section>

      {/* Equipment Categories */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-msc-primary mb-4">
              {t.categories.title}
            </h2>
            <p className="text-lg text-msc-text-light max-w-2xl mx-auto">
              {t.categories.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.categories.items.map((category, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-msc-accent/20">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">{category.icon}</div>
                  <h3 className="font-semibold text-lg text-msc-primary mb-2">{category.name}</h3>
                  <p className="text-msc-accent font-medium">{category.count}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Advantages */}
      <section className="py-20 bg-gradient-to-br from-msc-primary/5 to-msc-accent/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-msc-primary mb-4">
              {t.advantages.title}
            </h2>
            <p className="text-lg text-msc-text-light max-w-2xl mx-auto">
              {t.advantages.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {t.advantages.items.map((advantage, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-msc-accent to-msc-primary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <advantage.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-lg text-msc-primary mb-2">{advantage.title}</h3>
                <p className="text-msc-text-light">{advantage.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 bg-gradient-to-br from-msc-primary to-msc-accent text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl lg:text-4xl font-bold mb-4">
            {language === 'ru' ? 'Готовы начать сотрудничество?' : language === 'en' ? 'Ready to Start Cooperation?' : 'Hamkorlikni boshlashga tayyormisiz?'}
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            {language === 'ru' 
              ? 'Свяжитесь с нами сегодня и получите профессиональную консультацию по выбору медицинского оборудования'
              : language === 'en'
              ? 'Contact us today and get professional consultation on choosing medical equipment'
              : 'Bugun biz bilan bog\'laning va tibbiy asbob-uskunalarni tanlash bo\'yicha professional maslahat oling'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-msc-primary hover:bg-white/90 font-semibold px-8 py-4 text-lg"
              onClick={() => setShowConsultationForm(true)}
            >
              {language === 'ru' ? 'Оставить заявку' : language === 'en' ? 'Submit Request' : 'Ariza qoldirish'}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-msc-primary px-8 py-4 text-lg transition-all duration-300"
              onClick={() => setShowConsultationForm(true)}
            >
              {language === 'ru' ? 'Связаться с менеджером' : language === 'en' ? 'Contact Manager' : 'Menejer bilan bog\'lanish'}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Lead Form Modal */}
      {showConsultationForm && (
        <LeadForm 
          language={language} 
          onClose={() => setShowConsultationForm(false)} 
        />
      )}
    </div>
  );
};

export default Home;