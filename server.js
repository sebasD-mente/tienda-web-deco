/**
 * Deco Vintage Guate — Production Backend Server
 * Node.js + Express + Sharp | Runs on Hostinger VPS (145.223.120.56)
 *
 * This file is the lean orchestrator. All business logic lives in:
 *   config/paths.js          — filesystem paths (Docker volume roots)
 *   middleware/auth.js        — HMAC token system + requireAuth
 *   middleware/rateLimit.js   — AI rate limiter
 *   services/catalogService.js — catalog read/write
 *   services/imageService.js   — Sharp image processing
 *   services/jarvisService.js  — J.A.R.V.I.S. AI engines
 *   routes/authRoutes.js       — POST /api/auth/*
 *   routes/catalogRoutes.js    — GET|POST /api/catalog/*
 *   routes/settingsRoutes.js   — GET|POST /api/settings/*
 *   routes/jarvisRoutes.js     — GET|POST /api/jarvis/* + /api/version + /api/health
 */

console.log('[Boot] Vaciando cache de Docker...');

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import fs from 'fs';
import path from 'path';

import {
  PROJECT_ROOT,
  UPLOADS_DIR,
  FRANCHISES_DIR,
  JARVIS_REFS,
  DIST_DIR
} from './config/paths.js';

import authRoutes     from './routes/authRoutes.js';
import catalogRoutes  from './routes/catalogRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import jarvisRoutes   from './routes/jarvisRoutes.js';

import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// ── App bootstrap ─────────────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3000;

// Enable HTTP Gzip/Brotli compression for ultra-fast payload delivery
app.use(compression());

// Trust reverse proxy (Dokploy / Traefik / Nginx) for accurate client IP rate limiting
app.set('trust proxy', 1);

// Helmet security headers with explicit Cloud CSP Directives (CWE-693 Mitigation)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://storage.googleapis.com", "https://*.googleusercontent.com"],
      connectSrc: ["'self'", "https://storage.googleapis.com", "https://generativelanguage.googleapis.com", "https://oauth2.googleapis.com", "https://*.firebaseio.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    }
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({ origin: true, credentials: true }));

// ── Granular Body Parsing (CWE-400 DoS Mitigation) ───────────────────────────
// Elevated limit strictly for admin image upload / catalog persist endpoints
app.use('/api/catalog/upload', express.json({ limit: '50mb' }));
app.use('/api/catalog/save', express.json({ limit: '50mb' }));
app.use('/api/catalog/posters', express.json({ limit: '50mb' }));

// Reduced global body limit for all public and general API routes
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Static image files (served directly from VPS disk with 30-day cache) ─────
app.use('/posters/uploads', express.static(UPLOADS_DIR,                                    { maxAge: '30d' }));
app.use('/posters',         express.static(path.resolve(PROJECT_ROOT, 'public/posters'),   { maxAge: '30d' }));
app.use('/franchises',      express.static(FRANCHISES_DIR,                                 { maxAge: '30d' }));
app.use('/jarvis/references', express.static(JARVIS_REFS,                                  { maxAge: '30d' }));

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api', authRoutes);
app.use('/api', catalogRoutes);
app.use('/api', settingsRoutes);
app.use('/api', jarvisRoutes);

// ── Manejo de errores centralizado ────────────────────────────────────────────
// IMPORTANTE: Estos dos middlewares van SIEMPRE al final de las rutas API.
// notFoundHandler captura cualquier ruta /api/* inexistente y genera un 404 limpio.
// errorHandler es el receptor final de todos los errores (next(err)) del servidor.
app.use('/api', notFoundHandler);
app.use(errorHandler);

// ── Static assets from public/ and dist/ ─────────────────────────────────────
app.use(express.static(path.resolve(PROJECT_ROOT, 'public'), { maxAge: '30d' }));

if (fs.existsSync(DIST_DIR)) {
  // Hashed assets in /assets/ (immutable — 1 year)
  app.use('/assets', express.static(path.resolve(DIST_DIR, 'assets'), {
    maxAge:      '1y',
    immutable:   true,
    fallthrough: false
  }));

  // Never return index.html for missing .js / .css / .webp assets (prevents MIME type errors)
  app.use('/assets', (req, res) => {
    res.status(404).send('Asset not found');
  });

  // Root static files from dist — no cache on HTML
  app.use(express.static(DIST_DIR, {
    maxAge: '1d',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma',        'no-cache');
        res.setHeader('Expires',       '0');
      }
    }
  }));

  // SPA fallback for all client-side HTML routes (strictly no-cache)
  app.use((req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma',        'no-cache');
    res.setHeader('Expires',       '0');
    res.sendFile(path.resolve(DIST_DIR, 'index.html'));
  });
}

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [Deco Vintage Server] Running on http://0.0.0.0:${PORT} on VPS Hostinger 100 GB SSD.`);
});
