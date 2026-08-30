/**
 * services/catalogService.js
 * All disk I/O for the catalog (read + atomic write).
 * Extracted from server.js lines 132–146 (getCatalogData) and the
 * inline write logic in POST /api/catalog/save and POST /api/settings/save.
 *
 * CRITICAL: CATALOG_FILE path is tied to a Docker persistent volume — never alter.
 */

import fs from 'fs';
import { CATALOG_FILE } from '../config/paths.js';

// ── Read ─────────────────────────────────────────────────────────────────────

/**
 * Reads and parses catalogStore.json from the VPS SSD.
 * Handles BOM (0xFEFF) and returns a safe default if the file is missing or corrupt.
 *
 * @returns {{ categories: any[], franchises: any[], posters: any[], settings: object }}
 */
export function getCatalogData() {
  if (fs.existsSync(CATALOG_FILE)) {
    try {
      let raw = fs.readFileSync(CATALOG_FILE, 'utf-8');
      if (raw.charCodeAt(0) === 0xFEFF) {
        raw = raw.slice(1);
      }
      return JSON.parse(raw.trim());
    } catch (err) {
      console.error('[Deco Catalog] Error parsing catalog JSON:', err.message);
    }
  }
  return { categories: [], franchises: [], posters: [], settings: { whatsappPhone: '50238375078' } };
}

// ── Write (atomic) ───────────────────────────────────────────────────────────

/**
 * Atomically persists a catalog object to disk using a .tmp → rename strategy.
 * This guarantees the file is never left in a corrupt/partial state on the VPS SSD.
 *
 * @param {object} dataObject - The full catalog object to save.
 * @returns {void}
 */
export function saveCatalog(dataObject) {
  const tmpFile = `${CATALOG_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(dataObject, null, 2), 'utf-8');
  fs.renameSync(tmpFile, CATALOG_FILE);
}
