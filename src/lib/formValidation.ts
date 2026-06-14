// Form validation utilities
import validator from 'validator';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface LeadFormData {
  name: string;
  phone: string;
  equipmentType?: string;
  company?: string;
  message?: string;
}

// Validation rules
export const validateRequired = (value: string, fieldName: string): string | null => {
  if (!value || value.trim().length === 0) {
    return `${fieldName} обязательно для заполнения`;
  }
  return null;
};

export const validateMinLength = (value: string, minLength: number, fieldName: string): string | null => {
  if (value && value.trim().length < minLength) {
    return `${fieldName} должно содержать минимум ${minLength} символов`;
  }
  return null;
};

export const validateMaxLength = (value: string, maxLength: number, fieldName: string): string | null => {
  if (value && value.length > maxLength) {
    return `${fieldName} не должно превышать ${maxLength} символов`;
  }
  return null;
};

export const validateName = (name: string): string | null => {
  const required = validateRequired(name, 'Имя');
  if (required) return required;
  
  const minLength = validateMinLength(name, 2, 'Имя');
  if (minLength) return minLength;
  
  const maxLength = validateMaxLength(name, 50, 'Имя');
  if (maxLength) return maxLength;
  
  // Check for valid characters (letters, spaces, hyphens)
  const nameRegex = /^[a-zA-Zа-яА-ЯёЁ\s\-']+$/;
  if (!nameRegex.test(name.trim())) {
    return 'Имя может содержать только буквы, пробелы и дефисы';
  }
  
  return null;
};

export const validateCompany = (company: string): string | null => {
  if (!company) return null; // Company is optional
  
  const minLength = validateMinLength(company, 2, 'Название компании');
  if (minLength) return minLength;
  
  const maxLength = validateMaxLength(company, 100, 'Название компании');
  if (maxLength) return maxLength;
  
  return null;
};

export const validateMessage = (message: string): string | null => {
  if (!message) return null; // Message is optional
  
  const maxLength = validateMaxLength(message, 500, 'Сообщение');
  if (maxLength) return maxLength;
  
  return null;
};

// Main form validation function
export const validateLeadForm = (formData: LeadFormData): ValidationResult => {
  const errors: Record<string, string> = {};
  
  // Validate name
  const nameError = validateName(formData.name);
  if (nameError) errors.name = nameError;
  
  // Validate phone (should be handled by existing phone validation)
  const phoneRequired = validateRequired(formData.phone, 'Номер телефона');
  if (phoneRequired) errors.phone = phoneRequired;
  
  // Validate company if provided
  if (formData.company) {
    const companyError = validateCompany(formData.company);
    if (companyError) errors.company = companyError;
  }
  
  // Validate message if provided
  if (formData.message) {
    const messageError = validateMessage(formData.message);
    if (messageError) errors.message = messageError;
  }
  
  // Validate equipment type if provided
  if (formData.equipmentType && !['ultrasound', 'xray', 'mri', 'ct', 'lab', 'other'].includes(formData.equipmentType)) {
    errors.equipmentType = 'Выберите корректный тип оборудования';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Sanitize input to prevent XSS using comprehensive validation
export const sanitizeInput = (input: string): string => {
  // Use validator.js for robust HTML escaping
  let clean = validator.trim(input);
  clean = validator.escape(clean); // Escapes HTML entities, event handlers, and special chars
  return clean.substring(0, 200); // Limit length as defense in depth
};