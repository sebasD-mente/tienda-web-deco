/**
 * services/imageService.js
 * 100% Stateless Image Processor — RAM Buffer & Google Cloud Storage ONLY.
 * 
 * BLINDAJE DE MEMORIA (FASE 1):
 * - Semáforo de concurrencia nativo: Máximo 2 operaciones simultáneas de Sharp
 *   para erradicar picos de memoria Heap y riesgo de OOM Killer.
 * - Liberación explícita de buffers intermedios en RAM tras la subida a GCS.
 * - ZERO SSD / LOCAL DISK STORAGE.
 */

import sharp from 'sharp';
import { uploadBufferToGCS } from './gcsService.js';

// ── Semáforo de concurrencia nativo para Sharp (Límite 2 simultáneos) ─────────
const MAX_CONCURRENT_SHARP = 2;
let activeSharpJobs = 0;
const sharpQueue = [];

function acquireSharpSlot() {
  if (activeSharpJobs < MAX_CONCURRENT_SHARP) {
    activeSharpJobs++;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    sharpQueue.push(resolve);
  });
}

function releaseSharpSlot() {
  activeSharpJobs--;
  if (sharpQueue.length > 0) {
    activeSharpJobs++;
    const nextJob = sharpQueue.shift();
    nextJob();
  }
}

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

  // 1. Adquirir slot del semáforo para no saturar memoria RAM con Sharp
  await acquireSharpSlot();
  let fullBuffer = null;
  let thumbBuffer = null;

  try {
    // 1.1. Process High-Res (Max 1400×1400px, 86% WebP) in RAM Memory Buffer
    fullBuffer = await sharp(buffer)
      .resize(1400, 1400, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 86 })
      .toBuffer();

    // 1.2. Process Fast Thumbnail (Max 480×480px, 78% WebP) in RAM Memory Buffer
    thumbBuffer = await sharp(buffer)
      .resize(480, 480, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer();
  } finally {
    // Liberar inmediatamente el slot de Sharp tan pronto termina la descompresión/compresión
    releaseSharpSlot();
  }

  // 2. Upload Directly to Google Cloud Storage (Stateless Memory Gateway)
  let fullUrl = '';
  let thumbUrl = '';

  try {
    const results = await Promise.all([
      uploadBufferToGCS(fullBuffer, `posters/full/${baseFileName}`, 'image/webp'),
      uploadBufferToGCS(thumbBuffer, `posters/thumb/${baseFileName}`, 'image/webp'),
    ]);
    fullUrl = results[0];
    thumbUrl = results[1];
  } finally {
    // 3. Liberación explícita de referencias a buffers para facilitar recolección de basura (GC)
    fullBuffer = null;
    thumbBuffer = null;
  }

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
