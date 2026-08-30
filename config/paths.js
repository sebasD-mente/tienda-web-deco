/**
 * config/paths.js
 * Central registry of all filesystem paths used by the server.
 * These paths are tied to Docker persistent volumes on the VPS — DO NOT ALTER.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
// config/ is one level deep — resolve to project root
export const PROJECT_ROOT = path.resolve(path.dirname(__filename), '..');

// ── Data persistence (Docker volume) ────────────────────────────────────────
export const DATA_DIR     = path.resolve(PROJECT_ROOT, 'data');
export const CATALOG_FILE = path.resolve(DATA_DIR, 'catalogStore.json'); // ← SACRED
export const JARVIS_FILE  = path.resolve(DATA_DIR, 'jarvisConfig.json'); // ← SACRED

// ── Image storage (Docker volume) ────────────────────────────────────────────
export const UPLOADS_DIR   = path.resolve(PROJECT_ROOT, 'public/posters/uploads'); // ← SACRED
export const UPLOADS_FULL  = path.resolve(UPLOADS_DIR, 'full');
export const UPLOADS_THUMB = path.resolve(UPLOADS_DIR, 'thumb');

// ── Other public asset directories ──────────────────────────────────────────
export const FRANCHISES_DIR = path.resolve(PROJECT_ROOT, 'public/franchises');
export const JARVIS_REFS    = path.resolve(PROJECT_ROOT, 'public/jarvis/references');

// ── Frontend build output ────────────────────────────────────────────────────
export const DIST_DIR = path.resolve(PROJECT_ROOT, 'dist');

// ── Ensure all required directories exist on VPS 100 GB SSD ─────────────────
[DATA_DIR, UPLOADS_DIR, UPLOADS_FULL, UPLOADS_THUMB, FRANCHISES_DIR, JARVIS_REFS].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});
