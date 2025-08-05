import { useState, useEffect } from 'react';
import { Task } from '@/types/crm';
import { taskStorage } from '@/lib/storage';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = () => {
    try {
      const data = taskStorage.getAll();
      setTasks(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const addTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    try {
      const newTask = taskStorage.create(taskData);
      setTasks(prev => [...prev, newTask]);
      return newTask;
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    try {
      const updatedTask = taskStorage.update(id, updates);
      if (updatedTask) {
        setTasks(prev => 
          prev.map(task => task.id === id ? updatedTask : task)
        );
        return updatedTask;
      }
      return null;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  const deleteTask = (id: string) => {
    try {
      const success = taskStorage.delete(id);
      if (success) {
        setTasks(prev => prev.filter(task => task.id !== id));
      }
      return success;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  const getTaskById = (id: string) => {
    return tasks.find(task => task.id === id);
  };

  const getTasksByClientId = (clientId: string) => {
    return tasks.filter(task => task.clientId === clientId);
  };

  const getTasksByDealId = (dealId: string) => {
    return tasks.filter(task => task.dealId === dealId);
  };

  const completeTask = (id: string) => {
    return updateTask(id, { 
      status: 'completed', 
      completedAt: new Date() 
    });
  };

  return {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    getTaskById,
    getTasksByClientId,
    getTasksByDealId,
    completeTask,
    refreshTasks: loadTasks,
  };
};