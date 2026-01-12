import { Phone, Mail, MapPin, MessageCircle, Facebook, Instagram, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';
import SEOHead from "@/components/SEO/SEOHead";
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import LocationMap from '@/components/common/LocationMap';
import { formatUzbekPhoneNumber, validateUzbekPhoneNumber, isValidUzbekPhoneLength, isCompleteUzbekPhone } from '@/lib/phoneValidation';

const Contacts = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  
  // Contact data state
  const [contactData, setContactData] = useState({
    phone: '+998 (71) 237-33-08',
    email: 'info@medsc.uz',
    address: '',
    telegram: '@medservice_centre',
    whatsapp: '+998 90 944 34 82',
    facebook: 'https://www.facebook.com/profile.php?id=61576982724139',
    instagram: 'https://www.instagram.com/medservicecentreuz/',
    youtube: 'https://www.youtube.com/@MedService_centre/shorts'
  });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  // Load contact data from database
  useEffect(() => {
    const loadContactData = async () => {
      try {
        const { data, error } = await supabase
          .from('site_contacts')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setContactData({
            phone: data.phone || '+998 (71) 237-33-08',
            email: data.email || 'info@medsc.uz',
            address: data.address || '',
            telegram: data.telegram || '@medservice_centre',
            whatsapp: data.whatsapp || '+998 90 944 34 82',
            facebook: data.facebook || 'https://www.facebook.com/profile.php?id=61576982724139',
            instagram: data.instagram || 'https://www.instagram.com/medservicecentreuz/',
            youtube: data.youtube || 'https://www.youtube.com/@MedService_centre/shorts'
          });
        }
      } catch (error) {
        console.error('Error loading contact data:', error);
      }
    };

    loadContactData();
  }, []);
  
  const addressTranslations = {
    ru: 'Узбекистан, Ташкент, ул. Асака, 32',
    en: 'Uzbekistan, Tashkent, Asaka St., 32',
    uz: 'O\'zbekiston, Toshkent, Asaka ko\'chasi, 32'
  };
  
  const content = {
    ru: {
      title: 'Контакты',
      subtitle: 'Свяжитесь с нами любым удобным способом',
      phone: 'Телефон',
      email: 'Электронная почта',
      address: 'Адрес',
      socialNetworks: 'Социальные сети',
      workingHours: 'Часы работы',
      workingHoursText: 'Понедельник - Пятница: 9:00 - 18:00',
      weekend: 'Суббота - Воскресенье: Выходной',
      contactForm: 'Форма обратной связи',
      formDescription: 'Оставьте заявку и мы свяжемся с вами в ближайшее время',
      name: 'Имя',
      phoneField: 'Телефон',
      emailField: 'Email',
      message: 'Сообщение',
      messagePlaceholder: 'Ваше сообщение...',
      send: 'Отправить',
      fullAddress: 'Узбекистан, Ташкент, ул. Асака, 32',
      ourLocation: 'Наше местоположение',
      locationDescription: 'Найдите нас на карте'
    },
    en: {
      title: 'Contacts',
      subtitle: 'Contact us in any convenient way',
      phone: 'Phone',
      email: 'Email',
      address: 'Address',
      socialNetworks: 'Social Networks',
      workingHours: 'Working Hours',
      workingHoursText: 'Monday - Friday: 9:00 AM - 6:00 PM',
      weekend: 'Saturday - Sunday: Closed',
      contactForm: 'Contact Form',
      formDescription: 'Leave a request and we will contact you soon',
      name: 'Name',
      phoneField: 'Phone',
      emailField: 'Email',
      message: 'Message',
      messagePlaceholder: 'Your message...',
      send: 'Send',
      fullAddress: 'Uzbekistan, Tashkent, Asaka St., 32',
      ourLocation: 'Our Location',
      locationDescription: 'Find us on the map'
    },
    uz: {
      title: 'Aloqa',
      subtitle: 'Biz bilan qulay usulda bog\'laning',
      phone: 'Telefon',
      email: 'Elektron pochta',
      address: 'Manzil',
      socialNetworks: 'Ijtimoiy tarmoqlar',
      workingHours: 'Ish vaqti',
      workingHoursText: 'Dushanba - Juma: 9:00 - 18:00',
      weekend: 'Shanba - Yakshanba: Dam olish kuni',
      contactForm: 'Aloqa shakli',
      formDescription: 'So\'rov qoldiring va biz tez orada siz bilan bog\'lanamiz',
      name: 'Ism',
      phoneField: 'Telefon',
      emailField: 'Email',
      message: 'Xabar',
      messagePlaceholder: 'Sizning xabaringiz...',
      send: 'Yuborish',
      fullAddress: 'O\'zbekiston, Toshkent, Asaka ko\'chasi, 32',
      ourLocation: 'Bizning joylashuvimiz',
      locationDescription: 'Bizni xaritada toping'
    }
  };

  const currentContent = content[i18n.language as 'ru' | 'en' | 'uz'] || content['ru'];

  const handlePhoneClick = () => {
    const phoneNumber = contactData.phone.replace(/[^\d+]/g, '');
    window.open(`tel:${phoneNumber}`, '_self');
  };

  const handleEmailClick = () => {
    window.open(`mailto:${contactData.email}`, '_self');
  };

  const handleTelegramClick = () => {
    const telegramUrl = contactData.telegram.startsWith('http') 
      ? contactData.telegram 
      : `https://t.me/${contactData.telegram.replace('@', '')}`;
    window.open(telegramUrl, '_blank');
  };

  const handleWhatsAppClick = () => {
    const whatsappNumber = contactData.whatsapp.replace(/[^\d]/g, '');
    window.open(`https://wa.me/${whatsappNumber}`, '_blank');
  };

  const handleFacebookClick = () => {
    window.open(contactData.facebook, '_blank');
  };

  const handleInstagramClick = () => {
    window.open(contactData.instagram, '_blank');
  };

  const handleYouTubeClick = () => {
    window.open(contactData.youtube, '_blank');
  };

  // Form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      // Validate and format phone number
      if (!isValidUzbekPhoneLength(value)) return;
      
      const formatted = formatUzbekPhoneNumber(value);
      setFormData(prev => ({
        ...prev,
        [name]: formatted
      }));
      
      // Show validation error
      if (formatted.length > 0) {
        if (!isCompleteUzbekPhone(formatted)) {
          const lang = i18n.language;
          setPhoneError(lang === 'ru' ? 'Номер должен содержать 9 цифр' : lang === 'en' ? 'Number must contain 9 digits' : 'Raqam 9 ta raqamdan iborat bo\'lishi kerak');
        } else if (!validateUzbekPhoneNumber(formatted)) {
          const lang = i18n.language;
          setPhoneError(lang === 'ru' ? 'Неверный формат номера' : lang === 'en' ? 'Invalid phone format' : 'Noto\'g\'ri telefon formati');
        } else {
          setPhoneError('');
        }
      } else {
        setPhoneError('');
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('contact_inquiries' as any)
        .insert({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          message: formData.message
        });

      if (error) throw error;

      toast({
        title: 'Сообщение отправлено',
        description: 'Мы свяжемся с вами в ближайшее время.',
      });

      // Reset form
      setFormData({
        name: '',
        phone: '',
        email: '',
        message: ''
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение. Попробуйте позже.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-20">
      <SEOHead
        title="Контакты Med Service Centre"
        description="Контакты Med Service Centre™: офис в Ташкенте, телефон, e-mail, карта и онлайн-форма для закупки и аренды медтехники, сервисных заявок и консультаций."
        keywords="контакты Med Service Centre, медицинское оборудование Ташкент, телефон медтехника, e-mail медоборудование, карта офиса Ташкент, онлайн форма заявки"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4">
            {currentContent.title}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {currentContent.subtitle}
          </p>
        </div>

        {/* Contact Methods Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {/* Phone */}
          <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer" onClick={handlePhoneClick}>
            <CardContent className="p-8 text-center">
              <div className="w-12 h-12 bg-msc-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-xl text-foreground mb-2">{currentContent.phone}</h3>
              <div className="space-y-1">
                <p className="text-msc-primary text-lg font-medium">{contactData.phone}</p>
              </div>
            </CardContent>
          </Card>

          {/* Email */}
          <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer" onClick={handleEmailClick}>
            <CardContent className="p-8 text-center">
              <div className="w-12 h-12 bg-msc-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-xl text-foreground mb-2">{currentContent.email}</h3>
              <p className="text-msc-primary text-lg font-medium">{contactData.email}</p>
            </CardContent>
          </Card>

          {/* Address */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-8 text-center">
              <div className="w-12 h-12 bg-msc-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-xl text-foreground mb-2">{currentContent.address}</h3>
              <p className="text-muted-foreground text-lg">{addressTranslations[i18n.language as 'ru' | 'en' | 'uz'] || addressTranslations.ru}</p>
            </CardContent>
          </Card>

          {/* Telegram */}
          <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer" onClick={handleTelegramClick}>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-msc-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-xl text-foreground mb-2">Telegram</h3>
              <p className="text-msc-primary text-lg font-medium">{contactData.telegram}</p>
            </CardContent>
          </Card>

          {/* WhatsApp */}
          <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer" onClick={handleWhatsAppClick}>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-msc-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-xl text-foreground mb-2">WhatsApp</h3>
              <p className="text-msc-primary text-lg font-medium">{contactData.whatsapp}</p>
            </CardContent>
          </Card>

          {/* Working Hours */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-8 text-center">
              <div className="w-12 h-12 bg-msc-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-6 h-6 bg-white rounded text-msc-primary font-bold flex items-center justify-center text-xs">
                  9-6
                </div>
              </div>
              <h3 className="font-semibold text-xl text-foreground mb-2">{currentContent.workingHours}</h3>
              <div className="space-y-1">
                <p className="text-muted-foreground">{currentContent.workingHoursText}</p>
                <p className="text-muted-foreground text-sm">{currentContent.weekend}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Social Networks Row */}
        <div className="mb-16">
          <h3 className="font-semibold text-2xl text-foreground text-center mb-8">{currentContent.socialNetworks}</h3>
          <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
            <Button 
              variant="outline" 
              size="lg"
              className="h-12 justify-center space-x-2 text-base px-6"
              onClick={handleFacebookClick}
            >
              <Facebook className="w-4 h-4" />
              <span>Facebook</span>
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="h-12 justify-center space-x-2 text-base px-6"
              onClick={handleInstagramClick}
            >
              <Instagram className="w-4 h-4" />
              <span>Instagram</span>
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="h-12 justify-center space-x-2 text-base px-6"
              onClick={handleYouTubeClick}
            >
              <Youtube className="w-4 h-4" />
              <span>YouTube</span>
            </Button>
          </div>
        </div>

        {/* Contact Form */}
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h3 className="font-semibold text-3xl text-foreground mb-2">{currentContent.contactForm}</h3>
                <p className="text-muted-foreground text-lg">{currentContent.formDescription}</p>
              </div>
              
              <form className="space-y-6" onSubmit={handleFormSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {currentContent.name}
                    </label>
                    <Input 
                      type="text" 
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="h-12"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {currentContent.phoneField}
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-3.5 flex items-center gap-1.5 pointer-events-none">
                        <span className="text-base">🇺🇿</span>
                        <span className="text-sm font-medium text-foreground">+998</span>
                        <div className="w-px h-3 bg-gray-300 mx-1"></div>
                      </div>
                      <Input 
                        type="tel" 
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`h-12 pl-20 ${phoneError ? 'border-red-500' : ''}`}
                        placeholder="XX XXX XX XX"
                        maxLength={12}
                        required
                      />
                      {phoneError && (
                        <p className="text-red-500 text-xs mt-1">{phoneError}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {currentContent.emailField}
                  </label>
                  <Input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="h-12"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {currentContent.message}
                  </label>
                  <Textarea 
                    rows={5}
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder={currentContent.messagePlaceholder}
                    className="resize-none"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full bg-msc-primary hover:bg-msc-accent text-lg py-3"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Отправка...' : currentContent.send}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Location Map */}
        <div className="max-w-4xl mx-auto mt-16">
          <div className="text-center mb-8">
            <h3 className="font-semibold text-3xl text-foreground mb-2">{currentContent.ourLocation}</h3>
            <p className="text-muted-foreground text-lg">{currentContent.locationDescription}</p>
          </div>
          <LocationMap />
        </div>
      </div>
    </div>
  );
};

export default Contacts;