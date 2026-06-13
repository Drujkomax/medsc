import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ADMIN_SECTIONS, useCustomPermissions } from '@/hooks/useCustomPermissions';
import { Badge } from '@/components/ui/badge';

interface CustomPermissionsFormProps {
  userId: string;
  onSave?: () => void;
}

export const CustomPermissionsForm = ({ userId, onSave }: CustomPermissionsFormProps) => {
  const { permissions, temporaryEmployee, loading, savePermissions } = useCustomPermissions(userId);
  const [fullAccessSections, setFullAccessSections] = useState<string[]>([]);
  const [viewOnlySections, setViewOnlySections] = useState<string[]>([]);
  const [isTemporary, setIsTemporary] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Только обновляем состояние при изменении прав
    if (permissions.length > 0) {
      const fullAccess = permissions
        .filter(p => p.permission_level === 'full_access')
        .map(p => p.section);
      const viewOnly = permissions
        .filter(p => p.permission_level === 'view_only')
        .map(p => p.section);
      
      setFullAccessSections(fullAccess);
      setViewOnlySections(viewOnly);
    }

    // Устанавливаем временный статус
    if (temporaryEmployee?.expires_at) {
      setIsTemporary(true);
      setExpiresAt(new Date(temporaryEmployee.expires_at));
    } else {
      setIsTemporary(false);
      setExpiresAt(undefined);
    }
  }, [permissions, temporaryEmployee]);

  const toggleFullAccess = (section: string) => {
    setFullAccessSections(prev => {
      const newSections = prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section];
      
      // Удаляем из view only если добавляем в full access
      if (!prev.includes(section)) {
        setViewOnlySections(v => v.filter(s => s !== section));
      }
      
      return newSections;
    });
  };

  const toggleViewOnly = (section: string) => {
    setViewOnlySections(prev => {
      const newSections = prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section];
      
      // Удаляем из full access если добавляем в view only
      if (!prev.includes(section)) {
        setFullAccessSections(f => f.filter(s => s !== section));
      }
      
      return newSections;
    });
  };

  const handleSave = async () => {
    if (isTemporary && !expiresAt) {
      return;
    }
    
    setSaving(true);
    try {
      await savePermissions(
        fullAccessSections,
        viewOnlySections,
        isTemporary,
        expiresAt
      );
      
      onSave?.();
    } catch (error) {
      console.error('Error saving permissions:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Временный сотрудник */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="temporary-access">Временный сотрудник</Label>
          <Switch
            id="temporary-access"
            checked={isTemporary}
            onCheckedChange={setIsTemporary}
          />
        </div>

        {isTemporary && (
          <div className="space-y-2">
            <Label>Срок действия доступа</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !expiresAt && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expiresAt ? format(expiresAt, 'dd.MM.yyyy') : 'Выберите дату'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={expiresAt}
                  onSelect={setExpiresAt}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Права доступа */}
      <div className="space-y-4">
        <div className="border rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-sm">Разделы администрирования</h4>
          <div className="grid gap-3">
            {ADMIN_SECTIONS.map(section => {
              const hasFullAccess = fullAccessSections.includes(section.value);
              const hasViewOnly = viewOnlySections.includes(section.value);
              
              return (
                <div
                  key={section.value}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <span className="text-sm font-medium">{section.label}</span>
                  <div className="flex gap-2">
                    <Badge
                      variant={hasFullAccess ? "default" : "outline"}
                      className={`cursor-pointer transition-all ${
                        hasFullAccess 
                          ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' 
                          : 'hover:bg-accent border-muted-foreground/20'
                      }`}
                      onClick={() => toggleFullAccess(section.value)}
                    >
                      Полный доступ
                    </Badge>
                    <Badge
                      variant={hasViewOnly ? "secondary" : "outline"}
                      className={`cursor-pointer transition-all ${
                        hasViewOnly 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' 
                          : 'hover:bg-accent border-muted-foreground/20'
                      }`}
                      onClick={() => toggleViewOnly(section.value)}
                    >
                      Только просмотр
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Кнопка сохранения */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full"
      >
        {saving ? 'Сохранение...' : 'Сохранить настройки'}
      </Button>
    </div>
  );
};
