/**
 * routes/catalogRoutes.js
 * Catalog and image management endpoints — 100% Stateless & PostgreSQL-backed.
 * Zero Split-Brain: No JSON files used.
 */

import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { requireAuth } from '../middleware/auth.js';
import {
  getAllPosters,
  getPosterById,
  upsertPosterFromAdmin,
  updatePosterStatus,
  deletePoster,
  getFullCatalog,
  updateStoreSettings,
} from '../services/catalogService.js';
import { processImageBuffer, dataUrlToBuffer } from '../services/imageService.js';
import { deleteFromGCS } from '../services/gcsService.js';
import { PROJECT_ROOT } from '../config/paths.js';

const router = Router();

// ── Multer In-Memory Storage (Stateless Gateway) ─────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB max file limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen válidos (PNG, JPG, WebP, etc.).'), false);
    }
  }
});

// ── GET /api/catalog (Public — Central Source of Truth from PostgreSQL) ──────
router.get('/catalog', async (req, res) => {
  try {
    const catalog = await getFullCatalog();
    return res.status(200).json(catalog);
  } catch (err) {
    console.error('[API Error] GET /api/catalog:', err);
    return res.status(500).json({ error: 'Error al obtener el catálogo.', details: err.message });
  }
});

// ── GET /api/catalog/posters (Public / Admin listing with Cursor Pagination) ──
router.get('/catalog/posters', async (req, res) => {
  try {
    const {
      categoria,
      franchiseId,
      search,
      onlyFeatured,
      includeUnpublished,
      orderBy,
      order,
      cursor,
      take,
    } = req.query;

    const result = await getAllPosters({
      categoria,
      franchiseId,
      search,
      onlyFeatured: onlyFeatured === 'true',
      includeUnpublished: includeUnpublished === 'true',
      orderBy,
      order,
      cursor,
      take,
    });

    if (result && !Array.isArray(result) && result.posters) {
      return res.status(200).json({
        success: true,
        count: result.count,
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
        posters: result.posters,
      });
    }

    return res.status(200).json({
      success: true,
      count: result.length,
      posters: result,
    });
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

    // Limpieza de imágenes en GCS y local si aplica
    if (existing.imageUrl) await deleteFromGCS(existing.imageUrl);
    if (existing.thumbUrl) await deleteFromGCS(existing.thumbUrl);

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

    // Procesamiento por lotes secuenciales (chunks de 3) para no saturar el Connection Pool de PostgreSQL
    const BATCH_SIZE = 3;
    const processedPosters = [];

    const processSinglePoster = async (p) => {
      const cleanPoster = { ...p };
      const cleanId = (cleanPoster.id || 'obra-' + Date.now()).toLowerCase().replace(/[^a-z0-9]+/g, '-');

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

      try {
        return await upsertPosterFromAdmin(cleanPoster);
      } catch (prismaErr) {
        console.warn(`[Prisma Sync] Failed to upsert poster ${cleanPoster.id}:`, prismaErr.message);
        return cleanPoster;
      }
    };

    for (let i = 0; i < posters.length; i += BATCH_SIZE) {
      const batch = posters.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(batch.map(p => processSinglePoster(p)));
      processedPosters.push(...batchResults);
    }

    if (settings) {
      await updateStoreSettings(settings);
    }

    const updatedCatalog = await getFullCatalog();
    console.log(`[PostgreSQL DB] Persisted ${processedPosters.length} posters to PostgreSQL.`);

    return res.status(200).json({
      success:   true,
      count:     processedPosters.length,
      updatedAt: updatedCatalog.updatedAt,
      catalog:   updatedCatalog
    });
  } catch (err) {
    console.error('[API Error] POST /api/catalog/save:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /api/catalog/upload (Protected Admin) ───────────────────────────────
// Converts multipart buffer or base64 data URL to WebP and uploads to GCS.
router.post('/catalog/upload', requireAuth, (req, res, next) => {
  // Soporta tanto multipart/form-data como application/json
  if (req.is('multipart/form-data')) {
    upload.single('file')(req, res, next);
  } else {
    next();
  }
}, async (req, res) => {
  try {
    const posterId = req.body?.posterId || req.query?.posterId;
    const cleanId = (posterId || 'obra-' + Date.now()).toLowerCase().replace(/[^a-z0-9]+/g, '-');

    let buffer = null;

    if (req.file && req.file.buffer) {
      // Flujo Multipart con multer.memoryStorage()
      buffer = req.file.buffer;
    } else if (req.body?.dataUrl) {
      // Flujo Base64 Data URL
      buffer = dataUrlToBuffer(req.body.dataUrl);
    } else {
      return res.status(400).json({ error: 'Falta la imagen (archivo en campo "file" o propiedad "dataUrl").' });
    }

    const { image, thumb } = await processImageBuffer(buffer, cleanId);

    return res.status(200).json({ success: true, image, thumb });
  } catch (err) {
    console.error('[API Error] POST /api/catalog/upload:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /api/catalog/delete-image (Protected Admin) ────────────────────────
// Removes WebP files from Google Cloud Storage or legacy local disk.
router.post('/catalog/delete-image', requireAuth, async (req, res) => {
  try {
    const { imagePath, thumbPath } = req.body;

    // 1. Limpieza en Google Cloud Storage si es URL de GCS
    if (imagePath && imagePath.startsWith('https://storage.googleapis.com/')) {
      await deleteFromGCS(imagePath);
    }
    if (thumbPath && thumbPath.startsWith('https://storage.googleapis.com/')) {
      await deleteFromGCS(thumbPath);
    }

    // 2. Limpieza en disco local si es ruta relativa legacy
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
