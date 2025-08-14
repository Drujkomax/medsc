import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import mscLogo from '../../assets/msc-logo.png';

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
      address: 'г. Ташкент, Узбекистан',
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
      address: 'Tashkent, Uzbekistan',
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
      address: 'Toshkent, O\'zbekiston',
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
                src="/lovable-uploads/f5c3dd5e-1f26-44b2-b83a-e44ca979092f.png" 
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
                <span>+998 (71) 123-45-67</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-msc-accent" />
                <span>info@msc.uz</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-msc-accent" />
                <span>{t.address}</span>
              </div>
              <div className="flex items-center space-x-3">
                <MessageCircle className="w-5 h-5 text-msc-accent" />
                <span>@msc_uzbekistan</span>
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
                href="/Условия использования и дисклеймер Med Service Centre.docx" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-msc-accent transition-colors"
              >
                {language === 'ru' ? 'Условия использования' : 
                 language === 'en' ? 'Terms of Use' : 
                 'Foydalanish shartlari'}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;