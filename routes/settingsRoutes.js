/**
 * routes/settingsRoutes.js
 * Store settings and WhatsApp config endpoints — 100% async & memory/database backed.
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { settingsUpdateSchema } from '../validators/adminSchemas.js';
import { getStoreSettings, updateStoreSettings } from '../services/catalogService.js';

const router = Router();

// GET /api/settings or /api/settings/
router.get(['/settings', '/'], async (req, res) => {
  try {
    const settings = await getStoreSettings();
    return res.status(200).json({
      success: true,
      data: settings,
      settings,
      ...settings
    });
  } catch (err) {
    console.error('[API Error] GET /api/settings:', err);
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({ success: false, error: 'Error interno del servidor.' });
    }
    return res.status(500).json({ success: false, error: err.message });
  }
});

async function handleUpdateSettings(req, res) {
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
    return res.status(200).json({
      success: true,
      data: updatedSettings,
      settings: updatedSettings,
      ...updatedSettings
    });
  } catch (err) {
    console.error('[API Error] Update /api/settings:', err);
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({ success: false, error: 'Error interno del servidor.' });
    }
    return res.status(500).json({ success: false, error: err.message });
  }
}

// PUT /api/settings or /api/settings/ (Protected Admin)
router.put(['/settings', '/'], requireAuth, validate(settingsUpdateSchema), handleUpdateSettings);

// POST /api/settings/save or /api/settings/save (Protected Admin — legacy compatibility)
router.post(['/settings/save', '/save'], requireAuth, validate(settingsUpdateSchema), handleUpdateSettings);

export default router;
