// Utility functions for Uzbekistan phone number validation and formatting

export const formatUzbekPhoneNumber = (value: string): string => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Remove leading +998 if present
  const cleaned = digits.startsWith('998') ? digits.slice(3) : digits;
  
  // Limit to 9 digits (Uzbekistan mobile number format)
  const limited = cleaned.slice(0, 9);
  
  // Format as XX XXX XX XX
  if (limited.length <= 2) return limited;
  if (limited.length <= 5) return `${limited.slice(0, 2)} ${limited.slice(2)}`;
  if (limited.length <= 7) return `${limited.slice(0, 2)} ${limited.slice(2, 5)} ${limited.slice(5)}`;
  return `${limited.slice(0, 2)} ${limited.slice(2, 5)} ${limited.slice(5, 7)} ${limited.slice(7)}`;
};

export const validateUzbekPhoneNumber = (phone: string): boolean => {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Check if it's exactly 9 digits (excluding +998)
  const phoneDigits = digits.startsWith('998') ? digits.slice(3) : digits;
  
  // Must be exactly 9 digits
  return phoneDigits.length === 9;
};

export const getFullUzbekPhoneNumber = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  const phoneDigits = digits.startsWith('998') ? digits.slice(3) : digits;
  return `+998${phoneDigits}`;
};

export const isValidUzbekPhoneLength = (phone: string): boolean => {
  const digits = phone.replace(/\D/g, '');
  const phoneDigits = digits.startsWith('998') ? digits.slice(3) : digits;
  return phoneDigits.length <= 9;
};

// Проверяет, является ли номер полным (9 цифр)
export const isCompleteUzbekPhone = (phone: string): boolean => {
  const digits = phone.replace(/\D/g, '');
  const phoneDigits = digits.startsWith('998') ? digits.slice(3) : digits;
  return phoneDigits.length === 9;
};