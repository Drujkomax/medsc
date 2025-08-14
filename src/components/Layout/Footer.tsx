import { Phone, Mail, MapPin, Send } from 'lucide-react';


interface FooterProps {
  language: 'ru' | 'en' | 'uz';
}

const Footer = ({ language }: FooterProps) => {
  const content = {
    ru: {
      company: 'Med Service Centre',
      description: 'Ведущий интегратор медицинского оборудования и сервис-услуг в Узбекистане',
      quickLinks: 'Быстрые ссылки',
      contacts: 'Контакты',
      services: 'Услуги',
      address: 'г. Ташкент, Мирзо Улугбекский р-н, ул. Асака, 32',
      rights: 'Все права защищены',
      links: [
        { name: 'Каталог', href: '/catalog' },
        { name: 'Услуги', href: '/services' },
        { name: 'Кейсы', href: '/cases' },
        { name: 'О компании', href: '/about' },
      ],
      servicesList: [
        'Поставка оборудования',
        'Инсталляция и настройка',
        'Обучение персонала',
        'Техническое обслуживание',
      ]
    },
    en: {
      company: 'Med Service Centre',
      description: 'Leading integrator of medical equipment and services in Uzbekistan',
      quickLinks: 'Quick Links',
      contacts: 'Contacts',
      services: 'Services',
      address: 'Tashkent, Mirzo Ulugbek district, Asaka street, 32',
      rights: 'All rights reserved',
      links: [
        { name: 'Catalog', href: '/catalog' },
        { name: 'Services', href: '/services' },
        { name: 'Cases', href: '/cases' },
        { name: 'About', href: '/about' },
      ],
      servicesList: [
        'Equipment Supply',
        'Installation & Setup',
        'Staff Training',
        'Technical Support',
      ]
    },
    uz: {
      company: 'Med Service Centre',
      description: "O'zbekistonda tibbiy asbob-uskunalar va xizmatlarning yetakchi integratori",
      quickLinks: 'Tezkor havolalar',
      contacts: 'Aloqa',
      services: 'Xizmatlar',
      address: 'Toshkent sh., Mirzo Ulug\'bek tumani, Asaka ko\'chasi, 32',
      rights: 'Barcha huquqlar himoyalangan',
      links: [
        { name: 'Katalog', href: '/catalog' },
        { name: 'Xizmatlar', href: '/services' },
        { name: 'Loyihalar', href: '/cases' },
        { name: 'Kompaniya haqida', href: '/about' },
      ],
      servicesList: [
        'Uskunalar yetkazib berish',
        "O'rnatish va sozlash",
        'Xodimlarni o\'qitish',
        'Texnik xizmat ko\'rsatish',
      ]
    }
  };

  const t = content[language];

  return (
    <footer className="bg-msc-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src="/lovable-uploads/cebee8f0-cb8b-4449-8cdc-3cf173144e75.png" 
                alt="MSC Logo" 
                className="w-16 h-16 object-contain" 
              />
              <div>
                <h3 className="font-heading text-xl font-bold">{t.company}</h3>
                <p className="text-sm text-white/80">8 лет опыта • 300+ проектов</p>
              </div>
            </div>
            <p className="text-white/80 mb-6 max-w-md">{t.description}</p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-msc-accent" />
                <a 
                  href="tel:+998712373308"
                  className="hover:text-msc-accent transition-colors"
                >
                  +998 (71) 237-33-08
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-msc-accent" />
                <a 
                  href="mailto:info@medsc.uz"
                  className="hover:text-msc-accent transition-colors"
                >
                  info@medsc.uz
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-msc-accent" />
                <a 
                  href="https://yandex.ru/maps/?text=г. Ташкент, Мирзо Улугбекский р-н, ул. Асака, 32"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-msc-accent transition-colors"
                >
                  {t.address}
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Send className="w-5 h-5 text-msc-accent" />
                <a 
                  href="https://t.me/medservice_centre" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-msc-accent transition-colors"
                >
                  @medservice_centre
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">{t.quickLinks}</h4>
            <ul className="space-y-2">
              {t.links.map((link) => (
                <li key={link.href}>
                  <a 
                    href={link.href}
                    className="text-white/80 hover:text-msc-accent transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-lg mb-4">{t.services}</h4>
            <ul className="space-y-2">
              {t.servicesList.map((service, index) => (
                <li key={index} className="text-white/80 text-sm">
                  {service}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 mt-8 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-white/60 text-sm">
              © 2024 {t.company}. {t.rights}
            </p>
            <div className="flex gap-4 text-sm">
              <a 
                href="/services"
                className="text-white/60 hover:text-msc-accent transition-colors"
              >
                {language === 'ru' ? 'Условия использования' : 
                 language === 'en' ? 'Terms of Use' : 
                 'Foydalanish shartlari'}
              </a>
              <a 
                href="/services"
                className="text-white/60 hover:text-msc-accent transition-colors"
              >
                {language === 'ru' ? 'Каталог MSC' : 
                 language === 'en' ? 'MSC Catalog' : 
                 'MSC Katalogi'}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;