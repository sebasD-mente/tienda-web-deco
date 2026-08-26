import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

function catalogApiPlugin() {
  const dataDir = path.resolve(__dirname, 'src/data');
  const catalogStorePath = path.resolve(dataDir, 'catalogStore.json');
  const publicUploadsFull = path.resolve(__dirname, 'public/posters/uploads/full');
  const publicUploadsThumb = path.resolve(__dirname, 'public/posters/uploads/thumb');

  // Ensure upload and data folders exist
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(publicUploadsFull)) fs.mkdirSync(publicUploadsFull, { recursive: true });
  if (!fs.existsSync(publicUploadsThumb)) fs.mkdirSync(publicUploadsThumb, { recursive: true });

  const readBody = (req) => {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch (e) {
          reject(e);
        }
      });
      req.on('error', reject);
    });
  };

  return {
    name: 'deco-catalog-disk-persistence',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';

        // 1. GET /api/catalog
        if (url === '/api/catalog' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          try {
            if (fs.existsSync(catalogStorePath)) {
              const raw = fs.readFileSync(catalogStorePath, 'utf-8');
              res.statusCode = 200;
              res.end(raw);
            } else {
              res.statusCode = 200;
              res.end(JSON.stringify({ categories: [], posters: [] }));
            }
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // 2. POST /api/catalog/save (Physical SSD persistence)
        if (url === '/api/catalog/save' && req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json');
          try {
            const payload = await readBody(req);
            const { categories, posters, franchises } = payload;
            if (Array.isArray(posters)) {
              const dataToSave = {
                updatedAt: new Date().toISOString(),
                categories: categories || [],
                franchises: franchises || [],
                posters: posters || []
              };
              fs.writeFileSync(catalogStorePath, JSON.stringify(dataToSave, null, 2), 'utf-8');
              console.log(`[Deco Storage] Persisted ${posters.length} posters directly to physical disk.`);
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, count: posters.length }));
            } else {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: 'Invalid payload: posters array required' }));
            }
          } catch (err) {
            console.error('[Deco Storage Error] Failed to persist to disk:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
          return;
        }

        // 3. POST /api/catalog/upload (Saves real physical .webp files)
        if (url === '/api/catalog/upload' && req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json');
          try {
            const { dataUrl, fileName, posterId } = await readBody(req);
            if (!dataUrl) {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: 'Missing dataUrl' }));
              return;
            }

            const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            const cleanId = (posterId || 'obra-' + Date.now()).toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const baseFileName = `${cleanId}-${Date.now().toString().slice(-4)}.webp`;

            const fullDestPath = path.resolve(publicUploadsFull, baseFileName);
            const thumbDestPath = path.resolve(publicUploadsThumb, baseFileName);

            // 1. High-Res Full Version (max 1400px, 88% quality)
            await sharp(buffer)
              .resize(1400, 1400, { fit: 'inside', withoutEnlargement: true })
              .webp({ quality: 88, effort: 4 })
              .toFile(fullDestPath);

            // 2. Fast Thumb Version (max 480px, 80% quality)
            await sharp(buffer)
              .resize(480, 480, { fit: 'inside', withoutEnlargement: true })
              .webp({ quality: 80, effort: 4 })
              .toFile(thumbDestPath);

            const imageRelUrl = `/posters/uploads/full/${baseFileName}`;
            const thumbRelUrl = `/posters/uploads/thumb/${baseFileName}`;

            console.log(`[Deco Storage] Processed and saved permanent image files: ${imageRelUrl}`);

            res.statusCode = 200;
            res.end(JSON.stringify({
              success: true,
              image: imageRelUrl,
              thumb: thumbRelUrl
            }));
          } catch (err) {
            console.error('[Deco Storage Error] Failed to process image upload:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [
    react(),
    catalogApiPlugin()
  ],
  server: {
    port: 5173,
    host: true
  }
});
