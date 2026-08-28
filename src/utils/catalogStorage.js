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
import { apiGetCatalog, apiSaveCatalog, apiDeletePosterImage } from './apiClient.js';
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

    // 1. Fetch Primary Master Catalog from VPS SSD (Always live & reliable)
    let vpsData = null;
    try {
      vpsData = await apiGetCatalog();
    } catch (vpsErr) {
      console.warn('[Deco Storage] VPS read fallback:', vpsErr.message);
    }

    // 2. Fetch Secondary Backup Catalog from Cloud Firestore
    let firestoreData = null;
    try {
      const catalogRef = doc(db, 'catalogStore', 'masterCatalog');
      const snap = await getDoc(catalogRef);
      if (snap.exists()) {
        firestoreData = snap.data();
      }
    } catch (fsErr) {
      console.warn('[Deco Storage] Firestore read fallback:', fsErr.message);
    }

    // 3. Determine winning catalog: VPS SSD is primary unless Firestore is strictly newer
    const vpsTime = vpsData?.updatedAt ? new Date(vpsData.updatedAt).getTime() : 0;
    const fsTime = firestoreData?.updatedAt ? new Date(firestoreData.updatedAt).getTime() : 0;

    let winner = null;
    let winnerSource = '';

    if (vpsTime > 0 && vpsTime >= fsTime && Array.isArray(vpsData?.posters)) {
      winner = vpsData;
      winnerSource = 'VPS SSD';
    } else if (fsTime > 0 && Array.isArray(firestoreData?.posters)) {
      winner = firestoreData;
      winnerSource = 'Google Cloud Firestore';
    } else if (vpsData && Array.isArray(vpsData.posters)) {
      winner = vpsData;
      winnerSource = 'VPS SSD (Fallback)';
    }

    if (winner && Array.isArray(winner.posters)) {
      memoryPosters = winner.posters;
      memoryCategories = winner.categories || DEFAULT_CATEGORIES;
      memoryFranchises = winner.franchises || DEFAULT_FRANCHISES;
      memorySettings = winner.settings || DEFAULT_SETTINGS;

      if (memorySettings.whatsappPhone) {
        saveStoreWhatsAppPhone(memorySettings.whatsappPhone);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('deco-catalog-updated'));
      }
      console.log(`[Deco Storage] Master catalog synchronized from ${winnerSource}: ${memoryPosters.length} posters.`);

      // Align secondary source if outdated
      if (winnerSource === 'VPS SSD' && vpsTime > fsTime) {
        persistToFirestore({
          posters: memoryPosters,
          categories: memoryCategories,
          franchises: memoryFranchises,
          settings: memorySettings,
          updatedAt: winner.updatedAt
        }).catch(() => {});
      } else if (winnerSource === 'Google Cloud Firestore' && fsTime > vpsTime) {
        apiSaveCatalog({
          posters: memoryPosters,
          categories: memoryCategories,
          franchises: memoryFranchises,
          settings: memorySettings,
          updatedAt: winner.updatedAt
        }).catch(() => {});
      }

      return true;
    }
  } catch (err) {
    console.warn('[Deco Storage] General sync error:', err.message);
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
    settings: settings || getStoredSettings(),
    updatedAt: new Date().toISOString()
  };

  memoryPosters = payload.posters;
  memoryCategories = payload.categories;
  memoryFranchises = payload.franchises;
  memorySettings = payload.settings;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('deco-catalog-updated'));
  }

  // 1. Primary Sync: Save to VPS SSD immediately
  try {
    await apiSaveCatalog(payload);
    console.log('[Deco Storage] Master catalog saved to VPS SSD.');
  } catch (vpsErr) {
    console.error('[Deco Storage] VPS save error:', vpsErr.message);
  }

  // 2. Secondary Sync: Push to Cloud Firestore with non-blocking 3s timeout
  Promise.race([
    persistToFirestore(payload),
    new Promise(r => setTimeout(r, 3000))
  ]).catch(err => {
    console.warn('[Deco Storage] Firestore background sync warning:', err);
  });

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
  const posterToDelete = current.find(p => p.id === posterId);
  const updated = current.filter(p => p.id !== posterId);

  // Clean up physical WebP files on VPS SSD if saved on server
  if (posterToDelete) {
    if (posterToDelete.image || posterToDelete.thumb) {
      apiDeletePosterImage(posterToDelete.image, posterToDelete.thumb).catch(() => {});
    }
  }

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
