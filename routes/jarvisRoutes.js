/**
 * routes/jarvisRoutes.js
 * All J.A.R.V.I.S. AI endpoints plus /api/version and /api/health.
 *
 * Duplicate resolution (as per approved plan):
 *   GET  /api/jarvis → line 466 version kept (omits apiKey, googleClientSecret,
 *                      googleRefreshToken from response — more secure).
 *   POST /api/jarvis/save → requireAuth applied (line 962 behavior, the effective
 *                           one in Express) + complete merge logic (line 479).
 *
 * Extracted from server.js lines 117–124, 465–529, 952–987.
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { rateLimitAI } from '../middleware/rateLimit.js';
import {
  getCatalogData,
  getAllPosters,
  formatPosterForClient
} from '../services/catalogService.js';
import {
  getJarvisApiKey,
  getJarvisMemory,
  saveJarvisMemory,
  chatWithJarvis
} from '../services/jarvisService.js';

const router = Router();

// ── GET /api/version ─────────────────────────────────────────────────────────
// (server.js lines 117–124)
router.get('/version', (req, res) => {
  const key = getJarvisApiKey();
  res.json({
    version:   'v7.0-genai-modern',
    engine:    '@google/genai-gemini-3.6-flash',
    hasApiKey: !!key,
    keyPrefix: (key || '').substring(0, 10)
  });
});

// ── GET /api/health ──────────────────────────────────────────────────────────
// (server.js lines 977–987)
router.get('/health', async (req, res) => {
  let postersCount = 0;
  try {
    const livePosters = await getAllPosters({ includeUnpublished: true });
    postersCount = livePosters.length;
  } catch (e) {
    const catalog = getCatalogData();
    postersCount = catalog.posters?.length || 0;
  }
  res.json({
    status:       'ok',
    vps:          true,
    storage:      '100 GB SSD Hostinger',
    postersCount,
    timestamp:    new Date().toISOString()
  });
});

// ── GET /api/jarvis  &  /api/jarvis/config ───────────────────────────────────
// PUBLIC — returns merged training memory with sensitive fields stripped.
// KEPT: line 466 version (safe — omits apiKey, googleClientSecret, googleRefreshToken).
// DISCARDED: line 953 version (returned full object including secrets).
router.get(['/jarvis', '/jarvis/config'], (req, res) => {
  try {
    const memory     = getJarvisMemory();
    const safeMemory = { ...memory };
    delete safeMemory.apiKey;
    delete safeMemory.googleClientSecret;
    delete safeMemory.googleRefreshToken;
    return res.status(200).json(safeMemory);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /api/jarvis/save ────────────────────────────────────────────────────
// Persists full training memory, custom documents, and directives to VPS SSD.
// Auth:  requireAuth applied (line 962 was the effective definition in Express).
// Logic: complete merge + atomic write (line 479 version) via saveJarvisMemory().
router.post('/jarvis/save', requireAuth, (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ success: false, error: 'Payload inválido.' });
    }
    const result = saveJarvisMemory(payload);
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
// Persists Gemini API key to VPS SSD and syncs to src config.
// (server.js lines 515–529)
router.post('/jarvis/save-key', requireAuth, (req, res) => {
  try {
    const { apiKey } = req.body;
    const result = saveJarvisMemory({ apiKey: (apiKey || '').trim() });
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    console.log('[Deco J.A.R.V.I.S.] Saved Gemini API key to VPS SSD & src config.');
    return res.status(200).json({ success: true, message: 'Clave de Gemini API guardada en VPS SSD.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /api/jarvis/chat (Public + Rate Limiting) ───────────────────────────
// Secure server-side Gemini AI proxy. Runs 3-engine failover via chatWithJarvis().
// (server.js lines 571–932)
router.post('/jarvis/chat', rateLimitAI, async (req, res) => {
  try {
    const { prompt, history } = req.body || {};
    const clientKey      = req.headers['x-gemini-key'] || req.body?.apiKey;
    const masterServerKey = getJarvisApiKey();

    // Build candidate key pool — server key takes priority over client-provided key
    const candidateKeys = [];
    if (masterServerKey && masterServerKey.trim().length > 0) {
      candidateKeys.push(masterServerKey.trim());
    }
    if (clientKey && clientKey.trim().length > 0 && !candidateKeys.includes(clientKey.trim())) {
      candidateKeys.push(clientKey.trim());
    }

    // 1. Obtener inventario en VIVO directamente desde PostgreSQL via Prisma
    let livePosters = [];
    try {
      livePosters = await getAllPosters();
    } catch (dbErr) {
      console.warn('[Deco J.A.R.V.I.S.] Advertencia leyendo pósters de Prisma en vivo:', dbErr.message);
      const fallbackCatalog = getCatalogData();
      livePosters = (fallbackCatalog.posters || []).map(formatPosterForClient);
    }

    const legacyCatalog = getCatalogData();
    const liveCatalog = {
      categories: legacyCatalog.categories || [],
      franchises: legacyCatalog.franchises || [],
      settings:   legacyCatalog.settings || {},
      posters:    livePosters || []
    };

    const jarvisMemory = getJarvisMemory();

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
    // Retornamos un status 200 con mensaje explicativo para que el frontend nunca sufra un cuelgue infinito
    return res.status(200).json({
      replyText: 'Disculpa, ocurrió un inconveniente temporal al consultar el inventario, pero con gusto te asisto. ¿Qué temática de cuadros te gustaría ver?',
      actions: [],
      poweredBy: 'Deco Safe Error Recovery',
      error: err.message
    });
  }
});

export default router;
