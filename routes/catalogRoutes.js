/**
 * routes/catalogRoutes.js
 * Catalog and image management endpoints.
 * Extracted from server.js lines 184–308 (catalog CRUD) and line 935–950 (delete-image).
 */

import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { requireAuth } from '../middleware/auth.js';
import {
  getCatalogData,
  saveCatalog,
  getAllPosters,
  getPosterById,
  upsertPosterFromAdmin,
  updatePosterStatus,
  deletePoster,
  formatPosterForClient
} from '../services/catalogService.js';
import { processImageBuffer, dataUrlToBuffer } from '../services/imageService.js';
import { PROJECT_ROOT } from '../config/paths.js';

const router = Router();

// ── GET /api/catalog (Public — central source of truth) ──────────────────────
router.get('/catalog', async (req, res) => {
  try {
    // Intenta servir pósters desde PostgreSQL via Prisma
    try {
      const dbPosters = await getAllPosters({ includeUnpublished: true });
      if (dbPosters && dbPosters.length > 0) {
        const legacyCatalog = getCatalogData();
        return res.status(200).json({
          categories: legacyCatalog.categories || [],
          franchises: legacyCatalog.franchises || [],
          settings:   legacyCatalog.settings || {},
          posters:    dbPosters,
          updatedAt:  new Date().toISOString()
        });
      }
    } catch (dbErr) {
      console.warn('[API Warning] GET /api/catalog fallback to JSON:', dbErr.message);
    }

    const catalog = getCatalogData();
    const posters = (catalog.posters || []).map(formatPosterForClient);
    return res.status(200).json({ ...catalog, posters });
  } catch (err) {
    console.error('[API Error] GET /api/catalog:', err);
    return res.status(500).json({ error: 'Error al obtener el catálogo.', details: err.message });
  }
});

// ── GET /api/catalog/posters (Public / Admin listing) ────────────────────────
router.get('/catalog/posters', async (req, res) => {
  try {
    const { categoria, franchiseId, onlyFeatured, includeUnpublished } = req.query;
    const posters = await getAllPosters({
      categoria,
      franchiseId,
      onlyFeatured: onlyFeatured === 'true',
      includeUnpublished: includeUnpublished === 'true',
    });
    return res.status(200).json({ success: true, count: posters.length, posters });
  } catch (err) {
    console.error('[API Error] GET /api/catalog/posters:', err);
    return res.status(500).json({ error: 'Error al consultar pósters en la base de datos.', details: err.message });
  }
});

// ── GET /api/catalog/posters/:id (Public details) ────────────────────────────
router.get('/catalog/posters/:id', async (req, res) => {
  try {
    const poster = await getPosterById(req.params.id);
    if (!poster) {
      return res.status(404).json({ error: 'Póster no encontrado' });
    }
    return res.status(200).json({ success: true, poster });
  } catch (err) {
    console.error('[API Error] GET /api/catalog/posters/:id:', err);
    return res.status(500).json({ error: 'Error al obtener el póster.', details: err.message });
  }
});

// ── POST /api/catalog/posters (Protected Admin - Create Poster) ─────────────
router.post('/catalog/posters', requireAuth, async (req, res) => {
  try {
    const posterData = req.body;
    if (!posterData || (!posterData.title && !posterData.titulo)) {
      return res.status(400).json({ error: 'El título del póster es obligatorio.' });
    }

    // Procesa imagen base64 si está presente
    let image = posterData.image || posterData.imageUrl;
    let thumb = posterData.thumb || posterData.thumbUrl;

    if (image && image.startsWith('data:image/')) {
      const cleanId = (posterData.id || 'obra-' + Date.now()).toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const buffer = dataUrlToBuffer(image);
      const processed = await processImageBuffer(buffer, cleanId);
      image = processed.image;
      thumb = processed.thumb;
    }

    const savedPoster = await upsertPosterFromAdmin({
      ...posterData,
      image,
      thumb,
    });

    // Sincronización secundaria con catalogStore.json
    try {
      const currentCatalog = getCatalogData();
      const posters = currentCatalog.posters || [];
      const idx = posters.findIndex(p => p.id === savedPoster.id || p.id === savedPoster.legacyId);
      if (idx >= 0) {
        posters[idx] = { ...posters[idx], ...savedPoster };
      } else {
        posters.unshift(savedPoster);
      }
      saveCatalog({ ...currentCatalog, posters, updatedAt: new Date().toISOString() });
    } catch (jsonErr) {
      console.warn('[API Warning] Sync to JSON failed:', jsonErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Póster creado exitosamente en PostgreSQL.',
      poster: savedPoster
    });
  } catch (err) {
    console.error('[API Error] POST /api/catalog/posters:', err);
    return res.status(500).json({ error: 'Error al crear el póster en la base de datos.', details: err.message });
  }
});

// ── PUT /api/catalog/posters/:id (Protected Admin - Update Poster) ────────────
router.put('/catalog/posters/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const posterData = req.body;

    const existing = await getPosterById(id);
    if (!existing) {
      return res.status(404).json({ error: `Póster con ID "${id}" no encontrado.` });
    }

    let image = posterData.image || posterData.imageUrl || existing.imageUrl;
    let thumb = posterData.thumb || posterData.thumbUrl || existing.thumbUrl;

    if (image && image.startsWith('data:image/')) {
      const cleanId = (id || 'obra-' + Date.now()).toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const buffer = dataUrlToBuffer(image);
      const processed = await processImageBuffer(buffer, cleanId);
      image = processed.image;
      thumb = processed.thumb;
    }

    const updatedPoster = await upsertPosterFromAdmin({
      ...posterData,
      id: existing.id,
      legacyId: existing.legacyId,
      image,
      thumb,
    });

    // Sincronización secundaria con catalogStore.json
    try {
      const currentCatalog = getCatalogData();
      const posters = currentCatalog.posters || [];
      const idx = posters.findIndex(p => p.id === updatedPoster.id || p.id === updatedPoster.legacyId || p.id === id);
      if (idx >= 0) {
        posters[idx] = { ...posters[idx], ...updatedPoster };
        saveCatalog({ ...currentCatalog, posters, updatedAt: new Date().toISOString() });
      }
    } catch (jsonErr) {
      console.warn('[API Warning] Sync to JSON failed:', jsonErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Póster actualizado exitosamente en PostgreSQL.',
      poster: updatedPoster
    });
  } catch (err) {
    console.error(`[API Error] PUT /api/catalog/posters/${req.params.id}:`, err);
    return res.status(500).json({ error: 'Error al actualizar el póster en la base de datos.', details: err.message });
  }
});

// ── PATCH /api/catalog/posters/:id (Protected Admin - Partial Update) ────────
router.patch('/catalog/posters/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, isFeatured, isPublished } = req.body;

    const existing = await getPosterById(id);
    if (!existing) {
      return res.status(404).json({ error: `Póster con ID "${id}" no encontrado.` });
    }

    let updatedPoster;
    if (estado !== undefined) {
      updatedPoster = await updatePosterStatus(existing.id, estado);
    } else {
      updatedPoster = await upsertPosterFromAdmin({
        ...existing,
        id: existing.id,
        ...(isFeatured !== undefined && { isFeatured }),
        ...(isPublished !== undefined && { isPublished }),
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Póster actualizado parcialmente en PostgreSQL.',
      poster: updatedPoster
    });
  } catch (err) {
    console.error(`[API Error] PATCH /api/catalog/posters/${req.params.id}:`, err);
    return res.status(err.statusCode || 500).json({ error: err.message || 'Error al actualizar el póster.' });
  }
});

// ── DELETE /api/catalog/posters/:id (Protected Admin - Delete Poster) ────────
router.delete('/catalog/posters/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await getPosterById(id);
    if (!existing) {
      return res.status(404).json({ error: `Póster con ID "${id}" no encontrado.` });
    }

    await deletePoster(existing.id);

    // Sincronización secundaria con catalogStore.json
    try {
      const currentCatalog = getCatalogData();
      const posters = (currentCatalog.posters || []).filter(p => p.id !== existing.id && p.id !== existing.legacyId && p.id !== id);
      saveCatalog({ ...currentCatalog, posters, updatedAt: new Date().toISOString() });
    } catch (jsonErr) {
      console.warn('[API Warning] Sync deletion to JSON failed:', jsonErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Póster eliminado correctamente de PostgreSQL.'
    });
  } catch (err) {
    console.error(`[API Error] DELETE /api/catalog/posters/${req.params.id}:`, err);
    return res.status(500).json({ error: 'Error al eliminar el póster de la base de datos.', details: err.message });
  }
});

// ── POST /api/catalog/save (Protected Admin) ─────────────────────────────────
// Persists the entire catalog to VPS SSD and PostgreSQL via Prisma.
router.post('/catalog/save', requireAuth, async (req, res) => {
  try {
    const { categories, posters, franchises, settings } = req.body;
    if (!Array.isArray(posters)) {
      return res.status(400).json({ error: 'posters must be an array' });
    }

    // Auto-process and sanitize images: convert base64 to WebP files on disk
    // and fix any truncated extensions
    const processedPosters = await Promise.all(posters.map(async (p) => {
      const cleanPoster = { ...p };
      const cleanId = (cleanPoster.id || 'obra-' + Date.now()).toLowerCase().replace(/[^a-z0-9]+/g, '-');

      // Auto-correct truncated .web extension
      if (cleanPoster.thumb && cleanPoster.thumb.endsWith('.web')) {
        cleanPoster.thumb = cleanPoster.thumb + 'p';
      }
      if (cleanPoster.image && cleanPoster.image.endsWith('.web')) {
        cleanPoster.image = cleanPoster.image + 'p';
      }

      // Convert full image base64 if present
      if (cleanPoster.image && cleanPoster.image.startsWith('data:image/')) {
        try {
          const buffer = dataUrlToBuffer(cleanPoster.image);
          const { image, thumb } = await processImageBuffer(buffer, cleanId);
          cleanPoster.image = image;
          cleanPoster.thumb = thumb;
        } catch (e) {
          console.warn('[Deco Storage] Failed to convert base64 image:', e.message);
        }
      }

      // Normalize poster schema fields to match master standard
      cleanPoster.availableSizes = (Array.isArray(cleanPoster.availableSizes) && cleanPoster.availableSizes.length > 0)
        ? cleanPoster.availableSizes
        : ['MINI', 'PEQUENO', 'MEDIANO', 'GRANDE', 'GIGANTE'];
      cleanPoster.tags        = Array.isArray(cleanPoster.tags) ? cleanPoster.tags : [cleanPoster.category];
      cleanPoster.description = cleanPoster.description || '';
      cleanPoster.priceDisplay = cleanPoster.priceDisplay || 'Desde Q 25.00';

      // Persistir cada póster en PostgreSQL usando Prisma de forma asíncrona
      try {
        await upsertPosterFromAdmin(cleanPoster);
      } catch (prismaErr) {
        console.warn(`[Prisma Sync] Failed to upsert poster ${cleanPoster.id} to PostgreSQL:`, prismaErr.message);
      }

      return cleanPoster;
    }));

    const currentCatalog = getCatalogData();
    const dataToSave = {
      updatedAt:  new Date().toISOString(),
      categories: categories || currentCatalog.categories || [],
      franchises: franchises || currentCatalog.franchises || [],
      posters:    processedPosters,
      settings: {
        ...currentCatalog.settings,
        ...(settings || {}),
        updatedAt: new Date().toISOString()
      }
    };

    saveCatalog(dataToSave);
    console.log(`[VPS Disk & DB] Atomic persist of ${processedPosters.length} posters to PostgreSQL & SSD.`);
    return res.status(200).json({
      success:   true,
      count:     processedPosters.length,
      updatedAt: dataToSave.updatedAt,
      catalog:   dataToSave
    });
  } catch (err) {
    console.error('[API Error] POST /api/catalog/save:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /api/catalog/upload (Protected Admin) ───────────────────────────────
// Converts a base64 data URL to physical WebP files on the VPS SSD.
router.post('/catalog/upload', requireAuth, async (req, res) => {
  try {
    const { dataUrl, posterId } = req.body;
    if (!dataUrl) {
      return res.status(400).json({ error: 'Falta la imagen (dataUrl).' });
    }

    const cleanId = (posterId || 'obra-' + Date.now()).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const buffer  = dataUrlToBuffer(dataUrl);
    const { image, thumb } = await processImageBuffer(buffer, cleanId);

    return res.status(200).json({ success: true, image, thumb });
  } catch (err) {
    console.error('[API Error] POST /api/catalog/upload:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /api/catalog/delete-image (Protected Admin) ────────────────────────
// Removes physical WebP files from the VPS SSD. (server.js lines 935–950)
router.post('/catalog/delete-image', requireAuth, (req, res) => {
  try {
    const { imagePath, thumbPath } = req.body;

    if (imagePath && imagePath.startsWith('/posters/uploads/')) {
      const fullFile = path.resolve(PROJECT_ROOT, 'public', imagePath.replace(/^\//, ''));
      if (fs.existsSync(fullFile)) fs.unlinkSync(fullFile);
    }
    if (thumbPath && thumbPath.startsWith('/posters/uploads/')) {
      const thumbFile = path.resolve(PROJECT_ROOT, 'public', thumbPath.replace(/^\//, ''));
      if (fs.existsSync(thumbFile)) fs.unlinkSync(thumbFile);
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;
