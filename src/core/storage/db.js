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

    return new Promise((resolve) => {
      let settled = false;
      const done = (result) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(result);
        }
      };
      const timer = setTimeout(() => {
        console.warn('[FenixDB] Timeout al abrir IndexedDB, continuando en modo memoria');
        done(null);
      }, 2500);

      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
          const database = e.target.result;
          if (!database.objectStoreNames.contains(STORE_NAME)) {
            database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
          }
        };
        request.onsuccess = () => {
          db = request.result;
          done(db);
        };
        request.onerror = () => {
          console.warn('[FenixDB] Error al abrir IndexedDB:', request.error);
          done(null);
        };
        request.onblocked = () => {
          console.warn('[FenixDB] IndexedDB bloqueado, continuando sin bloqueo');
          done(null);
        };
      } catch (err) {
        console.warn('[FenixDB] Excepcion abriendo IndexedDB:', err);
        done(null);
      }
    });
  }

  const IMAGE_EXT_REGEX = /\.(jpe?g|png|webp|heic|heif|avif|gif)$/i;

  function isValidImageFile(file) {
    if (!file) return false;
    const rawName = String(file.name || file.webkitRelativePath || '');
    const baseName = rawName.split('/').pop() || '';
    if (!baseName || baseName.startsWith('.')) return false;
    if (file.type && file.type.startsWith('image/')) return true;
    return IMAGE_EXT_REGEX.test(baseName);
  }

  async function addPhoto(blob, filename) {
    const database = await open();
    if (!database) return null;

    const resolvedFilename =
      filename ||
      (blob && typeof blob === 'object' && (blob.webkitRelativePath || blob.name)) ||
      `foto-${Date.now()}.jpg`;

    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const entry = {
        blob,
        filename: resolvedFilename,
        addedAt: Date.now()
      };
      let addedId = null;
      const req = store.add(entry);
      req.onsuccess = () => {
        addedId = req.result;
      };
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => resolve(addedId);
      tx.onerror = () => reject(tx.error || req.error);
      tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
    });
  }

  /**
   * Importacion por goteo (streaming) hacia IndexedDB.
   * Procesa archivos uno por uno (o en micro-lotes segun perfil de hardware) con pausas
   * de cesion al event loop para evitar picos de RAM y cierres por Jetsam en iPadOS.
   */
  async function streamAddPhotos(filesOrList, options = {}) {
    const rawArray = Array.from(filesOrList || []);
    const validFiles = rawArray.filter(isValidImageFile);
    if (validFiles.length === 0) return { imported: 0, total: 0 };

    const batchSize = Math.max(1, Number(options.batchSize) || 1);
    const yieldMs = Math.max(0, Number(options.yieldMs) ?? 20);
    const onProgress = typeof options.onProgress === 'function' ? options.onProgress : null;

    let imported = 0;
    const total = validFiles.length;

    for (let i = 0; i < total; i += batchSize) {
      const slice = validFiles.slice(i, i + batchSize);
      for (const file of slice) {
        try {
          const displayFilename = file.webkitRelativePath || file.name || `foto-${Date.now()}.jpg`;
          await addPhoto(file, displayFilename);
          imported++;
          if (onProgress) {
            onProgress({ imported, total, filename: displayFilename });
          }
        } catch (err) {
          console.warn('[FenixDB] Error en escritura por goteo:', err);
        }
      }
      if (yieldMs > 0 && i + batchSize < total) {
        await new Promise((r) => setTimeout(r, yieldMs));
      }
    }

    return { imported, total };
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

  /**
   * Obtiene descriptores ligeros mediante cursor sin retener referencias a todos los Blobs
   * en memoria simultaneamente en dispositivos low-RAM (iPadOS WebKit).
   */
  async function getAllPhotoMetadata() {
    const database = await open();
    if (!database) return [];

    return new Promise((resolve, reject) => {
      const items = [];
      const tx = database.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.openCursor();
      req.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          const val = cursor.value || {};
          items.push({
            id: val.id,
            filename: val.filename || `foto-${val.id}.jpg`,
            addedAt: val.addedAt || Date.now(),
            size: val.blob?.size || 0
          });
          cursor.continue();
        } else {
          resolve(items);
        }
      };
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

  async function getPhotoById(id) {
    const database = await open();
    if (!database || id === undefined || id === null) return null;

    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const numericId = Number(id);
      const key = Number.isNaN(numericId) ? id : numericId;
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async function getPhotoBlobById(id) {
    const record = await getPhotoById(id);
    return record?.blob || null;
  }

  async function purgeDatabase() {
    return clearAll();
  }

  return {
    open,
    isValidImageFile,
    addPhoto,
    streamAddPhotos,
    getAllPhotos,
    getAllPhotoMetadata,
    getPhotoById,
    getPhotoBlobById,
    getPhotoCount,
    countPhotos: getPhotoCount,
    deletePhoto,
    clearAll,
    purgeDatabase
  };
})();

if (typeof window !== 'undefined') {
  window.FenixDB = FenixDB;
}

