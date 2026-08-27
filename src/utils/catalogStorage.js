import {
  CATALOG_POSTERS as BASE_POSTERS,
  CATEGORIES as BASE_CATEGORIES,
  INITIAL_FRANCHISES as BASE_FRANCHISES
} from '../data/catalogData.js';
import { db, doc, setDoc, onSnapshot } from './firebase.js';

const DEFAULT_POSTERS = BASE_POSTERS;
const DEFAULT_CATEGORIES = BASE_CATEGORIES;
const DEFAULT_FRANCHISES = BASE_FRANCHISES;

const POSTERS_STORAGE_KEY = 'deco_vintage_catalog_posters_v2';
const CATEGORIES_STORAGE_KEY = 'deco_vintage_catalog_categories_v2';
const FRANCHISES_STORAGE_KEY = 'deco_vintage_catalog_franchises_v2';

// 1. Initialize Real-Time Cloud Firestore Listener with Offline Fail-Safe
if (typeof window !== 'undefined') {
  try {
    const catalogDocRef = doc(db, 'deco_store', 'catalog');
    
    onSnapshot(catalogDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        let changed = false;

        if (Array.isArray(data.posters) && data.posters.length > 0) {
          localStorage.setItem(POSTERS_STORAGE_KEY, JSON.stringify(data.posters));
          changed = true;
        }
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(data.categories));
          changed = true;
        }
        if (Array.isArray(data.franchises) && data.franchises.length > 0) {
          localStorage.setItem(FRANCHISES_STORAGE_KEY, JSON.stringify(data.franchises));
          changed = true;
        }

        if (changed) {
          window.dispatchEvent(new Event('deco-catalog-updated'));
          console.log(`[Deco Cloud Firestore] Real-time cloud sync updated: ${data.posters?.length || 0} posters.`);
        }
      } else {
        // Auto-seed initial catalog to Cloud Firestore on first run
        const currentPosters = getStoredPosters();
        const currentCategories = getStoredCategories();
        const currentFranchises = getStoredFranchises();
        
        setDoc(catalogDocRef, {
          posters: currentPosters.length > 0 ? currentPosters : DEFAULT_POSTERS,
          categories: currentCategories.length > 0 ? currentCategories : DEFAULT_CATEGORIES,
          franchises: currentFranchises.length > 0 ? currentFranchises : DEFAULT_FRANCHISES,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(() => {});
      }
    }, (err) => {
      console.debug('[Deco Storage] Firestore listener running in offline fallback mode:', err.message);
    });
  } catch (e) {
    console.debug('[Deco Storage] Firestore init fallback:', e.message);
  }
}

// Synchronize with Physical SSD Disk on startup (Dev mode)
export async function syncCatalogWithDisk() {
  if (typeof window === 'undefined' || typeof fetch === 'undefined') return null;
  try {
    const res = await fetch('/api/catalog');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.posters) && data.posters.length > 0) {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(POSTERS_STORAGE_KEY, JSON.stringify(data.posters));
          if (Array.isArray(data.categories) && data.categories.length > 0) {
            localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(data.categories));
          }
          if (Array.isArray(data.franchises) && data.franchises.length > 0) {
            localStorage.setItem(FRANCHISES_STORAGE_KEY, JSON.stringify(data.franchises));
          }
        }
        window.dispatchEvent(new Event('deco-catalog-updated'));
        console.log(`[Deco Storage] Synchronized ${data.posters.length} posters from physical disk.`);
        return {
          posters: data.posters,
          categories: data.categories,
          franchises: data.franchises || DEFAULT_FRANCHISES
        };
      }
    }
  } catch (err) {
    console.debug('[Deco Storage] Running in cloud static mode:', err.message);
  }
  return null;
}

// Auto-run disk synchronization or initial cache migration on load
if (typeof window !== 'undefined') {
  syncCatalogWithDisk();
}

export function getStoredPosters() {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(POSTERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= DEFAULT_POSTERS.length) {
          return parsed;
        }
      }
      localStorage.setItem(POSTERS_STORAGE_KEY, JSON.stringify(DEFAULT_POSTERS));
    }
  } catch (e) {
    console.error('Error reading stored posters from localStorage:', e);
  }
  return DEFAULT_POSTERS;
}

export function getStoredCategories() {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= DEFAULT_CATEGORIES.length) {
          return parsed;
        }
      }
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(DEFAULT_CATEGORIES));
    }
  } catch (e) {
    console.error('Error reading stored categories from localStorage:', e);
  }
  return DEFAULT_CATEGORIES;
}

export function getStoredFranchises() {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(FRANCHISES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= DEFAULT_FRANCHISES.length) {
          return parsed;
        }
      }
      localStorage.setItem(FRANCHISES_STORAGE_KEY, JSON.stringify(DEFAULT_FRANCHISES));
    }
  } catch (e) {
    console.error('Error reading stored franchises from localStorage:', e);
  }
  return DEFAULT_FRANCHISES;
}

/**
 * Persists cloud and local database with instant UI updates
 */
async function syncToCloudAndDisk(posters, categories, franchises) {
  // 1. Cloud Firestore Real-Time Write
  try {
    const catalogDocRef = doc(db, 'deco_store', 'catalog');
    setDoc(catalogDocRef, {
      posters: posters || getStoredPosters(),
      categories: categories || getStoredCategories(),
      franchises: franchises || getStoredFranchises(),
      updatedAt: new Date().toISOString()
    }, { merge: true }).catch((err) => {
      console.debug('[Deco Firestore] Cloud write background queued/offline:', err.message);
    });
  } catch (cloudErr) {
    console.debug('[Deco Firestore] Cloud sync queued:', cloudErr.message);
  }

  // 2. Physical Local Disk Write (When running on Vite dev server)
  try {
    if (typeof fetch !== 'undefined') {
      await fetch('/api/catalog/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          posters: posters || getStoredPosters(), 
          categories: categories || getStoredCategories(), 
          franchises: franchises || getStoredFranchises() 
        })
      });
    }
  } catch (apiErr) {
    // Normal in production static hosting
  }
}

/**
 * Persists posters array both to cloud database and local storage
 */
export async function saveAllPosters(posters) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(POSTERS_STORAGE_KEY, JSON.stringify(posters));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('deco-catalog-updated'));
    }

    await syncToCloudAndDisk(posters, null, null);
    return true;
  } catch (e) {
    console.error('Error saving posters:', e);
    return false;
  }
}

/**
 * Persists categories array both to cloud database and local storage
 */
export async function saveAllCategories(categories) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('deco-catalog-updated'));
    }

    await syncToCloudAndDisk(null, categories, null);
    return true;
  } catch (e) {
    console.error('Error saving categories:', e);
    return false;
  }
}

/**
 * Persists franchises array both to cloud database and local storage
 */
export async function saveAllFranchises(franchises) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(FRANCHISES_STORAGE_KEY, JSON.stringify(franchises));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('deco-catalog-updated'));
    }

    await syncToCloudAndDisk(null, null, franchises);
    return true;
  } catch (e) {
    console.error('Error saving franchises:', e);
    return false;
  }
}

/**
 * Uploads an image base64 dataUrl to the physical disk server or cloud
 */
export async function uploadImageFileToDisk(dataUrl, fileName = 'poster', posterId = '') {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return { image: dataUrl, thumb: dataUrl };
  }

  try {
    if (typeof fetch !== 'undefined') {
      const res = await fetch('/api/catalog/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl, fileName, posterId })
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.image) {
          return { image: result.image, thumb: result.thumb || result.image };
        }
      }
    }
  } catch (err) {
    console.debug('[Deco Storage] Image upload fallback to direct dataUrl:', err);
  }

  return { image: dataUrl, thumb: dataUrl };
}

/**
 * Creates or updates a poster, automatically persisting to Firestore in real time
 */
export async function saveOrUpdatePoster(posterData) {
  let finalPoster = { ...posterData };

  if (finalPoster.image && finalPoster.image.startsWith('data:image/')) {
    const uploaded = await uploadImageFileToDisk(finalPoster.image, finalPoster.title, finalPoster.id);
    finalPoster.image = uploaded.image;
    finalPoster.thumb = uploaded.thumb;
  }

  const current = getStoredPosters();
  const index = current.findIndex(p => p.id === finalPoster.id);

  let updated;
  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...updated[index], ...finalPoster };
  } else {
    updated = [finalPoster, ...current];
  }

  await saveAllPosters(updated);
  return updated;
}

export async function togglePosterFeatured(posterId) {
  const current = getStoredPosters();
  const updated = current.map(p => p.id === posterId ? { ...p, isFeatured: !p.isFeatured } : p);
  await saveAllPosters(updated);
  return updated;
}

export async function deletePosterById(posterId) {
  const current = getStoredPosters();
  const updated = current.filter(p => p.id !== posterId);
  await saveAllPosters(updated);
  return updated;
}

export async function addNewCategory(newCat) {
  const current = getStoredCategories();
  if (current.some(c => c.id === newCat.id)) {
    return current;
  }
  const updated = [...current, newCat];
  await saveAllCategories(updated);
  return updated;
}

export async function deleteCategoryById(categoryId) {
  const current = getStoredCategories();
  const updated = current.filter(c => c.id !== categoryId);
  await saveAllCategories(updated);
  return updated;
}

export async function resetCatalogToDefault() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(POSTERS_STORAGE_KEY);
    localStorage.removeItem(CATEGORIES_STORAGE_KEY);
    localStorage.removeItem(FRANCHISES_STORAGE_KEY);
  }

  await saveAllPosters(DEFAULT_POSTERS);
  await saveAllCategories(DEFAULT_CATEGORIES);
  await saveAllFranchises(DEFAULT_FRANCHISES);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('deco-catalog-updated'));
  }
  return {
    posters: DEFAULT_POSTERS,
    categories: DEFAULT_CATEGORIES,
    franchises: DEFAULT_FRANCHISES
  };
}

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
