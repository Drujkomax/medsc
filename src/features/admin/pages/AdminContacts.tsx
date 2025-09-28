import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Save, Phone, Mail, MapPin, Clock, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const AdminContacts = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [contactData, setContactData] = useState({
    phone: '',
    email: '',
    address: '',
    working_hours: '',
    telegram: '',
    whatsapp: '',
    facebook: '',
    instagram: '',
    youtube: '',
  });
  const [contactId, setContactId] = useState<string | null>(null);

  // Load contacts data on component mount
  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('site_contacts')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setContactId(data.id);
        setContactData({
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          working_hours: data.working_hours || '',
          telegram: data.telegram || '',
          whatsapp: data.whatsapp || '',
          facebook: data.facebook || '',
          instagram: data.instagram || '',
          youtube: data.youtube || '',
        });
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast({
        title: t('common.error'),
        description: 'Ошибка при загрузке контактов',
        variant: 'destructive',
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setContactData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (contactId) {
        const { error } = await supabase
          .from('site_contacts')
          .update({
            phone: contactData.phone,
            email: contactData.email,
            address: contactData.address,
            working_hours: contactData.working_hours,
            telegram: contactData.telegram,
            whatsapp: contactData.whatsapp,
            facebook: contactData.facebook,
            instagram: contactData.instagram,
            youtube: contactData.youtube,
          })
          .eq('id', contactId);
        if (error) throw error;
      } else {
        const { data: inserted, error } = await supabase
          .from('site_contacts')
          .insert({
            phone: contactData.phone,
            email: contactData.email,
            address: contactData.address,
            working_hours: contactData.working_hours,
            telegram: contactData.telegram,
            whatsapp: contactData.whatsapp,
            facebook: contactData.facebook,
            instagram: contactData.instagram,
            youtube: contactData.youtube,
          })
          .select('id')
          .single();
        if (error) throw error;
        if (inserted?.id) setContactId(inserted.id);
      }
      
      toast({
        title: t('admin.contactsSaved'),
        description: t('admin.contactsSavedDesc'),
      });
    } catch (error) {
      console.error('Error saving contacts:', error);
      toast({
        title: t('common.error'),
        description: 'Ошибка при сохранении контактов',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('admin.contacts')}</h1>
        <Button onClick={handleSave} disabled={loading} className="gap-2">
          <Save className="w-4 h-4" />
          {loading ? 'Сохраняется...' : t('admin.save')}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Main Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              {t('admin.mainContacts')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="phone">{t('admin.phone')}</Label>
              <Input
                id="phone"
                value={contactData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder={t('admin.phone')}
              />
            </div>
            <div>
              <Label htmlFor="email">{t('admin.email')}</Label>
              <Input
                id="email"
                type="email"
                value={contactData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder={t('admin.email')}
              />
            </div>
            <div>
              <Label htmlFor="address">{t('admin.address')}</Label>
              <Textarea
                id="address"
                value={contactData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder={t('admin.address')}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="working_hours">{t('admin.workingHours')}</Label>
              <Input
                id="working_hours"
                value={contactData.working_hours}
                onChange={(e) => handleInputChange('working_hours', e.target.value)}
                placeholder={t('admin.workingHours')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Social Media */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              {t('admin.socialMedia')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="telegram">Telegram</Label>
              <Input
                id="telegram"
                value={contactData.telegram}
                onChange={(e) => handleInputChange('telegram', e.target.value)}
                placeholder={t('admin.telegramPlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={contactData.whatsapp}
                onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                placeholder={t('admin.whatsappPlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                value={contactData.facebook}
                onChange={(e) => handleInputChange('facebook', e.target.value)}
                placeholder={t('admin.facebookPlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={contactData.instagram}
                onChange={(e) => handleInputChange('instagram', e.target.value)}
                placeholder={t('admin.instagramPlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="youtube">YouTube</Label>
              <Input
                id="youtube"
                value={contactData.youtube}
                onChange={(e) => handleInputChange('youtube', e.target.value)}
                placeholder={t('admin.youtubePlaceholder')}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminContacts;