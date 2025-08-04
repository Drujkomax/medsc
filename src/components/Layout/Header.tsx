import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  language: 'ru' | 'en';
  onLanguageChange: (lang: 'ru' | 'en') => void;
}

const Header = ({ language, onLanguageChange }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navigation = {
    ru: [
      { name: 'Главная', href: '/' },
      { name: 'Каталог', href: '/catalog' },
      { name: 'Услуги', href: '/services' },
      { name: 'Кейсы', href: '/cases' },
      { name: 'О компании', href: '/about' },
      { name: 'Контакты', href: '/contacts' },
    ],
    en: [
      { name: 'Home', href: '/' },
      { name: 'Catalog', href: '/catalog' },
      { name: 'Services', href: '/services' },
      { name: 'Cases', href: '/cases' },
      { name: 'About', href: '/about' },
      { name: 'Contacts', href: '/contacts' },
    ]
  };

  const isActive = (href: string) => location.pathname === href;

  return (
    <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-msc-primary to-msc-accent hexagon flex items-center justify-center">
              <span className="text-white font-bold text-sm">MSC</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-heading text-xl font-bold text-msc-primary">
                Med Service Centre
              </h1>
              <p className="text-xs text-msc-text-light">
                {language === 'ru' ? 'Медицинское оборудование' : 'Medical Equipment'}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation[language].map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`font-medium transition-colors ${
                  isActive(item.href)
                    ? 'text-msc-accent border-b-2 border-msc-accent'
                    : 'text-msc-text hover:text-msc-accent'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Language Toggle & Mobile Menu */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLanguageChange(language === 'ru' ? 'en' : 'ru')}
              className="text-msc-text hover:text-msc-accent"
            >
              <Globe className="w-4 h-4 mr-1" />
              {language.toUpperCase()}
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col space-y-2">
              {navigation[language].map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    isActive(item.href)
                      ? 'bg-msc-accent/10 text-msc-accent font-medium'
                      : 'text-msc-text hover:bg-msc-accent/5 hover:text-msc-accent'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;