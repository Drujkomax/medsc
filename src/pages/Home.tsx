import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, Zap, Shield, Headphones, Globe, Stethoscope, Scissors, Heart, TestTube, Smile, Eye, FileText, Truck, Settings, GraduationCap, Wrench, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ROICalculator from '@/components/Calculator/ROICalculator';
import LeadForm from '@/components/forms/LeadForm';

interface HomeProps {
  language: 'ru' | 'en' | 'uz';
}

const Home = ({ language }: HomeProps) => {
  const navigate = useNavigate();
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
        description: "- Поставка\n- Инсталляция\n- Обучение персонала\n- Техническое обслуживание",
        cta: 'Рассчитать ROI',
        experience: '8 лет опыта',
        projects: '300+ проектов',
        clients: 'Довольных клиентов'
      },
      categories: {
        title: 'Категории оборудования',
        subtitle: 'Широкий спектр медицинского оборудования для всех направлений',
        items: [
          { name: 'Диагностическое оборудование', icon: Stethoscope, category: 'diagnostic' },
          { name: 'Хирургическое оборудование', icon: Scissors, category: 'surgical' },
          { name: 'Реабилитационное оборудование', icon: Heart, category: 'rehabilitation' },
          { name: 'Лабораторное оборудование', icon: TestTube, category: 'laboratory' },
          { name: 'Стоматологическое оборудование', icon: Smile, category: 'dental' },
          { name: 'Офтальмологическое оборудование', icon: Eye, category: 'ophthalmology' },
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
        description: 'Supply, installation,\nstaff training\nand technical support\nof medical equipment.',
        cta: 'Calculate ROI',
        experience: '8 years experience',
        projects: '300+ projects',
        clients: 'Satisfied clients'
      },
      categories: {
        title: 'Equipment Categories',
        subtitle: 'Wide range of medical equipment for all medical fields',
        items: [
          { name: 'Diagnostic Equipment', icon: Stethoscope, category: 'diagnostic' },
          { name: 'Surgical Equipment', icon: Scissors, category: 'surgical' },
          { name: 'Rehabilitation Equipment', icon: Heart, category: 'rehabilitation' },
          { name: 'Laboratory Equipment', icon: TestTube, category: 'laboratory' },
          { name: 'Dental Equipment', icon: Smile, category: 'dental' },
          { name: 'Ophthalmology Equipment', icon: Eye, category: 'ophthalmology' },
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
        subtitle: "O'zbekistondagi yetakchi tibbiy uskunalar integratori",
        description: "Tibbiy uskunalarni yetkazib berish,\no'rnatish, xodimlarni o'qitish\nva texnik xizmat ko'rsatish.",
        cta: 'ROI hisoblagich',
        experience: 'Yillik tajriba',
        projects: 'Muvaffaqiyatli loyiha',
        clients: 'Mamnun mijozlar'
      },
      categories: {
        title: 'Uskuna toifalari',
        subtitle: 'Biz barcha yo\'nalishlar uchun keng assortimentdagi tibbiy uskunalarni taklif qilamiz',
        items: [
          { name: 'Diagnostika uskunalari', icon: Stethoscope, category: 'diagnostic' },
          { name: 'Jarrohlik uskunalari', icon: Scissors, category: 'surgical' },
          { name: 'Reabilitatsiya uskunalari', icon: Heart, category: 'rehabilitation' },
          { name: 'Laboratoriya uskunalari', icon: TestTube, category: 'laboratory' },
          { name: 'Stomatologiya uskunalari', icon: Smile, category: 'dental' },
          { name: 'Oftalmologiya uskunalari', icon: Eye, category: 'ophthalmology' },
        ]
      },
      advantages: {
        title: 'Nega bizni tanlashadi?',
        subtitle: 'Tibbiy masalalarni hal qilishda kompleks yondashuv',
        items: [
          {
            icon: Shield,
            title: 'Sifat kafolati',
            description: 'Biz faqat yetakchi jahon ishlab chiqaruvchilarining sertifikatlangan uskunalari bilan ishlaymiz.'
          },
          {
            icon: Headphones,
            title: '24/7 texnik yordam',
            description: 'Har qanday muammo bo\'yicha kunu-tun qo\'llab-quvvatlash.'
          },
          {
            icon: Zap,
            title: 'Tezkor o\'rnatish',
            description: 'Tajribali muhandislar jamoamiz uskunani tez va sifatli o\'rnatadi.'
          },
          {
            icon: Globe,
            title: 'Respublika bo\'ylab logistika',
            description: 'O\'zbekistonning istalgan hududiga yetkazib berish va montaj.'
          }
        ]
      }
    }
  };

  const t = content[language];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative text-white py-20 lg:py-32 overflow-hidden"
        style={{
          backgroundImage: 'url(/lovable-uploads/41f0d478-2266-4aba-bc99-7b40bd7b049e.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className={`max-w-2xl space-y-8 ${isVisible ? 'animate-reveal' : ''}`}>
              <div className="space-y-4">
                <h1 className="font-heading text-6xl lg:text-8xl font-bold leading-tight">
                  {t.hero.title.split(' ').map((word, index) => (
                    <span key={index} className="block">{word}</span>
                  ))}
                </h1>
                <p className="text-xl lg:text-2xl text-white/90 font-medium">
                  {t.hero.subtitle}
                </p>
                <p className="text-lg text-white/80 whitespace-pre-line">
                  {t.hero.description}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-white">8+</div>
                  <div className="text-sm text-white/90 font-medium">{t.hero.experience}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-white">300+</div>
                  <div className="text-sm text-white/90 font-medium">{t.hero.projects}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-white">100%</div>
                  <div className="text-sm text-white/90 font-medium">{t.hero.clients}</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-msc-accent hover:bg-msc-accent/90 text-white font-semibold px-8 py-4 text-lg flex-1 sm:flex-none sm:min-w-[240px]"
                  onClick={() => {
                    const calculatorSection = document.querySelector('#roi-calculator-section');
                    calculatorSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  {t.hero.cta}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button
                  size="lg"
                  className="bg-white text-msc-primary hover:bg-white/90 font-semibold px-8 py-4 text-lg flex-1 sm:flex-none sm:min-w-[240px]"
                  onClick={() => setShowConsultationForm(true)}
                >
                  {language === 'ru' ? 'Получить консультацию' : language === 'en' ? 'Get Consultation' : 'Maslahat olish'}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Process Cluster */}
            <div className="flex justify-start lg:justify-center">
              <div className="relative w-96 h-96 lg:w-[28rem] lg:h-[28rem]">
                {/* Central Logo */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-52 h-52 lg:w-60 lg:h-60 flex items-center justify-center z-10">
                  <img 
                    src="/lovable-uploads/acdce942-978c-4243-9068-38f2c5bb0284.png" 
                    alt="Med Service Centre Logo" 
                    className="w-44 h-44 lg:w-52 lg:h-52 object-contain"
                  />
                </div>
                
                {/* Process Icons positioned around the logo in circular orbit */}
                {/* КП - Top (0°) */}
                <div className="absolute top-1/2 left-1/2 w-full h-full animate-spin" style={{ animationDuration: '20s' }}>
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ top: '20px' }}>
                    <div className="text-center -rotate-[var(--rotation)] animate-[counter-rotate_20s_linear_infinite]" style={{ '--rotation': '0deg' } as any}>
                      <div className="w-18 h-18 bg-gradient-to-br from-msc-accent to-msc-primary rounded-full flex items-center justify-center mx-auto mb-2">
                        <FileText className="w-12 h-12 text-white" />
                      </div>
                      <span className="text-white text-xs font-medium block">
                        {language === 'ru' ? 'КП' : language === 'en' ? 'Quote' : 'Taklif'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Поставка - Top Right (60°) */}
                <div className="absolute top-1/2 left-1/2 w-full h-full animate-spin" style={{ animationDuration: '20s', animationDelay: '-3.33s' }}>
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ top: '20px' }}>
                    <div className="text-center animate-[counter-rotate_20s_linear_infinite]" style={{ animationDelay: '3.33s' }}>
                      <div className="w-18 h-18 bg-gradient-to-br from-msc-accent to-msc-primary rounded-full flex items-center justify-center mx-auto mb-2">
                        <Truck className="w-12 h-12 text-white" />
                      </div>
                      <span className="text-white text-xs font-medium block">
                        {language === 'ru' ? 'Поставка' : language === 'en' ? 'Supply' : 'Yetkazish'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Установка - Bottom Right (120°) */}
                <div className="absolute top-1/2 left-1/2 w-full h-full animate-spin" style={{ animationDuration: '20s', animationDelay: '-6.67s' }}>
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ top: '20px' }}>
                    <div className="text-center animate-[counter-rotate_20s_linear_infinite]" style={{ animationDelay: '6.67s' }}>
                      <div className="w-18 h-18 bg-gradient-to-br from-msc-accent to-msc-primary rounded-full flex items-center justify-center mx-auto mb-2">
                        <Settings className="w-12 h-12 text-white" />
                      </div>
                      <span className="text-white text-xs font-medium block">
                        {language === 'ru' ? 'Установка' : language === 'en' ? 'Installation' : 'O\'rnatish'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Обучение - Bottom (180°) */}
                <div className="absolute top-1/2 left-1/2 w-full h-full animate-spin" style={{ animationDuration: '20s', animationDelay: '-10s' }}>
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ top: '20px' }}>
                    <div className="text-center animate-[counter-rotate_20s_linear_infinite]" style={{ animationDelay: '10s' }}>
                      <div className="w-18 h-18 bg-gradient-to-br from-msc-accent to-msc-primary rounded-full flex items-center justify-center mx-auto mb-2">
                        <GraduationCap className="w-12 h-12 text-white" />
                      </div>
                      <span className="text-white text-xs font-medium block">
                        {language === 'ru' ? 'Обучение' : language === 'en' ? 'Training' : 'O\'qitish'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Сервис - Bottom Left (240°) */}
                <div className="absolute top-1/2 left-1/2 w-full h-full animate-spin" style={{ animationDuration: '20s', animationDelay: '-13.33s' }}>
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ top: '20px' }}>
                    <div className="text-center animate-[counter-rotate_20s_linear_infinite]" style={{ animationDelay: '13.33s' }}>
                      <div className="w-18 h-18 bg-gradient-to-br from-msc-accent to-msc-primary rounded-full flex items-center justify-center mx-auto mb-2">
                        <Wrench className="w-12 h-12 text-white" />
                      </div>
                      <span className="text-white text-xs font-medium block">
                        {language === 'ru' ? 'Сервис' : language === 'en' ? 'Service' : 'Xizmat'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Окупаемость - Top Left (300°) */}
                <div className="absolute top-1/2 left-1/2 w-full h-full animate-spin" style={{ animationDuration: '20s', animationDelay: '-16.67s' }}>
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ top: '20px' }}>
                    <div className="text-center animate-[counter-rotate_20s_linear_infinite]" style={{ animationDelay: '16.67s' }}>
                      <div className="w-18 h-18 bg-gradient-to-br from-msc-accent to-msc-primary rounded-full flex items-center justify-center mx-auto mb-2">
                        <TrendingUp className="w-12 h-12 text-white" />
                      </div>
                      <span className="text-white text-xs font-medium block">
                        {language === 'ru' ? 'Окупаемость' : language === 'en' ? 'ROI' : 'Rentabellik'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator Section */}
      <section id="roi-calculator-section" className="py-20 bg-gradient-to-br from-msc-bg to-msc-accent/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-msc-primary mb-4">
              {language === 'ru' ? 'Рассчитайте окупаемость' : language === 'en' ? 'Calculate Your ROI' : 'Sizning tibbiy uskunangiz qancha muddatda o\'zini oqlashini biling'}
            </h2>
            <p className="text-lg text-msc-text-light max-w-2xl mx-auto">
              {language === 'ru' 
                ? 'Узнайте, за какой период окупится ваше медицинское оборудование'
                : language === 'en'
                ? 'Find out how long it will take for your medical equipment to pay for itself'
                : 'Uskuna narxi va protseduralar sonini kiritib, o\'zini oqlash muddatini bilib oling'
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
              {language === 'ru' ? 'Свяжитесь с нами' : language === 'en' ? 'Contact Us' : 'Biz bilan bog\'laning'}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <p className="text-lg font-semibold text-msc-primary mt-3 leading-relaxed">
              {language === 'ru' ? 'Получите консультацию "Как быстро окупить оборудование в 2025" за 24 часа!' : language === 'en' ? 'Get consultation "How to quickly pay back equipment in 2025" in 24 hours!' : '"2025 yilda uskunani tez qanday to\'lash" bo\'yicha 24 soat ichida maslahat oling!'}
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
              <Card 
                key={index} 
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-msc-accent/20 cursor-pointer"
                onClick={() => navigate(`/catalog?category=${category.category}`)}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-msc-accent to-msc-primary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <category.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg text-msc-primary mb-2">{category.name}</h3>
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
            {language === 'ru' ? 'Готовы начать сотрудничество?' : language === 'en' ? 'Ready to Start Cooperation?' : 'Hamkorlikka tayyormisiz?'}
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
              className="border-white text-black hover:bg-white hover:text-msc-primary px-8 py-4 text-lg transition-all duration-300"
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
