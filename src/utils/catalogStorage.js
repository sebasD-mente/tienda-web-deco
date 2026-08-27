import {
  CATALOG_POSTERS as BASE_POSTERS,
  CATEGORIES as BASE_CATEGORIES,
  INITIAL_FRANCHISES as BASE_FRANCHISES
} from '../data/catalogData.js';
import { 
  idbGetAllPosters, 
  idbSavePoster, 
  idbSaveAllPosters, 
  idbDeletePoster, 
  idbSetMetadata, 
  idbGetMetadata 
} from './idbStorage.js';

const DEFAULT_POSTERS = BASE_POSTERS;
const DEFAULT_CATEGORIES = BASE_CATEGORIES;
const DEFAULT_FRANCHISES = BASE_FRANCHISES;

const POSTERS_STORAGE_KEY = 'deco_vintage_catalog_posters_v2';
const CATEGORIES_STORAGE_KEY = 'deco_vintage_catalog_categories_v2';
const FRANCHISES_STORAGE_KEY = 'deco_vintage_catalog_franchises_v2';

// 1. Reactive In-Memory Cache (Ultra-Fast Synchronous Access)
let memoryPosters = null;
let memoryCategories = null;
let memoryFranchises = null;

// Helper to safely read from localStorage
function readLocalStorage(key) {
  try {
    if (typeof localStorage !== 'undefined') {
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
    }
  } catch (e) {}
  return null;
}

// Helper to safely write to localStorage
function writeLocalStorage(key, val) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(val));
    }
  } catch (quotaErr) {
    // Quota exceeded is normal for big image catalogs; IndexedDB handles the true storage
  }
}

// 2. Initialize and Hydrate from IndexedDB on startup
export async function initializeStorageEngine() {
  if (typeof window === 'undefined') return;

  try {
    // A. Hydrate Posters
    const idbPosters = await idbGetAllPosters();
    if (Array.isArray(idbPosters) && idbPosters.length > 0) {
      memoryPosters = idbPosters;
    } else {
      // Check if localStorage has existing posters to migrate
      const lsPosters = readLocalStorage(POSTERS_STORAGE_KEY);
      if (Array.isArray(lsPosters) && lsPosters.length > 0) {
        memoryPosters = lsPosters;
      } else {
        memoryPosters = [...DEFAULT_POSTERS];
      }
      // Persist to IndexedDB
      await idbSaveAllPosters(memoryPosters);
    }
    writeLocalStorage(POSTERS_STORAGE_KEY, memoryPosters);

    // B. Hydrate Categories
    const idbCats = await idbGetMetadata('categories');
    if (Array.isArray(idbCats) && idbCats.length > 0) {
      memoryCategories = idbCats;
    } else {
      const lsCats = readLocalStorage(CATEGORIES_STORAGE_KEY);
      memoryCategories = Array.isArray(lsCats) && lsCats.length > 0 ? lsCats : [...DEFAULT_CATEGORIES];
      await idbSetMetadata('categories', memoryCategories);
    }
    writeLocalStorage(CATEGORIES_STORAGE_KEY, memoryCategories);

    // C. Hydrate Franchises
    const idbFranchises = await idbGetMetadata('franchises');
    if (Array.isArray(idbFranchises) && idbFranchises.length > 0) {
      memoryFranchises = idbFranchises;
    } else {
      const lsFranchises = readLocalStorage(FRANCHISES_STORAGE_KEY);
      memoryFranchises = Array.isArray(lsFranchises) && lsFranchises.length > 0 ? lsFranchises : [...DEFAULT_FRANCHISES];
      await idbSetMetadata('franchises', memoryFranchises);
    }
    writeLocalStorage(FRANCHISES_STORAGE_KEY, memoryFranchises);

    // Notify UI that full database is ready
    window.dispatchEvent(new Event('deco-catalog-updated'));
    console.log(`[Deco Storage] Engine initialized. ${memoryPosters.length} posters loaded in memory & IndexedDB.`);
  } catch (err) {
    console.error('[Deco Storage] Error initializing database:', err);
  }
}

// Auto-run initialization immediately in browser
if (typeof window !== 'undefined') {
  initializeStorageEngine();
}

/**
 * Returns current posters from memory cache, localStorage fallback, or defaults
 */
export function getStoredPosters() {
  if (memoryPosters && Array.isArray(memoryPosters) && memoryPosters.length > 0) {
    return memoryPosters;
  }
  const ls = readLocalStorage(POSTERS_STORAGE_KEY);
  if (Array.isArray(ls) && ls.length > 0) {
    memoryPosters = ls;
    return ls;
  }
  return DEFAULT_POSTERS;
}

/**
 * Returns current categories
 */
export function getStoredCategories() {
  if (memoryCategories && Array.isArray(memoryCategories) && memoryCategories.length > 0) {
    return memoryCategories;
  }
  const ls = readLocalStorage(CATEGORIES_STORAGE_KEY);
  if (Array.isArray(ls) && ls.length > 0) {
    memoryCategories = ls;
    return ls;
  }
  return DEFAULT_CATEGORIES;
}

/**
 * Returns current franchises
 */
export function getStoredFranchises() {
  if (memoryFranchises && Array.isArray(memoryFranchises) && memoryFranchises.length > 0) {
    return memoryFranchises;
  }
  const ls = readLocalStorage(FRANCHISES_STORAGE_KEY);
  if (Array.isArray(ls) && ls.length > 0) {
    memoryFranchises = ls;
    return ls;
  }
  return DEFAULT_FRANCHISES;
}

/**
 * Creates or updates a poster with GUARANTEED persistence in IndexedDB and in-memory cache
 */
export async function saveOrUpdatePoster(posterData) {
  const finalPoster = { ...posterData };
  const current = getStoredPosters();
  const index = current.findIndex(p => p.id === finalPoster.id);

  let updated;
  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...updated[index], ...finalPoster };
  } else {
    updated = [finalPoster, ...current];
  }

  // 1. Update In-Memory Cache Instantly
  memoryPosters = updated;

  // 2. Persist to IndexedDB (Capacity 500MB+)
  await idbSavePoster(finalPoster);

  // 3. Update LocalStorage cache
  writeLocalStorage(POSTERS_STORAGE_KEY, updated);

  // 4. Dispatch update event to re-render all UI components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('deco-catalog-updated'));
  }

  console.log(`[Deco Storage] Poster "${finalPoster.title}" saved successfully. Total posters: ${updated.length}`);
  return updated;
}

/**
 * Toggles featured status for a poster
 */
export async function togglePosterFeatured(posterId) {
  const current = getStoredPosters();
  const poster = current.find(p => p.id === posterId);
  if (!poster) return current;

  const updatedPoster = { ...poster, isFeatured: !poster.isFeatured };
  return await saveOrUpdatePoster(updatedPoster);
}

/**
 * Deletes a poster by ID
 */
export async function deletePosterById(posterId) {
  const current = getStoredPosters();
  const updated = current.filter(p => p.id !== posterId);

  // 1. Update Memory Cache
  memoryPosters = updated;

  // 2. Delete from IndexedDB
  await idbDeletePoster(posterId);

  // 3. Update LocalStorage
  writeLocalStorage(POSTERS_STORAGE_KEY, updated);

  // 4. Dispatch update event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('deco-catalog-updated'));
  }

  console.log(`[Deco Storage] Poster "${posterId}" deleted. Total posters: ${updated.length}`);
  return updated;
}

/**
 * Saves all posters in batch
 */
export async function saveAllPosters(posters) {
  memoryPosters = posters;
  await idbSaveAllPosters(posters);
  writeLocalStorage(POSTERS_STORAGE_KEY, posters);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('deco-catalog-updated'));
  }
  return true;
}

/**
 * Adds a new category
 */
export async function addNewCategory(newCat) {
  const current = getStoredCategories();
  if (current.some(c => c.id === newCat.id)) {
    return current;
  }
  const updated = [...current, newCat];
  await saveAllCategories(updated);
  return updated;
}

/**
 * Deletes a category by ID
 */
export async function deleteCategoryById(categoryId) {
  const current = getStoredCategories();
  const updated = current.filter(c => c.id !== categoryId);
  await saveAllCategories(updated);
  return updated;
}

/**
 * Saves categories list
 */
export async function saveAllCategories(categories) {
  memoryCategories = categories;
  await idbSetMetadata('categories', categories);
  writeLocalStorage(CATEGORIES_STORAGE_KEY, categories);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('deco-catalog-updated'));
  }
  return true;
}

/**
 * Saves franchises list
 */
export async function saveAllFranchises(franchises) {
  memoryFranchises = franchises;
  await idbSetMetadata('franchises', franchises);
  writeLocalStorage(FRANCHISES_STORAGE_KEY, franchises);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('deco-catalog-updated'));
  }
  return true;
}

/**
 * Resets catalog to default factory data
 */
export async function resetCatalogToDefault() {
  memoryPosters = [...DEFAULT_POSTERS];
  memoryCategories = [...DEFAULT_CATEGORIES];
  memoryFranchises = [...DEFAULT_FRANCHISES];

  await idbSaveAllPosters(memoryPosters);
  await idbSetMetadata('categories', memoryCategories);
  await idbSetMetadata('franchises', memoryFranchises);

  writeLocalStorage(POSTERS_STORAGE_KEY, memoryPosters);
  writeLocalStorage(CATEGORIES_STORAGE_KEY, memoryCategories);
  writeLocalStorage(FRANCHISES_STORAGE_KEY, memoryFranchises);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('deco-catalog-updated'));
  }
  return {
    posters: memoryPosters,
    categories: memoryCategories,
    franchises: memoryFranchises
  };
}

/**
 * Exports catalog as JSON file for offline backup
 */
export function exportCatalogAsJSON() {
  const data = {
    exportedAt: new Date().toISOString(),
    version: '2.0.0',
    categories: getStoredCategories(),
    franchises: getStoredFranchises(),
    posters: getStoredPosters()
  };

  if (typeof document === 'undefined') return;

  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `deco-vintage-catalog-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Imports catalog from JSON file
 */
export async function importCatalogFromJSON(jsonString) {
  try {
    const data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    if (data.posters && Array.isArray(data.posters)) {
      await saveAllPosters(data.posters);
    }
    if (data.categories && Array.isArray(data.categories)) {
      await saveAllCategories(data.categories);
    }
    if (data.franchises && Array.isArray(data.franchises)) {
      await saveAllFranchises(data.franchises);
    }
    return { success: true, count: data.posters?.length || 0 };
  } catch (err) {
    console.error('Error importing JSON:', err);
    return { success: false, error: err.message };
  }
}
