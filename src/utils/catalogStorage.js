/**
 * Deco Vintage Guate - 100% Pure Server-First Catalog Engine
 * Directly communicates with VPS Hostinger SSD (/api/catalog).
 * Zero dependency on browser localStorage or IndexedDB for catalog data.
 */

import {
  CATALOG_POSTERS as BASE_POSTERS,
  CATEGORIES as BASE_CATEGORIES,
  INITIAL_FRANCHISES as BASE_FRANCHISES,
  STORE_SETTINGS as BASE_SETTINGS
} from '../data/catalogData.js';
import { apiGetCatalog, apiSaveCatalog } from './apiClient.js';
import { saveStoreWhatsAppPhone } from '../config/constants.js';

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
 * 2. Fetches the master catalog directly from the VPS server (100 GB SSD)
 */
export async function syncCatalogFromServer() {
  try {
    cleanObsoleteBrowserStorage();

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
      return true;
    }
  } catch (err) {
    console.warn('[Deco Storage] VPS server unreachable, using embedded master data:', err.message);
  }
  return false;
}

// Auto-run synchronization immediately
if (typeof window !== 'undefined') {
  syncCatalogFromServer();
}

/**
 * Returns current posters directly from runtime memory (server synced)
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
 * Persists a poster directly to the VPS SSD server
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

  // 1. Update runtime memory
  memoryPosters = updated;

  // 2. Dispatch UI update
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('deco-catalog-updated'));
  }

  // 3. Persist directly to VPS SSD Server
  try {
    await apiSaveCatalog({
      posters: updated,
      categories: getStoredCategories(),
      franchises: getStoredFranchises(),
      settings: getStoredSettings()
    });
    console.log(`[Deco Storage] Poster "${finalPoster.title}" persisted on VPS SSD.`);
    return updated;
  } catch (apiErr) {
    console.error('[Deco Storage] Error saving poster to VPS server:', apiErr);
    throw apiErr;
  }
}

/**
 * Toggles featured status for a poster and syncs with VPS
 */
export async function togglePosterFeatured(posterId) {
  const current = getStoredPosters();
  const poster = current.find(p => p.id === posterId);
  if (!poster) return current;

  const updatedPoster = { ...poster, isFeatured: !poster.isFeatured };
  return await saveOrUpdatePoster(updatedPoster);
}

/**
 * Deletes a poster by ID and persists deletion directly on the VPS SSD
 */
export async function deletePosterById(posterId) {
  const current = getStoredPosters();
  const updated = current.filter(p => p.id !== posterId);

  memoryPosters = updated;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('deco-catalog-updated'));
  }

  try {
    await apiSaveCatalog({
      posters: updated,
      categories: getStoredCategories(),
      franchises: getStoredFranchises(),
      settings: getStoredSettings()
    });
    console.log(`[Deco Storage] Poster "${posterId}" deleted from VPS SSD.`);
    return updated;
  } catch (apiErr) {
    console.error('[Deco Storage] Error deleting from VPS server:', apiErr);
    throw apiErr;
  }
}

/**
 * Saves all posters in batch directly to the VPS
 */
export async function saveAllPosters(posters) {
  memoryPosters = posters;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('deco-catalog-updated'));
  }

  await apiSaveCatalog({
    posters,
    categories: getStoredCategories(),
    franchises: getStoredFranchises(),
    settings: getStoredSettings()
  });

  return true;
}

/**
 * Adds a new category and persists directly to the VPS
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
 * Deletes a category by ID and persists directly to the VPS
 */
export async function deleteCategoryById(categoryId) {
  const current = getStoredCategories();
  const updated = current.filter(c => c.id !== categoryId);
  await saveAllCategories(updated);
  return updated;
}

/**
 * Saves categories list directly to the VPS
 */
export async function saveAllCategories(categories) {
  memoryCategories = categories;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('deco-catalog-updated'));
  }

  await apiSaveCatalog({
    posters: getStoredPosters(),
    categories,
    franchises: getStoredFranchises(),
    settings: getStoredSettings()
  });

  return true;
}

/**
 * Saves franchises list directly to the VPS
 */
export async function saveAllFranchises(franchises) {
  memoryFranchises = franchises;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('deco-catalog-updated'));
  }

  await apiSaveCatalog({
    posters: getStoredPosters(),
    categories: getStoredCategories(),
    franchises,
    settings: getStoredSettings()
  });

  return true;
}

/**
 * Saves store settings directly to the VPS
 */
export async function saveStoreSettings(settings) {
  memorySettings = { ...getStoredSettings(), ...settings, updatedAt: new Date().toISOString() };

  if (memorySettings.whatsappPhone) {
    saveStoreWhatsAppPhone(memorySettings.whatsappPhone);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('deco-catalog-updated'));
  }

  await apiSaveCatalog({
    posters: getStoredPosters(),
    categories: getStoredCategories(),
    franchises: getStoredFranchises(),
    settings: memorySettings
  });

  return memorySettings;
}

/**
 * Resets catalog to default master data
 */
export async function resetCatalogToDefault() {
  memoryPosters = [...DEFAULT_POSTERS];
  memoryCategories = [...DEFAULT_CATEGORIES];
  memoryFranchises = [...DEFAULT_FRANCHISES];
  memorySettings = { ...DEFAULT_SETTINGS };

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('deco-catalog-updated'));
  }

  await apiSaveCatalog({
    posters: memoryPosters,
    categories: memoryCategories,
    franchises: memoryFranchises,
    settings: memorySettings
  });

  return true;
}

/**
 * Exports catalog to JSON
 */
export function exportCatalogJSON() {
  return {
    version: '2.0-vps',
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
 * Imports catalog from JSON and syncs directly to the VPS
 */
export async function importCatalogJSON(jsonData) {
  if (!jsonData || typeof jsonData !== 'object') {
    throw new Error('Formato JSON inválido.');
  }

  const newPosters = Array.isArray(jsonData.posters) ? jsonData.posters : getStoredPosters();
  const newCategories = Array.isArray(jsonData.categories) ? jsonData.categories : getStoredCategories();
  const newFranchises = Array.isArray(jsonData.franchises) ? jsonData.franchises : getStoredFranchises();
  const newSettings = (jsonData.settings && typeof jsonData.settings === 'object') ? jsonData.settings : getStoredSettings();

  memoryPosters = newPosters;
  memoryCategories = newCategories;
  memoryFranchises = newFranchises;
  memorySettings = newSettings;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('deco-catalog-updated'));
  }

  await apiSaveCatalog({
    posters: newPosters,
    categories: newCategories,
    franchises: newFranchises,
    settings: newSettings
  });

  return true;
}

/**
 * Imports catalog from JSON string or object and syncs directly to the VPS
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
