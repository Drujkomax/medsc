"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useT, useLang, useSetLang } from "~/shared/i18n/i18n-provider";

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const t = useT();
  const currentLang = useLang();
  const setLang = useSetLang();

  const navigation = [
    { name: t('navigation.home'), href: '/' },
    { name: t('navigation.catalog'), href: '/catalog' },
    { name: t('navigation.services'), href: '/services' },
    { name: t('navigation.contacts'), href: '/contacts' },
  ];

  const languages = [
    { code: 'ru' as const, name: 'Русский', flag: '🇷🇺' },
    { code: 'en' as const, name: 'English', flag: '🇬🇧' },
    { code: 'uz' as const, name: "O'zbekcha", flag: '🇺🇿' },
  ];

  const currentLanguage = languages.find(lang => lang.code === currentLang) || languages[0];

  const handleLanguageChange = (langCode: 'ru' | 'en' | 'uz') => {
    // Client-side switch (no reload): <I18nProvider> persists the cookie and swaps
    // the dictionary so the statically-served page re-renders in the new language.
    setLang(langCode);
  };

  const isActive = (href: string) => pathname === href;

  // Borderless/transparent at the very top of the home hero; solid white + border once
  // scrolled or on inner pages. Text stays dark — the hero is light.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const transparentTop = pathname === '/' && !scrolled && !isMenuOpen;

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        transparentTop
          ? 'bg-transparent border-b border-transparent'
          : 'bg-background/95 backdrop-blur-sm border-b border-border'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/images/logo.webp"
              alt="Med Service Centre"
              width={382}
              height={441}
              priority
              className="h-12 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
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

          {/* Language Toggle & Auth */}
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-msc-text hover:text-msc-accent hover:bg-msc-accent/10 data-[state=open]:text-msc-accent data-[state=open]:bg-msc-accent/10"
                >
                  {currentLanguage.flag}
                  <span className="ml-1">{currentLanguage.code.toUpperCase()}</span>
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className="cursor-pointer"
                  >
                    <span className="mr-2">{lang.flag}</span>
                    {lang.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/admin">
              <Button variant="outline" size="sm">
                {t('navigation.admin')}
              </Button>
            </Link>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              aria-label="Меню"
              aria-expanded={isMenuOpen}
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
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
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
}
