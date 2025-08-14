import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLeads } from '@/hooks/useLeads';
import { formatUzbekPhoneNumber, validateUzbekPhoneNumber, getFullUzbekPhoneNumber, isValidUzbekPhoneLength, isCompleteUzbekPhone } from '@/lib/phoneValidation';
import { Phone, User, MessageSquare, Send, X, Settings } from 'lucide-react';
interface LeadFormProps {
  language: 'ru' | 'en' | 'uz';
  onClose?: () => void;
}
const LeadForm: React.FC<LeadFormProps> = ({
  language,
  onClose
}) => {
  const {
    toast
  } = useToast();
  const {
    addLead
  } = useLeads();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    equipmentType: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const texts = {
    ru: {
      title: 'Получить консультацию',
      subtitle: 'От расчета до запуска — 14 дней',
      description: 'Полный цикл: КП → поставка → установка → обучение',
      name: 'Ваше имя',
      phone: 'Телефон',
      equipmentType: 'Тип оборудования',
      submit: 'Отправить заявку',
      trust1: 'Ответ в течение часа',
      trust2: 'Лицензия Минздрава РУз',
      equipmentTypes: {
        ultrasound: 'УЗИ оборудование',
        xray: 'Рентген оборудование',
        mri: 'МРТ оборудование',
        ct: 'КТ оборудование',
        lab: 'Лабораторное оборудование',
        other: 'Другое'
      }
    },
    en: {
      title: 'Get Consultation',
      subtitle: 'From calculation to launch — 14 days',
      description: 'Full cycle: Quote → Supply → Installation → Training',
      name: 'Your name',
      phone: 'Phone',
      equipmentType: 'Equipment type',
      submit: 'Submit request',
      trust1: 'Response within an hour',
      trust2: 'Ministry of Health license',
      equipmentTypes: {
        ultrasound: 'Ultrasound equipment',
        xray: 'X-ray equipment',
        mri: 'MRI equipment',
        ct: 'CT equipment',
        lab: 'Laboratory equipment',
        other: 'Other'
      }
    },
    uz: {
      title: 'Maslahat olish',
      subtitle: 'Hisoblashdan ishga tushirishgacha — 14 kun',
      description: 'To\'liq tsikl: KP → yetkazish → o\'rnatish → o\'qitish',
      name: 'Ismingiz',
      phone: 'Telefon',
      equipmentType: 'Asbob-uskuna turi',
      submit: 'Ariza jo\'natish',
      trust1: 'Bir soat ichida javob',
      trust2: 'Sog\'liqni saqlash vazirligi litsenziyasi',
      equipmentTypes: {
        ultrasound: 'Ultratovush asboblari',
        xray: 'Rentgen asboblari',
        mri: 'MRI asboblari',
        ct: 'KT asboblari',
        lab: 'Laboratoriya asboblari',
        other: 'Boshqa'
      }
    }
  };
  const t = texts[language];
  const handleInputChange = (field: string, value: string) => {
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
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
        notes: formData.equipmentType ? `Тип оборудования: ${t.equipmentTypes[formData.equipmentType as keyof typeof t.equipmentTypes]}` : undefined,
        source: 'website_form',
        stage: 'new'
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
      if (onClose) onClose();
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
  return <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-msc-primary to-msc-accent text-white p-6 rounded-t-2xl">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
          
          <div className="text-center">
            <h2 className="font-heading text-2xl font-bold mb-2 flex items-center justify-center gap-2">
              <MessageSquare className="w-6 h-6" />
              {t.title}
            </h2>
            
            <p className="text-white/80 text-xs mt-1">{t.description}</p>
          </div>
        </div>

        {/* Trust Elements */}
        <div className="bg-gradient-to-r from-msc-primary/10 to-msc-accent/10 p-4 border-b animate-fade-in">
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
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Name */}
            <div className="space-y-1">
              <Label htmlFor="name" className="flex items-center gap-2 text-msc-text font-medium">
                <User className="w-4 h-4" />
                {t.name} *
              </Label>
              <Input id="name" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} required className="border-msc-primary/20 focus:border-msc-accent transition-all duration-200 h-11" placeholder={t.name} />
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <Label htmlFor="phone" className="flex items-center gap-2 text-msc-text font-medium">
                <Phone className="w-4 h-4" />
                {t.phone} *
              </Label>
              <div className="relative">
                <div className="absolute left-3 top-3 flex items-center gap-2 pointer-events-none">
                  <span className="text-lg">🇺🇿</span>
                  <span className="text-msc-text font-medium">+998</span>
                  <div className="w-px h-4 bg-msc-primary/20 mx-1"></div>
                </div>
                <Input id="phone" type="tel" value={formData.phone} onChange={e => handleInputChange('phone', e.target.value)} required className={`border-msc-primary/20 focus:border-msc-accent transition-all duration-200 pl-24 h-11 ${phoneError ? 'border-red-500' : ''}`} placeholder="XX XXX XX XX" maxLength={12} />
                {phoneError && <p className="text-red-500 text-xs mt-1 animate-in slide-in-from-top-1 duration-200">
                    {phoneError}
                  </p>}
              </div>
            </div>

            {/* Equipment Type */}
            <div className="space-y-1">
              <Label className="flex items-center gap-2 text-msc-text font-medium">
                <Settings className="w-4 h-4" />
                {t.equipmentType} *
              </Label>
              <Select value={formData.equipmentType} onValueChange={value => handleInputChange('equipmentType', value)} required>
                <SelectTrigger className="border-msc-primary/20 focus:border-msc-accent h-11 transition-all duration-200">
                  <SelectValue placeholder={t.equipmentType} />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(t.equipmentTypes).map(([key, value]) => <SelectItem key={key} value={key}>{value}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Submit Button */}
            <Button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-msc-primary to-msc-accent hover:from-msc-primary/90 hover:to-msc-accent/90 text-white font-semibold py-5 text-lg transition-all duration-300 shadow-lg mt-4">
              {isSubmitting ? <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {language === 'ru' ? 'Отправка...' : language === 'en' ? 'Sending...' : 'Jo\'natilmoqda...'}
                </div> : <div className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  {t.submit}
                </div>}
            </Button>
          </form>
        </div>
      </div>
    </div>;
};
export default LeadForm;