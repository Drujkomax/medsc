import { useState, useEffect } from 'react';
import { Task } from '@/types/crm';
import { supabase } from '@/integrations/supabase/client';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTasks(data as Task[] || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const addTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          title: taskData.title,
          description: taskData.description,
          assignee_id: taskData.assignee_id,
          client_id: taskData.client_id,
          deal_id: taskData.deal_id,
          status: taskData.status,
          priority: taskData.priority,
          due_date: taskData.due_date,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();
      
      if (error) throw error;
      setTasks(prev => [...prev, data as Task]);
      return data;
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          title: updates.title,
          description: updates.description,
          assignee_id: updates.assignee_id,
          client_id: updates.client_id,
          deal_id: updates.deal_id,
          status: updates.status,
          priority: updates.priority,
          due_date: updates.due_date,
          completed_at: updates.completed_at
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      setTasks(prev => 
        prev.map(task => task.id === id ? data as Task : task)
      );
      return data;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setTasks(prev => prev.filter(task => task.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  const getTaskById = (id: string) => {
    return tasks.find(task => task.id === id);
  };

  const getTasksByClientId = (clientId: string) => {
    return tasks.filter(task => task.client_id === clientId);
  };

  const getTasksByDealId = (dealId: string) => {
    return tasks.filter(task => task.deal_id === dealId);
  };

  const completeTask = async (id: string) => {
    return updateTask(id, { 
      status: 'completed', 
      completed_at: new Date().toISOString() 
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