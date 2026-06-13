import { Phone, Mail, MapPin, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FooterProps {
  language: 'ru' | 'en' | 'uz';
}

const Footer = ({ language }: FooterProps) => {
  const { t } = useTranslation();
  const links = t('footer.links', { returnObjects: true }) as { name: string; href: string }[];
  const servicesList = t('footer.servicesList', { returnObjects: true }) as string[];
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-msc-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center justify-center md:justify-start space-x-3 mb-4">
              <img
                src="/lovable-uploads/cebee8f0-cb8b-4449-8cdc-3cf173144e75.png"
                alt="MSC Logo"
                className="w-16 h-16 object-contain"
              />
              <div>
                <h3 className="font-heading text-xl font-bold">{t('footer.company')}</h3>
                <p className="text-sm text-white/80">{t('footer.stats')}</p>
              </div>
            </div>
            <p className="text-white/80 mb-6 max-w-md">{t('footer.description')}</p>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-center md:justify-start space-x-3">
                <Mail className="w-5 h-5 text-msc-accent" />
                <a
                  href="mailto:info@medsc.uz"
                  className="hover:text-msc-accent transition-colors"
                >
                  info@medsc.uz
                </a>
              </div>
              <div className="flex items-center justify-center md:justify-start space-x-3">
                <MapPin className="w-5 h-5 text-msc-accent" />
                <a
                  href="https://yandex.uz/maps/?ll=69.301548,41.316163&z=17&pt=69.301548,41.316163"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-msc-accent transition-colors"
                >
                  {t('footer.address')}
                </a>
              </div>
              <div className="flex items-center justify-center md:justify-start space-x-3">
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
            <h4 className="font-semibold text-lg mb-4">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-white/80 hover:text-msc-accent transition-colors block"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-lg mb-4">{t('footer.services')}</h4>
            <ul className="space-y-2">
              {servicesList.map((service, index) => (
                <li key={index}>
                  <a
                    href="/services"
                    className="text-white/80 text-sm hover:text-msc-accent transition-colors block"
                  >
                    {service}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 mt-8 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
            <p className="text-white/60 text-sm">
              © {currentYear} {t('footer.company')}. {t('footer.rights')}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 text-sm">
              <a
                href="/privacy-policy"
                className="text-white/60 hover:text-msc-accent transition-colors"
              >
                {t('footer.privacyPolicy', 'Политика конфиденциальности')}
              </a>
              <a
                href="/Условия использования и дисклеймер Med Service Centre.docx"
                download
                className="text-white/60 hover:text-msc-accent transition-colors"
              >
                {t('footer.downloads.terms')}
              </a>
              <a
                href="/Каталог (1).pdf"
                download
                className="text-white/60 hover:text-msc-accent transition-colors"
              >
                {t('footer.downloads.catalog')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
