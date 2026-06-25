"use client";

import { useState } from 'react';
import { imageUrl, BLUR_DATA_URL } from "~/shared/config/site";
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Zap, Shield, Headphones, Globe, Stethoscope, Scissors, Heart, TestTube, Smile, Eye, ChevronDown, ChevronUp, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RoiCalculator } from '~/features/roi-calculator/roi-calculator';
import { LeadForm } from '~/features/lead-form/lead-form';
import { useT, useLang } from '~/shared/i18n/i18n-provider';
import { toUrlSlug } from '@/lib/slugify';

// Shared button/card styles derived from the hero. Calm UI: only subtle color/shadow
// feedback on hover — no entrance, float, lift or slide animations.
const PRIMARY_BTN =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-msc-primary px-7 py-3.5 text-base font-semibold text-white shadow-[0_12px_32px_-14px_rgba(12,17,57,0.5)] transition-colors hover:bg-msc-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-msc-primary focus-visible:ring-offset-2';
const OUTLINE_BTN =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-msc-primary/20 bg-white px-7 py-3.5 text-base font-semibold text-msc-primary transition-colors hover:border-msc-primary/40 hover:bg-msc-primary/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-msc-primary/40';
const CARD =
  'group flex h-full flex-col rounded-2xl border border-msc-primary/10 bg-white shadow-[0_16px_48px_-30px_rgba(12,17,57,0.35)] transition-shadow duration-200 hover:shadow-[0_22px_56px_-30px_rgba(12,17,57,0.42)]';

export function HomeView({ products, categories, manufacturers }: { products: any[]; categories: any[]; manufacturers: any[] }) {
  const [showConsultationForm, setShowConsultationForm] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const t = useT();

  const currentLanguage = useLang();
  const dbCategories = categories;

  const faqItems = t('home.faq.items', { returnObjects: true }) as Array<{
    question: string;
    answer: string;
  }>;

  const heroTags = (t('home.hero.tags', { returnObjects: true }) as string[]) ?? [];

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

  const buildProductPath = (product: any) => {
    const manufacturerSlug = getManufacturerSlug(product.manufacturer_id);
    const productSlug = product.slug || product.id;
    return manufacturerSlug && manufacturerSlug !== 'unknown'
      ? `/catalog/${manufacturerSlug}/${productSlug}`
      : `/catalog/${productSlug}`;
  };

  const featuredProducts = products.slice(0, 3);

  return (
    <div className="min-h-screen">
      {/* Hero Section — pulled under the transparent header, sized to one viewport */}
      <section
        aria-labelledby="hero-heading"
        className="relative -mt-16 flex min-h-[100svh] items-center overflow-hidden"
        style={{
          background:
            'radial-gradient(60% 55% at 82% 26%, rgba(102,153,255,0.13), transparent 60%), ' +
            'radial-gradient(45% 45% at 0% 100%, rgba(59,130,246,0.06), transparent 60%), ' +
            'linear-gradient(180deg, #ffffff 0%, #f5f8fd 100%)',
        }}
      >
        <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-12">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-8">
            {/* Left: copy */}
            <div className="max-w-2xl">
              {/* Eyebrow */}
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-[#2563eb]/60" />
                <span className="text-[13px] sm:text-sm font-semibold uppercase tracking-[0.22em] text-[#2563eb]">
                  {t('home.hero.eyebrow')}
                </span>
              </div>

              {/* Headline */}
              <h1
                id="hero-heading"
                className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.08] tracking-tight text-msc-primary"
              >
                {t('home.hero.headline')}
              </h1>

              {/* Subtitle */}
              <p className="mt-5 max-w-md text-lg leading-relaxed text-msc-text-light">
                {t('home.hero.subtitle')}
              </p>

              {/* Service tags */}
              <ul className="mt-6 flex flex-wrap gap-2.5">
                {heroTags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full border border-msc-primary/15 bg-white px-4 py-2 text-sm font-medium text-msc-primary/80 shadow-sm transition-colors hover:border-msc-primary/30 hover:bg-msc-primary/[0.04]"
                  >
                    {tag}
                  </li>
                ))}
              </ul>

              {/* Stats */}
              <div className="mt-7 grid max-w-lg grid-cols-3 divide-x divide-msc-primary/10 rounded-2xl border border-msc-primary/10 bg-white p-5 sm:p-6 shadow-[0_14px_44px_-18px_rgba(12,17,57,0.30)]">
                <div className="px-1.5 text-center sm:px-4">
                  <div className="font-display text-2xl font-bold sm:text-3xl lg:text-4xl text-msc-primary">8+</div>
                  <div className="mt-1 text-[11px] leading-tight text-msc-text-light sm:text-sm">{t('home.hero.experience')}</div>
                </div>
                <div className="px-1.5 text-center sm:px-4">
                  <div className="font-display text-2xl font-bold sm:text-3xl lg:text-4xl text-msc-primary">300+</div>
                  <div className="mt-1 text-[11px] leading-tight text-msc-text-light sm:text-sm">{t('home.hero.projects')}</div>
                </div>
                <div className="px-1.5 text-center sm:px-4">
                  <div className="font-display text-2xl font-bold sm:text-3xl lg:text-4xl text-teal-600">100%</div>
                  <div className="mt-1 text-[11px] leading-tight text-msc-text-light sm:text-sm">{t('home.hero.clients')}</div>
                </div>
              </div>

              {/* CTAs */}
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => {
                    document.querySelector('#roi-calculator-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`${PRIMARY_BTN} focus-visible:ring-offset-white`}
                >
                  {t('home.hero.cta')}
                  <ArrowRight className="h-5 w-5" />
                </button>
                <button onClick={() => setShowConsultationForm(true)} className={`${OUTLINE_BTN} focus-visible:ring-offset-white`}>
                  {t('home.hero.getConsultation')}
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Right: ornate brand hexagon */}
            <div className="relative flex justify-center lg:justify-end">
              {/* soft radial glow behind mark */}
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-msc-accent/15 blur-[80px] sm:h-[400px] sm:w-[400px] lg:h-[480px] lg:w-[480px] lg:blur-[90px]" />
              <Image
                src="/images/logo.webp"
                alt="Med Service Centre"
                width={382}
                height={441}
                priority
                className="relative animate-float w-[230px] select-none drop-shadow-[0_20px_45px_rgba(12,17,57,0.20)] sm:w-[300px] lg:w-[420px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Equipment Section - SEO Content */}
      <section className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-12 text-center">
              <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-[#2563eb]/30" />
              <h2 className="font-display text-3xl lg:text-4xl font-semibold text-msc-primary">{t('home.equipment.title')}</h2>
            </div>

            {featuredProducts.length > 0 ? (
              <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-3">
                {featuredProducts.map((product) => {
                  const productPath = buildProductPath(product);
                  return (
                    <Card key={product.id} className={CARD}>
                      <Link
                        href={productPath}
                        className="relative block aspect-[1080/1350] overflow-hidden rounded-t-2xl"
                        aria-label={`${t('common.view')}: ${product.name[currentLanguage]}`}
                      >
                        {product.images?.cover ? (
                          <Image
                            src={imageUrl(product.images.cover)!}
                            alt={product.name[currentLanguage]}
                            fill
                            sizes="(max-width: 768px) 50vw, 25vw"
                            placeholder="blur"
                            blurDataURL={BLUR_DATA_URL}
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-muted">
                            <Package className="h-16 w-16 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute left-4 top-4">
                          <Badge variant="default">
                            {getCategoryTag(product.category)}
                          </Badge>
                        </div>
                      </Link>

                      <CardHeader className="flex-grow">
                        <CardTitle className="line-clamp-2 text-lg">
                          <Link href={productPath} className="hover:underline">
                            {product.name[currentLanguage]}
                          </Link>
                        </CardTitle>
                        <CardDescription className="line-clamp-3">
                          {product.description[currentLanguage]}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="mt-auto">
                        <Button asChild className="w-full rounded-xl">
                          <Link href={productPath}>
                            {t('common.view')}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-3">
                <div className="rounded-2xl border border-msc-primary/10 bg-white p-6 shadow-[0_16px_48px_-30px_rgba(12,17,57,0.35)]">
                  <h3 className="mb-3 font-display text-xl font-semibold text-msc-primary">{t('home.equipment.cards.diagnostic.title')}</h3>
                  <p className="mb-4 text-msc-text-light">{t('home.equipment.cards.diagnostic.body')}</p>
                  <Link href="/catalog/category/diagnostic" className="inline-flex items-center font-medium text-[#2563eb] hover:text-[#1e54d6]">{t('home.equipment.cards.diagnostic.link')} <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>

                <div className="rounded-2xl border border-msc-primary/10 bg-white p-6 shadow-[0_16px_48px_-30px_rgba(12,17,57,0.35)]">
                  <h3 className="mb-3 font-display text-xl font-semibold text-msc-primary">{t('home.equipment.cards.laboratory.title')}</h3>
                  <p className="mb-4 text-msc-text-light">
                    {t('home.equipment.cards.laboratory.bodyPrefix')}{' '}
                    <a href="https://www.radiometer.com/en/products/blood-gas-testing/abl800-flex" target="_blank" rel="noopener noreferrer" className="text-[#2563eb] hover:underline">
                      ABL800 Flex, Radiometer
                    </a>{' '}
                    {t('home.equipment.cards.laboratory.bodySuffix')}
                  </p>
                  <Link href="/catalog/category/laboratory" className="inline-flex items-center font-medium text-[#2563eb] hover:text-[#1e54d6]">{t('home.equipment.cards.laboratory.link')} <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>

                <div className="rounded-2xl border border-msc-primary/10 bg-white p-6 shadow-[0_16px_48px_-30px_rgba(12,17,57,0.35)]">
                  <h3 className="mb-3 font-display text-xl font-semibold text-msc-primary">{t('home.equipment.cards.surgical.title')}</h3>
                  <p className="mb-4 text-msc-text-light">
                    {t('home.equipment.cards.surgical.bodyPrefix')}{' '}
                    <a href="https://www.bowa-medical.com/" target="_blank" rel="noopener noreferrer" className="text-[#2563eb] hover:underline">
                      BOWA ARC 400
                    </a>{' '}
                    {t('home.equipment.cards.surgical.bodySuffix')}
                  </p>
                  <Link href="/catalog/category/surgical" className="inline-flex items-center font-medium text-[#2563eb] hover:text-[#1e54d6]">{t('home.equipment.cards.surgical.link')} <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            )}

            <div className="text-center">
              <Link href="/catalog" className={PRIMARY_BTN}>{t('home.equipment.cta')} <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="bg-[#f7f9fd] py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-[#2563eb]/30" />
              <h2 className="font-display text-3xl lg:text-4xl font-semibold text-msc-primary">{t('home.whyChoose.title')}</h2>
            </div>
            <div className="prose prose-lg max-w-none space-y-4 text-msc-text-light">
              <p>{t('home.whyChoose.paragraph1')}</p>
              <p>{t('home.whyChoose.paragraph2')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-[#2563eb]/30" />
            <h2 className="font-display text-3xl lg:text-4xl font-semibold text-msc-primary">{t('home.servicesSection.title')}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-msc-text-light">{t('home.servicesSection.description')}</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/services" className={PRIMARY_BTN}>{t('home.servicesSection.primaryCta')} <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/contacts" className={OUTLINE_BTN}>{t('home.servicesSection.secondaryCta')} <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator Section */}
      <section id="roi-calculator-section" className="bg-[#f7f9fd] py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-[#2563eb]/30" />
            <h2 className="font-display text-3xl lg:text-4xl font-semibold text-msc-primary">{t('home.roiCalculator.title')}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-msc-text-light">
              {t('home.roiCalculator.description')}
            </p>
          </div>

          <div className="flex justify-center">
            <RoiCalculator lang={currentLanguage} />
          </div>

          <div className="mt-12 text-center">
            <button onClick={() => setShowConsultationForm(true)} className={PRIMARY_BTN}>
              {t('home.roiCalculator.contactUs')}
              <ArrowRight className="h-5 w-5" />
            </button>
            <p className="mt-3 text-lg font-semibold leading-relaxed text-msc-primary">
              {t('home.roiCalculator.consultationOffer')}
            </p>
          </div>
        </div>
      </section>

      {/* Equipment Categories */}
      <section className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-[#2563eb]/30" />
            <h2 className="font-display text-3xl lg:text-4xl font-semibold text-msc-primary">{t('home.categories.title')}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-msc-text-light">
              {t('home.categories.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { name: t('home.categories.diagnostic'), icon: Stethoscope, category: 'diagnostic' },
              { name: t('home.categories.surgical'), icon: Scissors, category: 'surgical' },
              { name: t('home.categories.rehabilitation'), icon: Heart, category: 'rehabilitation' },
              { name: t('home.categories.laboratory'), icon: TestTube, category: 'laboratory' },
              { name: t('home.categories.dental'), icon: Smile, category: 'dental' },
              { name: t('home.categories.ophthalmology'), icon: Eye, category: 'ophthalmology' },
            ].map((category, index) => (
              <Link key={index} href={`/catalog/category/${category.category}`} className="block">
                <Card className={`${CARD} cursor-pointer`}>
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#2563eb]/10 text-[#2563eb]">
                      <category.icon className="h-7 w-7" />
                    </div>
                    <h3 className="text-lg font-semibold text-msc-primary">{category.name}</h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link href="/catalog" className="inline-flex items-center text-lg font-medium text-[#2563eb] hover:text-[#1e54d6]">{t('home.categories.cta')} <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Advantages */}
      <section className="bg-[#f7f9fd] py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-[#2563eb]/30" />
            <h2 className="font-display text-3xl lg:text-4xl font-semibold text-msc-primary">
              {t('home.advantages.title')}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-msc-text-light">
              {t('home.advantages.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
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
              <div key={index} className="rounded-2xl border border-msc-primary/10 bg-white p-6 shadow-[0_16px_48px_-30px_rgba(12,17,57,0.35)] transition-shadow duration-200 hover:shadow-[0_22px_56px_-30px_rgba(12,17,57,0.42)]">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2563eb]/10 text-[#2563eb]">
                  <advantage.icon className="h-7 w-7" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-msc-primary">{advantage.title}</h3>
                <p className="text-msc-text-light">{advantage.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-[#2563eb]/30" />
            <h2 className="font-display text-3xl lg:text-4xl font-semibold text-msc-primary">{t('home.faq.title')}</h2>
            <p className="mt-4 text-lg text-msc-text-light">{t('home.faq.subtitle')}</p>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-msc-primary/10 bg-white shadow-[0_10px_36px_-28px_rgba(12,17,57,0.4)]"
              >
                <button
                  className="flex w-full items-center justify-between px-6 py-5 text-left transition-colors hover:bg-msc-primary/[0.02]"
                  aria-expanded={openFaq === index}
                  aria-controls={`faq-panel-${index}`}
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <h3 className="pr-4 font-semibold text-msc-primary">{item.question}</h3>
                  {openFaq === index ? (
                    <ChevronUp className="h-5 w-5 flex-shrink-0 text-[#2563eb]" />
                  ) : (
                    <ChevronDown className="h-5 w-5 flex-shrink-0 text-[#2563eb]" />
                  )}
                </button>
                <div
                  id={`faq-panel-${index}`}
                  className={`grid transition-all duration-300 ease-in-out ${
                    openFaq === index ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="border-t border-msc-primary/10 px-6 py-4">
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
      <section className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-msc-primary/10 bg-gradient-to-br from-[#f3f7fe] to-[#eaf0fd] px-6 py-14 text-center shadow-[0_30px_80px_-40px_rgba(12,17,57,0.35)] sm:px-12 lg:py-20">
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#2563eb]/10 blur-[80px]" />
            <h2 className="relative font-display text-3xl lg:text-4xl font-semibold text-msc-primary">
              {t('home.finalCta.title')}
            </h2>
            <p className="relative mx-auto mt-4 max-w-2xl text-lg text-msc-text-light">
              {t('home.finalCta.description')}
            </p>
            <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button onClick={() => setShowConsultationForm(true)} className={PRIMARY_BTN}>
                {t('home.finalCta.requestButton')}
                <ArrowRight className="h-5 w-5" />
              </button>
              <button onClick={() => setShowConsultationForm(true)} className={OUTLINE_BTN}>
                {t('home.finalCta.managerButton')}
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
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
}
