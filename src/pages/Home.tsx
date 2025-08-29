import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, Zap, Shield, Headphones, Globe, Stethoscope, Scissors, Heart, TestTube, Smile, Eye, FileText, Truck, Settings, GraduationCap, Wrench, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ROICalculator from '@/components/Calculator/ROICalculator';
import LeadForm from '@/components/forms/LeadForm';
import { useTranslation } from 'react-i18next';
import SEOHead from "@/components/SEO/SEOHead";

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
      }
    },
    en: {
      hero: {
        title: 'Med Service Centre',
        subtitle: 'Leading medical equipment integrator in Uzbekistan',
        description: 'Supply, installation,\nstaff training\nand technical support',
        cta: 'Calculate ROI',
        experience: '8 years experience',
        projects: '300+ projects',
        clients: 'Satisfied clients'
      }
    },
    uz: {
      hero: {
        title: 'Med Service Centre',
        subtitle: "O'zbekistondagi yetakchi tibbiy uskunalar integratori",
        description: "Yetkazib berish,\no'rnatish, xodimlarni o'qitish\nva texnik xizmat",
        cta: 'ROI hisoblagich',
        experience: 'Yillik tajriba',
        projects: 'Loyiha',
        clients: 'Mamnun mijozlar'
      }
    }
  };

  const t = content[language] || content['ru']; // Fallback to Russian if language is undefined

  // Early return if content is not available
  if (!t) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen">
      <SEOHead 
        title="Med Service Centre - Медицинское оборудование в Узбекистане"
        description="Ведущий интегратор медицинского оборудования и сервис-услуг в Узбекистане. Поставка, инсталляция, обучение, регистрация, сервис."
        keywords="медицинское оборудование, узбекистан, МРТ, УЗИ, рентген, сервис, поставка, инсталляция"
        type="website"
      />
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
            <div className="flex justify-center">
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-[28rem] lg:h-[28rem]">
                {/* Central Logo */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-52 h-52 lg:w-60 lg:h-60 flex items-center justify-center z-10">
                  <img 
                    src="/lovable-uploads/acdce942-978c-4243-9068-38f2c5bb0284.png" 
                    alt="Med Service Centre Logo" 
                    className="w-44 h-44 lg:w-52 lg:h-52 object-contain"
                  />
                </div>
                
                {/* Rotating Orbit Container */}
                <div className="absolute inset-0 animate-[spin_20s_linear_infinite]">
                  {/* Process Icons positioned in perfect circle */}
                  {[
                    { icon: FileText, label: language === 'ru' ? 'КП' : language === 'en' ? 'Quote' : 'Taklif', angle: 0 },
                    { icon: Truck, label: language === 'ru' ? 'Поставка' : language === 'en' ? 'Supply' : 'Yetkazish', angle: 60 },
                    { icon: Settings, label: language === 'ru' ? 'Установка' : language === 'en' ? 'Installation' : 'O\'rnatish', angle: 120 },
                    { icon: GraduationCap, label: language === 'ru' ? 'Обучение' : language === 'en' ? 'Training' : 'O\'qitish', angle: 180 },
                    { icon: Wrench, label: language === 'ru' ? 'Сервис' : language === 'en' ? 'Service' : 'Xizmat', angle: 240 },
                    { icon: TrendingUp, label: language === 'ru' ? 'Окупаемость' : language === 'en' ? 'ROI' : 'Rentabellik', angle: 300 }
                  ].map((item, index) => {
                    const IconComponent = item.icon;
                    const radius = window.innerWidth < 768 ? 120 : 180; // Distance from center - smaller on mobile
                    const x = Math.cos((item.angle - 90) * Math.PI / 180) * radius;
                    const y = Math.sin((item.angle - 90) * Math.PI / 180) * radius;
                    
                    return (
                      <div
                        key={index}
                        className="absolute top-1/2 left-1/2"
                        style={{
                          transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`
                        }}
                      >
                        <div className="text-center animate-[counter-rotate_20s_linear_infinite]">
                          <div className="relative">
                             <div className="w-10 h-10 sm:w-14 sm:h-14 lg:w-20 lg:h-20 bg-gradient-to-br from-msc-accent to-msc-primary rounded-full flex items-center justify-center mx-auto shadow-lg hover:scale-110 transition-transform">
                               <IconComponent className="w-5 h-5 sm:w-8 sm:h-8 lg:w-14 lg:h-14 text-white" />
                            </div>
                            <span className="text-white text-xs sm:text-sm font-medium block whitespace-nowrap absolute top-full left-1/2 transform -translate-x-1/2 mt-1 sm:mt-2">
                              {item.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
              {language === 'ru' ? 'Категории оборудования' : language === 'en' ? 'Equipment Categories' : 'Uskuna toifalari'}
            </h2>
            <p className="text-lg text-msc-text-light max-w-2xl mx-auto">
              {language === 'ru' ? 'Широкий спектр медицинского оборудования для всех направлений' : 
               language === 'en' ? 'Wide range of medical equipment for all medical fields' : 
               'Barcha yo\'nalishlar uchun keng assortimentdagi tibbiy uskunalar'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: language === 'ru' ? 'Диагностическое оборудование' : language === 'en' ? 'Diagnostic Equipment' : 'Diagnostika uskunalari', icon: Stethoscope, category: 'diagnostic' },
              { name: language === 'ru' ? 'Хирургическое оборудование' : language === 'en' ? 'Surgical Equipment' : 'Jarrohlik uskunalari', icon: Scissors, category: 'surgical' },
              { name: language === 'ru' ? 'Реабилитационное оборудование' : language === 'en' ? 'Rehabilitation Equipment' : 'Reabilitatsiya uskunalari', icon: Heart, category: 'rehabilitation' },
              { name: language === 'ru' ? 'Лабораторное оборудование' : language === 'en' ? 'Laboratory Equipment' : 'Laboratoriya uskunalari', icon: TestTube, category: 'laboratory' },
              { name: language === 'ru' ? 'Стоматологическое оборудование' : language === 'en' ? 'Dental Equipment' : 'Stomatologiya uskunalari', icon: Smile, category: 'dental' },
              { name: language === 'ru' ? 'Офтальмологическое оборудование' : language === 'en' ? 'Ophthalmology Equipment' : 'Oftalmologiya uskunalari', icon: Eye, category: 'ophthalmology' },
            ].map((category, index) => (
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
              {language === 'ru' ? 'Почему выбирают нас' : language === 'en' ? 'Why Choose Us' : 'Nega bizni tanlashadi?'}
            </h2>
            <p className="text-lg text-msc-text-light max-w-2xl mx-auto">
              {language === 'ru' ? 'Комплексный подход к решению медицинских задач' : 
               language === 'en' ? 'Comprehensive approach to medical solutions' : 
               'Tibbiy masalalarni hal qilishda kompleks yondashuv'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Shield,
                title: language === 'ru' ? 'Гарантия качества' : language === 'en' ? 'Quality Guarantee' : 'Sifat kafolati',
                description: language === 'ru' ? 'Работаем только с сертифицированным оборудованием ведущих мировых производителей' : 
                            language === 'en' ? 'We work only with certified equipment from leading global manufacturers' : 
                            'Faqat yetakchi jahon ishlab chiqaruvchilarining sertifikatlangan uskunalari bilan ishlaymiz'
              },
              {
                icon: Headphones,
                title: language === 'ru' ? 'Сервис 24/7' : language === 'en' ? '24/7 Service' : '24/7 texnik yordam',
                description: language === 'ru' ? 'Круглосуточная техническая поддержка и оперативное решение любых вопросов' : 
                            language === 'en' ? 'Round-the-clock technical support and quick resolution of any issues' : 
                            'Har qanday muammo bo\'yicha kunu-tun qo\'llab-quvvatlash'
              },
              {
                icon: Zap,
                title: language === 'ru' ? 'Быстрая установка' : language === 'en' ? 'Fast Installation' : 'Tezkor o\'rnatish',
                description: language === 'ru' ? 'Профессиональная команда инженеров обеспечивает быструю инсталляцию и настройку' : 
                            language === 'en' ? 'Professional team of engineers ensures quick installation and setup' : 
                            'Tajribali muhandislar jamoamiz uskunani tez va sifatli o\'rnatadi'
              },
              {
                icon: Globe,
                title: language === 'ru' ? 'Логистика по всему Узбекистану' : language === 'en' ? 'Logistics throughout Uzbekistan' : 'Respublika bo\'ylab logistika',
                description: language === 'ru' ? 'Доставка и установка оборудования в любой регион страны' : 
                            language === 'en' ? 'Delivery and installation of equipment in any region of the country' : 
                            'O\'zbekistonning istalgan hududiga yetkazib berish va montaj'
              }
            ].map((advantage, index) => (
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
          onClose={() => setShowConsultationForm(false)} 
        />
      )}
    </div>
  );
};

export default Home;
