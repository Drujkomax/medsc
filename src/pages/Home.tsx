import { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle, Zap, Shield, Headphones, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ROICalculator from '@/components/Calculator/ROICalculator';

interface HomeProps {
  language: 'ru' | 'en';
}

const Home = ({ language }: HomeProps) => {
  const [isVisible, setIsVisible] = useState(false);

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
    }
  };

  const t = content[language];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-msc-primary via-msc-primary/95 to-msc-accent/90 text-white py-20 lg:py-32 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-8 gap-4 h-full">
            {Array.from({ length: 64 }).map((_, i) => (
              <div key={i} className="hexagon bg-white/20 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        </div>

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

              <Button
                size="lg"
                className="bg-msc-accent hover:bg-msc-accent/90 text-white font-semibold px-8 py-4 text-lg"
              >
                {t.hero.cta}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>

            {/* Hero Animation */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <div className="w-64 h-64 lg:w-80 lg:h-80 bg-gradient-to-br from-msc-accent to-white/20 hexagon-border animate-glow" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl lg:text-6xl font-bold mb-2">MSC</div>
                    <div className="text-sm lg:text-base opacity-80">Medical Excellence</div>
                  </div>
                </div>
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
              {language === 'ru' ? 'Рассчитайте окупаемость' : 'Calculate Your ROI'}
            </h2>
            <p className="text-lg text-msc-text-light max-w-2xl mx-auto">
              {language === 'ru' 
                ? 'Узнайте, за какой период окупится ваше медицинское оборудование'
                : 'Find out how long it will take for your medical equipment to pay for itself'
              }
            </p>
          </div>
          
          <div className="flex justify-center">
            <ROICalculator language={language} />
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
    </div>
  );
};

export default Home;