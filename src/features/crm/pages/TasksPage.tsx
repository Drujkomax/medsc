import { useState } from 'react';
import TaskList from '../components/TaskList';
import { Task } from '@/types/crm';

const TasksPage = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  const handleAddTask = () => {
    setShowAddDialog(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowAddDialog(true);
  };

  const handleViewTask = (task: Task) => {
    setViewingTask(task);
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setEditingTask(null);
    setViewingTask(null);
  };

  return (
    <div className="space-y-6">
      <TaskList 
        onAddTask={handleAddTask}
        onEditTask={handleEditTask}
        onViewTask={handleViewTask}
      />
      
      {/* TODO: Add Task dialogs */}
    </div>
  );
};

export default TasksPage;