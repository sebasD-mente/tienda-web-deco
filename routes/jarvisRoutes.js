/**
 * routes/jarvisRoutes.js
 * All J.A.R.V.I.S. AI endpoints plus /api/version and /api/health.
 * 100% Async and Non-blocking I/O.
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { rateLimitAI } from '../middleware/rateLimit.js';
import {
  getAllPosters,
  getAllCategories,
  getAllFranchises,
  getStoreSettings
} from '../services/catalogService.js';
import {
  getJarvisApiKey,
  getJarvisMemory,
  saveJarvisMemory,
  chatWithJarvis
} from '../services/jarvisService.js';

const router = Router();

// ── GET /api/version ─────────────────────────────────────────────────────────
router.get('/version', async (req, res) => {
  const key = await getJarvisApiKey();
  res.json({
    version:   'v7.0-genai-modern',
    engine:    '@google/genai-gemini-3.6-flash',
    hasApiKey: !!key,
    keyPrefix: (key || '').substring(0, 10)
  });
});

// ── GET /api/health ──────────────────────────────────────────────────────────
router.get('/health', async (req, res) => {
  let postersCount = 0;
  try {
    const livePosters = await getAllPosters({ includeUnpublished: true });
    postersCount = livePosters.length;
  } catch (e) {
    postersCount = 0;
  }
  res.json({
    status:       'ok',
    vps:          true,
    storage:      'Google Cloud Storage & VPS SSD',
    postersCount,
    timestamp:    new Date().toISOString()
  });
});

// ── GET /api/jarvis & /api/jarvis/config ──────────────────────────────────────
router.get(['/jarvis', '/jarvis/config'], async (req, res) => {
  try {
    const memory     = await getJarvisMemory();
    const safeMemory = { ...memory };
    delete safeMemory.apiKey;
    delete safeMemory.googleClientSecret;
    delete safeMemory.googleRefreshToken;
    return res.status(200).json(safeMemory);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /api/jarvis/save (Protected Admin) ──────────────────────────────────
router.post('/jarvis/save', requireAuth, async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ success: false, error: 'Payload inválido.' });
    }
    const result = await saveJarvisMemory(payload);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (err) {
    console.error('[Deco J.A.R.V.I.S. Save Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/jarvis/save-key (Protected Admin) ──────────────────────────────
router.post('/jarvis/save-key', requireAuth, async (req, res) => {
  try {
    const { apiKey } = req.body;
    const result = await saveJarvisMemory({ apiKey: (apiKey || '').trim() });
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    console.log('[Deco J.A.R.V.I.S.] Saved Gemini API key asynchronously.');
    return res.status(200).json({ success: true, message: 'Clave de Gemini API guardada correctamente.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /api/jarvis/chat (Public + Rate Limiting) ───────────────────────────
router.post('/jarvis/chat', rateLimitAI, async (req, res) => {
  try {
    const { prompt, history } = req.body || {};
    const clientKey       = req.headers['x-gemini-key'] || req.body?.apiKey;
    const masterServerKey = await getJarvisApiKey();

    const candidateKeys = [];
    if (masterServerKey && masterServerKey.trim().length > 0) {
      candidateKeys.push(masterServerKey.trim());
    }
    if (clientKey && clientKey.trim().length > 0 && !candidateKeys.includes(clientKey.trim())) {
      candidateKeys.push(clientKey.trim());
    }

    const [livePosters, categories, franchises, settings, jarvisMemory] = await Promise.all([
      getAllPosters(),
      getAllCategories(),
      getAllFranchises(),
      getStoreSettings(),
      getJarvisMemory()
    ]);

    const liveCatalog = {
      categories,
      franchises,
      settings,
      posters: livePosters
    };

    const result = await chatWithJarvis(prompt, history, candidateKeys, liveCatalog, jarvisMemory);

    if (!result || typeof result !== 'object') {
      return res.status(200).json({
        replyText: '¡Hola! Con gusto te asisto con las colecciones de Deco Vintage. ¿Qué diseño o temática estás buscando?',
        actions: [],
        poweredBy: 'Deco Safe Fallback'
      });
    }

    return res.status(200).json(result);

  } catch (err) {
    console.error('[API Error] POST /api/jarvis/chat:', err);
    return res.status(200).json({
      replyText: 'Disculpa, ocurrió un inconveniente temporal al consultar el inventario, pero con gusto te asisto. ¿Qué temática de cuadros te gustaría ver?',
      actions: [],
      poweredBy: 'Deco Safe Error Recovery',
      error: err.message
    });
  }
});

export default router;
