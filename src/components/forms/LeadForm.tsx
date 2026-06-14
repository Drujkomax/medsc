
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import TelegramPopup from '@/components/forms/TelegramPopup';
import { useLeads } from '@/hooks/useLeads';
import { formatUzbekPhoneNumber, validateUzbekPhoneNumber, getFullUzbekPhoneNumber, isValidUzbekPhoneLength, isCompleteUzbekPhone } from '@/lib/phoneValidation';
import { validateLeadForm, sanitizeInput } from '@/lib/formValidation';
import { Phone, User, MessageSquare, Send, X, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LeadFormProps {
  onClose?: () => void;
}
const LeadForm: React.FC<LeadFormProps> = ({ onClose }) => {
  const { toast } = useToast();
  const { addLead } = useLeads();
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    equipmentType: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showTelegramPopup, setShowTelegramPopup] = useState(false);
  const language = i18n.language || 'ru';
  const handleInputChange = (field: string, value: string) => {
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }

    if (field === 'phone') {
      // Format and validate phone number
      if (!isValidUzbekPhoneLength(value)) return; // Prevent input beyond max length

      const formatted = formatUzbekPhoneNumber(value);
      setFormData(prev => ({
        ...prev,
        [field]: formatted
      }));

      // Only show error if user has entered something and it's not complete or invalid
      if (formatted.length > 0) {
        if (!isCompleteUzbekPhone(formatted)) {
          setPhoneError(language === 'ru' ? 'Номер должен содержать 9 цифр' : language === 'en' ? 'Number must contain 9 digits' : 'Raqam 9 ta raqamdan iborat bo\'lishi kerak');
        } else if (!validateUzbekPhoneNumber(formatted)) {
          setPhoneError(language === 'ru' ? 'Неверный формат номера' : language === 'en' ? 'Invalid phone format' : 'Noto\'g\'ri telefon formati');
        } else {
          setPhoneError('');
        }
      } else {
        setPhoneError('');
      }
    } else {
      // Sanitize input for other fields
      const sanitizedValue = sanitizeInput(value);
      setFormData(prev => ({
        ...prev,
        [field]: sanitizedValue
      }));
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setValidationErrors({});
    setPhoneError('');

    // Validate form data
    const validation = validateLeadForm(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    // Validate phone number before submission
    if (formData.phone && (!isCompleteUzbekPhone(formData.phone) || !validateUzbekPhoneNumber(formData.phone))) {
      setPhoneError(language === 'ru' ? 'Введите корректный узбекский номер' : language === 'en' ? 'Enter a valid Uzbek number' : 'To\'g\'ri O\'zbek raqamini kiriting');
      return;
    }
    setIsSubmitting(true);
    try {
      await addLead({
        name: formData.name,
        phone: formData.phone ? getFullUzbekPhoneNumber(formData.phone) : undefined,
        notes: formData.equipmentType ? `Тип оборудования: ${t(`leadForm.equipmentTypes.${formData.equipmentType}`)}` : undefined,
        equipment_interest: formData.equipmentType,
        stage: 'new',
        source: 'website_form'
      });
      toast({
        title: language === 'ru' ? 'Заявка отправлена!' : language === 'en' ? 'Request sent!' : 'Ariza jo\'natildi!',
        description: language === 'ru' ? 'Мы свяжемся с вами в ближайшее время' : language === 'en' ? 'We will contact you soon' : 'Tez orada siz bilan bog\'lanamiz'
      });
      setFormData({
        name: '',
        phone: '',
        equipmentType: ''
      });
      setPhoneError('');
      setShowTelegramPopup(true);
    } catch (error) {
      toast({
        title: language === 'ru' ? 'Ошибка!' : language === 'en' ? 'Error!' : 'Xatolik!',
        description: language === 'ru' ? 'Не удалось отправить заявку' : language === 'en' ? 'Failed to send request' : 'Arizani jo\'natib bo\'lmadi',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTelegramPopupClose = () => {
    setShowTelegramPopup(false);
    if (onClose) onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in slide-in-from-bottom-4 relative z-10">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-msc-primary to-msc-accent text-white p-4 rounded-t-2xl">
            <button onClick={onClose} className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="text-center">
              <h2 className="font-heading text-lg font-bold mb-1 flex items-center justify-center gap-2">
                   <MessageSquare className="w-5 h-5" />
                   {t('leadForm.title')}
                 </h2>
                 
                 <p className="text-white/80 text-xs">{t('leadForm.description')}</p>
               </div>
          </div>

          {/* Trust Elements */}
          <div className="bg-gradient-to-r from-msc-primary/10 to-msc-accent/10 p-3 border-b animate-fade-in">
            <div className="text-center">
              <h3 className="text-sm font-semibold text-msc-text">
                Получите консультацию на тему<br />
                <span className="text-msc-primary font-bold">
                  "Как эффективно окупить оборудование в 2025 году?"
                </span>
              </h3>
            </div>
          </div>

          {/* Form */}
          <div className="p-5">
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Name */}
              <div className="space-y-1">
                <Label htmlFor="name" className="flex items-center gap-2 text-msc-text font-medium text-sm">
                  <User className="w-4 h-4" />
                  {t('leadForm.name')} *
                </Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={e => handleInputChange('name', e.target.value)} 
                  required 
                  className={`border-msc-primary/20 focus:border-msc-accent transition-all duration-200 h-10 ${validationErrors.name ? 'border-red-500' : ''}`} 
                  placeholder={t('leadForm.name')} 
                />
                {validationErrors.name && <p className="text-red-500 text-xs mt-1 animate-in slide-in-from-top-1 duration-200">{validationErrors.name}</p>}
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <Label htmlFor="phone" className="flex items-center gap-2 text-msc-text font-medium text-sm">
                  <Phone className="w-4 h-4" />
                  {t('leadForm.phone')} *
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-2.5 flex items-center gap-1.5 pointer-events-none">
                    <span className="text-base">🇺🇿</span>
                    <span className="text-msc-text font-medium text-sm">+998</span>
                    <div className="w-px h-3 bg-msc-primary/20 mx-1"></div>
                  </div>
                  <Input id="phone" type="tel" value={formData.phone} onChange={e => handleInputChange('phone', e.target.value)} required className={`border-msc-primary/20 focus:border-msc-accent transition-all duration-200 pl-20 h-10 ${phoneError ? 'border-red-500' : ''}`} placeholder="XX XXX XX XX" maxLength={12} />
                  {phoneError && <p className="text-red-500 text-xs mt-1 animate-in slide-in-from-top-1 duration-200">
                      {phoneError}
                    </p>}
                </div>
              </div>

              {/* Equipment Type */}
              <div className="space-y-1">
                <Label className="flex items-center gap-2 text-msc-text font-medium text-sm">
                  <Settings className="w-4 h-4" />
                  {t('leadForm.equipmentType')} *
                </Label>
                <Select value={formData.equipmentType} onValueChange={value => handleInputChange('equipmentType', value)} required>
                   <SelectTrigger className="border-msc-primary/20 focus:border-msc-accent h-10 transition-all duration-200">
                     <SelectValue placeholder={t('leadForm.equipmentType')} />
                   </SelectTrigger>
                   <SelectContent>
                     {['ultrasound', 'xray', 'mri', 'ct', 'lab', 'other'].map((key) => 
                       <SelectItem key={key} value={key}>{t(`leadForm.equipmentTypes.${key}`)}</SelectItem>
                     )}
                   </SelectContent>
                 </Select>
              </div>

              {/* Submit Button */}
              <Button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-msc-primary to-msc-accent hover:from-msc-primary/90 hover:to-msc-accent/90 text-white font-semibold py-5 text-base transition-all duration-300 shadow-lg mt-4">
                {isSubmitting ? <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {language === 'ru' ? 'Отправка...' : language === 'en' ? 'Sending...' : 'Jo\'natilmoqda...'}
                   </div> : <div className="flex items-center gap-2">
                     <Send className="w-4 h-4" />
                     {t('leadForm.submit')}
                   </div>}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Telegram Popup */}
      {showTelegramPopup && (
        <TelegramPopup 
          onClose={handleTelegramPopupClose}
        />
      )}
    </>
  );
};
export default LeadForm;
