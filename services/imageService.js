/**
 * services/imageService.js
 * 100% Stateless Image Processor — RAM Buffer & Google Cloud Storage ONLY.
 * 
 * ZERO SSD / LOCAL DISK STORAGE.
 * Sharp processes the image in memory and uploads directly to Google Cloud Storage.
 */

import sharp from 'sharp';
import { uploadBufferToGCS } from './gcsService.js';

/**
 * Converts a raw image buffer into two optimized WebP buffers in RAM
 * and uploads them directly to Google Cloud Storage:
 *   - Full-resolution (max 1400×1400px, 86% quality WebP)
 *   - Thumbnail (max 480×480px, 78% quality WebP)
 *
 * @param {Buffer} buffer    - Raw image binary data (from multer.memoryStorage or base64).
 * @param {string} cleanId   - Sanitized identifier used to build the filename
 *                             (e.g. "obra-dragon-ball-z").
 * @returns {Promise<{ image: string, thumb: string }>}
 *          Public Google Cloud Storage URLs (https://storage.googleapis.com/...).
 */
export async function processImageBuffer(buffer, cleanId) {
  const baseFileName = `${cleanId}-${Date.now().toString().slice(-4)}.webp`;

  // 1. Process High-Res (Max 1400×1400px, 86% WebP) in RAM Memory Buffer
  const fullBuffer = await sharp(buffer)
    .resize(1400, 1400, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 86 })
    .toBuffer();

  // 2. Process Fast Thumbnail (Max 480×480px, 78% WebP) in RAM Memory Buffer
  const thumbBuffer = await sharp(buffer)
    .resize(480, 480, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 78 })
    .toBuffer();

  // 3. Upload Directly to Google Cloud Storage (Stateless Memory Gateway)
  const [fullUrl, thumbUrl] = await Promise.all([
    uploadBufferToGCS(fullBuffer, `posters/full/${baseFileName}`, 'image/webp'),
    uploadBufferToGCS(thumbBuffer, `posters/thumb/${baseFileName}`, 'image/webp'),
  ]);

  console.log(`[Storage Gateway] ☁️ Pure Stateless upload to Google Cloud Storage: ${baseFileName}`);

  return {
    image: fullUrl,
    thumb: thumbUrl,
  };
}

/**
 * Strips the data-URL prefix from a base64 string and returns a Buffer.
 * @param {string} dataUrl - e.g. "data:image/jpeg;base64,/9j/4AAQ..."
 * @returns {Buffer}
 */
export function dataUrlToBuffer(dataUrl) {
  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}
