import { CATALOG_POSTERS as BASE_POSTERS, CATEGORIES as BASE_CATEGORIES } from '../data/catalogData';

const POSTERS_STORAGE_KEY = 'deco_vintage_catalog_posters_v1';
const CATEGORIES_STORAGE_KEY = 'deco_vintage_catalog_categories_v1';

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
    console.error('Error reading stored posters:', e);
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
    console.error('Error reading stored categories:', e);
  }
  return BASE_CATEGORIES;
}

export function saveAllPosters(posters) {
  try {
    localStorage.setItem(POSTERS_STORAGE_KEY, JSON.stringify(posters));
    // Trigger custom event for reactive updates in app
    window.dispatchEvent(new Event('deco-catalog-updated'));
    return true;
  } catch (e) {
    console.error('Error saving posters to localStorage:', e);
    return false;
  }
}

export function saveAllCategories(categories) {
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    window.dispatchEvent(new Event('deco-catalog-updated'));
    return true;
  } catch (e) {
    console.error('Error saving categories to localStorage:', e);
    return false;
  }
}

export function saveOrUpdatePoster(posterData) {
  const current = getStoredPosters();
  const index = current.findIndex(p => p.id === posterData.id);

  let updated;
  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...updated[index], ...posterData };
  } else {
    updated = [posterData, ...current];
  }

  saveAllPosters(updated);
  return updated;
}

export function deletePosterById(posterId) {
  const current = getStoredPosters();
  const updated = current.filter(p => p.id !== posterId);
  saveAllPosters(updated);
  return updated;
}

export function addNewCategory(newCat) {
  const current = getStoredCategories();
  if (current.some(c => c.id === newCat.id)) {
    return current;
  }
  const updated = [...current, newCat];
  saveAllCategories(updated);
  return updated;
}

export function deleteCategoryById(categoryId) {
  const current = getStoredCategories();
  const updated = current.filter(c => c.id !== categoryId);
  saveAllCategories(updated);
  return updated;
}

export function resetCatalogToDefault() {
  localStorage.removeItem(POSTERS_STORAGE_KEY);
  localStorage.removeItem(CATEGORIES_STORAGE_KEY);
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

export function importCatalogFromJSON(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (data.posters && Array.isArray(data.posters)) {
      saveAllPosters(data.posters);
    }
    if (data.categories && Array.isArray(data.categories)) {
      saveAllCategories(data.categories);
    }
    return { success: true, count: data.posters?.length || 0 };
  } catch (err) {
    console.error('Error importing JSON:', err);
    return { success: false, error: err.message };
  }
}
