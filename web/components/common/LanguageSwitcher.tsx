import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Languages } from 'lucide-react';

const languages = [
  { code: 'ru' as const, name: 'Русский' },
  { code: 'en' as const, name: 'English' },
  { code: 'uz' as const, name: "O'zbek" },
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const currentLanguage = languages.find(lang => lang.code === i18n.language);

  const changeLanguage = (langCode: 'ru' | 'en' | 'uz') => {
    i18n.changeLanguage(langCode);
    const url = new URL(window.location.href);
    if (langCode === 'ru') {
      url.searchParams.delete('lang');
    } else {
      url.searchParams.set('lang', langCode);
    }
    window.history.replaceState(null, '', url.toString());
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Languages className="w-4 h-4" />
          {currentLanguage?.name || 'Language'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            className={i18n.language === language.code ? 'bg-accent' : ''}
          >
            {language.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;