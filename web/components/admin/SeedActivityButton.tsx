import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Database, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { seedEmployeeActivity } from '@/utils/seedEmployeeActivity';

interface SeedActivityButtonProps {
  userId: string;
  userEmail: string;
}

const SeedActivityButton = ({ userId, userEmail }: SeedActivityButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handleSeedActivity = async () => {
    setLoading(true);
    try {
      await seedEmployeeActivity(userId, userEmail);
      toast.success('Тестовые данные активности добавлены');
    } catch (error) {
      console.error('Error seeding activity:', error);
      toast.error('Ошибка при добавлении тестовых данных');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleSeedActivity} 
      disabled={loading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Database className="h-4 w-4" />
      )}
      Добавить тестовые данные активности
    </Button>
  );
};

export default SeedActivityButton;