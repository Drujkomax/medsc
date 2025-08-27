export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  last_contact?: string;
  created_by?: string;
}

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