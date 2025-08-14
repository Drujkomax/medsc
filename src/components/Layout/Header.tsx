import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  language: 'ru' | 'en' | 'uz';
  onLanguageChange: (lang: 'ru' | 'en' | 'uz') => void;
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
    ],
    uz: [
      { name: 'Bosh sahifa', href: '/' },
      { name: 'Katalog', href: '/catalog' },
      { name: 'Xizmatlar', href: '/services' },
      { name: 'Loyihalar', href: '/cases' },
      { name: 'Kompaniya haqida', href: '/about' },
      { name: 'Aloqa', href: '/contacts' },
    ]
  };

  const languages = [
    { code: 'ru' as const, name: 'Русский', flag: '🇷🇺' },
    { code: 'en' as const, name: 'English', flag: '🇺🇸' },
    { code: 'uz' as const, name: "O'zbekcha", flag: '🇺🇿' },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img 
              src="/lovable-uploads/cebee8f0-cb8b-4449-8cdc-3cf173144e75.png" 
              alt="Med Service Centre" 
              className="h-12 w-auto object-contain"
            />
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-msc-text hover:text-msc-accent"
                >
                  {languages.find(lang => lang.code === language)?.flag}
                  <span className="ml-1">{language.toUpperCase()}</span>
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => onLanguageChange(lang.code)}
                    className="cursor-pointer"
                  >
                    <span className="mr-2">{lang.flag}</span>
                    {lang.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

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