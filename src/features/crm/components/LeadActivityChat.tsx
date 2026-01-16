import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useLeadActivities, LeadActivity } from '@/hooks/useLeadActivities';
import { useAuth } from '@/hooks/useAuth';
import { 
  MessageCircle, 
  Phone, 
  Settings, 
  User, 
  Clock,
  Send,
  Plus,
  FileText,
  AlertCircle,
  CheckCircle,
  UserCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

interface LeadActivityChatProps {
  leadId: string;
  className?: string;
}

const getActivityIcon = (type: LeadActivity['type']) => {
  switch (type) {
    case 'note':
      return <FileText className="h-4 w-4" />;
    case 'contact':
      return <Phone className="h-4 w-4" />;
    case 'status_change':
      return <CheckCircle className="h-4 w-4" />;
    case 'assignment':
      return <UserCheck className="h-4 w-4" />;
    case 'field_update':
      return <Settings className="h-4 w-4" />;
    case 'system':
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <MessageCircle className="h-4 w-4" />;
  }
};

const getActivityColor = (type: LeadActivity['type']) => {
  switch (type) {
    case 'note':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'contact':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'status_change':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'assignment':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'field_update':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'system':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export const LeadActivityChat = ({ leadId, className }: LeadActivityChatProps) => {
  const { t } = useTranslation();
  const { activities, loading, addNote, addContactRecord } = useLeadActivities(leadId);
  const { user } = useAuth();
  const [newNote, setNewNote] = useState('');
  const [newContact, setNewContact] = useState('');
  const [activeTab, setActiveTab] = useState<'note' | 'contact'>('note');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getActivityLabel = (type: LeadActivity['type']) => {
    switch (type) {
      case 'note':
        return t('leads.activityChat.types.note', 'Заметка');
      case 'contact':
        return t('leads.activityChat.types.contact', 'Контакт');
      case 'status_change':
        return t('leads.activityChat.types.statusChange', 'Изменение статуса');
      case 'assignment':
        return t('leads.activityChat.types.assignment', 'Назначение');
      case 'field_update':
        return t('leads.activityChat.types.fieldUpdate', 'Обновление данных');
      case 'system':
        return t('leads.activityChat.types.system', 'Система');
      default:
        return t('leads.activityChat.types.activity', 'Активность');
    }
  };

  const fieldNames: Record<string, string> = {
    name: t('leads.name', 'Имя'),
    phone: t('leads.phone', 'Телефон'),
    company: t('leads.company', 'Компания'),
    email: t('leads.email', 'Email')
  };

  const handleSubmitNote = async () => {
    if (!newNote.trim()) return;
    
    setIsSubmitting(true);
    try {
      await addNote(newNote);
      setNewNote('');
    } catch (error) {
      // Error is handled in the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitContact = async () => {
    if (!newContact.trim()) return;
    
    setIsSubmitting(true);
    try {
      await addContactRecord(newContact);
      setNewContact('');
    } catch (error) {
      // Error is handled in the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, callback: () => void) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      callback();
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <p className="text-muted-foreground">{t('leads.activityChat.loading', 'Загрузка активности...')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="space-y-4 p-4">
        {/* Add new activity tabs */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'note' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('note')}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              {t('leads.activityChat.noteTab', 'Заметка')}
            </Button>
            <Button
              variant={activeTab === 'contact' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('contact')}
              className="flex items-center gap-2"
            >
              <Phone className="h-4 w-4" />
              {t('leads.activityChat.contactTab', 'Контакт')}
            </Button>
          </div>

          {/* Note input */}
          {activeTab === 'note' && (
            <div className="space-y-2">
              <Textarea
                placeholder={t('leads.activityChat.notePlaceholder', 'Добавить заметку... (Ctrl+Enter для отправки)')}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => handleKeyPress(e, handleSubmitNote)}
                rows={3}
                className="resize-none"
              />
              <div className="flex justify-end">
                <Button 
                  size="sm" 
                  onClick={handleSubmitNote}
                  disabled={!newNote.trim() || isSubmitting}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {t('leads.activityChat.addNote', 'Добавить заметку')}
                </Button>
              </div>
            </div>
          )}

          {/* Contact input */}
          {activeTab === 'contact' && (
            <div className="space-y-2">
              <Textarea
                placeholder={t('leads.activityChat.contactPlaceholder', 'Описание контакта с клиентом... (Ctrl+Enter для отправки)')}
                value={newContact}
                onChange={(e) => setNewContact(e.target.value)}
                onKeyDown={(e) => handleKeyPress(e, handleSubmitContact)}
                rows={3}
                className="resize-none"
              />
              <div className="flex justify-end">
                <Button 
                  size="sm" 
                  onClick={handleSubmitContact}
                  disabled={!newContact.trim() || isSubmitting}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {t('leads.activityChat.recordContact', 'Записать контакт')}
                </Button>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Activities list */}
        <ScrollArea className="h-96 w-full">
          <div className="space-y-3">
            {activities.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">{t('leads.activityChat.noActivities', 'Нет записей активности')}</p>
                <p className="text-sm text-muted-foreground">{t('leads.activityChat.addFirstActivity', 'Добавьте первую заметку или запись о контакте')}</p>
              </div>
            ) : (
              activities.map((activity, index) => (
                <div key={activity.id} className="space-y-2">
                  <div className="flex gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {getActivityLabel(activity.type)}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(activity.created_at), 'dd MMM, HH:mm', { locale: ru })}
                        </div>
                        {activity.created_by && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            {activity.created_by === user?.id ? t('leads.activityChat.you', 'Вы') : t('leads.activityChat.manager', 'Менеджер')}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-sm bg-muted/50 p-3 rounded-md">
                        {activity.content}
                      </div>

                      {/* Show field updates metadata */}
                      {activity.type === 'field_update' && activity.metadata?.updated_fields && (
                        <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded border-l-2 border-muted-foreground/20">
                          <div className="font-medium mb-1">{t('leads.activityChat.changes', 'Изменения')}:</div>
                          {Object.entries(activity.metadata.updated_fields).map(([field, change]: [string, any]) => {
                            if (!change) return null;
                            return (
                              <div key={field} className="text-xs">
                                <span className="font-medium">{fieldNames[field] || field}:</span>{' '}
                                <span className="line-through">{change.old || t('leads.activityChat.notSpecified', 'не указано')}</span>{' '}
                                → <span>{change.new || t('leads.activityChat.notSpecified', 'не указано')}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Show contact type for contact activities */}
                      {activity.type === 'contact' && activity.metadata?.contact_type && (
                        <div className="text-xs text-muted-foreground">
                          {t('leads.activityChat.contactType', 'Тип контакта')}: {activity.metadata.contact_type === 'call' ? t('leads.activityChat.call', 'Звонок') : activity.metadata.contact_type}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {index < activities.length - 1 && (
                    <Separator className="ml-11" />
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
