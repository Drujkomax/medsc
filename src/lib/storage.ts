import { Deal, Task } from '@/types/crm';

const STORAGE_KEYS = {
  DEALS: 'crm_deals',
  TASKS: 'crm_tasks',
} as const;

// Utility functions for localStorage
const getStorageData = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return [];
  }
};

const setStorageData = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error);
  }
};

// Deal storage functions
export const dealStorage = {
  getAll: (): Deal[] => getStorageData<Deal>(STORAGE_KEYS.DEALS),
  
  getById: (id: string): Deal | undefined => {
    const deals = dealStorage.getAll();
    return deals.find(deal => deal.id === id);
  },
  
  getByLeadId: (leadId: string): Deal[] => {
    const deals = dealStorage.getAll();
    return deals.filter(deal => deal.lead_id === leadId);
  },
  
  create: (deal: Omit<Deal, 'id' | 'created_at' | 'updated_at'>): Deal => {
    const deals = dealStorage.getAll();
    const newDeal: Deal = {
      ...deal,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    deals.push(newDeal);
    setStorageData(STORAGE_KEYS.DEALS, deals);
    return newDeal;
  },
  
  update: (id: string, updates: Partial<Deal>): Deal | null => {
    const deals = dealStorage.getAll();
    const index = deals.findIndex(deal => deal.id === id);
    if (index === -1) return null;
    
    deals[index] = { ...deals[index], ...updates };
    setStorageData(STORAGE_KEYS.DEALS, deals);
    return deals[index];
  },
  
  delete: (id: string): boolean => {
    const deals = dealStorage.getAll();
    const filteredDeals = deals.filter(deal => deal.id !== id);
    if (filteredDeals.length === deals.length) return false;
    
    setStorageData(STORAGE_KEYS.DEALS, filteredDeals);
    return true;
  }
};

// Task storage functions
export const taskStorage = {
  getAll: (): Task[] => getStorageData<Task>(STORAGE_KEYS.TASKS),
  
  getById: (id: string): Task | undefined => {
    const tasks = taskStorage.getAll();
    return tasks.find(task => task.id === id);
  },
  
  getByClientId: (clientId: string): Task[] => {
    const tasks = taskStorage.getAll();
    return tasks.filter(task => task.client_id === clientId);
  },
  
  getByDealId: (dealId: string): Task[] => {
    const tasks = taskStorage.getAll();
    return tasks.filter(task => task.deal_id === dealId);
  },
  
  create: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Task => {
    const tasks = taskStorage.getAll();
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    tasks.push(newTask);
    setStorageData(STORAGE_KEYS.TASKS, tasks);
    return newTask;
  },
  
  update: (id: string, updates: Partial<Task>): Task | null => {
    const tasks = taskStorage.getAll();
    const index = tasks.findIndex(task => task.id === id);
    if (index === -1) return null;
    
    tasks[index] = { ...tasks[index], ...updates };
    setStorageData(STORAGE_KEYS.TASKS, tasks);
    return tasks[index];
  },
  
  delete: (id: string): boolean => {
    const tasks = taskStorage.getAll();
    const filteredTasks = tasks.filter(task => task.id !== id);
    if (filteredTasks.length === tasks.length) return false;
    
    setStorageData(STORAGE_KEYS.TASKS, filteredTasks);
    return true;
  }
};