import { Client, Deal, Task } from '@/types/crm';

const STORAGE_KEYS = {
  CLIENTS: 'crm_clients',
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

// Client storage functions
export const clientStorage = {
  getAll: (): Client[] => getStorageData<Client>(STORAGE_KEYS.CLIENTS),
  
  getById: (id: string): Client | undefined => {
    const clients = clientStorage.getAll();
    return clients.find(client => client.id === id);
  },
  
  create: (client: Omit<Client, 'id' | 'createdAt'>): Client => {
    const clients = clientStorage.getAll();
    const newClient: Client = {
      ...client,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    clients.push(newClient);
    setStorageData(STORAGE_KEYS.CLIENTS, clients);
    return newClient;
  },
  
  update: (id: string, updates: Partial<Client>): Client | null => {
    const clients = clientStorage.getAll();
    const index = clients.findIndex(client => client.id === id);
    if (index === -1) return null;
    
    clients[index] = { ...clients[index], ...updates };
    setStorageData(STORAGE_KEYS.CLIENTS, clients);
    return clients[index];
  },
  
  delete: (id: string): boolean => {
    const clients = clientStorage.getAll();
    const filteredClients = clients.filter(client => client.id !== id);
    if (filteredClients.length === clients.length) return false;
    
    setStorageData(STORAGE_KEYS.CLIENTS, filteredClients);
    return true;
  }
};

// Deal storage functions
export const dealStorage = {
  getAll: (): Deal[] => getStorageData<Deal>(STORAGE_KEYS.DEALS),
  
  getById: (id: string): Deal | undefined => {
    const deals = dealStorage.getAll();
    return deals.find(deal => deal.id === id);
  },
  
  getByClientId: (clientId: string): Deal[] => {
    const deals = dealStorage.getAll();
    return deals.filter(deal => deal.clientId === clientId);
  },
  
  create: (deal: Omit<Deal, 'id' | 'createdAt'>): Deal => {
    const deals = dealStorage.getAll();
    const newDeal: Deal = {
      ...deal,
      id: crypto.randomUUID(),
      createdAt: new Date(),
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
    return tasks.filter(task => task.clientId === clientId);
  },
  
  getByDealId: (dealId: string): Task[] => {
    const tasks = taskStorage.getAll();
    return tasks.filter(task => task.dealId === dealId);
  },
  
  create: (task: Omit<Task, 'id' | 'createdAt'>): Task => {
    const tasks = taskStorage.getAll();
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      createdAt: new Date(),
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