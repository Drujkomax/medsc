export interface Deal {
  id: string;
  title: string;
  lead_id?: string;
  amount?: number;
  currency?: 'USD' | 'EUR' | 'UZS';
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed' | 'lost';
  probability?: number;
  close_date?: string;
  notes?: string;
  deal_type?: 'product' | 'service' | 'both';
  product_id?: string;
  service_id?: string;
  payment_status?: 'waiting' | 'paid' | 'not_realized' | 'debt';
  debt_amount?: number;
  assigned_engineer?: string;
  assigned_accountant?: string;
  assigned_salesperson?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignee_id?: string;
  assignee_ids?: string[];
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