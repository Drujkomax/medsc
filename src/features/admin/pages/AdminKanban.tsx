import { useRef } from 'react';
import KanbanBoard from '@/features/crm/components/KanbanBoard';
import { Button } from '@/components/ui/button';

const stages = [
  { id: 'new', title: 'Новый лид' },
  { id: 'contacted', title: 'Связались' },
  { id: 'qualified', title: 'Квалифицирован' },
  { id: 'proposal', title: 'Отправил КП' },
  { id: 'negotiation', title: 'Переговоры' },
  { id: 'closed', title: 'Успешно' },
  { id: 'lost', title: 'Отказ' }
];

const AdminKanban = () => {
  const scrollToStage = (stageId: string) => {
    const element = document.querySelector(`[data-stage-id="${stageId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Канбан доска лидов</h1>
          <p className="text-muted-foreground">
            Управляйте лидами с помощью drag & drop интерфейса
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {stages.map((stage) => (
            <Button
              key={stage.id}
              variant="outline"
              size="sm"
              onClick={() => scrollToStage(stage.id)}
            >
              {stage.title}
            </Button>
          ))}
        </div>
      </div>
      <KanbanBoard />
    </div>
  );
};

export default AdminKanban;
