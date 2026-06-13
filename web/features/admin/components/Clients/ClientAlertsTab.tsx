import { useState, useEffect } from 'react';
import { useClientStock, type StockAlert } from '@/hooks/useClientStock';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle, Send, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ClientInteractionLogsTab } from './ClientInteractionLogsTab';

interface ClientAlertsTabProps {
  clientId: string;
}

export default function ClientAlertsTab({ clientId }: ClientAlertsTabProps) {
  const { getAlerts, acknowledgeAlert, resolveAlert } = useClientStock(clientId);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [telegramMessage, setTelegramMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, [clientId]);

  const loadAlerts = async () => {
    setLoading(true);
    const data = await getAlerts();
    setAlerts(data);
    setLoading(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'default';
      case 'low': return 'outline';
      default: return 'default';
    }
  };

  const handleAcknowledge = async (id: string) => {
    await acknowledgeAlert(id);
    loadAlerts();
  };

  const handleResolve = async (id: string) => {
    await resolveAlert(id);
    loadAlerts();
  };

  const handleSendTelegramMessage = async () => {
    if (!telegramMessage.trim()) {
      toast.error('Введите сообщение');
      return;
    }

    try {
      setSending(true);
      
      // Получаем информацию о клиенте
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('telegram_chat_id, name')
        .eq('id', clientId)
        .single();

      if (clientError) throw clientError;

      if (!client?.telegram_chat_id) {
        toast.error('У клиента не указан Telegram chat ID');
        return;
      }

      // Отправляем через edge function
      const { data, error } = await supabase.functions.invoke('send-telegram-message', {
        body: {
          chat_id: client.telegram_chat_id,
          message: telegramMessage,
          client_id: clientId
        }
      });

      if (error) throw error;

      // Логируем отправку сообщения
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('client_interaction_logs').insert({
        client_id: clientId,
        interaction_type: 'telegram',
        subject: 'Отправлено Telegram сообщение',
        message: telegramMessage,
        created_by: user?.id
      });

      toast.success('Сообщение отправлено');
      setTelegramMessage('');
    } catch (error: any) {
      console.error('Error sending telegram message:', error);
      toast.error('Ошибка отправки сообщения: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Telegram сообщения */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Отправить Telegram сообщение</h3>
          </div>
          
          <div className="space-y-4">
            <Textarea
              placeholder="Введите сообщение для отправки клиенту..."
              value={telegramMessage}
              onChange={(e) => setTelegramMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <Button 
              onClick={handleSendTelegramMessage} 
              disabled={sending || !telegramMessage.trim()}
              className="w-full sm:w-auto"
            >
              <Send className="h-4 w-4 mr-2" />
              {sending ? 'Отправка...' : 'Отправить сообщение'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Уведомления */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Уведомления ({alerts.length})</h3>
        
        {loading ? (
          <div>Загрузка...</div>
        ) : alerts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <p className="text-muted-foreground">Нет активных уведомлений</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {alerts.map(alert => (
              <Card key={alert.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-3 flex-1">
                      <AlertCircle className={`h-5 w-5 mt-0.5 ${
                        alert.severity === 'critical' ? 'text-red-500' :
                        alert.severity === 'high' ? 'text-orange-500' :
                        'text-yellow-500'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getSeverityColor(alert.severity) as any}>
                            {alert.alert_type}
                          </Badge>
                          {alert.acknowledged && (
                            <Badge variant="outline">Подтверждено</Badge>
                          )}
                        </div>
                        <p className="font-medium">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(alert.created_at), 'dd.MM.yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!alert.acknowledged && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAcknowledge(alert.id)}
                        >
                          Подтвердить
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResolve(alert.id)}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Решено
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Логи взаимодействия */}
      <ClientInteractionLogsTab clientId={clientId} />
    </div>
  );
}
