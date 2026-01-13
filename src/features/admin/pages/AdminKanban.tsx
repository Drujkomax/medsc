import KanbanBoard from '@/features/crm/components/KanbanBoard';

const AdminKanban = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Канбан доска</h1>
          <p className="text-muted-foreground">
            Управляйте лидами с помощью drag & drop интерфейса
          </p>
        </div>
      </div>
      <KanbanBoard />
    </div>
  );
};

export default AdminKanban;