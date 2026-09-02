/**
 * Deco Vintage Guate — Catalog Storage Bridge
 * Fuente de verdad única: PostgreSQL via backend Express + Prisma.
 *
 * ❌ Eliminado: Firebase / Firestore / memoria global / localStorage cache dual
 * ✅ Nuevo:     Todas las operaciones son async y hablan directamente con el backend.
 *               El backend es el único que lee/escribe la BD.
 *
 * Contratos de API que consume este módulo:
 *   GET    /api/catalog                     → { posters, categories, franchises, settings }
 *   GET    /api/catalog/posters             → { posters[] }
 *   POST   /api/catalog/posters             → { poster }   (crear)
 *   PUT    /api/catalog/posters/:id         → { poster }   (actualizar completo)
 *   PATCH  /api/catalog/posters/:id         → { poster }   (actualizar parcial)
 *   DELETE /api/catalog/posters/:id         → { success }
 *   POST   /api/catalog/save               → { catalog }  (guardar categorías / franchises / settings)
 *   POST   /api/settings/save              → { settings } (guardar WhatsApp)
 */

import {
  CATALOG_POSTERS as BASE_POSTERS,
  CATEGORIES as BASE_CATEGORIES,
  INITIAL_FRANCHISES as BASE_FRANCHISES,
  STORE_SETTINGS as BASE_SETTINGS
} from '../data/catalogData.js';
import {
  apiGetCatalog,
  apiSaveCatalog,
  apiCreatePoster,
  apiUpdatePoster,
  apiPatchPoster,
  apiDeletePosterRecord,
  apiDeletePosterImage,
  apiCreateFranchise,
  apiDeleteFranchise
} from './apiClient.js';
import { saveStoreWhatsAppPhone } from '../config/constants.js';

// ── Emisor de eventos UI ───────────────────────────────────────────────────────
// Mantiene compatibilidad con componentes que escuchan 'deco-catalog-updated'
// para forzar re-renders cuando el catálogo cambia en el servidor.
function emitCatalogUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('deco-catalog-updated'));
  }
}

// ── Cache mínima en memoria (solo lectura rápida, no es fuente de verdad) ─────
// Se hidrata en syncCatalogFromServer() y se invalida en cada mutación.
let _cachedPosters    = null;
let _cachedCategories = null;
let _cachedFranchises = null;
let _cachedSettings   = null;

// ── Sincronización inicial ─────────────────────────────────────────────────────

/**
 * Descarga el catálogo completo desde el backend (PostgreSQL + JSON para
 * categorías/franquicias/settings). Actualiza la cache interna y emite el
 * evento de actualización para que los componentes React se refresquen.
 *
 * @returns {Promise<boolean>} true si la sincronización fue exitosa.
 */
export async function syncCatalogFromServer() {
  try {
    const serverCatalog = await apiGetCatalog();
    if (serverCatalog && Array.isArray(serverCatalog.posters)) {
      _cachedPosters    = serverCatalog.posters;
      _cachedCategories = serverCatalog.categories || BASE_CATEGORIES;
      _cachedFranchises = serverCatalog.franchises || BASE_FRANCHISES;
      _cachedSettings   = serverCatalog.settings   || BASE_SETTINGS;

      if (_cachedSettings?.whatsappPhone) {
        saveStoreWhatsAppPhone(_cachedSettings.whatsappPhone);
      }

      emitCatalogUpdate();
      console.info(`[Deco Storage] Catálogo sincronizado: ${_cachedPosters.length} pósters desde PostgreSQL.`);
      return true;
    }
  } catch (err) {
    console.warn('[Deco Storage] Error en sincronización con backend:', err.message);
  }
  return false;
}

// Auto-sincronizar al cargar el módulo en el navegador
if (typeof window !== 'undefined') {
  syncCatalogFromServer();
}

// ── Lectores de cache ─────────────────────────────────────────────────────────
// Devuelven la cache actual. Si está vacía, devuelven los datos por defecto
// del bundle (datos estáticos de base). La cache se rellena en syncCatalogFromServer.

export function getStoredPosters()    { return _cachedPosters    ?? BASE_POSTERS;    }
export function getStoredCategories() { return _cachedCategories ?? BASE_CATEGORIES; }
export function getStoredFranchises() { return _cachedFranchises ?? BASE_FRANCHISES; }
export function getStoredSettings()   { return _cachedSettings   ?? BASE_SETTINGS;   }

// ── CRUD de Pósters ───────────────────────────────────────────────────────────

/**
 * Crea un nuevo póster en PostgreSQL.
 * El ID lo asigna el servidor (UUID). Invalida la cache local.
 *
 * @param {object} posterData - Datos del póster desde el formulario admin.
 * @returns {Promise<object>} El póster creado con su ID de PostgreSQL.
 */
export async function createPoster(posterData) {
  const result = await apiCreatePoster(posterData);
  const savedPoster = result.poster;

  // Actualizar cache local con el nuevo póster al frente
  if (_cachedPosters) {
    _cachedPosters = [savedPoster, ..._cachedPosters];
  }
  emitCatalogUpdate();
  console.info(`[Deco Storage] Póster "${savedPoster.titulo || savedPoster.title}" creado con ID: ${savedPoster.id}`);
  return savedPoster;
}

/**
 * Actualiza un póster existente en PostgreSQL (reemplazo completo).
 * Usa el ID de PostgreSQL (UUID). Invalida la cache local.
 *
 * @param {string} posterId - UUID del póster en PostgreSQL.
 * @param {object} posterData - Datos actualizados del póster.
 * @returns {Promise<object>} El póster actualizado.
 */
export async function updatePoster(posterId, posterData) {
  const result = await apiUpdatePoster(posterId, posterData);
  const updatedPoster = result.poster;

  // Actualizar cache local
  if (_cachedPosters) {
    _cachedPosters = _cachedPosters.map(p =>
      (p.id === posterId || p.legacyId === posterId) ? updatedPoster : p
    );
  }
  emitCatalogUpdate();
  return updatedPoster;
}

/**
 * Fachada unificada: crea o actualiza según si el póster tiene un ID de PG (UUID).
 * Usado por AdminDashboard como punto de entrada único del formulario.
 *
 * @param {object} posterData - Datos del póster. Si tiene `pgId`, actualiza. Si no, crea.
 * @returns {Promise<object>} El póster creado o actualizado.
 */
export async function saveOrUpdatePoster(posterData) {
  const { pgId, ...data } = posterData;
  if (pgId) {
    return updatePoster(pgId, data);
  }
  return createPoster(data);
}

/**
 * Actualiza parcialmente un póster (solo campos específicos).
 * Usado para toggle de isFeatured sin enviar el póster completo.
 *
 * @param {string} posterId - UUID del póster.
 * @param {object} patch - Campos a actualizar (ej: { isFeatured: true }).
 * @returns {Promise<object>} El póster actualizado.
 */
export async function patchPoster(posterId, patch) {
  const result = await apiPatchPoster(posterId, patch);
  const updatedPoster = result.poster;

  if (_cachedPosters) {
    _cachedPosters = _cachedPosters.map(p =>
      (p.id === posterId || p.legacyId === posterId) ? { ...p, ...updatedPoster } : p
    );
  }
  emitCatalogUpdate();
  return updatedPoster;
}

/**
 * Alterna el estado de destacado (Best Seller) de un póster.
 *
 * @param {string} posterId - UUID o legacyId del póster.
 * @returns {Promise<object>} El póster con isFeatured actualizado.
 */
export async function togglePosterFeatured(posterId) {
  const current = (_cachedPosters ?? []).find(p => p.id === posterId || p.legacyId === posterId);
  const newValue = current ? !current.isFeatured : true;
  return patchPoster(posterId, { isFeatured: newValue });
}

/**
 * Elimina un póster de PostgreSQL y sus archivos físicos del VPS SSD.
 *
 * @param {string} posterId - UUID del póster en PostgreSQL.
 * @returns {Promise<void>}
 */
export async function deletePosterById(posterId) {
  // Obtener datos del poster antes de eliminarlo para poder borrar las imágenes
  const posterToDelete = (_cachedPosters ?? []).find(
    p => p.id === posterId || p.legacyId === posterId
  );

  // 1. Eliminar el registro de la BD
  await apiDeletePosterRecord(posterId);

  // 2. Limpiar imágenes físicas del VPS SSD (fire-and-forget)
  if (posterToDelete) {
    const imgPath   = posterToDelete.imageUrl || posterToDelete.image;
    const thumbPath = posterToDelete.thumbUrl || posterToDelete.thumb;
    if (imgPath || thumbPath) {
      apiDeletePosterImage(imgPath, thumbPath).catch(() => {});
    }
  }

  // 3. Actualizar cache local
  if (_cachedPosters) {
    _cachedPosters = _cachedPosters.filter(
      p => p.id !== posterId && p.legacyId !== posterId
    );
  }
  emitCatalogUpdate();
  console.info(`[Deco Storage] Póster "${posterId}" eliminado de PostgreSQL y SSD.`);
}

// ── Categorías ────────────────────────────────────────────────────────────────
// Las categorías aún se persisten en el JSON del VPS via /api/catalog/save.
// En una futura migración se moverán a una tabla de PostgreSQL.

async function persistMetadata({ categories, franchises, settings } = {}) {
  const payload = {
    posters:    _cachedPosters    ?? [],
    categories: categories ?? _cachedCategories ?? BASE_CATEGORIES,
    franchises: franchises ?? _cachedFranchises ?? BASE_FRANCHISES,
    settings:   settings   ?? _cachedSettings   ?? BASE_SETTINGS,
  };
  const res = await apiSaveCatalog(payload);

  // Actualizar caches secundarias con la respuesta del servidor
  if (res?.catalog) {
    _cachedCategories = res.catalog.categories ?? _cachedCategories;
    _cachedFranchises = res.catalog.franchises ?? _cachedFranchises;
    _cachedSettings   = res.catalog.settings   ?? _cachedSettings;
  }
  emitCatalogUpdate();
}

/**
 * Agrega una nueva categoría y la persiste en el backend (JSON VPS).
 * @param {{ id: string, name: string }} newCat
 */
export async function addNewCategory(newCat) {
  const current = getStoredCategories();
  if (current.some(c => c.id === newCat.id)) return current;
  const updated = [...current, newCat];
  _cachedCategories = updated;
  await persistMetadata({ categories: updated });
  return updated;
}

/**
 * Elimina una categoría por ID y persiste en el backend.
 * @param {string} categoryId
 */
export async function deleteCategoryById(categoryId) {
  const updated = getStoredCategories().filter(c => c.id !== categoryId);
  _cachedCategories = updated;
  await persistMetadata({ categories: updated });
  return updated;
}

/**
 * Guarda la lista completa de categorías.
 */
export async function saveAllCategories(categories) {
  _cachedCategories = categories;
  await persistMetadata({ categories });
}

// ── Franquicias ───────────────────────────────────────────────────────────────

/**
 * Guarda la lista completa de franquicias.
 */
export async function saveAllFranchises(franchises) {
  _cachedFranchises = franchises;
  await persistMetadata({ franchises });
}

/**
 * Agrega o actualiza una franquicia directamente en PostgreSQL.
 * @param {object} franchiseData - { id, slug, name, img, category }
 */
export async function createFranchise(franchiseData) {
  try {
    const res = await apiCreateFranchise(franchiseData);
    if (res?.franchise) {
      await syncCatalogFromServer();
      emitCatalogUpdate();
      return res.franchise;
    }
  } catch (e) {
    console.warn('[Deco Storage] apiCreateFranchise fallback:', e.message);
  }
  const current = getStoredFranchises();
  const updated = [...current, franchiseData];
  await saveAllFranchises(updated);
  return franchiseData;
}

/**
 * Elimina una franquicia por ID o slug en PostgreSQL.
 * @param {string} franchiseId
 */
export async function deleteFranchiseById(franchiseId) {
  try {
    await apiDeleteFranchise(franchiseId);
    await syncCatalogFromServer();
    emitCatalogUpdate();
    return true;
  } catch (e) {
    console.warn('[Deco Storage] apiDeleteFranchise fallback:', e.message);
  }
  const current = getStoredFranchises();
  const updated = current.filter(f => f.id !== franchiseId && f.slug !== franchiseId);
  await saveAllFranchises(updated);
  return true;
}

// ── Settings ──────────────────────────────────────────────────────────────────

/**
 * Guarda la configuración de la tienda (WhatsApp, etc.).
 * Usa /api/settings/save directamente (más eficiente que el monolito).
 * @param {object} settings
 */
export async function saveStoreSettings(settings) {
  const newSettings = { ...getStoredSettings(), ...settings, updatedAt: new Date().toISOString() };
  _cachedSettings = newSettings;
  if (newSettings.whatsappPhone) {
    saveStoreWhatsAppPhone(newSettings.whatsappPhone);
  }
  // Solo persiste settings via su endpoint dedicado
  await persistMetadata({ settings: newSettings });
  return newSettings;
}

// ── Utilidades ────────────────────────────────────────────────────────────────

/**
 * Exporta el catálogo actual (cache) como JSON descargable.
 */
export function exportCatalogAsJSON() {
  const data = {
    version:    '4.0-postgresql',
    exportedAt: new Date().toISOString(),
    posters:    getStoredPosters(),
    categories: getStoredCategories(),
    franchises: getStoredFranchises(),
    settings:   getStoredSettings(),
  };
  if (typeof document === 'undefined') return;
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `deco-vintage-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Importa un catálogo desde JSON y lo persiste en el backend.
 * @param {string|object} rawJson
 */
export async function importCatalogFromJSON(rawJson) {
  try {
    const data = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
    if (!data || typeof data !== 'object') throw new Error('Formato JSON inválido.');

    // Actualizar caches
    if (Array.isArray(data.posters))    _cachedPosters    = data.posters;
    if (Array.isArray(data.categories)) _cachedCategories = data.categories;
    if (Array.isArray(data.franchises)) _cachedFranchises = data.franchises;
    if (data.settings)                  _cachedSettings   = data.settings;

    await persistMetadata();
    return { success: true, count: data.posters?.length || 0 };
  } catch (err) {
    console.error('[Deco Storage] Error importing JSON:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Restablece el catálogo a los datos por defecto del bundle.
 */
export async function resetCatalogToDefault() {
  _cachedPosters    = [...BASE_POSTERS];
  _cachedCategories = [...BASE_CATEGORIES];
  _cachedFranchises = [...BASE_FRANCHISES];
  _cachedSettings   = { ...BASE_SETTINGS };
  await persistMetadata();
}
