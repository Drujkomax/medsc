// SEO-оптимизированные данные для каждой категории каталога
export interface CategorySeoData {
  title: { ru: string; en: string; uz: string };
  description: { ru: string; en: string; uz: string };
  keywords: { ru: string[]; en: string[]; uz: string[] };
  h1: { ru: string; en: string; uz: string };
}

export const categorySeoData: Record<string, CategorySeoData> = {
  all: {
    title: {
      ru: "Каталог медицинского оборудования — купить в Узбекистане | Med Service Centre",
      en: "Medical Equipment Catalog — Buy in Uzbekistan | Med Service Centre",
      uz: "Tibbiy uskunalar katalogi — O'zbekistonda sotib olish | Med Service Centre",
    },
    description: {
      ru: "Купить медицинское оборудование в Узбекистане: УЗИ аппараты, лабораторные анализаторы, хирургические системы. Продажа, аренда и сервис от Med Service Centre.",
      en: "Buy medical equipment in Uzbekistan: ultrasound machines, laboratory analyzers, surgical systems. Sales, rental and service from Med Service Centre.",
      uz: "O'zbekistonda tibbiy uskunalarni sotib oling: UZI apparatlari, laboratoriya analizatorlari. Med Service Centre'dan sotish, ijara va xizmat.",
    },
    keywords: {
      ru: ["медицинское оборудование Узбекистан", "купить медтехнику Ташкент", "аренда медицинского оборудования", "каталог медоборудования", "Med Service Centre"],
      en: ["medical equipment Uzbekistan", "buy medical devices Tashkent", "medical equipment rental", "Med Service Centre"],
      uz: ["tibbiy uskunalar O'zbekiston", "Toshkentda tibbiy asboblar sotib olish", "Med Service Centre"],
    },
    h1: {
      ru: "Каталог медицинского оборудования",
      en: "Medical Equipment Catalog",
      uz: "Tibbiy uskunalar katalogi",
    },
  },
  diagnostic: {
    title: {
      ru: "Диагностическое оборудование — купить в Ташкенте и Узбекистане",
      en: "Diagnostic Equipment — Buy in Tashkent and Uzbekistan",
      uz: "Diagnostika uskunalari — Toshkent va O'zbekistonda sotib olish",
    },
    description: {
      ru: "Купить диагностическое оборудование в Узбекистане: УЗИ аппараты, рентген системы, МРТ. Поставка, установка и сервисное обслуживание по всей стране.",
      en: "Buy diagnostic equipment in Uzbekistan: ultrasound, X-ray, MRI systems. Delivery, installation and service nationwide.",
      uz: "O'zbekistonda diagnostika uskunalarini sotib oling: UZI, rentgen, MRT tizimlari. Butun mamlakat bo'ylab yetkazib berish va xizmat.",
    },
    keywords: {
      ru: ["диагностическое оборудование Узбекистан", "купить УЗИ аппарат Ташкент", "рентген оборудование", "МРТ аппарат купить", "диагностика медтехника"],
      en: ["diagnostic equipment Uzbekistan", "buy ultrasound Tashkent", "X-ray equipment", "MRI machine"],
      uz: ["diagnostika uskunalari O'zbekiston", "UZI apparati sotib olish", "rentgen uskunalari"],
    },
    h1: {
      ru: "Диагностическое оборудование",
      en: "Diagnostic Equipment",
      uz: "Diagnostika uskunalari",
    },
  },
  laboratory: {
    title: {
      ru: "Лабораторное оборудование — купить в Ташкенте и Узбекистане",
      en: "Laboratory Equipment — Buy in Tashkent and Uzbekistan",
      uz: "Laboratoriya uskunalari — Toshkent va O'zbekistonda sotib olish",
    },
    description: {
      ru: "Купить лабораторное оборудование в Узбекистане: анализаторы крови ABL800 Flex, биохимические анализаторы, центрифуги. Гарантия и сервис.",
      en: "Buy laboratory equipment in Uzbekistan: ABL800 Flex blood analyzers, biochemical analyzers, centrifuges. Warranty and service.",
      uz: "O'zbekistonda laboratoriya uskunalarini sotib oling: ABL800 Flex qon analizatorlari, bioximik analizatorlar. Kafolat va xizmat.",
    },
    keywords: {
      ru: ["лабораторное оборудование Узбекистан", "купить анализатор крови Ташкент", "ABL800 Flex", "биохимический анализатор", "лабораторная техника"],
      en: ["laboratory equipment Uzbekistan", "buy blood analyzer Tashkent", "ABL800 Flex", "biochemical analyzer"],
      uz: ["laboratoriya uskunalari O'zbekiston", "qon analizatori sotib olish", "ABL800 Flex"],
    },
    h1: {
      ru: "Лабораторное оборудование",
      en: "Laboratory Equipment",
      uz: "Laboratoriya uskunalari",
    },
  },
  surgical: {
    title: {
      ru: "Хирургическое оборудование — купить в Ташкенте и Узбекистане",
      en: "Surgical Equipment — Buy in Tashkent and Uzbekistan",
      uz: "Jarrohlik uskunalari — Toshkent va O'zbekistonda sotib olish",
    },
    description: {
      ru: "Купить хирургическое оборудование в Узбекистане: электрохирургические аппараты BOWA ARC 400, операционные столы, светильники. Установка и обучение.",
      en: "Buy surgical equipment in Uzbekistan: BOWA ARC 400 electrosurgical units, operating tables, lights. Installation and training.",
      uz: "O'zbekistonda jarrohlik uskunalarini sotib oling: BOWA ARC 400 elektrojarrohlik apparatlari, operatsiya stollari. O'rnatish va o'qitish.",
    },
    keywords: {
      ru: ["хирургическое оборудование Узбекистан", "купить электрохирургический аппарат", "BOWA ARC 400", "операционный стол", "хирургическая техника Ташкент"],
      en: ["surgical equipment Uzbekistan", "buy electrosurgical unit", "BOWA ARC 400", "operating table"],
      uz: ["jarrohlik uskunalari O'zbekiston", "elektrojarrohlik apparati sotib olish", "BOWA ARC 400"],
    },
    h1: {
      ru: "Хирургическое оборудование",
      en: "Surgical Equipment",
      uz: "Jarrohlik uskunalari",
    },
  },
  dental: {
    title: {
      ru: "Стоматологическое оборудование — купить в Ташкенте и Узбекистане",
      en: "Dental Equipment — Buy in Tashkent and Uzbekistan",
      uz: "Stomatologik uskunalar — Toshkent va O'zbekistonda sotib olish",
    },
    description: {
      ru: "Купить стоматологическое оборудование в Узбекистане: стоматологические установки, рентген аппараты, автоклавы. Сервис и запчасти.",
      en: "Buy dental equipment in Uzbekistan: dental units, X-ray machines, autoclaves. Service and spare parts.",
      uz: "O'zbekistonda stomatologik uskunalarni sotib oling: stomatologik qurilmalar, rentgen apparatlari, avtoklavlar.",
    },
    keywords: {
      ru: ["стоматологическое оборудование Узбекистан", "купить стоматологическую установку Ташкент", "дентальный рентген", "автоклав стоматологический"],
      en: ["dental equipment Uzbekistan", "buy dental unit Tashkent", "dental X-ray", "dental autoclave"],
      uz: ["stomatologik uskunalar O'zbekiston", "stomatologik qurilma sotib olish"],
    },
    h1: {
      ru: "Стоматологическое оборудование",
      en: "Dental Equipment",
      uz: "Stomatologik uskunalar",
    },
  },
  rehabilitation: {
    title: {
      ru: "Реабилитационное оборудование — купить в Ташкенте и Узбекистане",
      en: "Rehabilitation Equipment — Buy in Tashkent and Uzbekistan",
      uz: "Reabilitatsiya uskunalari — Toshkent va O'zbekistonda sotib olish",
    },
    description: {
      ru: "Купить реабилитационное оборудование в Узбекистане: тренажёры, физиотерапевтические аппараты, массажные столы. Доставка по стране.",
      en: "Buy rehabilitation equipment in Uzbekistan: exercise machines, physiotherapy devices, massage tables. Nationwide delivery.",
      uz: "O'zbekistonda reabilitatsiya uskunalarini sotib oling: trenajyorlar, fizioterapiya apparatlari, massaj stollari.",
    },
    keywords: {
      ru: ["реабилитационное оборудование Узбекистан", "физиотерапевтическое оборудование Ташкент", "медицинские тренажёры", "реабилитация медтехника"],
      en: ["rehabilitation equipment Uzbekistan", "physiotherapy equipment Tashkent", "medical trainers"],
      uz: ["reabilitatsiya uskunalari O'zbekiston", "fizioterapiya uskunalari"],
    },
    h1: {
      ru: "Реабилитационное оборудование",
      en: "Rehabilitation Equipment",
      uz: "Reabilitatsiya uskunalari",
    },
  },
  monitoring: {
    title: {
      ru: "Мониторинговое оборудование — купить в Ташкенте и Узбекистане",
      en: "Patient Monitoring Equipment — Buy in Tashkent and Uzbekistan",
      uz: "Monitoring uskunalari — Toshkent va O'zbekistonda sotib olish",
    },
    description: {
      ru: "Купить мониторинговое оборудование в Узбекистане: мониторы пациента, пульсоксиметры, ЭКГ аппараты. Гарантия и техподдержка.",
      en: "Buy patient monitoring equipment in Uzbekistan: patient monitors, pulse oximeters, ECG machines. Warranty and support.",
      uz: "O'zbekistonda monitoring uskunalarini sotib oling: bemor monitorlari, pulsoksimetrlar, EKG apparatlari.",
    },
    keywords: {
      ru: ["мониторинговое оборудование Узбекистан", "монитор пациента купить Ташкент", "пульсоксиметр", "ЭКГ аппарат", "кардиомонитор"],
      en: ["patient monitoring equipment Uzbekistan", "buy patient monitor Tashkent", "pulse oximeter", "ECG machine"],
      uz: ["monitoring uskunalari O'zbekiston", "bemor monitori sotib olish"],
    },
    h1: {
      ru: "Мониторинговое оборудование",
      en: "Patient Monitoring Equipment",
      uz: "Monitoring uskunalari",
    },
  },
  sterilization: {
    title: {
      ru: "Стерилизационное оборудование — купить в Ташкенте и Узбекистане",
      en: "Sterilization Equipment — Buy in Tashkent and Uzbekistan",
      uz: "Sterilizatsiya uskunalari — Toshkent va O'zbekistonda sotib olish",
    },
    description: {
      ru: "Купить стерилизационное оборудование в Узбекистане: автоклавы, стерилизаторы, дезинфекционные камеры. Сертифицированная техника.",
      en: "Buy sterilization equipment in Uzbekistan: autoclaves, sterilizers, disinfection chambers. Certified equipment.",
      uz: "O'zbekistonda sterilizatsiya uskunalarini sotib oling: avtoklavlar, sterilizatorlar, dezinfeksiya kameralari.",
    },
    keywords: {
      ru: ["стерилизационное оборудование Узбекистан", "автоклав купить Ташкент", "стерилизатор медицинский", "дезинфекционная камера"],
      en: ["sterilization equipment Uzbekistan", "buy autoclave Tashkent", "medical sterilizer"],
      uz: ["sterilizatsiya uskunalari O'zbekiston", "avtoklav sotib olish"],
    },
    h1: {
      ru: "Стерилизационное оборудование",
      en: "Sterilization Equipment",
      uz: "Sterilizatsiya uskunalari",
    },
  },
  furniture: {
    title: {
      ru: "Медицинская мебель — купить в Ташкенте и Узбекистане",
      en: "Medical Furniture — Buy in Tashkent and Uzbekistan",
      uz: "Tibbiy mebel — Toshkent va O'zbekistonda sotib olish",
    },
    description: {
      ru: "Купить медицинскую мебель в Узбекистане: кушетки, процедурные столы, шкафы для медикаментов, кресла. Доставка и сборка.",
      en: "Buy medical furniture in Uzbekistan: examination couches, procedure tables, medicine cabinets, chairs. Delivery and assembly.",
      uz: "O'zbekistonda tibbiy mebelni sotib oling: kushetkalar, protsedura stollari, dori-darmon shkaflari.",
    },
    keywords: {
      ru: ["медицинская мебель Узбекистан", "купить кушетку Ташкент", "процедурный стол", "мебель для клиники"],
      en: ["medical furniture Uzbekistan", "buy examination couch Tashkent", "procedure table"],
      uz: ["tibbiy mebel O'zbekiston", "kushetka sotib olish"],
    },
    h1: {
      ru: "Медицинская мебель",
      en: "Medical Furniture",
      uz: "Tibbiy mebel",
    },
  },
  consumables: {
    title: {
      ru: "Расходные материалы — купить в Ташкенте и Узбекистане",
      en: "Medical Consumables — Buy in Tashkent and Uzbekistan",
      uz: "Sarf materiallari — Toshkent va O'zbekistonda sotib olish",
    },
    description: {
      ru: "Купить медицинские расходные материалы в Узбекистане: реагенты, электроды, картриджи для анализаторов. Оптовые поставки.",
      en: "Buy medical consumables in Uzbekistan: reagents, electrodes, analyzer cartridges. Wholesale supplies.",
      uz: "O'zbekistonda tibbiy sarf materiallarini sotib oling: reagentlar, elektrodlar, analizator kartrijlari.",
    },
    keywords: {
      ru: ["расходные материалы медицинские Узбекистан", "реагенты для анализаторов Ташкент", "электроды медицинские", "картриджи ABL"],
      en: ["medical consumables Uzbekistan", "analyzer reagents Tashkent", "medical electrodes"],
      uz: ["tibbiy sarf materiallari O'zbekiston", "analizator reagentlari"],
    },
    h1: {
      ru: "Расходные материалы",
      en: "Medical Consumables",
      uz: "Sarf materiallari",
    },
  },
};

export const getCategorySeoData = (category: string): CategorySeoData | null => {
  return categorySeoData[category] || null;
};

export const buildCatalogSeoMeta = (
  selectedCategory: string,
  categoryName: string,
  language: "ru" | "en" | "uz",
  baseUrl: string
) => {
  const seoData = getCategorySeoData(selectedCategory);

  const title = seoData
    ? seoData.title[language]
    : `${categoryName} — купить в Ташкенте и Узбекистане | Med Service Centre`;

  const description = seoData
    ? seoData.description[language]
    : `Купить ${categoryName.toLowerCase()} в Узбекистане. Продажа, аренда и сервисное обслуживание медицинского оборудования от Med Service Centre.`;

  const keywords = seoData
    ? seoData.keywords[language]
    : [
        `${categoryName} Узбекистан`,
        `купить ${categoryName.toLowerCase()} Ташкент`,
        "медицинское оборудование",
        "Med Service Centre",
      ];

  const h1 = seoData ? seoData.h1[language] : categoryName;

  const canonicalUrl =
    selectedCategory === "all"
      ? `${baseUrl}/catalog`
      : `${baseUrl}/catalog?category=${selectedCategory}`;

  return { title, description, keywords, h1, canonicalUrl };
};

export const buildBreadcrumbSchema = (
  selectedCategory: string,
  categoryName: string,
  language: "ru" | "en" | "uz",
  baseUrl: string,
  canonicalUrl: string
) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: { ru: "Главная", en: "Home", uz: "Bosh sahifa" }[language],
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: { ru: "Каталог", en: "Catalog", uz: "Katalog" }[language],
        item: `${baseUrl}/catalog`,
      },
      ...(selectedCategory !== "all"
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: categoryName,
              item: canonicalUrl,
            },
          ]
        : []),
    ],
  };
};