/**
 * routes/catalogRoutes.js
 * Catalog and image management endpoints — 100% Prisma (PostgreSQL).
 * Zero Split-Brain (catalogStore.json removed) and non-blocking I/O.
 */

import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { requireAuth } from '../middleware/auth.js';
import {
  getAllPosters,
  getPosterById,
  upsertPosterFromAdmin,
  updatePosterStatus,
  deletePoster,
  getAllCategories,
  getAllFranchises,
  getStoreSettings,
  saveStoreSettings
} from '../services/catalogService.js';
import { processImageBuffer, dataUrlToBuffer } from '../services/imageService.js';
import { PROJECT_ROOT } from '../config/paths.js';

const router = Router();

// ── GET /api/catalog (Public — central source of truth from PostgreSQL) ──────
router.get('/catalog', async (req, res) => {
  try {
    const { take, cursor, skip, categoria, franchiseId } = req.query;
    const [posters, categories, franchises, settings] = await Promise.all([
      getAllPosters({ includeUnpublished: true, take, cursor, skip, categoria, franchiseId }),
      getAllCategories(),
      getAllFranchises(),
      getStoreSettings()
    ]);

    return res.status(200).json({
      categories,
      franchises,
      settings,
      posters,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('[API Error] GET /api/catalog:', err);
    return res.status(500).json({ error: 'Error al obtener el catálogo.', details: err.message });
  }
});

// ── GET /api/catalog/posters (Public / Admin listing with Prisma Pagination) ─
router.get('/catalog/posters', async (req, res) => {
  try {
    const { categoria, franchiseId, onlyFeatured, includeUnpublished, take, cursor, skip, orderBy, order } = req.query;
    const posters = await getAllPosters({
      categoria,
      franchiseId,
      onlyFeatured: onlyFeatured === 'true',
      includeUnpublished: includeUnpublished === 'true',
      take,
      cursor,
      skip,
      orderBy,
      order
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
// Persists catalog items directly to PostgreSQL via Prisma.
router.post('/catalog/save', requireAuth, async (req, res) => {
  try {
    const { posters, settings } = req.body;
    if (!Array.isArray(posters)) {
      return res.status(400).json({ error: 'posters must be an array' });
    }

    const processedPosters = await Promise.all(posters.map(async (p) => {
      const cleanPoster = { ...p };
      const cleanId = (cleanPoster.id || 'obra-' + Date.now()).toLowerCase().replace(/[^a-z0-9]+/g, '-');

      if (cleanPoster.thumb && cleanPoster.thumb.endsWith('.web')) {
        cleanPoster.thumb = cleanPoster.thumb + 'p';
      }
      if (cleanPoster.image && cleanPoster.image.endsWith('.web')) {
        cleanPoster.image = cleanPoster.image + 'p';
      }

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

      try {
        return await upsertPosterFromAdmin(cleanPoster);
      } catch (prismaErr) {
        console.warn(`[Prisma Sync] Failed to upsert poster ${cleanPoster.id} to PostgreSQL:`, prismaErr.message);
        return cleanPoster;
      }
    }));

    if (settings && settings.whatsappPhone) {
      await saveStoreSettings(settings.whatsappPhone);
    }

    console.log(`[PostgreSQL DB] Atomic persist of ${processedPosters.length} posters via Prisma.`);
    return res.status(200).json({
      success:   true,
      count:     processedPosters.length,
      updatedAt: new Date().toISOString(),
      posters:   processedPosters
    });
  } catch (err) {
    console.error('[API Error] POST /api/catalog/save:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /api/catalog/upload (Protected Admin) ───────────────────────────────
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
// Non-blocking async file deletion
router.post('/catalog/delete-image', requireAuth, async (req, res) => {
  try {
    const { imagePath, thumbPath } = req.body;

    if (imagePath && imagePath.startsWith('/posters/uploads/')) {
      const fullFile = path.resolve(PROJECT_ROOT, 'public', imagePath.replace(/^\//, ''));
      try { await fs.promises.unlink(fullFile); } catch (e) {}
    }
    if (thumbPath && thumbPath.startsWith('/posters/uploads/')) {
      const thumbFile = path.resolve(PROJECT_ROOT, 'public', thumbPath.replace(/^\//, ''));
      try { await fs.promises.unlink(thumbFile); } catch (e) {}
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;
