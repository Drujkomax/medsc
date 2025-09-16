import KanbanBoard from '@/features/crm/components/KanbanBoard';

const AdminKanban = () => {
  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading gradient-text mb-2">Канбан доска</h1>
            <p className="text-muted-foreground">
              Управляйте лидами с помощью drag & drop интерфейса
            </p>
          </div>
        </div>
      </div>
      <div className="animate-slide-up">
        <KanbanBoard />
      </div>
    </div>
  );
};

export default AdminKanban;