/**
 * routes/settingsRoutes.js
 * Store settings and WhatsApp config endpoints.
 * Extracted from server.js lines 314–342.
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getCatalogData, saveCatalog } from '../services/catalogService.js';

const router = Router();

// GET /api/settings
router.get('/settings', (req, res) => {
  try {
    const catalog = getCatalogData();
    return res.status(200).json(catalog.settings || { whatsappPhone: '50238375078' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/settings/save (Protected Admin)
router.post('/settings/save', requireAuth, (req, res) => {
  try {
    const { whatsappPhone } = req.body;
    const catalog = getCatalogData();
    catalog.settings = {
      ...catalog.settings,
      whatsappPhone: (whatsappPhone || '50238375078').replace(/[^0-9]/g, ''),
      updatedAt: new Date().toISOString()
    };
    saveCatalog(catalog);
    console.log(`[Deco Settings] Updated WhatsApp phone to: ${catalog.settings.whatsappPhone}`);
    return res.status(200).json({ success: true, settings: catalog.settings });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
