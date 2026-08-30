/**
 * services/imageService.js
 * Image processing with Sharp — converts base64/buffer to WebP files on disk.
 * Extracted from server.js lines 217–233 (inline in catalog/save) and
 * lines 271–307 (catalog/upload handler).
 *
 * CRITICAL: UPLOADS_FULL and UPLOADS_THUMB paths are tied to Docker
 * persistent volumes on the VPS SSD — never alter.
 */

import path from 'path';
import sharp from 'sharp';
import { UPLOADS_FULL, UPLOADS_THUMB } from '../config/paths.js';

// ── Core image processor ─────────────────────────────────────────────────────

/**
 * Converts a raw image buffer into two WebP files on the VPS SSD:
 * a full-resolution file (max 1400×1400px, 86% quality) and
 * a thumbnail (max 480×480px, 78% quality).
 *
 * @param {Buffer} buffer    - Raw image data (from base64 or upload).
 * @param {string} cleanId   - Sanitized identifier used to build the filename
 *                             (e.g. "obra-dragon-ball-z").
 * @returns {Promise<{ image: string, thumb: string }>}
 *          URL paths relative to the server root (e.g. "/posters/uploads/full/...").
 */
export async function processImageBuffer(buffer, cleanId) {
  const baseFileName = `${cleanId}-${Date.now().toString().slice(-4)}.webp`;
  const fullDest  = path.resolve(UPLOADS_FULL,  baseFileName);
  const thumbDest = path.resolve(UPLOADS_THUMB, baseFileName);

  // Full High-Res (Max 1400×1400px, 86% WebP)
  await sharp(buffer)
    .resize(1400, 1400, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 86 })
    .toFile(fullDest);

  // Fast Thumbnail (Max 480×480px, 78% WebP)
  await sharp(buffer)
    .resize(480, 480, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(thumbDest);

  console.log(`[VPS Storage] Created physical WebP files on SSD: ${baseFileName}`);

  return {
    image: `/posters/uploads/full/${baseFileName}`,
    thumb: `/posters/uploads/thumb/${baseFileName}`
  };
}

// ── Helper: base64 data URL → Buffer ────────────────────────────────────────

/**
 * Strips the data-URL prefix from a base64 string and returns a Buffer.
 * @param {string} dataUrl - e.g. "data:image/jpeg;base64,/9j/4AAQ..."
 * @returns {Buffer}
 */
export function dataUrlToBuffer(dataUrl) {
  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}
