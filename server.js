/**
 * Deco Vintage Guate - Production Backend Server (Node.js + Express + Sharp)
 * Runs on VPS (145.223.120.56) utilizing the 100 GB SSD storage.
 */

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// High body limit for image uploads
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Paths on VPS Disk
const DATA_DIR = path.resolve(__dirname, 'data');
const CATALOG_FILE = path.resolve(DATA_DIR, 'catalogStore.json');
const JARVIS_FILE = path.resolve(DATA_DIR, 'jarvisConfig.json');
const UPLOADS_DIR = path.resolve(__dirname, 'public/posters/uploads');
const UPLOADS_FULL = path.resolve(UPLOADS_DIR, 'full');
const UPLOADS_THUMB = path.resolve(UPLOADS_DIR, 'thumb');
const JARVIS_REFS = path.resolve(__dirname, 'public/jarvis/references');

// Ensure directories exist on VPS 100 GB SSD
[DATA_DIR, UPLOADS_DIR, UPLOADS_FULL, UPLOADS_THUMB, JARVIS_REFS].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Serve static images directly
app.use('/posters/uploads', express.static(UPLOADS_DIR));
app.use('/jarvis/references', express.static(JARVIS_REFS));

// 1. GET /api/catalog
app.get('/api/catalog', (req, res) => {
  try {
    if (fs.existsSync(CATALOG_FILE)) {
      const raw = fs.readFileSync(CATALOG_FILE, 'utf-8');
      return res.status(200).json(JSON.parse(raw));
    }
    return res.status(200).json({ categories: [], franchises: [], posters: [] });
  } catch (err) {
    console.error('[API Error] GET /api/catalog:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 2. POST /api/catalog/save
app.post('/api/catalog/save', (req, res) => {
  try {
    const { categories, posters, franchises } = req.body;
    if (!Array.isArray(posters)) {
      return res.status(400).json({ error: 'posters must be an array' });
    }

    const dataToSave = {
      updatedAt: new Date().toISOString(),
      categories: categories || [],
      franchises: franchises || [],
      posters: posters || []
    };

    fs.writeFileSync(CATALOG_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    console.log(`[VPS Disk] Saved ${posters.length} posters to 100 GB SSD.`);
    return res.status(200).json({ success: true, count: posters.length });
  } catch (err) {
    console.error('[API Error] POST /api/catalog/save:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 3. POST /api/catalog/upload
app.post('/api/catalog/upload', async (req, res) => {
  try {
    const { dataUrl, fileName, posterId } = req.body;
    if (!dataUrl) {
      return res.status(400).json({ error: 'Missing dataUrl' });
    }

    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const cleanId = (posterId || 'obra-' + Date.now()).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const baseFileName = `${cleanId}-${Date.now().toString().slice(-4)}.webp`;

    const fullDest = path.resolve(UPLOADS_FULL, baseFileName);
    const thumbDest = path.resolve(UPLOADS_THUMB, baseFileName);

    // Full High-Res (max 1200px, 85% WebP)
    await sharp(buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(fullDest);

    // Fast Thumbnail (max 400px, 78% WebP)
    await sharp(buffer)
      .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(thumbDest);

    console.log(`[VPS Storage] Saved WebP files: ${baseFileName}`);
    return res.status(200).json({
      success: true,
      image: `/posters/uploads/full/${baseFileName}`,
      thumb: `/posters/uploads/thumb/${baseFileName}`
    });
  } catch (err) {
    console.error('[API Error] POST /api/catalog/upload:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 4. GET /api/jarvis
app.get('/api/jarvis', (req, res) => {
  try {
    if (fs.existsSync(JARVIS_FILE)) {
      const raw = fs.readFileSync(JARVIS_FILE, 'utf-8');
      return res.status(200).json(JSON.parse(raw));
    }
    return res.status(200).json({});
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 5. POST /api/jarvis/save
app.post('/api/jarvis/save', (req, res) => {
  try {
    const dataToSave = {
      updatedAt: new Date().toISOString(),
      ...req.body
    };
    fs.writeFileSync(JARVIS_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    console.log('[VPS Storage] Saved JARVIS memory to SSD.');
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 6. POST /api/jarvis/upload
app.post('/api/jarvis/upload', async (req, res) => {
  try {
    const { dataUrl, title } = req.body;
    if (!dataUrl) return res.status(400).json({ error: 'Missing dataUrl' });

    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const cleanTitle = (title || 'ref-' + Date.now()).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const fileName = `${cleanTitle}-${Date.now().toString().slice(-4)}.webp`;
    const destPath = path.resolve(JARVIS_REFS, fileName);

    await sharp(buffer)
      .resize(1000, 1000, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(destPath);

    return res.status(200).json({
      success: true,
      url: `/jarvis/references/${fileName}`
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), vps: true });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Deco Vintage Server] Running on http://0.0.0.0:${PORT} on VPS SSD.`);
});
