import { IStorage } from '../interfaces/IStorage.js';

const DB_NAME = 'leptium_frame_db';
const STORE_NAME = 'key_val_store';
const DB_VERSION = 1;

export class WebStorage extends IStorage {
  constructor() {
    super();
    this.dbPromise = this._initDB();
  }

  _initDB() {
    if (typeof indexedDB === 'undefined') {
      return Promise.resolve(null);
    }
    return new Promise((resolve) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = () => resolve(null);
    });
  }

  async get(key) {
    const db = await this.dbPromise;
    if (db) {
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result !== undefined ? req.result : this._fallbackGet(key));
        req.onerror = () => resolve(this._fallbackGet(key));
      });
    }
    return this._fallbackGet(key);
  }

  async set(key, value) {
    const db = await this.dbPromise;
    if (db) {
      await new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    }
    this._fallbackSet(key, value);
  }

  async remove(key) {
    const db = await this.dbPromise;
    if (db) {
      await new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    }
    this._fallbackRemove(key);
  }

  async listKeys() {
    const db = await this.dbPromise;
    if (db) {
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAllKeys();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => {
          try { resolve(Object.keys(localStorage)); } catch { resolve([]); }
        };
      });
    }
    try {
      return Object.keys(localStorage);
    } catch {
      return [];
    }
  }

  _fallbackGet(key) {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  }

  _fallbackSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('[WebStorage] Error en localStorage fallback:', e);
    }
  }

  _fallbackRemove(key) {
    try {
      localStorage.removeItem(key);
    } catch {}
  }
}
