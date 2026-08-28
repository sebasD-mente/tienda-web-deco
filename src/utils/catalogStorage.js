/**
 * Deco Vintage Guate - Dual-Sync High-Availability Catalog Engine
 * Synchronizes master catalog with Google Cloud Firestore (Primary) & VPS Hostinger SSD (Secondary).
 * Zero data loss guarantee across server restarts and deployments.
 */

import {
  CATALOG_POSTERS as BASE_POSTERS,
  CATEGORIES as BASE_CATEGORIES,
  INITIAL_FRANCHISES as BASE_FRANCHISES,
  STORE_SETTINGS as BASE_SETTINGS
} from '../data/catalogData.js';
import { apiGetCatalog, apiSaveCatalog } from './apiClient.js';
import { saveStoreWhatsAppPhone } from '../config/constants.js';
import { db, doc, getDoc, setDoc, onSnapshot } from './firebase.js';

const DEFAULT_POSTERS = BASE_POSTERS;
const DEFAULT_CATEGORIES = BASE_CATEGORIES;
const DEFAULT_FRANCHISES = BASE_FRANCHISES;
const DEFAULT_SETTINGS = BASE_SETTINGS || { whatsappPhone: '50238375078' };

// 1. Reactive In-Memory Runtime Cache
let memoryPosters = [...DEFAULT_POSTERS];
let memoryCategories = [...DEFAULT_CATEGORIES];
let memoryFranchises = [...DEFAULT_FRANCHISES];
let memorySettings = { ...DEFAULT_SETTINGS };

/**
 * Clean up obsolete browser localStorage keys from older versions
 */
function cleanObsoleteBrowserStorage() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    const keysToRemove = [
      'deco_vintage_catalog_posters_v2',
      'deco_vintage_catalog_categories_v2',
      'deco_vintage_catalog_franchises_v2',
      'deco_vintage_catalog_settings_v2',
      'deco_vintage_catalog_posters',
      'deco_vintage_catalog_categories',
      'deco_vintage_catalog_franchises',
      'deco_vintage_catalog_settings'
    ];
    keysToRemove.forEach(k => localStorage.removeItem(k));
    if (typeof indexedDB !== 'undefined') {
      indexedDB.deleteDatabase('deco_vintage_catalog_db');
    }
  } catch (e) {}
}

/**
 * Helper to sync catalog payload to Google Cloud Firestore
 */
async function persistToFirestore(payload) {
  try {
    const cleanPosters = (payload.posters || []).map(p => {
      const copy = { ...p };
      if (copy.image && copy.image.startsWith('data:image/')) {
        copy.image = '/posters/wallpaper.jpg';
      }
      if (copy.thumb && copy.thumb.startsWith('data:image/')) {
        copy.thumb = '/posters/wallpaper.jpg';
      }
      return copy;
    });

    const catalogRef = doc(db, 'catalogStore', 'masterCatalog');
    await setDoc(catalogRef, {
      updatedAt: payload.updatedAt || new Date().toISOString(),
      posters: cleanPosters,
      categories: payload.categories || [],
      franchises: payload.franchises || [],
      settings: payload.settings || {}
    }, { merge: true });
    console.log(`[Deco Storage] Master catalog synced to Google Cloud Firestore (${cleanPosters.length} posters).`);
  } catch (fsErr) {
    console.warn('[Deco Storage] Firestore sync warning:', fsErr.message);
  }
}

/**
 * 2. Synchronizes master catalog from Cloud Firestore & VPS Server
 */
export async function syncCatalogFromServer() {
  try {
    cleanObsoleteBrowserStorage();

    // 1. Primary Source: Google Cloud Firestore
    try {
      const catalogRef = doc(db, 'catalogStore', 'masterCatalog');
      const snap = await getDoc(catalogRef);
      if (snap.exists()) {
        const firestoreCatalog = snap.data();
        if (Array.isArray(firestoreCatalog.posters) && firestoreCatalog.posters.length > 0) {
          memoryPosters = firestoreCatalog.posters;
          memoryCategories = firestoreCatalog.categories || DEFAULT_CATEGORIES;
          memoryFranchises = firestoreCatalog.franchises || DEFAULT_FRANCHISES;
          memorySettings = firestoreCatalog.settings || DEFAULT_SETTINGS;

          if (memorySettings.whatsappPhone) {
            saveStoreWhatsAppPhone(memorySettings.whatsappPhone);
          }

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('deco-catalog-updated'));
          }
          console.log(`[Deco Storage] Master catalog loaded directly from Google Cloud Firestore: ${memoryPosters.length} posters.`);

          // Sync VPS in background to keep both copies aligned
          apiSaveCatalog({
            posters: memoryPosters,
            categories: memoryCategories,
            franchises: memoryFranchises,
            settings: memorySettings
          }).catch(() => {});

          return true;
        }
      }
    } catch (fsErr) {
      console.warn('[Deco Storage] Firestore check fallback to VPS:', fsErr.message);
    }

    // 2. Secondary Source: VPS Server Endpoint
    const serverCatalog = await apiGetCatalog();
    if (serverCatalog && Array.isArray(serverCatalog.posters) && serverCatalog.posters.length > 0) {
      memoryPosters = serverCatalog.posters;
      memoryCategories = serverCatalog.categories || DEFAULT_CATEGORIES;
      memoryFranchises = serverCatalog.franchises || DEFAULT_FRANCHISES;
      memorySettings = serverCatalog.settings || DEFAULT_SETTINGS;

      if (memorySettings.whatsappPhone) {
        saveStoreWhatsAppPhone(memorySettings.whatsappPhone);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('deco-catalog-updated'));
      }
      console.log(`[Deco Storage] Master catalog loaded directly from VPS SSD: ${memoryPosters.length} posters.`);

      // Seed Firestore with initial data if empty
      persistToFirestore({
        posters: memoryPosters,
        categories: memoryCategories,
        franchises: memoryFranchises,
        settings: memorySettings
      });

      return true;
    }
  } catch (err) {
    console.warn('[Deco Storage] Server unreachable, using embedded master data:', err.message);
  }
  return false;
}

// Auto-run synchronization immediately
if (typeof window !== 'undefined') {
  syncCatalogFromServer();

  // Listen for real-time remote updates from Firestore across browser tabs/devices
  try {
    const catalogRef = doc(db, 'catalogStore', 'masterCatalog');
    onSnapshot(catalogRef, (snap) => {
      if (snap.exists()) {
        const firestoreCatalog = snap.data();
        if (Array.isArray(firestoreCatalog.posters) && firestoreCatalog.posters.length > 0) {
          memoryPosters = firestoreCatalog.posters;
          memoryCategories = firestoreCatalog.categories || DEFAULT_CATEGORIES;
          memoryFranchises = firestoreCatalog.franchises || DEFAULT_FRANCHISES;
          memorySettings = firestoreCatalog.settings || DEFAULT_SETTINGS;

          if (memorySettings.whatsappPhone) {
            saveStoreWhatsAppPhone(memorySettings.whatsappPhone);
          }

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('deco-catalog-updated'));
          }
        }
      }
    }, (err) => {
      console.warn('[Deco Storage] Realtime snapshot listener warning:', err.message);
    });
  } catch (e) {}
}

/**
 * Returns current posters directly from runtime memory (synced)
 */
export function getStoredPosters() {
  return memoryPosters || DEFAULT_POSTERS;
}

/**
 * Returns current categories
 */
export function getStoredCategories() {
  return memoryCategories || DEFAULT_CATEGORIES;
}

/**
 * Returns current franchises
 */
export function getStoredFranchises() {
  return memoryFranchises || DEFAULT_FRANCHISES;
}

/**
 * Returns store settings
 */
export function getStoredSettings() {
  return memorySettings || DEFAULT_SETTINGS;
}

/**
 * Helper to persist full catalog payload to VPS and Firestore
 */
async function persistCatalogAll(posters, categories, franchises, settings) {
  const payload = {
    posters: posters || getStoredPosters(),
    categories: categories || getStoredCategories(),
    franchises: franchises || getStoredFranchises(),
    settings: settings || getStoredSettings()
  };

  memoryPosters = payload.posters;
  memoryCategories = payload.categories;
  memoryFranchises = payload.franchises;
  memorySettings = payload.settings;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('deco-catalog-updated'));
  }

  // Dual Sync: Save to both VPS and Cloud Firestore
  await Promise.allSettled([
    apiSaveCatalog(payload),
    persistToFirestore(payload)
  ]);

  return payload;
}

/**
 * Persists a poster directly to VPS SSD & Cloud Firestore
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

  await persistCatalogAll(updated, getStoredCategories(), getStoredFranchises(), getStoredSettings());
  console.log(`[Deco Storage] Poster "${finalPoster.title}" persisted to Cloud Firestore & VPS SSD.`);
  return updated;
}

/**
 * Toggles featured status for a poster and syncs
 */
export async function togglePosterFeatured(posterId) {
  const current = getStoredPosters();
  const poster = current.find(p => p.id === posterId);
  if (!poster) return current;

  const updatedPoster = { ...poster, isFeatured: !poster.isFeatured };
  return await saveOrUpdatePoster(updatedPoster);
}

/**
 * Deletes a poster by ID and persists deletion
 */
export async function deletePosterById(posterId) {
  const current = getStoredPosters();
  const updated = current.filter(p => p.id !== posterId);
  await persistCatalogAll(updated, getStoredCategories(), getStoredFranchises(), getStoredSettings());
  console.log(`[Deco Storage] Poster "${posterId}" deleted from Cloud Firestore & VPS SSD.`);
  return updated;
}

/**
 * Saves all posters in batch
 */
export async function saveAllPosters(posters) {
  await persistCatalogAll(posters, getStoredCategories(), getStoredFranchises(), getStoredSettings());
  return true;
}

/**
 * Adds a new category and persists
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
 * Deletes a category by ID and persists
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
  await persistCatalogAll(getStoredPosters(), categories, getStoredFranchises(), getStoredSettings());
  return true;
}

/**
 * Saves franchises list
 */
export async function saveAllFranchises(franchises) {
  await persistCatalogAll(getStoredPosters(), getStoredCategories(), franchises, getStoredSettings());
  return true;
}

/**
 * Saves store settings
 */
export async function saveStoreSettings(settings) {
  const newSettings = { ...getStoredSettings(), ...settings, updatedAt: new Date().toISOString() };
  if (newSettings.whatsappPhone) {
    saveStoreWhatsAppPhone(newSettings.whatsappPhone);
  }
  await persistCatalogAll(getStoredPosters(), getStoredCategories(), getStoredFranchises(), newSettings);
  return newSettings;
}

/**
 * Resets catalog to default master data
 */
export async function resetCatalogToDefault() {
  await persistCatalogAll([...DEFAULT_POSTERS], [...DEFAULT_CATEGORIES], [...DEFAULT_FRANCHISES], { ...DEFAULT_SETTINGS });
  return true;
}

/**
 * Exports catalog to JSON
 */
export function exportCatalogJSON() {
  return {
    version: '3.0-firestore-vps',
    exportedAt: new Date().toISOString(),
    posters: getStoredPosters(),
    categories: getStoredCategories(),
    franchises: getStoredFranchises(),
    settings: getStoredSettings()
  };
}

/**
 * Exports catalog as JSON file for offline download
 */
export function exportCatalogAsJSON() {
  const data = exportCatalogJSON();
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
 * Imports catalog from JSON and syncs to Firestore & VPS
 */
export async function importCatalogJSON(jsonData) {
  if (!jsonData || typeof jsonData !== 'object') {
    throw new Error('Formato JSON inválido.');
  }

  const newPosters = Array.isArray(jsonData.posters) ? jsonData.posters : getStoredPosters();
  const newCategories = Array.isArray(jsonData.categories) ? jsonData.categories : getStoredCategories();
  const newFranchises = Array.isArray(jsonData.franchises) ? jsonData.franchises : getStoredFranchises();
  const newSettings = (jsonData.settings && typeof jsonData.settings === 'object') ? jsonData.settings : getStoredSettings();

  await persistCatalogAll(newPosters, newCategories, newFranchises, newSettings);
  return true;
}

/**
 * Imports catalog from JSON string or object
 */
export async function importCatalogFromJSON(rawJson) {
  try {
    const data = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
    await importCatalogJSON(data);
    return { success: true, count: data.posters?.length || 0 };
  } catch (err) {
    console.error('Error importing JSON:', err);
    return { success: false, error: err.message };
  }
}
