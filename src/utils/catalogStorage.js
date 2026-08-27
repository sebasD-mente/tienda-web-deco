import {
  CATALOG_POSTERS as BASE_POSTERS,
  CATEGORIES as BASE_CATEGORIES,
  INITIAL_FRANCHISES as BASE_FRANCHISES
} from '../data/catalogData.js';
import { db, collection, doc, setDoc, deleteDoc, onSnapshot, getDocs } from './firebase.js';

const DEFAULT_POSTERS = BASE_POSTERS;
const DEFAULT_CATEGORIES = BASE_CATEGORIES;
const DEFAULT_FRANCHISES = BASE_FRANCHISES;

const POSTERS_STORAGE_KEY = 'deco_vintage_catalog_posters_v2';
const CATEGORIES_STORAGE_KEY = 'deco_vintage_catalog_categories_v2';
const FRANCHISES_STORAGE_KEY = 'deco_vintage_catalog_franchises_v2';

const isLocalServer = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// 1. Initialize Real-Time Cloud Firestore Listeners (Collection Architecture)
if (typeof window !== 'undefined') {
  try {
    const postersCollectionRef = collection(db, 'deco_posters');
    const metadataDocRef = doc(db, 'deco_store', 'metadata');

    // A. Listen to Posters Collection (Each poster is an individual document < 100 KB)
    onSnapshot(postersCollectionRef, (snapshot) => {
      if (!snapshot.empty) {
        const cloudPosters = [];
        snapshot.forEach((docSnap) => {
          cloudPosters.push(docSnap.data());
        });

        if (cloudPosters.length > 0) {
          try {
            localStorage.setItem(POSTERS_STORAGE_KEY, JSON.stringify(cloudPosters));
          } catch (e) {
            console.warn('[Deco Storage] LocalStorage cache notice:', e);
          }
          window.dispatchEvent(new Event('deco-catalog-updated'));
          console.log(`[Deco Cloud Firestore] Real-time collection sync: ${cloudPosters.length} posters active.`);
        }
      } else {
        // Auto-seed initial catalog to Cloud Firestore collection if empty
        const currentPosters = getStoredPosters();
        const seedList = currentPosters.length > 0 ? currentPosters : DEFAULT_POSTERS;
        
        seedList.forEach((poster) => {
          setDoc(doc(db, 'deco_posters', poster.id), poster, { merge: true }).catch(() => {});
        });
        console.log(`[Deco Cloud Firestore] Initial seeding of ${seedList.length} posters to cloud collection.`);
      }
    }, (err) => {
      console.debug('[Deco Storage] Posters listener fallback:', err.message);
    });

    // B. Listen to Categories & Franchises Metadata
    onSnapshot(metadataDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        let changed = false;

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
        }
      } else {
        // Seed initial metadata
        setDoc(metadataDocRef, {
          categories: getStoredCategories(),
          franchises: getStoredFranchises(),
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(() => {});
      }
    }, (err) => {
      console.debug('[Deco Storage] Metadata listener fallback:', err.message);
    });

  } catch (e) {
    console.debug('[Deco Storage] Firestore init fallback:', e.message);
  }
}

// Synchronize with Physical SSD Disk on startup (Dev mode only)
export async function syncCatalogWithDisk() {
  if (!isLocalServer || typeof fetch === 'undefined') return null;
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

if (typeof window !== 'undefined' && isLocalServer) {
  syncCatalogWithDisk();
}

export function getStoredPosters() {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(POSTERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
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
        if (Array.isArray(parsed) && parsed.length > 0) {
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
        if (Array.isArray(parsed) && parsed.length > 0) {
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
 * Uploads an image base64 dataUrl to the physical disk server (dev mode only)
 */
export async function uploadImageFileToDisk(dataUrl, fileName = 'poster', posterId = '') {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return { image: dataUrl, thumb: dataUrl };
  }

  if (isLocalServer) {
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
  }

  return { image: dataUrl, thumb: dataUrl };
}

/**
 * Creates or updates a poster, automatically persisting individual document to Firestore
 */
export async function saveOrUpdatePoster(posterData) {
  let finalPoster = { ...posterData };

  if (isLocalServer && finalPoster.image && finalPoster.image.startsWith('data:image/')) {
    const uploaded = await uploadImageFileToDisk(finalPoster.image, finalPoster.title, finalPoster.id);
    finalPoster.image = uploaded.image;
    finalPoster.thumb = uploaded.thumb;
  }

  // 1. Update local cache immediately
  const current = getStoredPosters();
  const index = current.findIndex(p => p.id === finalPoster.id);

  let updated;
  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...updated[index], ...finalPoster };
  } else {
    updated = [finalPoster, ...current];
  }

  try {
    localStorage.setItem(POSTERS_STORAGE_KEY, JSON.stringify(updated));
  } catch (quotaErr) {
    console.warn('[Deco Storage] LocalStorage quota notice:', quotaErr);
  }
  window.dispatchEvent(new Event('deco-catalog-updated'));

  // 2. Persist individual poster document to Firestore (~40 KB)
  try {
    const posterDocRef = doc(db, 'deco_posters', finalPoster.id);
    await setDoc(posterDocRef, finalPoster, { merge: true });
    console.log(`[Deco Cloud Firestore] Poster "${finalPoster.title}" saved to cloud.`);
  } catch (cloudErr) {
    console.error('[Deco Cloud Firestore] Error saving poster to cloud:', cloudErr);
  }

  // 3. Physical Local Disk Write (dev mode only)
  if (isLocalServer) {
    try {
      await fetch('/api/catalog/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          posters: updated, 
          categories: getStoredCategories(), 
          franchises: getStoredFranchises() 
        })
      });
    } catch (apiErr) {}
  }

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
 * Deletes a poster by ID from both local storage and Cloud Firestore
 */
export async function deletePosterById(posterId) {
  const current = getStoredPosters();
  const updated = current.filter(p => p.id !== posterId);

  try {
    localStorage.setItem(POSTERS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {}
  window.dispatchEvent(new Event('deco-catalog-updated'));

  // Delete from Cloud Firestore collection
  try {
    const posterDocRef = doc(db, 'deco_posters', posterId);
    await deleteDoc(posterDocRef);
    console.log(`[Deco Cloud Firestore] Poster "${posterId}" deleted from cloud.`);
  } catch (cloudErr) {
    console.error('[Deco Cloud Firestore] Error deleting poster from cloud:', cloudErr);
  }

  if (isLocalServer) {
    try {
      await fetch('/api/catalog/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          posters: updated, 
          categories: getStoredCategories(), 
          franchises: getStoredFranchises() 
        })
      });
    } catch (apiErr) {}
  }

  return updated;
}

/**
 * Persists all posters in batch
 */
export async function saveAllPosters(posters) {
  try {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(POSTERS_STORAGE_KEY, JSON.stringify(posters));
      } catch (quotaErr) {
        console.warn('[Deco Storage] LocalStorage quota notice:', quotaErr);
      }
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('deco-catalog-updated'));
    }

    // Persist each poster to Firestore collection
    for (const poster of posters) {
      const posterDocRef = doc(db, 'deco_posters', poster.id);
      setDoc(posterDocRef, poster, { merge: true }).catch(() => {});
    }

    return true;
  } catch (e) {
    console.error('Error saving posters batch:', e);
    return false;
  }
}

/**
 * Adds a new category and syncs to metadata document
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

    const metadataDocRef = doc(db, 'deco_store', 'metadata');
    await setDoc(metadataDocRef, { categories, updatedAt: new Date().toISOString() }, { merge: true });
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

    const metadataDocRef = doc(db, 'deco_store', 'metadata');
    await setDoc(metadataDocRef, { franchises, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (e) {
    console.error('Error saving franchises:', e);
    return false;
  }
}

/**
 * Restores initial factory default data
 */
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
