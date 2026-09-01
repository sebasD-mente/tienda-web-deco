/**
 * services/gcsService.js
 * Google Cloud Storage integration for Deco Vintage Guate.
 * Handles uploading optimized WebP image buffers to GCS bucket.
 * 
 * Supports authentication via:
 *   1. GCS_CREDENTIALS_BASE64 (Base64-encoded application_default_credentials.json or Service Account JSON)
 *   2. GCS_CREDENTIALS (raw JSON string)
 *   3. GOOGLE_APPLICATION_CREDENTIALS (file path)
 *   4. Individual env vars (GCS_CLIENT_EMAIL, GCS_PRIVATE_KEY, GCS_PROJECT_ID)
 *   5. Standard Google Cloud ADC auto-discovery
 */

import { Storage } from '@google-cloud/storage';

const rawBucketName = process.env.GCS_BUCKET_NAME || 'decovintage-master-media';
const BUCKET_NAME = rawBucketName.trim().replace(/^gs:\/\//, '').replace(/\/+$/, '');

let storageClient = null;

/**
 * Initializes and returns the Google Cloud Storage client singleton.
 * @returns {Storage}
 * @throws {Error} If credentials cannot be parsed or client fails to initialize.
 */
export function getStorageClient() {
  if (storageClient) return storageClient;

  const options = {};

  if (process.env.GCS_PROJECT_ID) {
    options.projectId = process.env.GCS_PROJECT_ID.trim();
  }

  // 1. Base64-encoded or raw JSON credentials (cleanest for Dokploy / Docker)
  const credsBase64 = process.env.GCS_CREDENTIALS_BASE64;
  const credsJson = process.env.GCS_CREDENTIALS;

  if (credsBase64 && credsBase64.trim().length > 0) {
    try {
      const sanitized = credsBase64.trim().replace(/^['"]|['"]$/g, '');
      let jsonString;
      if (sanitized.startsWith('{')) {
        // Raw JSON was pasted directly into the env var
        jsonString = sanitized;
      } else {
        // Decode Base64 (stripping any extraneous whitespace or line breaks)
        const cleanBase64 = sanitized.replace(/\s+/g, '');
        jsonString = Buffer.from(cleanBase64, 'base64').toString('utf-8');
      }

      const parsedCreds = JSON.parse(jsonString);
      if (parsedCreds.private_key && typeof parsedCreds.private_key === 'string') {
        parsedCreds.private_key = parsedCreds.private_key.replace(/\\n/g, '\n');
      }

      options.credentials = parsedCreds;
      if ((parsedCreds.project_id || parsedCreds.quota_project_id) && !options.projectId) {
        options.projectId = parsedCreds.project_id || parsedCreds.quota_project_id;
      }
      console.log(`[GCS Init] ✅ Loaded credentials from GCS_CREDENTIALS_BASE64 (Project: ${options.projectId || 'auto'})`);
    } catch (err) {
      console.error('[GCS Init Error] ❌ Critical failure parsing GCS_CREDENTIALS_BASE64:', err.message);
      throw new Error(`[GCS Credentials Error] No se pudo parsear GCS_CREDENTIALS_BASE64: ${err.message}`);
    }
  } else if (credsJson && credsJson.trim().length > 0) {
    try {
      const parsedCreds = JSON.parse(credsJson.trim());
      if (parsedCreds.private_key && typeof parsedCreds.private_key === 'string') {
        parsedCreds.private_key = parsedCreds.private_key.replace(/\\n/g, '\n');
      }
      options.credentials = parsedCreds;
      if ((parsedCreds.project_id || parsedCreds.quota_project_id) && !options.projectId) {
        options.projectId = parsedCreds.project_id || parsedCreds.quota_project_id;
      }
      console.log(`[GCS Init] ✅ Loaded credentials from GCS_CREDENTIALS (Project: ${options.projectId || 'auto'})`);
    } catch (err) {
      console.error('[GCS Init Error] ❌ Critical failure parsing GCS_CREDENTIALS JSON:', err.message);
      throw new Error(`[GCS Credentials Error] No se pudo parsear GCS_CREDENTIALS: ${err.message}`);
    }
  }
  // 2. Individual Service Account env variables
  else if (process.env.GCS_CLIENT_EMAIL && process.env.GCS_PRIVATE_KEY) {
    options.credentials = {
      client_email: process.env.GCS_CLIENT_EMAIL.trim(),
      private_key: process.env.GCS_PRIVATE_KEY.trim().replace(/\\n/g, '\n'),
    };
    console.log(`[GCS Init] ✅ Loaded credentials from individual GCS_CLIENT_EMAIL / GCS_PRIVATE_KEY env vars`);
  }

  try {
    storageClient = new Storage(options);
    return storageClient;
  } catch (err) {
    console.error('[GCS Init Error] ❌ Failed to instantiate Google Cloud Storage client:', err.message);
    throw err;
  }
}

/**
 * Checks if Google Cloud Storage is configured or required.
 * @returns {boolean}
 */
export function isGcsConfigured() {
  const hasBase64 = !!(process.env.GCS_CREDENTIALS_BASE64 && process.env.GCS_CREDENTIALS_BASE64.trim().length > 0);
  const hasJson = !!(process.env.GCS_CREDENTIALS && process.env.GCS_CREDENTIALS.trim().length > 0);
  const hasAppCreds = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const hasIndividual = !!(process.env.GCS_CLIENT_EMAIL && process.env.GCS_PRIVATE_KEY);
  const isProd = process.env.NODE_ENV === 'production';

  return hasBase64 || hasJson || hasAppCreds || hasIndividual || isProd;
}

/**
 * Uploads a buffer to Google Cloud Storage with public cache headers and returns its public URL.
 * FAIL-FAST: Throws on any upload failure without silent local fallback.
 * 
 * @param {Buffer} buffer - Image binary buffer
 * @param {string} destinationPath - Path inside bucket (e.g. 'posters/full/obra-1.webp')
 * @param {string} contentType - MIME type (e.g. 'image/webp')
 * @returns {Promise<string>} Public HTTP URL of the uploaded object
 */
export async function uploadBufferToGCS(buffer, destinationPath, contentType = 'image/webp') {
  const client = getStorageClient();
  if (!client) {
    throw new Error('Google Cloud Storage client is not initialized.');
  }

  const bucket = client.bucket(BUCKET_NAME);
  const file = bucket.file(destinationPath);

  await file.save(buffer, {
    metadata: {
      contentType,
      cacheControl: 'public, max-age=31536000, immutable',
    },
    resumable: false,
  });

  const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${destinationPath}`;
  console.log(`[GCS Storage] ☁️ Uploaded to Google Cloud Storage: ${publicUrl}`);
  return publicUrl;
}

/**
 * Deletes an object from Google Cloud Storage if the URL/path belongs to GCS.
 * 
 * @param {string} gcsUrlOrPath - Public URL (https://storage.googleapis.com/...) or destination path inside bucket.
 * @returns {Promise<boolean>} True if deleted or ignored cleanly.
 */
export async function deleteFromGCS(gcsUrlOrPath) {
  if (!gcsUrlOrPath || typeof gcsUrlOrPath !== 'string') return false;

  try {
    const client = getStorageClient();
    if (!client) return false;

    let filePath = gcsUrlOrPath;
    const prefix = `https://storage.googleapis.com/${BUCKET_NAME}/`;
    if (gcsUrlOrPath.startsWith(prefix)) {
      filePath = gcsUrlOrPath.slice(prefix.length);
    } else if (gcsUrlOrPath.startsWith('https://storage.googleapis.com/')) {
      const parts = gcsUrlOrPath.replace('https://storage.googleapis.com/', '').split('/');
      parts.shift(); // remove bucket
      filePath = parts.join('/');
    }

    const bucket = client.bucket(BUCKET_NAME);
    const file = bucket.file(filePath);
    const [exists] = await file.exists();
    if (exists) {
      await file.delete();
      console.log(`[GCS Storage] 🗑️ Deleted object from Google Cloud Storage: ${filePath}`);
      return true;
    }
    return false;
  } catch (err) {
    console.warn('[GCS Storage] Warning deleting object from GCS (non-fatal):', err.message);
    return false;
  }
}

export { BUCKET_NAME };
