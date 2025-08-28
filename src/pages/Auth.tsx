import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const AuthPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password,
      });

      if (error) {
        setError(getErrorMessage(error.message));
        toast({
          variant: 'destructive',
          title: 'Ошибка входа',
          description: getErrorMessage(error.message),
        });
      } else {
        toast({
          title: 'Успешно',
          description: 'Вход выполнен успешно',
        });
        // Перенаправляем на главную страницу
        navigate('/');
      }
    } catch (err) {
      const errorMessage = 'Произошла ошибка при входе';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (error: string): string => {
    const errorMessages: { [key: string]: string } = {
      'Invalid login credentials': 'Неверный email или пароль',
      'Email not confirmed': 'Email не подтвержден. Проверьте почту',
      'User already registered': 'Пользователь с таким email уже зарегистрирован',
      'Password should be at least 6 characters': 'Пароль должен содержать минимум 6 символов',
      'Invalid email': 'Неверный формат email',
      'Signup is disabled': 'Регистрация отключена',
    };

    return errorMessages[error] || error;
  };

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
          <CardTitle className="text-2xl font-bold">Админская панель</CardTitle>
          <CardDescription>
            Введите данные для входа в систему управления
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="your@email.com"
                value={loginForm.email}
                onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="login-password">Пароль</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="Введите пароль"
                value={loginForm.password}
                onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <LogIn className="mr-2 h-4 w-4" />
              Войти в систему
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;