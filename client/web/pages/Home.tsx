import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Zap, Shield, Headphones, Globe, Stethoscope, Scissors, Heart, TestTube, Smile, Eye, FileText, Truck, Settings, GraduationCap, Wrench, TrendingUp, ChevronDown, ChevronUp, Loader2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ROICalculator from '@/components/Calculator/ROICalculator';
import LeadForm from '@/components/forms/LeadForm';
import { useTranslation } from 'react-i18next';
import SEOHead from "@/components/SEO/SEOHead";
import { useProducts, type Product } from '@/hooks/useProducts';
import { useManufacturers } from '@/hooks/useManufacturers';
import { useCategories } from '@/hooks/useCategories';
import { toUrlSlug } from '@/lib/slugify';

interface HomeProps {
  language: 'ru' | 'en' | 'uz';
}

const Home = ({ language }: HomeProps) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [showConsultationForm, setShowConsultationForm] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { t, i18n } = useTranslation();
  
  const currentLanguage = (i18n.language || 'ru') as 'ru' | 'en' | 'uz';
  const { products, loading: productsLoading } = useProducts();
  const { categories: dbCategories } = useCategories();
  const { manufacturers } = useManufacturers();
  const baseUrl = 'https://medsc.uz';

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const faqItems = t('home.faq.items', { returnObjects: true }) as Array<{
    question: string;
    answer: string;
  }>;

  const fallbackCategories = {
    all: { ru: 'Все категории', en: 'All categories', uz: 'Barcha kategoriyalar' }
  };

  const allCategories = {
    ...fallbackCategories,
    ...dbCategories.reduce((acc, cat) => {
      acc[cat.value] = cat.name;
      return acc;
    }, {} as Record<string, { ru: string; en: string; uz: string }>)
  };

  const getCategoryTag = (category: string) => {
    return allCategories[category]?.[currentLanguage] || category;
  };

  const getManufacturerSlug = (manufacturerId: string | null | undefined) => {
    if (!manufacturerId) return 'unknown';
    const manufacturer = manufacturers.find(m => m.id === manufacturerId);
    const safeSlug = toUrlSlug(manufacturer?.slug);
    return safeSlug || 'unknown';
  };

  const buildProductPath = (product: Product) => {
    const manufacturerSlug = getManufacturerSlug(product.manufacturer_id);
    const productSlug = product.slug || product.id;
    return manufacturerSlug && manufacturerSlug !== 'unknown'
      ? `/catalog/${manufacturerSlug}/${productSlug}`
      : `/catalog/${productSlug}`;
  };

  const featuredProducts = products.slice(0, 3);

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Med Service Centre",
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${baseUrl}/catalog?search={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  const featuredProductsSchema = featuredProducts.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: featuredProducts.map((product, index) => {
      const productPath = buildProductPath(product);
      const productImage = product.images?.cover || '';
      const productImageUrl = productImage
        ? (productImage.startsWith('http') ? productImage : `${baseUrl}${productImage}`)
        : undefined;
      return {
        "@type": "ListItem",
        position: index + 1,
        item: {
          // Avoid Product rich-result errors on listing pages without offers/pricing.
          "@type": "WebPage",
          name: product.name[currentLanguage],
          url: `${baseUrl}${productPath}`,
          image: productImageUrl
        }
      };
    })
  } : null;

  const homeStructuredData = [
    websiteSchema,
    ...(featuredProductsSchema ? [featuredProductsSchema] : [])
  ];

  return (
    <div className="min-h-screen">
      <SEOHead
        title={t('home.seo.title')}
        description={t('home.seo.description')}
        keywords={t('home.seo.keywords')}
        type="website"
        canonical="https://medsc.uz/"
        ogTitle={t('home.seo.ogTitle')}
        ogDescription={t('home.seo.ogDescription')}
        ogUrl="https://medsc.uz/"
        ogImage="https://medsc.uz/lovable-uploads/ea1f50a2-d3d1-418f-b6ce-f6e08a722162.png"
        twitterTitle={t('home.seo.twitterTitle')}
        twitterDescription={t('home.seo.twitterDescription')}
        twitterImage="https://medsc.uz/lovable-uploads/ea1f50a2-d3d1-418f-b6ce-f6e08a722162.png"
        structuredData={homeStructuredData}
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
                <h1 className="font-heading text-5xl lg:text-6xl font-bold leading-tight">{t('home.hero.headline')}</h1>
                <p className="text-xl lg:text-2xl text-white/90 font-medium">
                  {t('home.hero.subtitle')}
                </p>
                <p className="text-lg text-white/80 whitespace-pre-line">
                  {t('home.hero.description')}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-white">8+</div>
                  <div className="text-sm text-white/90 font-medium">{t('home.hero.experience')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-white">300+</div>
                  <div className="text-sm text-white/90 font-medium">{t('home.hero.projects')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-white">100%</div>
                  <div className="text-sm text-white/90 font-medium">{t('home.hero.clients')}</div>
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
                  {t('home.hero.cta')}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button
                  size="lg"
                  className="bg-white text-msc-primary hover:bg-white/90 font-semibold px-8 py-4 text-lg flex-1 sm:flex-none sm:min-w-[240px]"
                  onClick={() => setShowConsultationForm(true)}
                >
                  {t('home.hero.getConsultation')}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Process Cluster */}
            <div className="flex justify-center">
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-[28rem] lg:h-[28rem]">
                {/* Central Logo */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-52 h-52 lg:w-60 lg:h-60 flex items-center justify-center z-10 pointer-events-none">
                  <img 
                    src="/lovable-uploads/acdce942-978c-4243-9068-38f2c5bb0284.png" 
                    alt={t('home.hero.logoAlt')} 
                    className="w-44 h-44 lg:w-52 lg:h-52 object-contain select-none"
                  />
                </div>
                
                {/* Rotating Orbit Container */}
                <div className="absolute inset-0 animate-[spin_20s_linear_infinite]">
                  {[
                    { icon: FileText, label: t('home.process.quote'), angle: 0, path: '/catalog' },
                    { icon: Truck, label: t('home.process.supply'), angle: 60, path: '/catalog' },
                    { icon: Settings, label: t('home.process.installation'), angle: 120, path: '/services' },
                    { icon: GraduationCap, label: t('home.process.training'), angle: 180, path: '/services' },
                    { icon: Wrench, label: t('home.process.service'), angle: 240, path: '/services' },
                    { icon: TrendingUp, label: t('home.process.roi'), angle: 300, path: '/#roi-calculator-section' }
                  ].map((item, index) => {
                    const IconComponent = item.icon;
                    const radius = window.innerWidth < 768 ? 120 : 180;
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
                             <div 
                               className="w-10 h-10 sm:w-14 sm:h-14 lg:w-20 lg:h-20 bg-gradient-to-br from-msc-accent to-msc-primary rounded-full flex items-center justify-center mx-auto shadow-lg hover:scale-110 transition-transform cursor-pointer relative overflow-hidden group"
                               onClick={() => {
                                 if (item.path.startsWith('/#')) {
                                   const section = document.querySelector(item.path.substring(1));
                                   section?.scrollIntoView({ behavior: 'smooth' });
                                 } else {
                                   navigate(item.path);
                                 }
                               }}
                             >
                               <div className="absolute inset-0 rounded-full bg-white/30 animate-ping opacity-75" 
                                    style={{ animationDuration: '3s', animationDelay: `${index * 0.5}s` }} />
                               <div className="absolute inset-0 rounded-full bg-white/0 group-hover:bg-white/20 transition-all duration-300" />
                               <IconComponent className="w-5 h-5 sm:w-8 sm:h-8 lg:w-14 lg:h-14 text-white relative z-10" />
                            </div>
                            <span className="text-white text-xs sm:text-sm font-medium block whitespace-nowrap absolute top-full left-1/2 transform -translate-x-1/2 mt-1 sm:mt-2 pointer-events-none">
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

      {/* Equipment Section - SEO Content */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-msc-primary mb-10 text-center">{t('home.equipment.title')}</h2>
            
            {productsLoading ? (
              <div className="flex items-center justify-center gap-3 py-10 text-msc-text-light">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-lg">{t('common.loading')}</span>
              </div>
            ) : featuredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                {featuredProducts.map((product) => {
                  const productPath = buildProductPath(product);
                  return (
                    <Card
                      key={product.id}
                      className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col h-full"
                    >
                      <Link
                        to={productPath}
                        className="relative overflow-hidden rounded-t-lg aspect-[1080/1350] block"
                        aria-label={`${t('common.view')}: ${product.name[currentLanguage]}`}
                      >
                        {product.images?.cover ? (
                          <img
                            src={product.images.cover}
                            alt={product.name[currentLanguage]}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.svg';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Package className="w-16 h-16 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute top-4 left-4">
                          <Badge variant="default">
                            {getCategoryTag(product.category)}
                          </Badge>
                        </div>
                      </Link>

                      <CardHeader className="flex-grow">
                        <CardTitle className="text-lg line-clamp-2">
                          <Link to={productPath} className="hover:underline">
                            {product.name[currentLanguage]}
                          </Link>
                        </CardTitle>
                        <CardDescription className="line-clamp-3">
                          {product.description[currentLanguage]}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="mt-auto">
                        <Button asChild className="w-full">
                          <Link to={productPath}>
                            {t('common.view')}
                            <ArrowRight className="ml-2 w-4 h-4" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="bg-msc-bg/30 rounded-lg p-6">
                  <h3 className="font-heading text-xl font-bold text-msc-primary mb-3">{t('home.equipment.cards.diagnostic.title')}</h3>
                  <p className="text-msc-text-light mb-4">{t('home.equipment.cards.diagnostic.body')}</p>
                  <Link to="/catalog?category=diagnostic" className="text-msc-accent hover:underline font-medium inline-flex items-center">{t('home.equipment.cards.diagnostic.link')} <ArrowRight className="ml-1 w-4 h-4" />
                  </Link>
                </div>
                
                <div className="bg-msc-bg/30 rounded-lg p-6">
                  <h3 className="font-heading text-xl font-bold text-msc-primary mb-3">{t('home.equipment.cards.laboratory.title')}</h3>
                  <p className="text-msc-text-light mb-4">
                    {t('home.equipment.cards.laboratory.bodyPrefix')}{' '}
                    <a href="https://www.radiometer.com/en/products/blood-gas-testing/abl800-flex" target="_blank" rel="noopener noreferrer" className="text-msc-accent hover:underline">
                      ABL800 Flex, Radiometer
                    </a>{' '}
                    {t('home.equipment.cards.laboratory.bodySuffix')}
                  </p>
                  <Link to="/catalog?category=laboratory" className="text-msc-accent hover:underline font-medium inline-flex items-center">{t('home.equipment.cards.laboratory.link')} <ArrowRight className="ml-1 w-4 h-4" />
                  </Link>
                </div>
                
                <div className="bg-msc-bg/30 rounded-lg p-6">
                  <h3 className="font-heading text-xl font-bold text-msc-primary mb-3">{t('home.equipment.cards.surgical.title')}</h3>
                  <p className="text-msc-text-light mb-4">
                    {t('home.equipment.cards.surgical.bodyPrefix')}{' '}
                    <a href="https://www.bowa-medical.com/" target="_blank" rel="noopener noreferrer" className="text-msc-accent hover:underline">
                      BOWA ARC 400
                    </a>{' '}
                    {t('home.equipment.cards.surgical.bodySuffix')}
                  </p>
                  <Link to="/catalog?category=surgical" className="text-msc-accent hover:underline font-medium inline-flex items-center">{t('home.equipment.cards.surgical.link')} <ArrowRight className="ml-1 w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

            <div className="text-center">
              <Link to="/catalog" className="inline-flex items-center bg-msc-accent hover:bg-msc-accent/90 text-white font-semibold px-6 py-3 rounded-lg transition-colors">{t('home.equipment.cta')} <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 bg-gradient-to-br from-msc-primary/5 to-msc-accent/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-msc-primary mb-6 text-center">{t('home.whyChoose.title')}</h2>
            <div className="prose prose-lg max-w-none text-msc-text-light space-y-4">
              <p>{t('home.whyChoose.paragraph1')}</p>
              <p>{t('home.whyChoose.paragraph2')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-msc-primary mb-6">{t('home.servicesSection.title')}</h2>
            <p className="text-lg text-msc-text-light mb-8">{t('home.servicesSection.description')}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/services" className="inline-flex items-center bg-msc-primary hover:bg-msc-primary/90 text-white font-semibold px-6 py-3 rounded-lg transition-colors">{t('home.servicesSection.primaryCta')} <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link to="/contacts" className="inline-flex items-center border-2 border-msc-primary text-msc-primary hover:bg-msc-primary hover:text-white font-semibold px-6 py-3 rounded-lg transition-colors">{t('home.servicesSection.secondaryCta')} <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator Section */}
      <section id="roi-calculator-section" className="py-20 bg-gradient-to-br from-msc-bg to-msc-accent/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-msc-primary mb-4">{t('home.roiCalculator.title')}</h2>
            <p className="text-lg text-msc-text-light max-w-2xl mx-auto">
              {t('home.roiCalculator.description')}
            </p>
          </div>
          
          <div className="flex justify-center">
            <ROICalculator language={currentLanguage} />
          </div>
          
          <div className="text-center mt-12">
            <Button
              size="lg"
              className="bg-msc-accent hover:bg-msc-accent/90 text-white font-semibold px-8 py-4 text-lg shadow-lg"
              onClick={() => setShowConsultationForm(true)}
            >
              {t('home.roiCalculator.contactUs')}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <p className="text-lg font-semibold text-msc-primary mt-3 leading-relaxed">
              {t('home.roiCalculator.consultationOffer')}
            </p>
          </div>
        </div>
      </section>

      {/* Equipment Categories */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-msc-primary mb-4">{t('home.categories.title')}</h2>
            <p className="text-lg text-msc-text-light max-w-2xl mx-auto">
              {t('home.categories.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: t('home.categories.diagnostic'), icon: Stethoscope, category: 'diagnostic' },
              { name: t('home.categories.surgical'), icon: Scissors, category: 'surgical' },
              { name: t('home.categories.rehabilitation'), icon: Heart, category: 'rehabilitation' },
              { name: t('home.categories.laboratory'), icon: TestTube, category: 'laboratory' },
              { name: t('home.categories.dental'), icon: Smile, category: 'dental' },
              { name: t('home.categories.ophthalmology'), icon: Eye, category: 'ophthalmology' },
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

          <div className="text-center mt-8">
            <Link to="/catalog" className="inline-flex items-center text-msc-accent hover:underline font-medium text-lg">{t('home.categories.cta')} <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Advantages */}
      <section className="py-20 bg-gradient-to-br from-msc-primary/5 to-msc-accent/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-msc-primary mb-4">
              {t('home.advantages.title')}
            </h2>
            <p className="text-lg text-msc-text-light max-w-2xl mx-auto">
              {t('home.advantages.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Shield,
                title: t('home.advantages.qualityGuarantee.title'),
                description: t('home.advantages.qualityGuarantee.description')
              },
              {
                icon: Headphones,
                title: t('home.advantages.support247.title'),
                description: t('home.advantages.support247.description')
              },
              {
                icon: Zap,
                title: t('home.advantages.fastInstallation.title'),
                description: t('home.advantages.fastInstallation.description')
              },
              {
                icon: Globe,
                title: t('home.advantages.globalExperience.title'),
                description: t('home.advantages.globalExperience.description')
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

      {/* FAQ Section */}
      <section className="py-20 bg-white min-h-[800px]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-msc-primary mb-4">{t('home.faq.title')}</h2>
            <p className="text-lg text-msc-text-light">{t('home.faq.subtitle')}</p>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div 
                key={index} 
                className="border border-msc-accent/20 rounded-lg overflow-hidden"
              >
                <button
                  className="w-full px-6 py-4 text-left flex items-center justify-between bg-white hover:bg-msc-bg/50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <h3 className="font-semibold text-msc-primary pr-4">{item.question}</h3>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-msc-accent flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-msc-accent flex-shrink-0" />
                  )}
                </button>
                <div 
                  className={`grid transition-all duration-300 ease-in-out ${
                    openFaq === index ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 py-4 bg-msc-bg/30 border-t border-msc-accent/10">
                      <p className="text-msc-text-light">{item.answer}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 bg-gradient-to-br from-msc-primary to-msc-accent text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl lg:text-4xl font-bold mb-4">
            {t('home.finalCta.title')}
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            {t('home.finalCta.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-msc-primary hover:bg-white/90 font-semibold px-8 py-4 text-lg"
              onClick={() => setShowConsultationForm(true)}
            >
              {t('home.finalCta.requestButton')}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-black hover:bg-white hover:text-msc-primary px-8 py-4 text-lg transition-all duration-300"
              onClick={() => setShowConsultationForm(true)}
            >
              {t('home.finalCta.managerButton')}
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





