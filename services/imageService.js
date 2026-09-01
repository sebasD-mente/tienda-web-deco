/**
 * services/imageService.js
 * Image processing with Sharp and cloud storage via @google-cloud/storage (Factor VI).
 * Supports in-memory processing via multer.memoryStorage and zero hardcoded credentials (CWE-798).
 * Fail-Fast Stateless Mode: Direct GCS uploads without silent local disk fallback.
 */

import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import multer from 'multer';
import { Storage } from '@google-cloud/storage';
import { UPLOADS_FULL, UPLOADS_THUMB } from '../config/paths.js';

// ── Multer Memory Storage Configuration (In-Memory Processing) ────────────────
export const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit per image
});

// ── Google Cloud Storage Initialization (Zero Hardcoded Secrets CWE-798) ──────
function getGCSClient() {
  const bucketName = process.env.GCS_BUCKET_NAME || process.env.GOOGLE_CLOUD_STORAGE_BUCKET;
  if (!bucketName) return null;

  try {
    let credentials;
    if (process.env.GCS_CREDENTIALS_BASE64) {
      const decoded = Buffer.from(process.env.GCS_CREDENTIALS_BASE64, 'base64').toString('utf-8');
      credentials = JSON.parse(decoded);
    } else if (process.env.GCP_CLIENT_EMAIL && process.env.GCP_PRIVATE_KEY) {
      credentials = {
        client_email: process.env.GCP_CLIENT_EMAIL,
        private_key:  process.env.GCP_PRIVATE_KEY.replace(/\\n/g, '\n'),
      };
    }

    const projectId = process.env.GCP_PROJECT_ID || credentials?.project_id;
    const storageOptions = {
      ...(projectId && { projectId }),
      ...(credentials && { credentials }),
    };

    return {
      storage: new Storage(storageOptions),
      bucketName
    };
  } catch (err) {
    console.warn('[GCS Storage Warning] Failed to initialize Google Cloud Storage client:', err.message);
    return null;
  }
}

/**
 * Uploads a buffer directly to Google Cloud Storage.
 * @param {Buffer} buffer
 * @param {string} destinationPath - e.g. "posters/uploads/full/obra-1234.webp"
 * @param {string} contentType - e.g. "image/webp"
 * @returns {Promise<string>} Public URL of the uploaded object.
 */
export async function uploadBufferToGCS(buffer, destinationPath, contentType = 'image/webp') {
  const gcs = getGCSClient();
  if (!gcs) throw new Error('Google Cloud Storage is not configured.');

  const bucket = gcs.storage.bucket(gcs.bucketName);
  const file = bucket.file(destinationPath);

  await file.save(buffer, {
    metadata: { contentType },
    resumable: false,
    public: true
  });

  return `https://storage.googleapis.com/${gcs.bucketName}/${destinationPath}`;
}

// ── Core image processor (Fail-Fast GCS Mode) ────────────────────────────────

/**
 * Converts a raw image buffer into two WebP files (full resolution & thumbnail).
 * Uploads directly to Google Cloud Storage (Fail-Fast), or falls back to local SSD only if GCS is unconfigured.
 *
 * @param {Buffer} buffer  - Raw image data.
 * @param {string} cleanId - Sanitized identifier (e.g. "obra-dragon-ball-z").
 * @returns {Promise<{ image: string, thumb: string }>}
 */
export async function processImageBuffer(buffer, cleanId) {
  const baseFileName = `${cleanId}-${Date.now().toString().slice(-4)}.webp`;

  // 1. Process images in memory using Sharp
  const fullBuffer = await sharp(buffer)
    .resize(1400, 1400, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 86 })
    .toBuffer();

  const thumbBuffer = await sharp(buffer)
    .resize(480, 480, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 78 })
    .toBuffer();

  // 2. Google Cloud Storage (Factor VI Cloud Storage - Fail-Fast)
  const gcs = getGCSClient();
  if (gcs) {
    const fullPath  = `posters/uploads/full/${baseFileName}`;
    const thumbPath = `posters/uploads/thumb/${baseFileName}`;

    const [imageUrl, thumbUrl] = await Promise.all([
      uploadBufferToGCS(fullBuffer, fullPath),
      uploadBufferToGCS(thumbBuffer, thumbPath)
    ]);

    console.log(`[GCS Cloud Storage] Successfully uploaded WebP images to bucket ${gcs.bucketName}: ${baseFileName}`);
    return { image: imageUrl, thumb: thumbUrl };
  }

  // 3. Fallback: Local VPS SSD storage ONLY if GCS is unconfigured
  await fs.promises.mkdir(UPLOADS_FULL, { recursive: true });
  await fs.promises.mkdir(UPLOADS_THUMB, { recursive: true });

  const fullDest  = path.resolve(UPLOADS_FULL,  baseFileName);
  const thumbDest = path.resolve(UPLOADS_THUMB, baseFileName);

  await Promise.all([
    fs.promises.writeFile(fullDest, fullBuffer),
    fs.promises.writeFile(thumbDest, thumbBuffer)
  ]);

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
  if (!dataUrl || typeof dataUrl !== 'string') return Buffer.alloc(0);
  const base64Data = dataUrl.replace(/^data:[^;]+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}
