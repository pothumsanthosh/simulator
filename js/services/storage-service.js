/**
 * Switcha Studio — Offline-First Project Storage Engine
 * Multi-store IndexedDB engine with LocalStorage fallback.
 * Strictly isolates:
 *   - My Circuits (Switcha Circuits - .swcirc)
 *   - My Models (Switcha Blocks - .swblock)
 *   - My Scripts (Switcha Code - .swcode)
 * 
 * Strict Zero Auto-Sync Policy: Offline data remains strictly local.
 * Cloud interactions require explicit user actions.
 */

export class StorageService {
  constructor() {
    this.dbName = 'switcha_studio_db';
    this.dbVersion = 1;
    this.db = null;
    this.isReady = false;
    this.initPromise = this.initDB();
  }

  async initDB() {
    if (typeof window === 'undefined' || !window.indexedDB) {
      this.isReady = true;
      return null;
    }

    return new Promise((resolve) => {
      try {
        const req = window.indexedDB.open(this.dbName, this.dbVersion);

        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('circuits')) {
            const store = db.createObjectStore('circuits', { keyPath: 'id' });
            store.createIndex('updatedAt', 'updatedAt', { unique: false });
            store.createIndex('name', 'name', { unique: false });
          }
          if (!db.objectStoreNames.contains('models')) {
            const store = db.createObjectStore('models', { keyPath: 'id' });
            store.createIndex('updatedAt', 'updatedAt', { unique: false });
            store.createIndex('name', 'name', { unique: false });
          }
          if (!db.objectStoreNames.contains('scripts')) {
            const store = db.createObjectStore('scripts', { keyPath: 'id' });
            store.createIndex('updatedAt', 'updatedAt', { unique: false });
            store.createIndex('name', 'name', { unique: false });
          }
        };

        req.onsuccess = (e) => {
          this.db = e.target.result;
          this.isReady = true;
          resolve(this.db);
        };

        req.onerror = () => {
          this.isReady = true;
          resolve(null);
        };
      } catch (err) {
        this.isReady = true;
        resolve(null);
      }
    });
  }

  // --- Generic Store CRUD ---

  async getAll(storeName) {
    await this.initPromise;
    if (this.db) {
      return new Promise((resolve) => {
        try {
          const tx = this.db.transaction(storeName, 'readonly');
          const store = tx.objectStore(storeName);
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve(this.getFallback(storeName));
        } catch (_) {
          resolve(this.getFallback(storeName));
        }
      });
    }
    return this.getFallback(storeName);
  }

  async getById(storeName, id) {
    await this.initPromise;
    if (this.db) {
      return new Promise((resolve) => {
        try {
          const tx = this.db.transaction(storeName, 'readonly');
          const store = tx.objectStore(storeName);
          const req = store.get(id);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => {
            const list = this.getFallback(storeName);
            resolve(list.find(item => item.id === id) || null);
          };
        } catch (_) {
          const list = this.getFallback(storeName);
          resolve(list.find(item => item.id === id) || null);
        }
      });
    }
    const list = this.getFallback(storeName);
    return list.find(item => item.id === id) || null;
  }

  async save(storeName, item) {
    await this.initPromise;
    if (!item.id) item.id = `${storeName}_${Date.now()}`;
    item.updatedAt = Date.now();

    if (this.db) {
      new Promise((resolve) => {
        try {
          const tx = this.db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          store.put(item);
          tx.oncomplete = () => resolve(item);
          tx.onerror = () => resolve(this.saveFallback(storeName, item));
        } catch (_) {
          resolve(this.saveFallback(storeName, item));
        }
      });
    }
    this.saveFallback(storeName, item);
    return item;
  }

  async delete(storeName, id) {
    await this.initPromise;
    if (this.db) {
      new Promise((resolve) => {
        try {
          const tx = this.db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          store.delete(id);
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => resolve(this.deleteFallback(storeName, id));
        } catch (_) {
          resolve(this.deleteFallback(storeName, id));
        }
      });
    }
    this.deleteFallback(storeName, id);
    return true;
  }

  // --- LocalStorage Fallback Helper ---

  getFallbackKey(storeName) {
    return `switcha_my_${storeName}`;
  }

  getFallback(storeName) {
    try {
      const data = localStorage.getItem(this.getFallbackKey(storeName));
      return data ? JSON.parse(data) : [];
    } catch (_) {
      return [];
    }
  }

  saveFallback(storeName, item) {
    try {
      const list = this.getFallback(storeName);
      const idx = list.findIndex(i => i.id === item.id);
      if (idx >= 0) list[idx] = item;
      else list.unshift(item);
      localStorage.setItem(this.getFallbackKey(storeName), JSON.stringify(list));
      return item;
    } catch (_) {
      return item;
    }
  }

  deleteFallback(storeName, id) {
    try {
      const list = this.getFallback(storeName).filter(i => i.id !== id);
      localStorage.setItem(this.getFallbackKey(storeName), JSON.stringify(list));
      return true;
    } catch (_) {
      return false;
    }
  }

  // --- Environment-Specific Project Accessors ---

  // 1. Switcha Circuits Projects
  async getCircuits() {
    const list = await this.getAll('circuits');
    if (!list || list.length === 0) {
      return this.getFallback('circuits');
    }
    return list;
  }
  async getCircuit(id) {
    const item = await this.getById('circuits', id);
    if (!item) {
      const fallbackList = this.getFallback('circuits');
      return fallbackList.find(c => c.id === id) || null;
    }
    return item;
  }
  async saveCircuit(circuit) { return this.save('circuits', circuit); }
  async deleteCircuit(id) { return this.delete('circuits', id); }

  // 2. Switcha Blocks Projects (Models)
  async getModels() { return this.getAll('models'); }
  async getModel(id) { return this.getById('models', id); }
  async saveModel(model) { return this.save('models', model); }
  async deleteModel(id) { return this.delete('models', id); }

  // 3. Switcha Code Projects (Scripts)
  async getScripts() { return this.getAll('scripts'); }
  async getScript(id) { return this.getById('scripts', id); }
  async saveScript(script) { return this.save('scripts', script); }
  async deleteScript(id) { return this.delete('scripts', id); }
}

export const storageService = new StorageService();
export const SwitchaStorageService = StorageService;
export const switchaStorage = storageService;

if (typeof window !== 'undefined') {
  window.StorageService = StorageService;
  window.SwitchaStorageService = SwitchaStorageService;
  window.storageService = storageService;
  window.SwitchaStorage = storageService;
}

