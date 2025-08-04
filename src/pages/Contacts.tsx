import { Phone, Mail, MapPin, MessageCircle, Facebook, Instagram, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ContactsProps {
  language: 'ru' | 'en' | 'uz';
}

const Contacts = ({ language }: ContactsProps) => {
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
      send: 'Отправить',
      fullAddress: 'г. Ташкент, Узбекистан'
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
      send: 'Send',
      fullAddress: 'Tashkent, Uzbekistan'
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
      send: 'Yuborish',
      fullAddress: 'Toshkent, O\'zbekiston'
    }
  };

  const t = content[language];

  const handlePhoneClick = () => {
    window.open('tel:+998712373308', '_self');
  };

  const handleEmailClick = () => {
    window.open('mailto:info@medsc.uz', '_self');
  };

  const handleTelegramClick = () => {
    window.open('https://t.me/medservice_centre', '_blank');
  };

  const handleWhatsAppClick = () => {
    window.open('https://wa.me/998909443482', '_blank');
  };

  const handleFacebookClick = () => {
    window.open('https://www.facebook.com/profile.php?id=61576982724139', '_blank');
  };

  const handleInstagramClick = () => {
    window.open('https://www.instagram.com/medservicecentreuz/', '_blank');
  };

  const handleYouTubeClick = () => {
    window.open('https://www.youtube.com/@MedService_centre/shorts', '_blank');
  };

  return (
    <div className="min-h-screen bg-background py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4">
            {t.title}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        {/* Contact Methods Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {/* Phone */}
          <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer" onClick={handlePhoneClick}>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-msc-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-xl text-foreground mb-2">{t.phone}</h3>
              <p className="text-msc-primary text-lg font-medium">+998 (71) 237-33-08</p>
            </CardContent>
          </Card>

          {/* Email */}
          <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer" onClick={handleEmailClick}>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-msc-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-xl text-foreground mb-2">{t.email}</h3>
              <p className="text-msc-primary text-lg font-medium">info@medsc.uz</p>
            </CardContent>
          </Card>

          {/* Address */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-msc-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-xl text-foreground mb-2">{t.address}</h3>
              <p className="text-muted-foreground text-lg">{t.fullAddress}</p>
            </CardContent>
          </Card>

          {/* Telegram */}
          <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer" onClick={handleTelegramClick}>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-msc-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-xl text-foreground mb-2">Telegram</h3>
              <p className="text-msc-primary text-lg font-medium">@medservice_centre</p>
            </CardContent>
          </Card>

          {/* WhatsApp */}
          <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer" onClick={handleWhatsAppClick}>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-msc-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-xl text-foreground mb-2">WhatsApp</h3>
              <p className="text-msc-primary text-lg font-medium">+998 90 944 34 82</p>
            </CardContent>
          </Card>

          {/* Working Hours */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-msc-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 bg-white rounded text-msc-primary font-bold flex items-center justify-center text-sm">
                  9-6
                </div>
              </div>
              <h3 className="font-semibold text-xl text-foreground mb-2">{t.workingHours}</h3>
              <div className="space-y-1">
                <p className="text-muted-foreground">{t.workingHoursText}</p>
                <p className="text-muted-foreground text-sm">{t.weekend}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Social Networks Row */}
        <div className="mb-16">
          <h3 className="font-semibold text-2xl text-foreground text-center mb-8">{t.socialNetworks}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <Button 
              variant="outline" 
              size="lg"
              className="h-16 justify-center space-x-3 text-lg"
              onClick={handleFacebookClick}
            >
              <Facebook className="w-6 h-6" />
              <span>Facebook</span>
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="h-16 justify-center space-x-3 text-lg"
              onClick={handleInstagramClick}
            >
              <Instagram className="w-6 h-6" />
              <span>Instagram</span>
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="h-16 justify-center space-x-3 text-lg"
              onClick={handleYouTubeClick}
            >
              <Youtube className="w-6 h-6" />
              <span>YouTube</span>
            </Button>
          </div>
        </div>

        {/* Contact Form */}
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h3 className="font-semibold text-3xl text-foreground mb-2">{t.contactForm}</h3>
                <p className="text-muted-foreground text-lg">{t.formDescription}</p>
              </div>
              
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t.name}
                    </label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-msc-primary"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t.phoneField}
                    </label>
                    <input 
                      type="tel" 
                      className="w-full px-4 py-3 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-msc-primary"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t.emailField}
                  </label>
                  <input 
                    type="email" 
                    className="w-full px-4 py-3 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-msc-primary"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t.message}
                  </label>
                  <textarea 
                    rows={5}
                    className="w-full px-4 py-3 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-msc-primary"
                    placeholder="Ваше сообщение..."
                  ></textarea>
                </div>
                
                <Button type="submit" size="lg" className="w-full bg-msc-primary hover:bg-msc-accent text-lg py-3">
                  {t.send}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Contacts;