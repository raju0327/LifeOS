/* ==========================================================================
   LIFE OS - STORAGE SERVICE (services/storageService.js)
   IndexedDB Offline Caching & Local Storage Fallback Engine
   ========================================================================== */

window.LifeOSStorageService = {
  dbName: 'LifeOS_Offline_DB',
  dbVersion: 1,
  db: null,

  async init() {
    return new Promise((resolve) => {
      if (!window.indexedDB) {
        console.warn('IndexedDB unavailable. Falling back to localStorage.');
        resolve(false);
        return;
      }

      const request = window.indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('app_state')) {
          db.createObjectStore('app_state', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('pending_sync')) {
          db.createObjectStore('pending_sync', { keyPath: 'id', autoIncrement: true });
        }
      };

      request.onsuccess = (e) => {
        this.db = e.target.result;
        console.log('IndexedDB offline cache initialized.');
        resolve(true);
      };

      request.onerror = (e) => {
        console.warn('IndexedDB open error:', e);
        resolve(false);
      };
    });
  },

  async saveStateOffline(userId, stateObj) {
    if (this.db) {
      try {
        const tx = this.db.transaction('app_state', 'readwrite');
        const store = tx.objectStore('app_state');
        store.put({ id: userId || 'default', data: stateObj, updatedAt: Date.now() });
      } catch (e) {
        console.warn('IndexedDB save state error:', e);
      }
    }
    // Backup to localStorage as secondary fallback
    try {
      localStorage.setItem(`lifeos_state_${userId || 'default'}`, JSON.stringify(stateObj));
    } catch (e) {
      console.warn('localStorage save state error:', e);
    }
  },

  async getOfflineState(userId) {
    if (this.db) {
      try {
        return await new Promise((resolve) => {
          const tx = this.db.transaction('app_state', 'readonly');
          const store = tx.objectStore('app_state');
          const req = store.get(userId || 'default');
          req.onsuccess = () => resolve(req.result ? req.result.data : null);
          req.onerror = () => resolve(null);
        });
      } catch (e) {
        console.warn('IndexedDB get state error:', e);
      }
    }

    // Fallback to localStorage
    const raw = localStorage.getItem(`lifeos_state_${userId || 'default'}`);
    return raw ? JSON.parse(raw) : null;
  }
};
