import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Wrench, GraduationCap, Zap, Calendar, Check, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import SEOHead from "@/components/SEO/SEOHead";
import {
  formatUzbekPhoneNumber,
  validateUzbekPhoneNumber,
  isValidUzbekPhoneLength,
  isCompleteUzbekPhone,
} from "@/lib/phoneValidation";

const Services = () => {
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string>("");
  const [phoneValue, setPhoneValue] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [openAccordion, setOpenAccordion] = useState<string>("");
  const { i18n } = useTranslation();

  const content = {
    ru: {
      title: "Наши услуги",
      subtitle: "Комплексное сервисное обслуживание медицинского оборудования",
      heroNote:
        "Монтаж, пуско-наладка, сервис 24/7 и аренда медоборудования в Ташкенте и по Узбекистану.",
      nav: [
        { id: "installation", label: "Монтаж и ввод" },
        { id: "training", label: "Обучение" },
        { id: "service-24-7", label: "Сервис 24/7" },
        { id: "rent", label: "Аренда" },
      ],
      seo: {
        title:
          "Услуги по монтажу, сервису 24/7 и аренде медоборудования — Ташкент, Узбекистан",
        description:
          "Монтаж и пуско-наладка, обучение медперсонала, сервис 24/7 и аренда медицинского оборудования для клиник и лабораторий. Выезд по Ташкенту и регионам Узбекистана, договор и документы.",
        keywords:
          "сервис медицинского оборудования Ташкент, монтаж медоборудования Узбекистан, пуско-наладка медтехники, обучение медперсонала, ремонт медоборудования 24/7, аренда медицинского оборудования Ташкент, сервисный центр медтехники",
      },
      areaServed: ["Tashkent", "Uzbekistan"],
      services: [
        {
          id: "installation",
          icon: <Wrench className="w-8 h-8" />,
          title: "Монтаж, пуско-наладка и ввод в эксплуатацию медоборудования",
          price: "от 500$",
          description:
            "Профессиональный монтаж и запуск медицинского оборудования для клиник и лабораторий в Ташкенте и по Узбекистану",
          seoLines: [
            "Установка и пуско-наладка медицинского оборудования в Ташкенте и по Узбекистану",
            "Акт работ, чек-лист запуска, требования производителя, гарантия",
          ],
          features: [
            "Подготовка помещения",
            "Монтаж и подключение",
            "Ввод в эксплуатацию",
            "Гарантия на установку",
          ],
          cta: "Заказать услугу",
          schemaType: "Medical equipment installation and commissioning",
        },
        {
          id: "training",
          icon: <GraduationCap className="w-8 h-8" />,
          title: "Обучение медперсонала работе с оборудованием",
          price: "от 300$",
          description:
            "Обучение врачей и медперсонала: теория, практика, безопасность и протокол обучения",
          seoLines: [
            "Инструктаж персонала в Ташкенте и по Узбекистану",
            "Протокол обучения, рекомендации по эксплуатации и режимам",
          ],
          features: [
            "Теоретический курс",
            "Практические занятия",
            "Сертификация персонала",
            "Учебные материалы",
          ],
          cta: "Заказать услугу",
          schemaType: "Medical equipment training",
        },
        {
          id: "service-24-7",
          icon: <Zap className="w-8 h-8" />,
          title: "Сервисное обслуживание и ремонт медоборудования 24/7",
          price: "от 150$",
          description:
            "Диагностика, выезд инженера и ремонт медицинского оборудования 24/7 для клиник и лабораторий",
          seoLines: [
            "Сервис и ремонт медоборудования в Ташкенте и по Узбекистану",
            "SLA, выезд инженера, регламентные работы, оригинальные запчасти",
          ],
          features: [
            "Выезд инженера за 4 часа",
            "Диагностика на месте",
            "Оригинальные запчасти",
            "Удаленная поддержка 24/7",
          ],
          cta: "Заказать услугу",
          schemaType: "Medical equipment maintenance and repair",
        },
        {
          id: "rent",
          icon: <Calendar className="w-8 h-8" />,
          title: "Аренда медицинского оборудования",
          price: "от 500$/мес",
          description:
            "Аренда медоборудования для клиник и проектов: гибкие сроки, обслуживание включено",
          seoLines: [
            "Аренда медоборудования в Ташкенте и по Узбекистану",
            "Договор для юрлиц, счёт, акты и закрывающие документы",
          ],
          features: [
            "Минимальный срок - 1 месяц",
            "Обслуживание включено",
            "Скидка при выкупе",
            "Быстрая замена",
          ],
          cta: "Заказать услугу",
          schemaType: "Medical equipment rental",
        },
      ],
      sections: {
        seoHeading: "Сервис медоборудования для клиник в Ташкенте и Узбекистане",
        seoText: [
          "Med Service Centre — B2B-партнёр клиник, медцентров и лабораторий в Ташкенте и по всему Узбекистану. Мы выполняем монтаж и ввод в эксплуатацию, обучение медперсонала, сервисное обслуживание 24/7 и аренду медицинского оборудования с договором, актами и чек-листами запуска.",
          "Работаем с УЗИ, рентгеном, лабораторными анализаторами, стерилизационным, эндоскопическим и реанимационным оборудованием. Обеспечиваем выезд инженера, регламентное обслуживание, оригинальные запчасти и прозрачную отчётность для B2B.",
        ],
        geographyHeading: "География и сроки реакции",
        geographyText:
          "Выезд инженера возможен по Ташкенту и регионам Узбекистана. Сроки реакции и формат обслуживания фиксируем в SLA и договоре, чтобы клиника могла планировать работу без простоев.",
        trustHeading: "Почему B2B-клиенты выбирают нас",
        trustPoints: [
          "SLA и время реакции фиксируются в договоре",
          "Акты выполненных работ, чек-листы запуска, протоколы обучения",
          "Сервис по регламентам производителя и оригинальные запчасти",
          "Инженеры с профильной квалификацией и опытом внедрений",
          "Прозрачная отчётность и понятные условия для юрлиц",
        ],
        equipmentHeading: "Типы оборудования, с которыми работаем",
        equipmentList: [
          "УЗИ и функциональная диагностика",
          "Рентген и С-дуга",
          "Лабораторные анализаторы",
          "Стерилизационное оборудование",
          "Эндоскопические и хирургические системы",
          "Реанимационное и мониторинговое оборудование",
        ],
        commercialHeading: "Коммерческие условия и документы",
        commercialList: [
          "Договор обслуживания или аренды",
          "Счёт и закрывающие документы",
          "Акт выполненных работ",
          "Чек-лист запуска оборудования",
          "Протокол обучения персонала",
        ],
        lsiHeading: "Связанные запросы и термины",
        lsiList: [
          "сервисный центр медоборудования",
          "пуско-наладочные работы",
          "регламентное обслуживание",
          "выезд инженера",
          "оригинальные запчасти",
          "постгарантийный сервис",
          "удалённая диагностика",
          "обучение медперсонала",
        ],
      },
      orderForm: {
        title: "Заказать услугу",
        serviceLabel: "Услуга",
        name: "Имя",
        phone: "Телефон",
        email: "Email",
        company: "Организация / клиника",
        message: "Комментарий",
        submit: "Отправить заявку",
        success: "Заявка отправлена. Мы свяжемся с вами в течение рабочего дня.",
      },
    },
    en: {
      title: "Our Services",
      subtitle: "Comprehensive service for medical equipment",
      heroNote:
        "Installation, commissioning, 24/7 service, and rental in Tashkent and across Uzbekistan.",
      nav: [
        { id: "installation", label: "Installation" },
        { id: "training", label: "Training" },
        { id: "service-24-7", label: "24/7 Service" },
        { id: "rent", label: "Rental" },
      ],
      seo: {
        title:
          "Medical Equipment Installation, 24/7 Service, and Rental — Tashkent, Uzbekistan",
        description:
          "Installation and commissioning, staff training, 24/7 maintenance, and medical equipment rental for clinics and labs. Coverage in Tashkent and across Uzbekistan with contracts and documentation.",
        keywords:
          "medical equipment service Tashkent, installation Uzbekistan, commissioning, staff training, 24/7 maintenance, medical equipment rental",
      },
      areaServed: ["Tashkent", "Uzbekistan"],
      services: [
        {
          id: "installation",
          icon: <Wrench className="w-8 h-8" />,
          title: "Medical equipment installation and commissioning",
          price: "from $500",
          description:
            "Professional installation and launch for clinics and labs in Tashkent and across Uzbekistan",
          seoLines: [
            "Installation and commissioning in Tashkent and across Uzbekistan",
            "Work act, launch checklist, manufacturer requirements, warranty",
          ],
          features: [
            "Room preparation",
            "Installation and connection",
            "Commissioning",
            "Installation warranty",
          ],
          cta: "Order service",
          schemaType: "Medical equipment installation and commissioning",
        },
        {
          id: "training",
          icon: <GraduationCap className="w-8 h-8" />,
          title: "Medical staff training for equipment",
          price: "from $300",
          description:
            "Training for doctors and staff: theory, practice, safety, training protocol",
          seoLines: [
            "On-site instruction in Tashkent and across Uzbekistan",
            "Training protocol and operating guidance",
          ],
          features: [
            "Theoretical course",
            "Practical sessions",
            "Staff certification",
            "Training materials",
          ],
          cta: "Order service",
          schemaType: "Medical equipment training",
        },
        {
          id: "service-24-7",
          icon: <Zap className="w-8 h-8" />,
          title: "24/7 medical equipment service and repair",
          price: "from $150",
          description:
            "Diagnostics, engineer dispatch, and 24/7 repair for clinics and labs",
          seoLines: [
            "Service and repair in Tashkent and across Uzbekistan",
            "SLA, scheduled maintenance, engineer dispatch, original spare parts",
          ],
          features: [
            "Engineer call within 4 hours",
            "On-site diagnostics",
            "Original spare parts",
            "Remote support 24/7",
          ],
          cta: "Order service",
          schemaType: "Medical equipment maintenance and repair",
        },
        {
          id: "rent",
          icon: <Calendar className="w-8 h-8" />,
          title: "Medical equipment rental",
          price: "from $500/month",
          description:
            "Rental for clinics and projects with flexible terms and service included",
          seoLines: [
            "Medical equipment rental in Tashkent and across Uzbekistan",
            "Contracts for legal entities with invoices and closing documents",
          ],
          features: [
            "Minimum term - 1 month",
            "Service included",
            "Discount on purchase",
            "Quick replacement",
          ],
          cta: "Order service",
          schemaType: "Medical equipment rental",
        },
      ],
      sections: {
        seoHeading: "B2B medical equipment services in Tashkent and Uzbekistan",
        seoText: [
          "Med Service Centre supports clinics and labs with installation and commissioning, staff training, 24/7 maintenance, and equipment rental across Tashkent and Uzbekistan with full contracts and documentation.",
          "We work with ultrasound, X-ray, laboratory analyzers, sterilization, endoscopic, and ICU equipment, providing engineer dispatch, scheduled maintenance, original parts, and transparent reporting.",
        ],
        geographyHeading: "Coverage and response times",
        geographyText:
          "We serve Tashkent and regions across Uzbekistan. Response times and service format are fixed in the SLA and contract.",
        trustHeading: "Why B2B clients choose us",
        trustPoints: [
          "SLA with fixed response times",
          "Work acts, launch checklists, training protocols",
          "Manufacturer-grade service and original parts",
          "Qualified engineers and implementation experience",
          "Clear reporting and legal entity documentation",
        ],
        equipmentHeading: "Equipment types",
        equipmentList: [
          "Ultrasound and diagnostics",
          "X-ray and C-arm systems",
          "Laboratory analyzers",
          "Sterilization equipment",
          "Endoscopic and surgical systems",
          "ICU and monitoring equipment",
        ],
        commercialHeading: "Commercial documents",
        commercialList: [
          "Service or rental contract",
          "Invoices and closing documents",
          "Work act",
          "Launch checklist",
          "Training protocol",
        ],
        lsiHeading: "Related terms",
        lsiList: [
          "service center",
          "commissioning",
          "scheduled maintenance",
          "engineer dispatch",
          "original spare parts",
          "post-warranty service",
          "remote diagnostics",
          "staff training",
        ],
      },
      orderForm: {
        title: "Order service",
        serviceLabel: "Service",
        name: "Name",
        phone: "Phone",
        email: "Email",
        company: "Organization / clinic",
        message: "Comment",
        submit: "Submit request",
        success: "Request sent. We will contact you within one business day.",
      },
    },
    uz: {
      title: "Bizning xizmatlarimiz",
      subtitle: "Tibbiy asbob-uskunalar uchun keng qamrovli servis",
      heroNote:
        "Toshkent va O‘zbekiston bo‘ylab o‘rnatish, 24/7 servis va ijara.",
      nav: [
        { id: "installation", label: "O‘rnatish" },
        { id: "training", label: "O‘qitish" },
        { id: "service-24-7", label: "24/7 servis" },
        { id: "rent", label: "Ijara" },
      ],
      seo: {
        title:
          "Tibbiy uskunalarni o‘rnatish, 24/7 servis va ijara — Toshkent, O‘zbekiston",
        description:
          "O‘rnatish va ishga tushirish, xodimlarni o‘qitish, 24/7 servis va tibbiy uskunalar ijarasi. Toshkent va O‘zbekiston bo‘ylab, shartnoma va hujjatlar bilan.",
        keywords:
          "tibbiy uskunalar servisi Toshkent, o‘rnatish O‘zbekiston, ishga tushirish, xodimlarni o‘qitish, 24/7 servis, tibbiy uskunalar ijarasi",
      },
      areaServed: ["Tashkent", "Uzbekistan"],
      services: [
        {
          id: "installation",
          icon: <Wrench className="w-8 h-8" />,
          title: "Tibbiy uskunalarni o‘rnatish va ishga tushirish",
          price: "500$ dan",
          description:
            "Toshkent va O‘zbekiston bo‘ylab klinikalar uchun professional o‘rnatish va ishga tushirish",
          seoLines: [
            "Toshkent va O‘zbekiston bo‘ylab o‘rnatish va ishga tushirish",
            "Akt va ishga tushirish chek-listi, ishlab chiqaruvchi talablari",
          ],
          features: [
            "Xonani tayyorlash",
            "O‘rnatish va ulash",
            "Ishga tushirish",
            "O‘rnatishga kafolat",
          ],
          cta: "Xizmat buyurtma qilish",
          schemaType: "Medical equipment installation and commissioning",
        },
        {
          id: "training",
          icon: <GraduationCap className="w-8 h-8" />,
          title: "Tibbiy xodimlarni uskunada ishlashga o‘qitish",
          price: "300$ dan",
          description:
            "Nazariya va amaliyot, xavfsizlik va o‘qitish protokoli bilan trening",
          seoLines: [
            "Toshkent va O‘zbekiston bo‘ylab joyida instrukta joriy etiladi",
            "O‘qitish protokoli va foydalanish bo‘yicha tavsiyalar",
          ],
          features: [
            "Nazariy kurs",
            "Amaliy mashg‘ulotlar",
            "Xodimlarni sertifikatlash",
            "O‘quv materiallari",
          ],
          cta: "Xizmat buyurtma qilish",
          schemaType: "Medical equipment training",
        },
        {
          id: "service-24-7",
          icon: <Zap className="w-8 h-8" />,
          title: "Tibbiy uskunalar uchun 24/7 texnik xizmat",
          price: "150$ dan",
          description:
            "Diagnostika, muhandis chiqishi va 24/7 servis klinikalar uchun",
          seoLines: [
            "Toshkent va O‘zbekiston bo‘ylab servis",
            "SLA, rejalashtirilgan servis, akt, original ehtiyot qismlar",
          ],
          features: [
            "4 soat ichida muhandis chaqiruvi",
            "Joyida diagnostika",
            "Asl ehtiyot qismlar",
            "Masofaviy qo‘llab-quvvatlash 24/7",
          ],
          cta: "Xizmat buyurtma qilish",
          schemaType: "Medical equipment maintenance and repair",
        },
        {
          id: "rent",
          icon: <Calendar className="w-8 h-8" />,
          title: "Tibbiy uskunalarni ijaraga berish",
          price: "500$/oylik dan",
          description:
            "Klinikalar va loyihalar uchun moslashuvchan ijara, servis kiritilgan",
          seoLines: [
            "Toshkent va O‘zbekiston bo‘ylab tibbiy uskunalar ijarasi",
            "Shartnoma, hisob-faktura va yopuvchi hujjatlar",
          ],
          features: [
            "Minimal muddat - 1 oy",
            "Xizmat kiritilgan",
            "Sotib olishda chegirma",
            "Tez almashtirish",
          ],
          cta: "Xizmat buyurtma qilish",
          schemaType: "Medical equipment rental",
        },
      ],
      sections: {
        seoHeading: "Toshkent va O‘zbekistonda B2B tibbiy uskunalar xizmati",
        seoText: [
          "Med Service Centre klinikalar va laboratoriyalar uchun o‘rnatish, ishga tushirish, xodimlarni o‘qitish, 24/7 servis va uskunalarni ijaraga berishni taklif qiladi. Biz shartnoma va hujjatlar bilan Toshkent va O‘zbekiston bo‘ylab ishlaymiz.",
          "UZI, rentgen, laboratoriya analizatorlari, sterilizatsiya, endoskopik va reanimatsiya uskunalari bilan ishlaymiz. Muhandis chiqishi, rejalashtirilgan servis, original ehtiyot qismlar va hisobot taqdim etiladi.",
        ],
        geographyHeading: "Hududlar va javob muddati",
        geographyText:
          "Toshkent va O‘zbekiston bo‘ylab xizmat ko‘rsatamiz. Javob muddati SLA’da belgilanadi.",
        trustHeading: "Nega bizni tanlashadi",
        trustPoints: [
          "SLA va tezkor javob",
          "Aktlar, chek-list va o‘qitish protokoli",
          "Reglament bo‘yicha servis",
          "Tajribali muhandislar",
          "Yuridik shaxslar uchun shaffof hujjatlar",
        ],
        equipmentHeading: "Uskunalar turlari",
        equipmentList: [
          "UZI va diagnostika",
          "Rentgen va C-arm",
          "Laboratoriya analizatorlari",
          "Sterilizatsiya uskunalari",
          "Endoskopik tizimlar",
          "Reanimatsiya monitoringi",
        ],
        commercialHeading: "Hujjatlar",
        commercialList: [
          "Servis yoki ijara shartnomasi",
          "Hisob-faktura va yopuvchi hujjatlar",
          "Bajarilgan ishlar akti",
          "Ishga tushirish chek-listi",
          "O‘qitish protokoli",
        ],
        lsiHeading: "Bog‘liq atamalar",
        lsiList: [
          "servis markazi",
          "ishga tushirish",
          "rejalashtirilgan servis",
          "muhandis chiqishi",
          "original ehtiyot qismlar",
          "post-kafolat servis",
          "masofaviy diagnostika",
          "xodimlarni o‘qitish",
        ],
      },
      orderForm: {
        title: "Xizmat buyurtma qilish",
        serviceLabel: "Xizmat",
        name: "Ism",
        phone: "Telefon",
        email: "Email",
        company: "Tashkilot / klinika",
        message: "Izoh",
        submit: "So‘rov yuborish",
        success: "So‘rov yuborildi. 1 ish kuni ichida aloqaga chiqamiz.",
      },
    },
  };

  const currentContent =
    content[i18n.language as "ru" | "en" | "uz"] || content["ru"];
  const baseUrl = "https://medsc.uz";
  const canonicalUrl = `${baseUrl}/services`;

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: currentContent.seo.title,
    description: currentContent.seo.description,
    url: canonicalUrl,
    inLanguage: i18n.language,
  };

  const servicesSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: currentContent.services.map((service, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Service",
        name: service.title,
        description: service.description,
        serviceType: service.schemaType,
        url: `${canonicalUrl}#${service.id}`,
        provider: {
          "@type": "Organization",
          name: "Med Service Centre",
          url: baseUrl,
        },
        areaServed: currentContent.areaServed,
      },
    })),
  };

  const seoText = currentContent.sections.seoText;

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
        setPhoneError(
          lang === "ru"
            ? "Номер должен содержать 9 цифр"
            : lang === "en"
              ? "Number must contain 9 digits"
              : "Raqam 9 ta raqamdan iborat bo'lishi kerak",
        );
      } else if (!validateUzbekPhoneNumber(formatted)) {
        const lang = i18n.language;
        setPhoneError(
          lang === "ru"
            ? "Неверный формат номера"
            : lang === "en"
              ? "Invalid phone format"
              : "Noto'g'ri telefon formati",
        );
      } else {
        setPhoneError("");
      }
    } else {
      setPhoneError("");
    }
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      phoneValue &&
      (!isCompleteUzbekPhone(phoneValue) ||
        !validateUzbekPhoneNumber(phoneValue))
    ) {
      const lang = i18n.language;
      setPhoneError(
        lang === "ru"
          ? "Введите корректный узбекский номер"
          : lang === "en"
            ? "Enter a valid Uzbek number"
            : "To'g'ri O'zbek raqamini kiriting",
      );
      return;
    }

    toast.success(currentContent.orderForm.success);
    setIsOrderDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-background py-20">
      <SEOHead
        title={currentContent.seo.title}
        description={currentContent.seo.description}
        keywords={currentContent.seo.keywords}
        canonical={canonicalUrl}
        structuredData={[pageSchema, servicesSchema]}
      />
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
            {currentContent.title}
          </h1>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-4xl mx-auto">
            {currentContent.subtitle}
          </p>
          <p className="text-sm text-muted-foreground max-w-3xl mx-auto mt-3">
            {currentContent.heroNote}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {currentContent.nav.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="px-4 py-2 rounded-full border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {currentContent.services.map((service, index) => (
            <Card
              key={index}
              id={service.id}
              className="bg-card/50 backdrop-blur-sm border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 group scroll-mt-32 h-full flex flex-col"
            >
              <CardHeader className="pb-4 flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    {service.icon}
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-foreground">
                      {service.title}
                    </CardTitle>
                    <p className="text-sm font-semibold text-primary mt-1">
                      {service.price}
                    </p>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  {service.description}
                </p>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {service.seoLines.map((line, lineIndex) => (
                    <p key={lineIndex}>{line}</p>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="mt-auto">
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
                  {service.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="max-w-4xl mx-auto mt-20 space-y-16">
          <section>
            <h2 className="text-3xl font-heading font-bold text-foreground mb-6">
              {currentContent.sections.seoHeading}
            </h2>
            <div className="space-y-5 text-muted-foreground">
              {seoText.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
            <div className="mt-8 space-y-4 h-[600px] md:h-[640px] overflow-hidden">
              <details
                open={openAccordion === "geography"}
                className="rounded-lg border border-primary/10 bg-muted/20 p-4"
              >
                <summary
                  className="cursor-pointer text-lg font-semibold text-foreground"
                  onClick={(event) => {
                    event.preventDefault();
                    setOpenAccordion((prev) =>
                      prev === "geography" ? "" : "geography",
                    );
                  }}
                >
                  {currentContent.sections.geographyHeading}
                </summary>
                <p className="mt-3 text-muted-foreground">
                  {currentContent.sections.geographyText}
                </p>
              </details>

              <details
                open={openAccordion === "trust"}
                className="rounded-lg border border-primary/10 bg-muted/20 p-4"
              >
                <summary
                  className="cursor-pointer text-lg font-semibold text-foreground"
                  onClick={(event) => {
                    event.preventDefault();
                    setOpenAccordion((prev) =>
                      prev === "trust" ? "" : "trust",
                    );
                  }}
                >
                  {currentContent.sections.trustHeading}
                </summary>
                <ul className="mt-3 space-y-2 text-muted-foreground">
                  {currentContent.sections.trustPoints.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </details>

              <details
                open={openAccordion === "equipment"}
                className="rounded-lg border border-primary/10 bg-muted/20 p-4"
              >
                <summary
                  className="cursor-pointer text-lg font-semibold text-foreground"
                  onClick={(event) => {
                    event.preventDefault();
                    setOpenAccordion((prev) =>
                      prev === "equipment" ? "" : "equipment",
                    );
                  }}
                >
                  {currentContent.sections.equipmentHeading}
                </summary>
                <ul className="mt-3 space-y-2 text-muted-foreground">
                  {currentContent.sections.equipmentList.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </details>

              <details
                open={openAccordion === "commercial"}
                className="rounded-lg border border-primary/10 bg-muted/20 p-4"
              >
                <summary
                  className="cursor-pointer text-lg font-semibold text-foreground"
                  onClick={(event) => {
                    event.preventDefault();
                    setOpenAccordion((prev) =>
                      prev === "commercial" ? "" : "commercial",
                    );
                  }}
                >
                  {currentContent.sections.commercialHeading}
                </summary>
                <ul className="mt-3 space-y-2 text-muted-foreground">
                  {currentContent.sections.commercialList.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </details>

              <details
                open={openAccordion === "lsi"}
                className="rounded-lg border border-primary/10 bg-muted/20 p-4"
              >
                <summary
                  className="cursor-pointer text-lg font-semibold text-foreground"
                  onClick={(event) => {
                    event.preventDefault();
                    setOpenAccordion((prev) => (prev === "lsi" ? "" : "lsi"));
                  }}
                >
                  {currentContent.sections.lsiHeading}
                </summary>
                <ul className="mt-3 space-y-2 text-muted-foreground">
                  {currentContent.sections.lsiList.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </details>
            </div>
          </section>
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
              <Label htmlFor="service">{currentContent.orderForm.serviceLabel}</Label>
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
                  className={`pl-20 ${phoneError ? "border-red-500" : ""}`}
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
