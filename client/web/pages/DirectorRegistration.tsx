import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import SEOHead from "@/components/SEO/SEOHead";

const DirectorRegistration = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    email: 'director@medsc.uz',
    password: 'msc001uz',
    confirmPassword: 'msc001uz'
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (formData.password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Регистрируемся в Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Назначаем роль директора
        const { error: functionError } = await supabase.rpc('register_specific_director', {
          user_id: authData.user.id,
          director_email: formData.email
        });

        if (functionError) {
          console.error('Function error:', functionError);
          // Пробуем напрямую
          await supabase
            .from('user_roles')
            .insert({
              user_id: authData.user.id,
              role: 'director'
            });
        }
      }

      toast({
        title: 'Директор зарегистрирован!',
        description: 'Теперь вы можете войти в систему с правами директора',
      });

      // Автоматически входим в систему
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (signInError) {
        toast({
          title: 'Регистрация успешна',
          description: 'Войдите в систему с созданными учетными данными',
        });
        navigate('/admin/login');
      } else {
        navigate('/admin');
      }
      
    } catch (error: any) {
      setError(error.message || 'Ошибка при регистрации');
      toast({
        title: 'Ошибка регистрации',
        description: error.message || 'Произошла ошибка при регистрации',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted px-4">
      <SEOHead
        title="Регистрация директора - Med Service Centre"
        description="Регистрация директора Med Service Centre™: примите приглашение, задайте пароль и откройте доступ к админской CRM для контроля каталога заявок и ролей."
        keywords="регистрация директора, Med Service Centre, админ панель доступ, пароль директора, CRM вход, управление каталогом, роли и заявки"
        noindex
        nofollow
      />
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <Crown className="h-16 w-16 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Регистрация директора</CardTitle>
          <CardDescription>
            Создание аккаунта директора Med Service Centre
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Подтвердите пароль</Label>
              <Input
                id="confirm-password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Crown className="mr-2 h-4 w-4" />
              {loading ? 'Создание аккаунта...' : 'Создать аккаунт директора'}
            </Button>
          </form>

          <Alert className="mt-4">
            <AlertDescription>
              После создания аккаунта вы получите полный доступ к админской панели с правами директора.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default DirectorRegistration;
