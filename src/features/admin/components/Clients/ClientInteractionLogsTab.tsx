import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FileText, Plus, Phone, Mail, Video, MessageSquare, StickyNote } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ClientInteractionLogsTabProps {
  clientId: string;
}

interface InteractionLog {
  id: string;
  client_id: string;
  interaction_type: string;
  subject: string | null;
  message: string;
  created_by: string | null;
  created_at: string;
}

const INTERACTION_TYPES = [
  { value: 'note', label: 'Заметка', icon: StickyNote },
  { value: 'call', label: 'Звонок', icon: Phone },
  { value: 'meeting', label: 'Встреча', icon: Video },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'telegram', label: 'Telegram', icon: MessageSquare },
  { value: 'other', label: 'Другое', icon: FileText },
];

export const ClientInteractionLogsTab = ({ clientId }: ClientInteractionLogsTabProps) => {
  const [logs, setLogs] = useState<InteractionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    interaction_type: 'note',
    subject: '',
    message: ''
  });
  const [saving, setSaving] = useState(false);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('client_interaction_logs')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      console.error('Error loading logs:', error);
      toast.error('Ошибка загрузки логов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [clientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.message.trim()) {
      toast.error('Введите описание взаимодействия');
      return;
    }

    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Пользователь не авторизован');
        return;
      }

      const { error } = await supabase.from('client_interaction_logs').insert({
        client_id: clientId,
        interaction_type: formData.interaction_type,
        subject: formData.subject || null,
        message: formData.message,
        created_by: user.id
      });

      if (error) throw error;

      toast.success('Лог добавлен');
      setFormData({ interaction_type: 'note', subject: '', message: '' });
      setShowAddForm(false);
      await loadLogs();
    } catch (error: any) {
      console.error('Error saving log:', error);
      toast.error('Ошибка сохранения лога');
    } finally {
      setSaving(false);
    }
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = INTERACTION_TYPES.find(t => t.value === type);
    const Icon = typeConfig?.icon || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const getTypeLabel = (type: string) => {
    return INTERACTION_TYPES.find(t => t.value === type)?.label || type;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <h3 className="text-lg font-semibold">История взаимодействий</h3>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Добавить запись
        </Button>
      </div>

      {showAddForm && (
        <Card className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="interaction_type">Тип взаимодействия</Label>
                <Select
                  value={formData.interaction_type}
                  onValueChange={(value) => setFormData({ ...formData, interaction_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERACTION_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(type.value)}
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Тема (опционально)</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Краткое описание темы"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Описание взаимодействия *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Детальное описание взаимодействия с клиентом..."
                rows={4}
                required
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({ interaction_type: 'note', subject: '', message: '' });
                }}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      ) : logs.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Нет записей взаимодействий</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <Card key={log.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {getTypeIcon(log.interaction_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-sm font-medium">
                      {getTypeLabel(log.interaction_type)}
                    </span>
                    {log.subject && (
                      <span className="text-sm text-muted-foreground">
                        • {log.subject}
                      </span>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap mb-2">{log.message}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {new Date(log.created_at).toLocaleString('ru-RU')}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
