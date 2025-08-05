export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  createdAt: Date;
  lastContact?: Date;
  notes?: string;
}

export interface Deal {
  id: string;
  title: string;
  clientId: string;
  amount: number;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed' | 'lost';
  probability: number;
  closeDate?: Date;
  createdAt: Date;
  notes?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assigneeId?: string;
  clientId?: string;
  dealId?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  createdAt: Date;
  completedAt?: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'manager' | 'admin';
}