import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Search,
  Filter,
  Heart,
  Eye,
  Loader2,
  Package,
  Menu,
} from "lucide-react";
import { useProducts, type Product } from "@/hooks/useProducts";
import { useManufacturers } from "@/hooks/useManufacturers";
import { useCategories } from "@/hooks/useCategories";
import { toast } from "sonner";
import { getCountryFlag, getCountryName } from "@/utils/countries";
import QuoteRequestForm from "@/components/forms/QuoteRequestForm";
import { useTranslation } from "react-i18next";
import SEOHead from "@/components/SEO/SEOHead";
import { useCurrencyRates } from "@/hooks/useCurrencyRates";
import { toUrlSlug } from "@/lib/slugify";
import {
  buildCatalogSeoMeta,
  buildBreadcrumbSchema,
} from "@/utils/catalogSeo";

// Function to get category display name
const getCategoryTag = (
  category: string,
  language: "ru" | "en" | "uz",
  allCategories: Record<string, { ru: string; en: string; uz: string }>,
) => {
  return allCategories[category]?.[language] || category;
};

// Fallback categories for display
const fallbackCategories = {
  all: {
    ru: "Все категории",
    en: "All categories",
    uz: "Barcha kategoriyalar",
  },
};

const translations = {
  title: {
    ru: "Каталог медицинского оборудования",
    en: "Medical Equipment Catalog",
    uz: "Tibbiy asbob-uskunalar katalogi",
  },
  subtitle: {
    ru: "Профессиональное медицинское оборудование от ведущих производителей",
    en: "Professional medical equipment from leading manufacturers",
    uz: "Yetakchi ishlab chiqaruvchilardan professional tibbiy asbob-uskunalar",
  },
  search: {
    ru: "Поиск по каталогу...",
    en: "Search catalog...",
    uz: "Katalogda qidirish...",
  },
  category: { ru: "Категория", en: "Category", uz: "Kategoriya" },
  features: { ru: "Особенности", en: "Features", uz: "Xususiyatlar" },
  details: { ru: "Подробнее", en: "Details", uz: "Batafsil" },
  requestQuote: { ru: "Запросить КП", en: "Request Quote", uz: "KP so'rash" },
  noProducts: {
    ru: "Товары не найдены",
    en: "No products found",
    uz: "Mahsulotlar topilmadi",
  },
  loading: {
    ru: "Загружаем каталог...",
    en: "Loading catalog...",
    uz: "Katalog yuklanmoqda...",
  },
};

const Catalog = () => {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || "",
  );
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "all",
  );
  const [selectedManufacturer, setSelectedManufacturer] = useState(
    searchParams.get("manufacturer") || "all",
  );
  const [currentPage, setCurrentPage] = useState(1);

  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const ITEMS_PER_PAGE = 20;

  const {
    products,
    loading: productsLoading,
    error: productsError,
  } = useProducts();
  const { categories: dbCategories, loading: categoriesLoading } =
    useCategories();
  const { manufacturers } = useManufacturers();
  const { convertToUZS, formatPrice } = useCurrencyRates();
  const baseUrl = "https://medsc.uz";

  // Helper to get manufacturer slug by ID
  const getManufacturerSlug = (manufacturerId: string | null | undefined) => {
    if (!manufacturerId) return "unknown";
    const manufacturer = manufacturers.find((m) => m.id === manufacturerId);
    const safeSlug = toUrlSlug(manufacturer?.slug);
    return safeSlug || "unknown";
  };

  const buildProductPath = (product: Product) => {
    const manufacturerSlug = getManufacturerSlug(product.manufacturer_id);
    const productSlug = product.slug || product.id;
    return manufacturerSlug && manufacturerSlug !== "unknown"
      ? `/catalog/${manufacturerSlug}/${productSlug}`
      : `/catalog/${productSlug}`;
  };

  // Update selected category when URL changes
  useEffect(() => {
    const categoryFromUrl = searchParams.get("category") || "all";
    if (categoryFromUrl !== selectedCategory) {
      setSelectedCategory(categoryFromUrl);
    }
  }, [searchParams, selectedCategory]);

  useEffect(() => {
    const searchFromUrl = searchParams.get("search") || "";
    setSearchTerm((prev) => (prev === searchFromUrl ? prev : searchFromUrl));
  }, [searchParams]);

  useEffect(() => {
    const manufacturerFromUrl = searchParams.get("manufacturer") || "all";
    if (manufacturerFromUrl !== selectedManufacturer) {
      setSelectedManufacturer(manufacturerFromUrl);
    }
  }, [searchParams, selectedManufacturer]);

  const language = (i18n.language as "ru" | "en" | "uz") || "ru";

  // Combine fallback categories with database categories
  const allCategories = {
    ...fallbackCategories,
    ...dbCategories.reduce(
      (acc, cat) => {
        acc[cat.value] = cat.name;
        return acc;
      },
      {} as Record<string, { ru: string; en: string; uz: string }>,
    ),
  };

  const manufacturerNameById = new Map(
    manufacturers.map((manufacturer) => {
      const name = manufacturer.name;
      if (typeof name === "object") {
        const objName = name as Record<string, string>;
        return [
          manufacturer.id,
          objName[language] || objName.ru || objName.en || "",
        ] as const;
      }
      return [manufacturer.id, String(name)] as const;
    }),
  );

  const selectedManufacturerEntity =
    selectedManufacturer === "all"
      ? null
      : manufacturers.find(
          (manufacturer) =>
            toUrlSlug(manufacturer.slug) === toUrlSlug(selectedManufacturer),
        ) || null;
  const selectedManufacturerId = selectedManufacturerEntity?.id || null;

  const filteredProducts = products.filter((product) => {
    const manufacturerNameForSearch =
      manufacturerNameById.get(product.manufacturer_id || "") || "";
    const matchesSearch =
      product.name[language].toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description[language]
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      manufacturerNameForSearch
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;
    const matchesManufacturer = selectedManufacturerId
      ? product.manufacturer_id === selectedManufacturerId
      : true;
    return matchesSearch && matchesCategory && matchesManufacturer;
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedManufacturer]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  // Pagination calculations
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const loading = productsLoading || categoriesLoading;
  const error = productsError;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-lg">{translations.loading[language]}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">
            Ошибка загрузки
          </h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const categoryName = getCategoryTag(
    selectedCategory,
    language,
    allCategories,
  );

  const manufacturerName = (() => {
    if (!selectedManufacturerEntity?.name) return "";
    const name = selectedManufacturerEntity.name;
    if (typeof name === "object") {
      const objName = name as Record<string, string>;
      return objName[language] || objName.ru || objName.en || "";
    }
    return String(name);
  })();

  const catalogTitleByLanguage = {
    ru: "Каталог медицинского оборудования в Узбекистане",
    en: "Medical Equipment Catalog in Uzbekistan",
    uz: "O‘zbekistonda tibbiy uskunalar katalogi",
  }[language];

  const locationByLanguage = {
    ru: "в Узбекистане и Ташкенте",
    en: "in Uzbekistan and Tashkent",
    uz: "O‘zbekistonda va Toshkentda",
  }[language];

  const seoTitle = (() => {
    if (selectedCategory !== "all" && manufacturerName) {
      return language === "ru"
        ? `${categoryName} ${manufacturerName} — купить в Узбекистане`
        : language === "en"
          ? `${categoryName} ${manufacturerName} — buy in Uzbekistan`
          : `${categoryName} ${manufacturerName} — O‘zbekistonda sotib olish`;
    }
    if (selectedCategory !== "all") {
      return language === "ru"
        ? `${categoryName} — купить в Узбекистане`
        : language === "en"
          ? `${categoryName} — buy in Uzbekistan`
          : `${categoryName} — O‘zbekistonda sotib olish`;
    }
    if (manufacturerName) {
      return language === "ru"
        ? `${manufacturerName} — купить медоборудование в Узбекистане`
        : language === "en"
          ? `${manufacturerName} — buy medical equipment in Uzbekistan`
          : `${manufacturerName} — O‘zbekistonda tibbiy uskunalarni sotib olish`;
    }
    return catalogTitleByLanguage;
  })();

  const seoDescription = (() => {
    if (selectedCategory !== "all" && manufacturerName) {
      return language === "ru"
        ? `${categoryName} ${manufacturerName} — продажа, сервис и аренда медицинского оборудования ${locationByLanguage}.`
        : language === "en"
          ? `${categoryName} ${manufacturerName} — sales, service, and rental of medical equipment ${locationByLanguage}.`
          : `${categoryName} ${manufacturerName} — tibbiy uskunalarni sotish, servis va ijara ${locationByLanguage}.`;
    }
    if (selectedCategory !== "all") {
      return language === "ru"
        ? `${categoryName}. Продажа, сервис и аренда медицинского оборудования ${locationByLanguage}.`
        : language === "en"
          ? `${categoryName}. Medical equipment sales, service, and rental ${locationByLanguage}.`
          : `${categoryName}. Tibbiy uskunalarni sotish, servis va ijara ${locationByLanguage}.`;
    }
    if (manufacturerName) {
      return language === "ru"
        ? `${manufacturerName} — медицинское оборудование: продажа, аренда и сервис ${locationByLanguage}.`
        : language === "en"
          ? `${manufacturerName} — medical equipment: sales, rental, and service ${locationByLanguage}.`
          : `${manufacturerName} — tibbiy uskunalar: sotuv, ijara va servis ${locationByLanguage}.`;
    }
    return {
      ru: "Продажа и аренда медицинского оборудования: УЗИ, анализаторы, хирургические системы. Поставка по Узбекистану и Ташкенту.",
      en: "Medical equipment sales and rental in Uzbekistan and Tashkent.",
      uz: "O‘zbekistonda va Toshkentda tibbiy uskunalarni sotish va ijaraga berish.",
    }[language];
  })();

  const seoKeywords = [
    "медицинское оборудование Узбекистан",
    "медицинское оборудование Ташкент",
    "купить медоборудование",
    "аренда медицинского оборудования",
    "medical equipment Uzbekistan",
    "buy medical equipment Tashkent",
    "Med Service Centre",
    ...(selectedCategory !== "all"
      ? [
          `${categoryName} оборудование`,
          `купить ${categoryName.toLowerCase()}`,
          `купить ${categoryName.toLowerCase()} в Ташкенте`,
        ]
      : []),
    ...(manufacturerName
      ? [
          `${manufacturerName} оборудование`,
          `купить мед оборудование ${manufacturerName}`,
          `купить медицинские аппараты ${manufacturerName}`,
          `купить мед оборудование ${manufacturerName} в Ташкенте`,
          `купить мед оборудование ${manufacturerName} в Узбекистане`,
        ]
      : []),
  ];

  const queryParams = new URLSearchParams();
  const normalizedCategoryValue =
    selectedCategory !== "all"
      ? Object.keys(allCategories).find(
          (key) => key.toLowerCase() === selectedCategory.toLowerCase(),
        ) || selectedCategory
      : null;
  const normalizedManufacturerSlug = selectedManufacturerEntity
    ? toUrlSlug(selectedManufacturerEntity.slug)
    : null;
  if (normalizedCategoryValue) {
    queryParams.set("category", normalizedCategoryValue);
  }
  if (normalizedManufacturerSlug) {
    queryParams.set("manufacturer", normalizedManufacturerSlug);
  }
  const canonicalUrl = `https://medsc.uz/catalog${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

  // Structured data для каталога
  const catalogSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: seoTitle,
    description: seoDescription,
    url: canonicalUrl,
    isPartOf: {
      "@type": "WebSite",
      name: "Med Service Centre",
      url: "https://medsc.uz",
    },
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: currentProducts.map((product, index) => {
      const productPath = buildProductPath(product);
      const productUrl = `${baseUrl}${productPath}`;
      const productImage = product.images?.cover || null;
      const productImageUrl = productImage
        ? productImage.startsWith("http")
          ? productImage
          : `${baseUrl}${productImage}`
        : undefined;
      return {
        "@type": "ListItem",
        position: startIndex + index + 1,
        item: {
          // Use WebPage here to avoid Product rich-result errors when price/offers are absent.
          "@type": "WebPage",
          name: product.name[language],
          url: productUrl,
          image: productImageUrl,
        },
      };
    }),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords.join(", ")}
        canonical={canonicalUrl}
        type="website"
        structuredData={[catalogSchema, itemListSchema]}
        noindex={Boolean(searchTerm)}
      />
      {/* Header */}
      <div
        className="relative py-16 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/lovable-uploads/4c70d2a2-2735-43a5-904b-62be351fa867.png')`,
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
            {selectedCategory !== "all" && manufacturerName
              ? `${categoryName} ${manufacturerName}`
              : selectedCategory !== "all"
                ? categoryName
                : manufacturerName
                  ? manufacturerName
                  : translations.title[language]}
          </h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            {selectedCategory === "all" && !manufacturerName
              ? translations.subtitle[language]
              : seoDescription}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-card rounded-lg border p-6 sticky top-8">
              <h3 className="font-semibold text-lg mb-4">
                {translations.category[language]}
              </h3>
              <nav className="space-y-2">
                {Object.entries(allCategories).map(([key, value]) => (
                  <Link
                    key={key}
                    to={
                      key === "all"
                        ? "/catalog"
                        : `/catalog?category=${encodeURIComponent(key)}`
                    }
                    onClick={() => setSelectedCategory(key)}
                    className={`block w-full text-left px-3 py-2 rounded-md text-sm leading-snug transition-colors ${
                      selectedCategory === key
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    {value[language]}
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Search and Mobile Category Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={translations.search[language]}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Mobile Category Filter */}
              <div className="lg:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Menu className="h-4 w-4 mr-2" />
                      {translations.category[language]}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80">
                    <div className="py-6">
                      <h3 className="font-semibold text-lg mb-4">
                        {translations.category[language]}
                      </h3>
                      <nav className="space-y-2">
                        {Object.entries(allCategories).map(([key, value]) => (
                          <Link
                            key={key}
                            to={
                              key === "all"
                                ? "/catalog"
                                : `/catalog?category=${encodeURIComponent(key)}`
                            }
                            onClick={() => {
                              setSelectedCategory(key);
                              // Close sheet after selection
                            }}
                            className={`block w-full text-left px-3 py-2 rounded-md text-sm leading-snug transition-colors ${
                              selectedCategory === key
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted"
                            }`}
                          >
                            {value[language]}
                          </Link>
                        ))}
                      </nav>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* Products Grid */}
            {currentProducts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-xl text-muted-foreground">
                  {translations.noProducts[language]}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {currentProducts.map((product) => {
                    const productUrl = buildProductPath(product);
                    return (
                      <Card
                        key={product.id}
                        className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col h-full"
                      >
                        <Link
                          to={productUrl}
                          className="relative overflow-hidden rounded-t-lg aspect-[1080/1350] block"
                          aria-label={`${translations.details[language]}: ${product.name[language]}`}
                        >
                          {product.images?.cover ? (
                            <img
                              src={product.images.cover}
                              alt={product.name[language]}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.svg";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <Package className="w-16 h-16 text-muted-foreground" />
                            </div>
                          )}
                          <div className="absolute top-4 left-4">
                            <Badge variant="default">
                              {getCategoryTag(
                                product.category,
                                language,
                                allCategories,
                              )}
                            </Badge>
                          </div>
                        </Link>

                        <CardHeader className="flex-grow">
                          <div className="flex items-start justify-between mb-2">
                            <CardTitle className="text-sm sm:text-lg flex-1 line-clamp-2">
                              <Link
                                to={productUrl}
                                className="hover:underline"
                                aria-label={`${translations.details[language]}: ${product.name[language]}`}
                              >
                                {product.name[language]}
                              </Link>
                            </CardTitle>
                            {product.country && (
                              <div className="bg-black text-white text-xs px-2 py-1 rounded-sm flex items-center gap-1 ml-2 whitespace-nowrap">
                                <span className="text-sm">
                                  {getCountryFlag(product.country)}
                                </span>
                                <span className="hidden sm:inline">
                                  {getCountryName(product.country, language)}
                                </span>
                              </div>
                            )}
                          </div>
                          {/* Hide description on mobile, show on larger screens */}
                          <CardDescription className="hidden sm:block">
                            {product.description[language]}
                          </CardDescription>
                        </CardHeader>

                        <CardContent className="flex flex-col justify-end mt-auto">
                          {/* Price Display */}
                          {product.price && product.currency && (
                            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-primary">
                                  {formatPrice(product.price, product.currency)}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {product.currency}
                                </span>
                              </div>
                              {product.currency !== "UZS" && (
                                <div className="mt-1 text-xs text-muted-foreground">
                                  ≈{" "}
                                  {formatPrice(
                                    convertToUZS(
                                      parseFloat(product.price),
                                      product.currency,
                                    ).toString(),
                                    "UZS",
                                  )}{" "}
                                  UZS
                                </div>
                              )}
                            </div>
                          )}

                          {/* Hide features on mobile, show on larger screens */}
                          {product.features &&
                            product.features[language] &&
                            product.features[language].length > 0 && (
                              <div className="mb-4 hidden sm:block">
                                <h4 className="font-medium mb-2">
                                  {translations.features[language]}:
                                </h4>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                  {product.features[language].map(
                                    (feature, index) => (
                                      <li
                                        key={index}
                                        className="flex items-center"
                                      >
                                        <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span>
                                        {feature}
                                      </li>
                                    ),
                                  )}
                                </ul>
                              </div>
                            )}

                          <div className="flex flex-col gap-2">
                            <Button
                              asChild
                              className="w-full text-xs sm:text-sm"
                            >
                              <Link
                                to={productUrl}
                                aria-label={`${translations.details[language]}: ${product.name[language]}`}
                              >
                                <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                {translations.details[language]}
                              </Link>
                            </Button>
                            <Button
                              variant="outline"
                              className="w-full text-xs sm:text-sm"
                              onClick={() => {
                                setSelectedProduct(product);
                                setShowQuoteForm(true);
                              }}
                            >
                              {translations.requestQuote[language]}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentPage > 1) {
                                setCurrentPage(currentPage - 1);
                              }
                            }}
                            className={
                              currentPage <= 1
                                ? "pointer-events-none opacity-50"
                                : ""
                            }
                          />
                        </PaginationItem>

                        {Array.from(
                          { length: totalPages },
                          (_, i) => i + 1,
                        ).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(page);
                              }}
                              isActive={currentPage === page}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}

                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentPage < totalPages) {
                                setCurrentPage(currentPage + 1);
                              }
                            }}
                            className={
                              currentPage >= totalPages
                                ? "pointer-events-none opacity-50"
                                : ""
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quote Request Form */}
      {showQuoteForm && (
        <QuoteRequestForm
          language={language}
          product={selectedProduct}
          onClose={() => {
            setShowQuoteForm(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
};

export default Catalog;
