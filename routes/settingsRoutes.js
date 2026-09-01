/**
 * routes/settingsRoutes.js
 * Store settings and WhatsApp config endpoints — 100% async & memory/database backed.
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getStoreSettings, updateStoreSettings } from '../services/catalogService.js';

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
    const { whatsappPhone, storeName, deliveryMinDays, deliveryMaxDays, customCm2Price } = req.body;
    const updatedSettings = await updateStoreSettings({
      ...(whatsappPhone !== undefined && { whatsappPhone }),
      ...(storeName !== undefined && { storeName }),
      ...(deliveryMinDays !== undefined && { deliveryMinDays }),
      ...(deliveryMaxDays !== undefined && { deliveryMaxDays }),
      ...(customCm2Price !== undefined && { customCm2Price }),
    });

    console.log(`[Deco Settings] Updated store settings: WhatsApp = ${updatedSettings.whatsappPhone}`);
    return res.status(200).json({ success: true, settings: updatedSettings });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
