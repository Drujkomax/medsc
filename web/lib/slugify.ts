/**
 * Generate a URL-friendly slug from text
 * Handles Cyrillic transliteration and special characters
 * @param text - The text to convert to a slug
 * @returns A URL-friendly slug
 */
export const generateSlug = (text: string): string => {
  if (!text) return '';
  
  // Cyrillic to Latin transliteration map
  const cyrillicMap: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
    'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
    'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
    'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch',
    'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
  };
  
  // Transliterate Cyrillic characters
  let result = text.split('').map(char => cyrillicMap[char] || char).join('');
  
  return result
    .toLowerCase()
    .trim()
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Remove special characters except hyphens and alphanumeric
    .replace(/[^a-z0-9-]/g, '')
    // Remove multiple consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
};

/**
 * Ensure a slug is URL-safe ASCII. If it already is, keep it.
 * If not, transliterate and normalize it.
 */
export const toUrlSlug = (slug: string | null | undefined): string => {
  if (!slug) return '';
  const normalized = slug.trim().toLowerCase();
  const isAsciiSlug = /^[a-z0-9-]+$/.test(normalized);
  return isAsciiSlug ? normalized : generateSlug(slug);
};

/**
 * Remove UUID suffix from existing slugs
 * @param slug - The slug that may contain a UUID suffix
 * @returns Clean slug without UUID suffix
 */
export const cleanSlug = (slug: string): string => {
  if (!slug) return '';
  // Remove UUID-like suffix (8 hex chars at the end after a dash)
  return slug.replace(/-[a-f0-9]{8}$/i, '');
};
