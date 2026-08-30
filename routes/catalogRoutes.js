/**
 * routes/catalogRoutes.js
 * Catalog and image management endpoints.
 * Extracted from server.js lines 184–308 (catalog CRUD) and line 935–950 (delete-image).
 */

import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { requireAuth } from '../middleware/auth.js';
import { getCatalogData, saveCatalog } from '../services/catalogService.js';
import { processImageBuffer, dataUrlToBuffer } from '../services/imageService.js';
import { PROJECT_ROOT } from '../config/paths.js';

const router = Router();

// ── GET /api/catalog (Public — central source of truth) ──────────────────────
router.get('/catalog', (req, res) => {
  try {
    const catalog = getCatalogData();
    return res.status(200).json(catalog);
  } catch (err) {
    console.error('[API Error] GET /api/catalog:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /api/catalog/save (Protected Admin) ─────────────────────────────────
// Persists the entire catalog to VPS SSD, auto-converting any base64 images to WebP.
router.post('/catalog/save', requireAuth, async (req, res) => {
  try {
    const { categories, posters, franchises, settings } = req.body;
    if (!Array.isArray(posters)) {
      return res.status(400).json({ error: 'posters must be an array' });
    }

    // Auto-process and sanitize images: convert base64 to WebP files on disk
    // and fix any truncated extensions (server.js lines 204–244)
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
    console.log(`[VPS Disk] Atomic persist of ${processedPosters.length} posters to 100 GB SSD.`);
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
