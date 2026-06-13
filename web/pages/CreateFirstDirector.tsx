import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Crown, Loader2, Copy, CheckCircle } from 'lucide-react';
import SEOHead from "@/components/SEO/SEOHead";

const CreateFirstDirector = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [created, setCreated] = useState(false);
  const seoProps = {
    title: "Создание первого директора - Med Service Centre",
    description:
      "Шаг создания директора Med Service Centre: отправьте приглашение, копируйте ссылку регистрации и включите админскую CRM для контроля каталога и ролей.",
    keywords:
      "создание директора, приглашение администратора, регистрация админ панели, Med Service Centre, запуск CRM, контроль ролей",
    noindex: true,
    nofollow: true,
  };

  const handleCreateDirector = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: 'Ошибка',
        description: 'Введите email директора',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('create_first_director', {
        director_email: email
      });

      if (error) throw error;

      const result = data as { invite_id: string; invite_link: string };
      const fullInviteLink = `${window.location.origin}/admin/register/${result.invite_id}`;
      
      setInviteLink(fullInviteLink);
      setCreated(true);
      
      toast({
        title: 'Приглашение создано',
        description: 'Ссылка для регистрации директора готова',
      });

    } catch (error: any) {
      console.error('Error creating director invite:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Ошибка при создании приглашения',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast({
        title: 'Скопировано',
        description: 'Ссылка скопирована в буфер обмена',
      });
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось скопировать ссылку',
        variant: 'destructive',
      });
    }
  };

  if (created) {
    return (
      <div className="space-y-6">
        <SEOHead {...seoProps} />
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-6 w-6" />
              Приглашение для директора создано
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                <strong>Email директора:</strong> {email}
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label>Ссылка для регистрации:</Label>
              <div className="flex gap-2">
                <Input 
                  value={inviteLink} 
                  readOnly 
                  className="font-mono text-sm"
                />
                <Button onClick={copyToClipboard} size="sm">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Alert>
              <AlertDescription>
                Отправьте эту ссылку директору. Ссылка действительна в течение 7 дней.
                После регистрации директор получит полный доступ к админской панели.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SEOHead {...seoProps} />
      <div>
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <Crown className="h-8 w-8 text-yellow-600" />
          Создание первого директора
        </h2>
        <p className="text-muted-foreground">
          Создайте приглашение для первого директора компании
        </p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Данные директора</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateDirector} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="director-email">Email директора</Label>
              <Input
                id="director-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="director@medservice.uz"
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Crown className="mr-2 h-4 w-4" />
              {loading ? 'Создание...' : 'Создать приглашение'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Alert>
        <AlertDescription>
          <strong>Важно:</strong> Эта функция создает приглашение для первого директора в системе.
          После создания директора эта возможность будет недоступна.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default CreateFirstDirector;
