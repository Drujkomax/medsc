"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Heart,
  FileText,
  Package,
  Globe,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useT, useLang } from "~/shared/i18n/i18n-provider";
import { getCountryName, getCountryFlag } from "@/utils/countries";
import { useCurrencyRates } from "@/hooks/useCurrencyRates";
import {
  formatUzbekPhoneNumber,
  validateUzbekPhoneNumber,
  isValidUzbekPhoneLength,
  isCompleteUzbekPhone,
} from "@/lib/phoneValidation";
import { toUrlSlug } from "@/lib/slugify";
import Image from "next/image";
import { API_URL, BLUR_DATA_URL } from "~/shared/config/site";

const getCategoryLabel = (category: string, language: "ru" | "en" | "uz") => {
  const categoryLabels = {
    diagnostic: { ru: "Диагностическое", en: "Diagnostic", uz: "Diagnostika" },
    surgical: { ru: "Хирургическое", en: "Surgical", uz: "Jarrohlik" },
    monitoring: { ru: "Мониторинг", en: "Monitoring", uz: "Monitoring" },
    laboratory: { ru: "Лабораторное", en: "Laboratory", uz: "Laboratoriya" },
    rehabilitation: {
      ru: "Реабилитационное",
      en: "Rehabilitation",
      uz: "Reabilitatsiya",
    },
    dental: { ru: "Стоматологическое", en: "Dental", uz: "Stomatologiya" },
    ophthalmology: {
      ru: "Офтальмологическое",
      en: "Ophthalmology",
      uz: "Oftalmologiya",
    },
    furniture: {
      ru: "Медицинская мебель",
      en: "Medical Furniture",
      uz: "Tibbiy mebel",
    },
  };

  return (
    categoryLabels[category as keyof typeof categoryLabels]?.[language] ||
    category
  );
};

const translations = {
  backToCatalog: {
    ru: "Назад к каталогу",
    en: "Back to Catalog",
    uz: "Katalogga qaytish",
  },
  inStock: { ru: "В наличии", en: "In Stock", uz: "Mavjud" },
  outOfStock: { ru: "Под заказ", en: "On Order", uz: "Buyurtma bo'yicha" },
  features: { ru: "Характеристики", en: "Features", uz: "Xususiyatlar" },
  category: { ru: "Категория", en: "Category", uz: "Kategoriya" },
  requestQuote: { ru: "Запросить КП", en: "Request Quote", uz: "KP so'rash" },
  requestQuoteTitle: {
    ru: "Запрос коммерческого предложения",
    en: "Request Commercial Proposal",
    uz: "Tijoriy taklif so'rovi",
  },
  requestQuoteDesc: {
    ru: "Заполните форму и мы свяжемся с вами в ближайшее время",
    en: "Fill out the form and we will contact you soon",
    uz: "Shaklni to'ldiring va biz tez orada siz bilan bog'lanamiz",
  },
  companyName: {
    ru: "Название организации",
    en: "Company Name",
    uz: "Tashkilot nomi",
  },
  contactPerson: {
    ru: "Контактное лицо",
    en: "Contact Person",
    uz: "Aloqa shaxsi",
  },
  phone: { ru: "Телефон", en: "Phone", uz: "Telefon" },
  email: { ru: "Email", en: "Email", uz: "Email" },
  message: {
    ru: "Дополнительные пожелания",
    en: "Additional Requirements",
    uz: "Qo'shimcha talablar",
  },
  submit: {
    ru: "Отправить заявку",
    en: "Submit Request",
    uz: "So'rov yuborish",
  },
  successMessage: {
    ru: "Заявка отправлена! Мы свяжемся с вами в ближайшее время.",
    en: "Request sent! We will contact you soon.",
    uz: "So'rov yuborildi! Biz tez orada siz bilan bog'lanamiz.",
  },
  productNotFound: {
    ru: "Товар не найден",
    en: "Product not found",
    uz: "Mahsulot topilmadi",
  },
  loading: {
    ru: "Загружаем товар...",
    en: "Loading product...",
    uz: "Mahsulot yuklanmoqda...",
  },
  error: { ru: "Ошибка загрузки", en: "Loading error", uz: "Yuklash xatosi" },
  keyFeatures: {
    ru: "Ключевые особенности",
    en: "Key Features",
    uz: "Asosiy xususiyatlar",
  },
  manufacturer: {
    ru: "Производитель",
    en: "Manufacturer",
    uz: "Ishlab chiqaruvchi",
  },
  country: { ru: "Страна", en: "Country", uz: "Mamlakat" },
};

const toImageUrl = (img: string | null | undefined): string | null => {
  if (!img) return null;
  return img.startsWith("http") ? img : `${API_URL}${img}`;
};

export function ProductDetailView({
  product,
  manufacturers,
  related,
}: {
  product: any;
  manufacturers: any[];
  related: any[];
}) {
  const t = useT();
  const language = (useLang() as "ru" | "en" | "uz") || "ru";
  const router = useRouter();
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState("");
  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    phone: "",
    email: "",
    message: "",
  });

  const handlePhoneChange = (value: string) => {
    if (!isValidUzbekPhoneLength(value)) return;

    const formatted = formatUzbekPhoneNumber(value);
    setFormData((prev) => ({ ...prev, phone: formatted }));

    if (formatted.length > 0) {
      if (!isCompleteUzbekPhone(formatted)) {
        setPhoneError(
          language === "ru"
            ? "Номер должен содержать 9 цифр"
            : language === "en"
              ? "Number must contain 9 digits"
              : "Raqam 9 ta raqamdan iborat bo'lishi kerak",
        );
      } else if (!validateUzbekPhoneNumber(formatted)) {
        setPhoneError(
          language === "ru"
            ? "Неверный формат номера"
            : language === "en"
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

  const { convertToUZS, formatPrice } = useCurrencyRates();

  const manufacturer = manufacturers.find(
    (m) => m.id === product?.manufacturer_id,
  );
  const countryCode = manufacturer?.country_code || product?.country || null;

  const productName = (() => {
    if (typeof product.name === "object" && product.name !== null) {
      const objName = product.name as Record<string, string>;
      return (
        objName[language] ||
        objName.ru ||
        objName.en ||
        "Медицинское оборудование"
      );
    }
    return String(product.name) || "Медицинское оборудование";
  })();

  const productDescription = (() => {
    if (
      typeof product.description === "object" &&
      product.description !== null
    ) {
      const objDesc = product.description as Record<string, string>;
      return objDesc[language] || objDesc.ru || objDesc.en || "";
    }
    return String(product.description) || "";
  })();

  const manufacturerSlugSafe = toUrlSlug(manufacturer?.slug);
  const categoryLabel = getCategoryLabel(product.category, language);
  const categoryPath = `/catalog?category=${encodeURIComponent(
    product.category,
  )}`;

  const seoBlurb =
    language === "ru"
      ? `${productName} доступен для клиник Узбекистана: продажа, аренда и сервисное сопровождение от Med Service Centre.`
      : language === "en"
        ? `${productName} is available for clinics in Uzbekistan with sales, rental, and service support from Med Service Centre.`
        : `${productName} O‘zbekiston klinikalari uchun mavjud: sotuv, ijara va Med Service Centre servis xizmati.`;

  const coverUrl = toImageUrl(product.images?.cover);
  const selectedImageUrl = toImageUrl(selectedImage);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate phone before submit
    if (
      !isCompleteUzbekPhone(formData.phone) ||
      !validateUzbekPhoneNumber(formData.phone)
    ) {
      setPhoneError(
        language === "ru"
          ? "Введите корректный узбекский номер"
          : language === "en"
            ? "Enter a valid Uzbek number"
            : "To'g'ri O'zbek raqamini kiriting",
      );
      return;
    }

    toast({
      title: translations.successMessage[language],
      description: `${productName} - ${formData.companyName}`,
    });
    setIsDialogOpen(false);
    setFormData({
      companyName: "",
      contactPerson: "",
      phone: "",
      email: "",
      message: "",
    });
    setPhoneError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <nav className="text-sm text-muted-foreground mb-4">
          <Link href="/catalog" className="hover:underline">
            {language === "ru"
              ? "Каталог"
              : language === "en"
                ? "Catalog"
                : "Katalog"}
          </Link>
          <span className="mx-2">/</span>
          <Link href={categoryPath} className="hover:underline">
            {categoryLabel}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{productName}</span>
        </nav>
        <Button
          variant="outline"
          onClick={() => router.push("/catalog")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {translations.backToCatalog[language]}
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
              {coverUrl || selectedImageUrl ? (
                <Image
                  src={(selectedImageUrl || coverUrl)!}
                  alt={productName}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-24 h-24 text-muted-foreground" />
                </div>
              )}
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-background/80 backdrop-blur-sm"
                  onClick={() => setIsFavorite(!isFavorite)}
                >
                  <Heart
                    className={`h-4 w-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`}
                  />
                </Button>
              </div>
            </div>

            {/* Gallery */}
            {product.images?.gallery && product.images.gallery.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {/* Cover as first thumbnail */}
                {product.images.cover && (
                  <div
                    className={`relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer border-2 transition-colors ${
                      !selectedImage
                        ? "border-primary"
                        : "border-transparent hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedImage(null)}
                  >
                    {coverUrl && (
                      <Image
                        src={coverUrl}
                        alt={`${productName} - основное изображение`}
                        fill
                        sizes="120px"
                        className="object-cover"
                      />
                    )}
                  </div>
                )}

                {/* Gallery images */}
                {product.images.gallery.map((image: string, index: number) => (
                  <div
                    key={index}
                    className={`relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer border-2 transition-colors ${
                      selectedImage === image
                        ? "border-primary"
                        : "border-transparent hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedImage(image)}
                  >
                    {toImageUrl(image) && (
                      <Image
                        src={toImageUrl(image)!}
                        alt={`${productName} - изображение ${index + 1}`}
                        fill
                        sizes="120px"
                        className="object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {productName}
              </h1>
              <div className="mb-4 flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-sm">
                  {getCategoryLabel(product.category, language)}
                </Badge>
              </div>
              <p className="text-lg text-muted-foreground mb-6">
                {productDescription}
              </p>
              <p className="text-sm text-muted-foreground">{seoBlurb}</p>

              {/* Price Display */}
              {product.price && product.currency && (
                <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-bold text-primary">
                        {formatPrice(product.price, product.currency)}
                      </span>
                      <span className="text-xl text-muted-foreground">
                        {product.currency}
                      </span>
                    </div>
                    {product.currency !== "UZS" && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        ≈{" "}
                        {formatPrice(
                          convertToUZS(
                            parseFloat(product.price),
                            product.currency,
                          ).toString(),
                          "UZS",
                        )}{" "}
                        <span className="font-medium">UZS</span>
                        <div className="text-xs mt-1 opacity-70">
                          По курсу НБУ на сегодня
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Features */}
            {product.features &&
              product.features[language] &&
              product.features[language].length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-medium text-sm">
                            ✓
                          </span>
                        </div>
                        {translations.keyFeatures[language]}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {product.features[language].map(
                        (feature: string, index: number) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
                          >
                            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                            <span className="text-foreground leading-relaxed">
                              {feature}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Manufacturer Info */}
            {(manufacturer || product.country) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {translations.manufacturer[language]}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {manufacturer ? (
                    <div className="space-y-4">
                      {manufacturer.logo_url && (
                        <div className="flex items-center gap-3 pb-3 border-b">
                          <img
                            src={manufacturer.logo_url}
                            alt={`${manufacturer.name} logo`}
                            className="h-12 w-auto object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <div className="font-medium text-lg">
                          {manufacturerSlugSafe ? (
                            <Link
                              href={`/catalog?manufacturer=${encodeURIComponent(
                                manufacturerSlugSafe,
                              )}`}
                              className="hover:underline"
                            >
                              {manufacturer.name}
                            </Link>
                          ) : (
                            manufacturer.name
                          )}
                        </div>
                        {manufacturer.legal_name && (
                          <div className="text-sm text-muted-foreground">
                            {manufacturer.legal_name}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <span
                            className="text-xl leading-none inline-block"
                            style={{
                              fontFamily:
                                "Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif",
                            }}
                          >
                            {getCountryFlag(countryCode)}
                          </span>
                          <span className="font-medium">
                            {getCountryName(countryCode, language) ||
                              translations.country[language]}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : product.country ? (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span
                        className="text-xl leading-none inline-block mr-1"
                        style={{
                          fontFamily:
                            "Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif",
                        }}
                      >
                        {getCountryFlag(product.country)}
                      </span>
                      <span>{getCountryName(product.country, language)}</span>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )}

            {/* CTA Button */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  <FileText className="h-5 w-5 mr-2" />
                  {translations.requestQuote[language]}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {translations.requestQuoteTitle[language]}
                  </DialogTitle>
                  <DialogDescription>
                    {translations.requestQuoteDesc[language]}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="companyName">
                      {translations.companyName[language]}
                    </Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          companyName: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPerson">
                      {translations.contactPerson[language]}
                    </Label>
                    <Input
                      id="contactPerson"
                      value={formData.contactPerson}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactPerson: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">
                      {translations.phone[language]}
                    </Label>
                    <div className="relative">
                      <div className="absolute left-3 top-2.5 flex items-center gap-1.5 pointer-events-none">
                        <span className="text-base">🇺🇿</span>
                        <span className="text-foreground font-medium text-sm">
                          +998
                        </span>
                        <div className="w-px h-3 bg-border mx-1"></div>
                      </div>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        required
                        className={`pl-20 ${phoneError ? "border-destructive" : ""}`}
                        placeholder="XX XXX XX XX"
                        maxLength={12}
                      />
                    </div>
                    {phoneError && (
                      <p className="text-destructive text-xs mt-1 animate-in slide-in-from-top-1 duration-200">
                        {phoneError}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="email">
                      {translations.email[language]}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">
                      {translations.message[language]}
                    </Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    {translations.submit[language]}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}
