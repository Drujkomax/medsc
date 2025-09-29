// Утилита для перевода ролей пользователей

export interface RoleTranslation {
  ru: string;
  en: string;
  uz: string;
}

export const roleTranslations: Record<string, RoleTranslation> = {
  'director': {
    ru: 'Директор',
    en: 'Director',
    uz: 'Direktor'
  },
  'sales_manager': {
    ru: 'Руководитель',
    en: 'Sales Manager',
    uz: 'Sotuv menejeri'
  },
  'admin': {
    ru: 'Администратор',
    en: 'Administrator',
    uz: 'Administrator'
  },
  'salesperson': {
    ru: 'Специалист по продажам',
    en: 'Salesperson',
    uz: 'Sotuvchi'
  },
  'user': {
    ru: 'Пользователь',
    en: 'User',
    uz: 'Foydalanuvchi'
  },
  'accountant': {
    ru: 'Бухгалтер',
    en: 'Accountant',
    uz: 'Buxgalter'
  },
  'engineer': {
    ru: 'Инженер',
    en: 'Engineer',
    uz: 'Muhandis'
  }
};

export const getRoleTranslation = (role: string | null, language: string = 'ru'): string => {
  if (!role) return '';
  
  const translation = roleTranslations[role];
  if (!translation) return role;
  
  switch (language) {
    case 'en':
      return translation.en;
    case 'uz':
      return translation.uz;
    case 'ru':
    default:
      return translation.ru;
  }
};