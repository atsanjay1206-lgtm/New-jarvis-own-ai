import { ChatMessage, MemoryItem, TaskItem, IntentAction, OfflineModelSpec } from '../types/jarvis';

const DB_NAME = 'jarvis_core_db';
const DB_VERSION = 1;

class JarvisStorageService {
  private db: IDBDatabase | null = null;
  private dbReadyPromise: Promise<void>;

  constructor() {
    this.dbReadyPromise = this.initDB();
  }

  private initDB(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        console.warn('IndexedDB not supported, falling back to localStorage');
        resolve();
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e: any) => {
        const db = e.target.result as IDBDatabase;
        if (!db.objectStoreNames.contains('conversations')) {
          db.createObjectStore('conversations', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('memories')) {
          db.createObjectStore('memories', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('tasks')) {
          db.createObjectStore('tasks', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('audit_logs')) {
          db.createObjectStore('audit_logs', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('models')) {
          db.createObjectStore('models', { keyPath: 'id' });
        }
      };

      request.onsuccess = (e: any) => {
        this.db = e.target.result;
        resolve();
      };

      request.onerror = (e) => {
        console.warn('IndexedDB open error, using localStorage fallback', e);
        resolve();
      };
    });
  }

  // --- Conversations ---
  public async getConversations(): Promise<ChatMessage[]> {
    await this.dbReadyPromise;
    if (this.db) {
      return new Promise((resolve) => {
        try {
          const tx = this.db!.transaction('conversations', 'readonly');
          const store = tx.objectStore('conversations');
          const request = store.getAll();
          request.onsuccess = () => {
            const results = (request.result || []) as ChatMessage[];
            results.sort((a, b) => a.timestamp - b.timestamp);
            resolve(results);
          };
          request.onerror = () => resolve(this.getLocalFallback('jarvis_conversations', []));
        } catch (e) {
          resolve(this.getLocalFallback('jarvis_conversations', []));
        }
      });
    }
    return this.getLocalFallback('jarvis_conversations', []);
  }

  public async saveMessage(message: ChatMessage): Promise<void> {
    await this.dbReadyPromise;
    if (this.db) {
      try {
        const tx = this.db.transaction('conversations', 'readwrite');
        const store = tx.objectStore('conversations');
        store.put(message);
      } catch (e) {
        console.warn('Error saving to IDB:', e);
      }
    }
    // sync to localstorage mirror
    const list = this.getLocalFallback<ChatMessage[]>('jarvis_conversations', []);
    const filtered = list.filter(m => m.id !== message.id);
    filtered.push(message);
    if (filtered.length > 100) filtered.shift(); // retain last 100 in mirror
    this.setLocalFallback('jarvis_conversations', filtered);
  }

  public async clearConversations(): Promise<void> {
    await this.dbReadyPromise;
    if (this.db) {
      try {
        const tx = this.db.transaction('conversations', 'readwrite');
        tx.objectStore('conversations').clear();
      } catch (e) {}
    }
    localStorage.removeItem('jarvis_conversations');
  }

  // --- Durable Long-Term Memory ---
  public async getMemories(): Promise<MemoryItem[]> {
    await this.dbReadyPromise;
    let list: MemoryItem[] = [];
    if (this.db) {
      list = await new Promise((resolve) => {
        try {
          const tx = this.db!.transaction('memories', 'readonly');
          const req = tx.objectStore('memories').getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve([]);
        } catch (e) {
          resolve([]);
        }
      });
    }

    if (list.length === 0) {
      list = this.getLocalFallback('jarvis_memories', []);
    }

    // Default seeded memories if empty
    if (list.length === 0) {
      const defaults: MemoryItem[] = [
        {
          id: 'mem_1',
          key: 'Host Identity',
          value: 'Addressed as Sir / Commander. Operating under Stark Industries protocol Mk LXXXV.',
          category: 'User Profile',
          created: Date.now() - 100000,
          updated: Date.now() - 100000,
          confidence: 1.0,
        },
        {
          id: 'mem_2',
          key: 'Primary Hardware',
          value: 'OnePlus 11R running Snapdragon 8+ Gen 1, 16GB LPDDR5X RAM, 100W SuperVOOC power system.',
          category: 'Device Specs',
          created: Date.now() - 80000,
          updated: Date.now() - 80000,
          confidence: 1.0,
        },
        {
          id: 'mem_3',
          key: 'Operational Directive',
          value: 'Maintain high availability offline, prioritize battery conservation, execute Android intent actions with validation.',
          category: 'Directive',
          created: Date.now() - 60000,
          updated: Date.now() - 60000,
          confidence: 0.95,
        },
        {
          id: 'mem_4',
          key: 'Verbal Cadence',
          value: 'British English, refined, subtle wit, concise, and loyal.',
          category: 'Preference',
          created: Date.now() - 40000,
          updated: Date.now() - 40000,
          confidence: 0.9,
        },
      ];
      for (const item of defaults) {
        await this.saveMemory(item);
      }
      return defaults;
    }

    return list;
  }

  public async saveMemory(item: MemoryItem): Promise<void> {
    await this.dbReadyPromise;
    if (this.db) {
      try {
        const tx = this.db.transaction('memories', 'readwrite');
        tx.objectStore('memories').put(item);
      } catch (e) {}
    }
    const list = this.getLocalFallback<MemoryItem[]>('jarvis_memories', []);
    const idx = list.findIndex(m => m.id === item.id);
    if (idx >= 0) list[idx] = item;
    else list.push(item);
    this.setLocalFallback('jarvis_memories', list);
  }

  public async deleteMemory(id: string): Promise<void> {
    await this.dbReadyPromise;
    if (this.db) {
      try {
        const tx = this.db.transaction('memories', 'readwrite');
        tx.objectStore('memories').delete(id);
      } catch (e) {}
    }
    const list = this.getLocalFallback<MemoryItem[]>('jarvis_memories', []);
    this.setLocalFallback('jarvis_memories', list.filter(m => m.id !== id));
  }

  // --- Tasks & Reminders ---
  public async getTasks(): Promise<TaskItem[]> {
    await this.dbReadyPromise;
    if (this.db) {
      return new Promise((resolve) => {
        try {
          const tx = this.db!.transaction('tasks', 'readonly');
          const req = tx.objectStore('tasks').getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve(this.getLocalFallback('jarvis_tasks', []));
        } catch (e) {
          resolve(this.getLocalFallback('jarvis_tasks', []));
        }
      });
    }
    return this.getLocalFallback('jarvis_tasks', []);
  }

  public async saveTask(task: TaskItem): Promise<void> {
    await this.dbReadyPromise;
    if (this.db) {
      try {
        const tx = this.db.transaction('tasks', 'readwrite');
        tx.objectStore('tasks').put(task);
      } catch (e) {}
    }
    const list = this.getLocalFallback<TaskItem[]>('jarvis_tasks', []);
    const idx = list.findIndex(t => t.id === task.id);
    if (idx >= 0) list[idx] = task;
    else list.push(task);
    this.setLocalFallback('jarvis_tasks', list);
  }

  public async deleteTask(id: string): Promise<void> {
    await this.dbReadyPromise;
    if (this.db) {
      try {
        const tx = this.db.transaction('tasks', 'readwrite');
        tx.objectStore('tasks').delete(id);
      } catch (e) {}
    }
    const list = this.getLocalFallback<TaskItem[]>('jarvis_tasks', []);
    this.setLocalFallback('jarvis_tasks', list.filter(t => t.id !== id));
  }

  // --- Audit Log ---
  public async logAction(action: IntentAction): Promise<void> {
    const entry = {
      ...action,
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: Date.now(),
    };
    await this.dbReadyPromise;
    if (this.db) {
      try {
        const tx = this.db.transaction('audit_logs', 'readwrite');
        tx.objectStore('audit_logs').put(entry);
      } catch (e) {}
    }
    const logs = this.getLocalFallback<any[]>('jarvis_audit_logs', []);
    logs.unshift(entry);
    if (logs.length > 50) logs.pop();
    this.setLocalFallback('jarvis_audit_logs', logs);
  }

  public async getAuditLogs(): Promise<any[]> {
    await this.dbReadyPromise;
    if (this.db) {
      return new Promise((resolve) => {
        try {
          const tx = this.db!.transaction('audit_logs', 'readonly');
          const req = tx.objectStore('audit_logs').getAll();
          req.onsuccess = () => {
            const res = req.result || [];
            res.sort((a: any, b: any) => b.timestamp - a.timestamp);
            resolve(res);
          };
          req.onerror = () => resolve(this.getLocalFallback('jarvis_audit_logs', []));
        } catch (e) {
          resolve(this.getLocalFallback('jarvis_audit_logs', []));
        }
      });
    }
    return this.getLocalFallback('jarvis_audit_logs', []);
  }

  // --- Offline Models Specs & State ---
  public async getOfflineModels(): Promise<OfflineModelSpec[]> {
    const defaultModels: OfflineModelSpec[] = [
      {
        id: 'smollm-135m-q4',
        name: 'SmolLM-135M Quantum Core',
        parameters: '135 Million',
        quantization: 'q4_k_m (4-bit)',
        downloadSizeMB: 88,
        ramUsageMB: 280,
        status: 'ready',
        description: 'Ultra-fast compact neural weights for mobile intent classification and reasoning without network.',
        targetDevice: 'OnePlus 11R (Lightweight)',
      },
      {
        id: 'qwen-0.5b-chat-q4',
        name: 'Qwen2.5-0.5B Jarvis Tactical',
        parameters: '490 Million',
        quantization: 'q4_k_m (4-bit)',
        downloadSizeMB: 340,
        ramUsageMB: 850,
        status: 'not_downloaded',
        description: 'Balanced conversational reasoning, multi-turn context, and complex task planning.',
        targetDevice: 'OnePlus 11R (Recommended)',
      },
      {
        id: 'tinyllama-1.1b-chat-q4',
        name: 'Mark-IV 1.1B Deep Cognitive',
        parameters: '1.10 Billion',
        quantization: 'q4_0 (4-bit)',
        downloadSizeMB: 660,
        ramUsageMB: 1450,
        status: 'not_downloaded',
        description: 'Full-depth assistant intelligence, creative writing, and extensive world knowledge. Requires 2GB+ free RAM.',
        targetDevice: 'OnePlus 11R 16GB RAM Spec',
      },
    ];

    const saved = this.getLocalFallback<OfflineModelSpec[]>('jarvis_models', []);
    if (saved.length > 0) return saved;
    return defaultModels;
  }

  public saveOfflineModels(models: OfflineModelSpec[]) {
    this.setLocalFallback('jarvis_models', models);
  }

  // --- Backup & Restore ---
  public async exportDatabase(): Promise<string> {
    const conversations = await this.getConversations();
    const memories = await this.getMemories();
    const tasks = await this.getTasks();
    const auditLogs = await this.getAuditLogs();
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      conversations,
      memories,
      tasks,
      auditLogs,
    };
    return JSON.stringify(data, null, 2);
  }

  public async importDatabase(jsonString: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.memories)) {
        for (const m of data.memories) {
          await this.saveMemory(m);
        }
      }
      if (Array.isArray(data.tasks)) {
        for (const t of data.tasks) {
          await this.saveTask(t);
        }
      }
      if (Array.isArray(data.conversations)) {
        for (const c of data.conversations) {
          await this.saveMessage(c);
        }
      }
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }

  // LocalStorage Helpers
  private getLocalFallback<T>(key: string, defaultVal: T): T {
    try {
      const str = localStorage.getItem(key);
      return str ? JSON.parse(str) : defaultVal;
    } catch (e) {
      return defaultVal;
    }
  }

  private setLocalFallback(key: string, val: any) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
  }
}

export const jarvisStorage = new JarvisStorageService();
