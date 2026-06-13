import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SEOHead from "@/components/SEO/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const About = () => {
  const { i18n } = useTranslation();
  const language = (i18n.language as "ru" | "en" | "uz") || "ru";
  const baseUrl = "https://medsc.uz";
  const canonicalUrl = `${baseUrl}/about`;

  const content = {
    ru: {
      title: "О компании Med Service Centre",
      intro:
        "Med Service Centre — поставщик медицинского оборудования в Узбекистане. Мы подбираем решения для клиник и лабораторий, организуем поставку, ввод в эксплуатацию и сервисное сопровождение.",
      highlightsTitle: "Что мы делаем",
      highlights: [
        {
          title: "Поставка оборудования",
          text: "УЗИ, лабораторные анализаторы, хирургические системы, мониторинг и реабилитация.",
        },
        {
          title: "Сервис и обучение",
          text: "Установка, ввод в эксплуатацию, обучение персонала и техническая поддержка 24/7.",
        },
        {
          title: "Аренда и сопровождение",
          text: "Гибкие условия аренды, консультации и поддержка на всех этапах закупки.",
        },
      ],
      directionsTitle: "Основные направления",
      directions: [
        "Диагностическое оборудование и УЗИ-аппараты",
        "Лабораторные анализаторы и расходные материалы",
        "Хирургическое оборудование и электрохирургия",
        "Мониторинг пациентов и реанимация",
        "Стоматологическое и офтальмологическое оборудование",
        "Медицинская мебель и оснащение кабинетов",
      ],
      advantagesTitle: "Почему клиники выбирают нас",
      advantages: [
        "Подбор техники под клинические задачи и бюджет",
        "Официальные поставки и прозрачная логистика",
        "Гарантийное и постгарантийное обслуживание",
        "Опыт внедрения оборудования в частных и государственных клиниках",
      ],
      geographyTitle: "География и сроки",
      geographyText:
        "Работаем по Ташкенту и регионам Узбекистана. Сроки поставки согласуем заранее, обеспечиваем сопровождение на всех этапах.",
      ctaTitle: "Нужна консультация по подбору?",
      ctaText:
        "Расскажите о задаче, и мы подготовим коммерческое предложение под ваш бюджет и сроки.",
      ctaCatalog: "Перейти в каталог",
      ctaContact: "Связаться с нами",
      seoDescription:
        "Med Service Centre — поставщик медицинского оборудования в Узбекистане. Поставка, аренда, сервис, обучение персонала и подбор техники для клиник.",
      seoKeywords:
        "о компании Med Service Centre, медицинское оборудование Узбекистан, поставка медтехники Ташкент, аренда медоборудования, сервис медтехники",
    },
    en: {
      title: "About Med Service Centre",
      intro:
        "Med Service Centre supplies medical equipment in Uzbekistan. We select solutions for clinics and labs, manage delivery, commissioning, and ongoing service support.",
      highlightsTitle: "What we do",
      highlights: [
        {
          title: "Equipment supply",
          text: "Ultrasound, laboratory analyzers, surgical systems, monitoring and rehabilitation.",
        },
        {
          title: "Service and training",
          text: "Installation, commissioning, staff training, and 24/7 technical support.",
        },
        {
          title: "Rental and support",
          text: "Flexible rental options, consultations, and support at every procurement stage.",
        },
      ],
      directionsTitle: "Key areas",
      directions: [
        "Diagnostic equipment and ultrasound systems",
        "Laboratory analyzers and consumables",
        "Surgical equipment and electrosurgery",
        "Patient monitoring and intensive care",
        "Dental and ophthalmology equipment",
        "Medical furniture and room outfitting",
      ],
      advantagesTitle: "Why clinics choose us",
      advantages: [
        "Equipment selection aligned with clinical tasks and budget",
        "Official supply chain and transparent logistics",
        "Warranty and post-warranty service",
        "Experience across private and public healthcare facilities",
      ],
      geographyTitle: "Coverage and timelines",
      geographyText:
        "We serve Tashkent and all regions of Uzbekistan. Delivery timelines are agreed in advance with full support.",
      ctaTitle: "Need guidance for procurement?",
      ctaText:
        "Share your requirements, and we will prepare a tailored offer with the right equipment and timelines.",
      ctaCatalog: "Open catalog",
      ctaContact: "Contact us",
      seoDescription:
        "Med Service Centre supplies medical equipment in Uzbekistan. Sales, rental, service, staff training, and procurement support for clinics.",
      seoKeywords:
        "Med Service Centre, medical equipment Uzbekistan, supply in Tashkent, rental, service and training",
    },
    uz: {
      title: "Med Service Centre haqida",
      intro:
        "Med Service Centre O'zbekistonda tibbiy uskunalar yetkazib beradi. Biz klinikalar va laboratoriyalar uchun yechim tanlaymiz, yetkazib berish va servisni tashkil qilamiz.",
      highlightsTitle: "Biz nima qilamiz",
      highlights: [
        {
          title: "Uskunalar yetkazib berish",
          text: "UZI, laboratoriya analizatorlari, jarrohlik tizimlari va monitoring.",
        },
        {
          title: "Servis va o'qitish",
          text: "O'rnatish, ishga tushirish, xodimlarni o'qitish va 24/7 qo'llab-quvvatlash.",
        },
        {
          title: "Ijara va hamrohlik",
          text: "Moslashuvchan ijara shartlari va xarid jarayonida to'liq yordam.",
        },
      ],
      directionsTitle: "Asosiy yo'nalishlar",
      directions: [
        "Diagnostika uskunalari va UZI apparatlari",
        "Laboratoriya analizatorlari va sarf materiallari",
        "Jarrohlik uskunalari va elektrojarrohlik",
        "Bemorlarni monitoring qilish va reanimatsiya",
        "Stomatologiya va oftalmologiya uskunalari",
        "Tibbiy mebel va xonalarni jihozlash",
      ],
      advantagesTitle: "Nega bizni tanlashadi",
      advantages: [
        "Klinik vazifalarga mos tanlov va byudjetga moslash",
        "Rasmiy yetkazib berish va shaffof logistika",
        "Kafolatli va kafolatsiz servis",
        "Xususiy va davlat klinikalarida tajriba",
      ],
      geographyTitle: "Qamrov va muddatlar",
      geographyText:
        "Toshkent va O'zbekiston bo'ylab ishlaymiz. Yetkazib berish muddatlari oldindan kelishiladi.",
      ctaTitle: "Uskunani tanlash bo'yicha yordam kerakmi?",
      ctaText:
        "Talablaringizni yuboring, biz sizga mos tijorat taklifini tayyorlaymiz.",
      ctaCatalog: "Katalogga o'tish",
      ctaContact: "Biz bilan bog'lanish",
      seoDescription:
        "Med Service Centre — O'zbekistonda tibbiy uskunalar yetkazib beruvchi. Sotuv, ijara, servis va xodimlarni o'qitish.",
      seoKeywords:
        "Med Service Centre, tibbiy uskunalar O'zbekiston, Toshkent yetkazib berish, ijara, servis",
    },
  };

  const currentContent = content[language] || content.ru;

  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: currentContent.title,
    description: currentContent.seoDescription,
    url: canonicalUrl,
    inLanguage: language,
    about: {
      "@type": "Organization",
      name: "Med Service Centre",
      url: baseUrl,
      areaServed: "UZ",
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name:
          language === "ru" ? "Главная" : language === "en" ? "Home" : "Bosh sahifa",
        item: `${baseUrl}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: currentContent.title,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background py-20">
      <SEOHead
        title={currentContent.title}
        description={currentContent.seoDescription}
        keywords={currentContent.seoKeywords}
        canonical={canonicalUrl}
        structuredData={[aboutSchema, breadcrumbSchema]}
      />
      <div className="container mx-auto px-4">
        <header className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
            {currentContent.title}
          </h1>
          <p className="text-lg text-muted-foreground">
            {currentContent.intro}
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {currentContent.highlights.map((item, index) => (
            <Card key={index} className="bg-card/60 border-primary/20">
              <CardHeader>
                <CardTitle className="text-xl">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                {item.text}
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
          <div>
            <h2 className="text-2xl font-heading font-semibold mb-4">
              {currentContent.directionsTitle}
            </h2>
            <ul className="space-y-2 text-muted-foreground">
              {currentContent.directions.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="mt-2 h-2 w-2 rounded-full bg-primary"></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-heading font-semibold mb-4">
              {currentContent.advantagesTitle}
            </h2>
            <ul className="space-y-2 text-muted-foreground">
              {currentContent.advantages.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="mt-2 h-2 w-2 rounded-full bg-primary"></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center mb-16">
          <div>
            <h2 className="text-2xl font-heading font-semibold mb-4">
              {currentContent.geographyTitle}
            </h2>
            <p className="text-muted-foreground">{currentContent.geographyText}</p>
          </div>
          <div className="bg-msc-primary/5 rounded-xl p-6 border border-msc-primary/10">
            <h3 className="text-xl font-semibold mb-3">
              {currentContent.ctaTitle}
            </h3>
            <p className="text-muted-foreground mb-6">
              {currentContent.ctaText}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild>
                <Link to="/catalog">{currentContent.ctaCatalog}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/contacts">{currentContent.ctaContact}</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
