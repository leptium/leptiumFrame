/**
 * FenixDB — Capa de persistencia local de alto rendimiento en IndexedDB
 * Gestiona gigabytes de fotografías de usuarios localmente sin límite de 5 MB de localStorage.
 * Estricto cumplimiento de Cero Emojis y 100% Vanilla JS.
 */

export const FenixDB = (() => {
  const DB_NAME = 'FenixFrameDB';
  const DB_VERSION = 1;
  const STORE_NAME = 'photos';
  let db = null;

  async function open() {
    if (db) return db;
    if (typeof indexedDB === 'undefined') {
      console.warn('[FenixDB] IndexedDB no soportado en este entorno');
      return null;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const database = e.target.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      };
      request.onsuccess = () => {
        db = request.result;
        resolve(db);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async function addPhoto(blob, filename = 'foto.jpg') {
    const database = await open();
    if (!database) return null;

    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const entry = {
        blob,
        filename,
        addedAt: Date.now()
      };
      const req = store.add(entry);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function getAllPhotos() {
    const database = await open();
    if (!database) return [];

    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async function getPhotoCount() {
    const database = await open();
    if (!database) return 0;

    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.count();
      req.onsuccess = () => resolve(req.result || 0);
      req.onerror = () => reject(req.error);
    });
  }

  async function deletePhoto(id) {
    const database = await open();
    if (!database) return false;

    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  async function clearAll() {
    const database = await open();
    if (!database) return false;

    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  async function purgeDatabase() {
    return clearAll();
  }

  return {
    open,
    addPhoto,
    getAllPhotos,
    getPhotoCount,
    deletePhoto,
    clearAll,
    purgeDatabase
  };
})();

if (typeof window !== 'undefined') {
  window.FenixDB = FenixDB;
}
