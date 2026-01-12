import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import TelegramPopup from '@/components/forms/TelegramPopup';
import CountdownTimer from '@/components/common/CountdownTimer';
import { useLeads } from '@/hooks/useLeads';
import { formatUzbekPhoneNumber, validateUzbekPhoneNumber, getFullUzbekPhoneNumber, isValidUzbekPhoneLength, isCompleteUzbekPhone } from '@/lib/phoneValidation';
import { validateLeadForm, sanitizeInput } from '@/lib/formValidation';
import { Phone, User, MessageSquare, Send, X, Settings, Package, Building2 } from 'lucide-react';
import { Product } from '@/hooks/useProducts';

interface QuoteRequestFormProps {
  language: 'ru' | 'en' | 'uz';
  product?: Product;
  onClose?: () => void;
}

const QuoteRequestForm: React.FC<QuoteRequestFormProps> = ({
  language,
  product,
  onClose
}) => {
  const { toast } = useToast();
  const { addLead } = useLeads();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    company: '',
    message: '',
    equipmentType: product?.category || ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showTelegramPopup, setShowTelegramPopup] = useState(false);

  const texts = {
    ru: {
      title: product ? `Получить КП по ${product.name.ru}` : 'Запрос коммерческого предложения',
      subtitle: 'Получите индивидуальное КП с ценами и условиями',
      description: 'Детальное КП → цены → сроки → условия доставки',
      name: 'Ваше имя',
      phone: 'Телефон',
      company: 'Название организации',
      message: 'Дополнительные требования',
      equipmentType: 'Тип оборудования',
      submit: 'Запросить КП',
      trust1: 'КП в течение 24 часов',
      trust2: 'Индивидуальные условия',
      messagePlaceholder: 'Укажите количество, особые требования, предпочтения по брендам и другие детали...',
      equipmentTypes: {
        diagnostic: 'Диагностическое',
        surgical: 'Хирургическое',
        monitoring: 'Мониторинг',
        laboratory: 'Лабораторное',
        rehabilitation: 'Реабилитационное',
        dental: 'Стоматологическое',
        ophthalmology: 'Офтальмологическое',
        furniture: 'Медицинская мебель'
      }
    },
    en: {
      title: product ? `Get Quote for ${product.name.en}` : 'Commercial Proposal Request',
      subtitle: 'Get personalized quote with prices and terms',
      description: 'Detailed quote → prices → delivery terms → conditions',
      name: 'Your name',
      phone: 'Phone',
      company: 'Organization name',
      message: 'Additional requirements',
      equipmentType: 'Equipment type',
      submit: 'Request Quote',
      trust1: 'Quote within 24 hours',
      trust2: 'Individual conditions',
      messagePlaceholder: 'Specify quantity, special requirements, brand preferences and other details...',
      equipmentTypes: {
        diagnostic: 'Diagnostic',
        surgical: 'Surgical',
        monitoring: 'Monitoring',
        laboratory: 'Laboratory',
        rehabilitation: 'Rehabilitation',
        dental: 'Dental',
        ophthalmology: 'Ophthalmology',
        furniture: 'Medical Furniture'
      }
    },
    uz: {
      title: product ? `${product.name.uz} uchun KP olish` : 'Tijorat taklifini so\'rash',
      subtitle: 'Shaxsiy narxlar va shartlar bilan taklif oling',
      description: 'Batafsil taklif → narxlar → yetkazish → shartlar',
      name: 'Ismingiz',
      phone: 'Telefon',
      company: 'Tashkilot nomi',
      message: 'Qo\'shimcha talablar',
      equipmentType: 'Asbob-uskuna turi',
      submit: 'Taklif so\'rash',
      trust1: '24 soat ichida taklif',
      trust2: 'Shaxsiy shartlar',
      messagePlaceholder: 'Miqdor, maxsus talablar, brend afzalliklari va boshqa tafsilotlarni ko\'rsating...',
      equipmentTypes: {
        diagnostic: 'Diagnostika',
        surgical: 'Jarrohlik',
        monitoring: 'Monitoring',
        laboratory: 'Laboratoriya',
        rehabilitation: 'Reabilitatsiya',
        dental: 'Stomatologiya',
        ophthalmology: 'Oftalmologiya',
        furniture: 'Tibbiy mebel'
      }
    }
  };

  const t = texts[language];

  const handleInputChange = (field: string, value: string) => {
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }

    if (field === 'phone') {
      if (!isValidUzbekPhoneLength(value)) return;

      const formatted = formatUzbekPhoneNumber(value);
      setFormData(prev => ({
        ...prev,
        [field]: formatted
      }));

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

    if (formData.phone && (!isCompleteUzbekPhone(formData.phone) || !validateUzbekPhoneNumber(formData.phone))) {
      setPhoneError(language === 'ru' ? 'Введите корректный узбекский номер' : language === 'en' ? 'Enter a valid Uzbek number' : 'To\'g\'ri O\'zbek raqamini kiriting');
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare detailed notes for the lead
      let notes = `Запрос КП`;
      if (product) {
        notes += ` - ${product.name[language]}`;
      }
      if (formData.equipmentType) {
        notes += ` | Тип: ${t.equipmentTypes[formData.equipmentType as keyof typeof t.equipmentTypes]}`;
      }
      if (formData.company) {
        notes += ` | Организация: ${formData.company}`;
      }
      if (formData.message) {
        notes += ` | Требования: ${formData.message}`;
      }

      await addLead({
        name: formData.name,
        phone: formData.phone ? getFullUzbekPhoneNumber(formData.phone) : undefined,
        company: formData.company || undefined,
        notes,
        stage: 'new',
        source: 'website_form'
      });

      toast({
        title: language === 'ru' ? 'Запрос КП отправлен!' : language === 'en' ? 'Quote request sent!' : 'KP so\'rovi jo\'natildi!',
        description: language === 'ru' ? 'Мы подготовим КП и свяжемся с вами в течение 24 часов' : language === 'en' ? 'We will prepare a quote and contact you within 24 hours' : '24 soat ichida KP tayyorlab, siz bilan bog\'lanamiz'
      });

      setFormData({
        name: '',
        phone: '',
        company: '',
        message: '',
        equipmentType: product?.category || ''
      });
      setPhoneError('');
      setShowTelegramPopup(true);
    } catch (error) {
      toast({
        title: language === 'ru' ? 'Ошибка!' : language === 'en' ? 'Error!' : 'Xatolik!',
        description: language === 'ru' ? 'Не удалось отправить запрос КП' : language === 'en' ? 'Failed to send quote request' : 'KP so\'rovini jo\'natib bo\'lmadi',
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
        <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl animate-in slide-in-from-bottom-4 max-h-[90vh] overflow-y-auto relative z-10">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-msc-primary to-msc-accent text-white p-4 rounded-t-2xl">
            <button onClick={onClose} className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center">
              <h2 className="font-heading text-lg font-bold mb-1 flex items-center justify-center gap-2">
                <Package className="w-5 h-5" />
                {t.title}
              </h2>
              <p className="text-white/80 text-xs">{t.description}</p>
            </div>
          </div>

          {/* Product Info */}
          {product && (
            <div className="bg-gradient-to-r from-msc-primary/10 to-msc-accent/10 p-3 border-b">
              <div className="text-center">
                <h3 className="text-sm font-semibold text-msc-text flex items-center justify-center gap-2">
                  <span className="text-lg">🎁</span>
                  Бонусом получите статью на тему<br />"Покупать или арендовывать оборудование?"
                </h3>
              </div>
            </div>
          )}

          {/* Countdown Timer */}
          <CountdownTimer minutes={5} />

          {/* Form */}
          <div className="p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <Label htmlFor="name" className="flex items-center gap-2 text-msc-text font-medium text-sm">
                  <User className="w-4 h-4" />
                  {t.name} *
                </Label>
                 <Input 
                   id="name" 
                   value={formData.name} 
                   onChange={e => handleInputChange('name', e.target.value)} 
                   required 
                   className={`border-msc-primary/20 focus:border-msc-accent transition-all duration-200 h-10 ${validationErrors.name ? 'border-red-500' : ''}`}
                   placeholder={t.name} 
                 />
                 {validationErrors.name && <p className="text-red-500 text-xs mt-1 animate-in slide-in-from-top-1 duration-200">{validationErrors.name}</p>}
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <Label htmlFor="phone" className="flex items-center gap-2 text-msc-text font-medium text-sm">
                  <Phone className="w-4 h-4" />
                  {t.phone} *
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-2.5 flex items-center gap-1.5 pointer-events-none">
                    <span className="text-base">🇺🇿</span>
                    <span className="text-msc-text font-medium text-sm">+998</span>
                    <div className="w-px h-3 bg-msc-primary/20 mx-1"></div>
                  </div>
                  <Input 
                    id="phone" 
                    type="tel" 
                    value={formData.phone} 
                    onChange={e => handleInputChange('phone', e.target.value)} 
                    required 
                    className={`border-msc-primary/20 focus:border-msc-accent transition-all duration-200 pl-20 h-10 ${phoneError ? 'border-red-500' : ''}`} 
                    placeholder="XX XXX XX XX" 
                    maxLength={12} 
                  />
                  {phoneError && (
                    <p className="text-red-500 text-xs mt-1 animate-in slide-in-from-top-1 duration-200">
                      {phoneError}
                    </p>
                  )}
                </div>
              </div>


              {/* Equipment Type */}
              {!product && (
                <div className="space-y-1">
                  <Label className="flex items-center gap-2 text-msc-text font-medium text-sm">
                    <Settings className="w-4 h-4" />
                    {t.equipmentType} *
                  </Label>
                  <Select value={formData.equipmentType} onValueChange={value => handleInputChange('equipmentType', value)} required>
                    <SelectTrigger className="border-msc-primary/20 focus:border-msc-accent h-10 transition-all duration-200">
                      <SelectValue placeholder={t.equipmentType} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(t.equipmentTypes).map(([key, value]) => (
                        <SelectItem key={key} value={key}>{value}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Message */}
              <div className="space-y-1">
                <Label htmlFor="message" className="flex items-center gap-2 text-msc-text font-medium text-sm">
                  <MessageSquare className="w-4 h-4" />
                  {t.message}
                </Label>
                <Textarea 
                  id="message" 
                  value={formData.message} 
                  onChange={e => handleInputChange('message', e.target.value)} 
                  className="border-msc-primary/20 focus:border-msc-accent transition-all duration-200 min-h-[80px] resize-none" 
                  placeholder={t.messagePlaceholder}
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full bg-gradient-to-r from-msc-primary to-msc-accent hover:from-msc-primary/90 hover:to-msc-accent/90 text-white font-semibold py-5 text-base transition-all duration-300 shadow-lg mt-6"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {language === 'ru' ? 'Отправка...' : language === 'en' ? 'Sending...' : 'Jo\'natilmoqda...'}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    {t.submit}
                  </div>
                )}
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

export default QuoteRequestForm;