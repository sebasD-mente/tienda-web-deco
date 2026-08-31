/**
 * routes/settingsRoutes.js
 * Store settings and WhatsApp config endpoints — 100% Prisma (PostgreSQL).
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getStoreSettings, saveStoreSettings } from '../services/catalogService.js';

const router = Router();

// GET /api/settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await getStoreSettings();
    return res.status(200).json(settings);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/settings/save (Protected Admin)
router.post('/settings/save', requireAuth, async (req, res) => {
  try {
    const { whatsappPhone } = req.body;
    const settings = await saveStoreSettings(whatsappPhone);
    console.log(`[Deco Settings] Updated WhatsApp phone via Prisma to: ${settings.whatsappPhone}`);
    return res.status(200).json({ success: true, settings });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
