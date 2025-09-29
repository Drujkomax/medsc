export interface Deal {
  id: string;
  title: string;
  client_id?: string;
  amount?: number;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed' | 'lost';
  probability?: number;
  close_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignee_id?: string;
  client_id?: string;
  deal_id?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  completed_at?: string;
  recurrence_type?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrence_interval?: number;
  recurrence_end_date?: string;
  parent_task_id?: string;
  comments?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'manager' | 'admin';
}