import {
  CATALOG_POSTERS as BASE_POSTERS,
  CATEGORIES as BASE_CATEGORIES,
  INITIAL_FRANCHISES as BASE_FRANCHISES
} from '../data/catalogData';

const POSTERS_STORAGE_KEY = 'deco_vintage_catalog_posters_v1';
const CATEGORIES_STORAGE_KEY = 'deco_vintage_catalog_categories_v1';
const FRANCHISES_STORAGE_KEY = 'deco_vintage_catalog_franchises_v1';

// Synchronize with Physical SSD Disk on startup
export async function syncCatalogWithDisk() {
  try {
    const res = await fetch('/api/catalog');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.posters) && data.posters.length > 0) {
        localStorage.setItem(POSTERS_STORAGE_KEY, JSON.stringify(data.posters));
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(data.categories));
        }
        if (Array.isArray(data.franchises) && data.franchises.length > 0) {
          localStorage.setItem(FRANCHISES_STORAGE_KEY, JSON.stringify(data.franchises));
        }
        window.dispatchEvent(new Event('deco-catalog-updated'));
        console.log(`[Deco Storage] Synchronized ${data.posters.length} posters from physical disk.`);
        return {
          posters: data.posters,
          categories: data.categories,
          franchises: data.franchises || BASE_FRANCHISES
        };
      }
    }
  } catch (err) {
    console.warn('[Deco Storage] Running in client-only/offline mode:', err.message);
  }
  return null;
}

// Auto-run disk synchronization on load
if (typeof window !== 'undefined') {
  syncCatalogWithDisk();
}

export function getStoredPosters() {
  try {
    const saved = localStorage.getItem(POSTERS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading stored posters from localStorage:', e);
  }
  return BASE_POSTERS;
}

export function getStoredCategories() {
  try {
    const saved = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading stored categories from localStorage:', e);
  }
  return BASE_CATEGORIES;
}

export function getStoredFranchises() {
  try {
    const saved = localStorage.getItem(FRANCHISES_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading stored franchises from localStorage:', e);
  }
  return BASE_FRANCHISES;
}

/**
 * Persists posters array both to local storage and physical disk on SSD
 */
export async function saveAllPosters(posters) {
  try {
    // 1. Instant local sync
    localStorage.setItem(POSTERS_STORAGE_KEY, JSON.stringify(posters));
    window.dispatchEvent(new Event('deco-catalog-updated'));

    // 2. Physical SSD disk persistence
    try {
      const categories = getStoredCategories();
      const franchises = getStoredFranchises();
      await fetch('/api/catalog/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posters, categories, franchises })
      });
    } catch (apiErr) {
      console.warn('[Deco Storage] Physical disk save failed or running static:', apiErr);
    }

    return true;
  } catch (e) {
    console.error('Error saving posters:', e);
    return false;
  }
}

/**
 * Persists categories array both to local storage and physical disk on SSD
 */
export async function saveAllCategories(categories) {
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    window.dispatchEvent(new Event('deco-catalog-updated'));

    try {
      const posters = getStoredPosters();
      const franchises = getStoredFranchises();
      await fetch('/api/catalog/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posters, categories, franchises })
      });
    } catch (apiErr) {
      console.warn('[Deco Storage] Physical disk save failed or running static:', apiErr);
    }

    return true;
  } catch (e) {
    console.error('Error saving categories:', e);
    return false;
  }
}

/**
 * Persists franchises array both to local storage and physical disk on SSD
 */
export async function saveAllFranchises(franchises) {
  try {
    localStorage.setItem(FRANCHISES_STORAGE_KEY, JSON.stringify(franchises));
    window.dispatchEvent(new Event('deco-catalog-updated'));

    try {
      const posters = getStoredPosters();
      const categories = getStoredCategories();
      await fetch('/api/catalog/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posters, categories, franchises })
      });
    } catch (apiErr) {
      console.warn('[Deco Storage] Physical disk save failed or running static:', apiErr);
    }

    return true;
  } catch (e) {
    console.error('Error saving franchises:', e);
    return false;
  }
}

/**
 * Uploads an image base64 dataUrl to the physical disk server
 * Returns lightweight, permanent static URLs
 */
export async function uploadImageFileToDisk(dataUrl, fileName = 'poster', posterId = '') {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return { image: dataUrl, thumb: dataUrl };
  }

  try {
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
  } catch (err) {
    console.warn('[Deco Storage] Image upload to disk fallback:', err);
  }

  return { image: dataUrl, thumb: dataUrl };
}

/**
 * Creates or updates a poster, automatically persisting images to disk
 */
export async function saveOrUpdatePoster(posterData) {
  let finalPoster = { ...posterData };

  // If image is a Base64 data string, upload it to permanent SSD storage first
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
  localStorage.removeItem(POSTERS_STORAGE_KEY);
  localStorage.removeItem(CATEGORIES_STORAGE_KEY);

  await saveAllPosters(BASE_POSTERS);
  await saveAllCategories(BASE_CATEGORIES);

  window.dispatchEvent(new Event('deco-catalog-updated'));
  return {
    posters: BASE_POSTERS,
    categories: BASE_CATEGORIES
  };
}

export function exportCatalogAsJSON() {
  const data = {
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    categories: getStoredCategories(),
    posters: getStoredPosters()
  };

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
    const data = JSON.parse(jsonString);
    if (data.posters && Array.isArray(data.posters)) {
      await saveAllPosters(data.posters);
    }
    if (data.categories && Array.isArray(data.categories)) {
      await saveAllCategories(data.categories);
    }
    return { success: true, count: data.posters?.length || 0 };
  } catch (err) {
    console.error('Error importing JSON:', err);
    return { success: false, error: err.message };
  }
}
