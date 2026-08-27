/**
 * Deco Vintage - Motor de Persistencia Profesional IndexedDB
 * Proporciona almacenamiento robusto, de alta capacidad (500MB+) y libre del límite de 5MB de LocalStorage.
 */

const DB_NAME = 'DecoVintageStoreDB';
const DB_VERSION = 1;
const STORE_POSTERS = 'posters';
const STORE_METADATA = 'metadata';

let dbInstance = null;

/**
 * Abre o inicializa la base de datos IndexedDB de Deco Vintage
 */
export function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB no está disponible en este entorno.'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Almacén de pósters (clave primaria: id)
      if (!db.objectStoreNames.contains(STORE_POSTERS)) {
        const posterStore = db.createObjectStore(STORE_POSTERS, { keyPath: 'id' });
        posterStore.createIndex('category', 'category', { unique: false });
        posterStore.createIndex('isFeatured', 'isFeatured', { unique: false });
      }

      // Almacén de metadatos (categorías, franquicias, configuración)
      if (!db.objectStoreNames.contains(STORE_METADATA)) {
        db.createObjectStore(STORE_METADATA, { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('[IndexedDB] Error al abrir la base de datos:', event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Obtiene todos los pósters almacenados en IndexedDB
 */
export async function idbGetAllPosters() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_POSTERS], 'readonly');
      const store = transaction.objectStore(STORE_POSTERS);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn('[IndexedDB] Fallback al leer pósters:', err);
    return [];
  }
}

/**
 * Guarda o actualiza un póster individual en IndexedDB
 */
export async function idbSavePoster(poster) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_POSTERS], 'readwrite');
      const store = transaction.objectStore(STORE_POSTERS);
      const request = store.put(poster);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.error('[IndexedDB] Error al guardar póster:', err);
    return false;
  }
}

/**
 * Guarda una lista completa de pósters en lote dentro de una sola transacción
 */
export async function idbSaveAllPosters(posters) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_POSTERS], 'readwrite');
      const store = transaction.objectStore(STORE_POSTERS);

      // Limpiar y reinsertar lote
      store.clear().onsuccess = () => {
        for (const poster of posters) {
          store.put(poster);
        }
      };

      transaction.oncomplete = () => {
        resolve(true);
      };

      transaction.onerror = () => {
        reject(transaction.error);
      };
    });
  } catch (err) {
    console.error('[IndexedDB] Error en guardado por lote:', err);
    return false;
  }
}

/**
 * Elimina un póster por ID en IndexedDB
 */
export async function idbDeletePoster(posterId) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_POSTERS], 'readwrite');
      const store = transaction.objectStore(STORE_POSTERS);
      const request = store.delete(posterId);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.error('[IndexedDB] Error al eliminar póster:', err);
    return false;
  }
}

/**
 * Guarda metadatos (categorías o franquicias)
 */
export async function idbSetMetadata(key, value) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_METADATA], 'readwrite');
      const store = transaction.objectStore(STORE_METADATA);
      const request = store.put({ key, value, updatedAt: new Date().toISOString() });

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.error(`[IndexedDB] Error al guardar metadato "${key}":`, err);
    return false;
  }
}

/**
 * Lee metadatos por clave
 */
export async function idbGetMetadata(key) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_METADATA], 'readonly');
      const store = transaction.objectStore(STORE_METADATA);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result ? request.result.value : null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn(`[IndexedDB] Fallback al leer metadato "${key}":`, err);
    return null;
  }
}
