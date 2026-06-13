import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const LogoutButton = () => {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      // Выходим из системы
      await supabase.auth.signOut({ scope: 'global' });
      
      // Принудительно очищаем localStorage
      localStorage.clear();
      
      toast({
        title: t('common.success'),
        description: 'Вы успешно вышли из системы',
      });
      
      // Используем window.location для полной перезагрузки
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: 'Ошибка при выходе из системы',
      });
    }
  };

  return (
    <Button 
      variant="ghost" 
      className="w-full justify-start text-muted-foreground"
      onClick={handleLogout}
    >
      <LogOut className="w-4 h-4 mr-2" />
      {t('admin.logout')}
    </Button>
  );
};

export default LogoutButton;