import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserPlus, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface InviteData {
  email: string;
  role: string;
  message: string;
}

const RegisterWithInvite = () => {
  const { inviteId } = useParams<{ inviteId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (inviteId) {
      validateInvite();
    }
  }, [inviteId]);

  const validateInvite = async () => {
    try {
      setValidating(true);
      
      // Проверяем приглашение через защищенную функцию
      const { data, error } = await supabase.rpc('validate_invite', {
        p_invite_id: inviteId
      });

      if (error || !data || data.length === 0) {
        setError('Приглашение недействительно или истекло');
        return;
      }

      const invite = Array.isArray(data) ? data[0] : (data as any);
      setInviteData({
        email: invite.email,
        role: getRoleLabel(invite.role),
        message: 'Приглашение действительно'
      });
    } catch (err) {
      setError('Ошибка при проверке приглашения');
    } finally {
      setValidating(false);
    }
  };

  const getRoleLabel = (role: string): string => {
    const roleLabels: { [key: string]: string } = {
      'salesperson': 'Специалист по продажам',
      'sales_manager': 'Руководитель',
      'admin': 'Администратор',
      'director': 'Директор'
    };
    return roleLabels[role] || role;
  };

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

    if (!inviteData) {
      setError('Данные приглашения недоступны');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Регистрируемся в Supabase Auth без подтверждения email
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: inviteData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`,
          data: {
            email_confirm: false // Отключаем подтверждение email
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Используем новую функцию для назначения роли и подтверждения пользователя
        const { data: assignResult, error: assignError } = await supabase.rpc('assign_role_from_invite', {
          p_invite_id: inviteId,
          p_user_id: authData.user.id
        });

        if (assignError) {
          console.error('Role assignment error:', assignError);
          throw new Error('Ошибка при назначении роли: ' + assignError.message);
        }

        console.log('Role assigned successfully:', assignResult);
      }

      toast({
        title: 'Регистрация успешна!',
        description: 'Теперь вы можете войти в систему с вашими данными',
      });

      // Перенаправляем на страницу входа
      navigate('/admin/login');
      
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

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted px-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p>Проверка приглашения...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-red-600">Ошибка</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button 
              onClick={() => navigate('/admin/login')} 
              className="w-full mt-4"
            >
              Перейти ко входу
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <img 
              src="/lovable-uploads/cebee8f0-cb8b-4449-8cdc-3cf173144e75.png" 
              alt="Med Service Centre" 
              className="h-16 w-auto object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold">Завершение регистрации</CardTitle>
          <CardDescription>
            Вы приглашены присоединиться к команде Med Service Centre
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {inviteData && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Приглашение действительно</span>
              </div>
              <p className="text-sm text-green-700">
                <strong>Email:</strong> {inviteData.email}
              </p>
              <p className="text-sm text-green-700">
                <strong>Должность:</strong> {inviteData.role}
              </p>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Создайте пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="Минимум 6 символов"
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
                placeholder="Повторите пароль"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <UserPlus className="mr-2 h-4 w-4" />
              {loading ? 'Регистрация...' : 'Завершить регистрацию'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterWithInvite;