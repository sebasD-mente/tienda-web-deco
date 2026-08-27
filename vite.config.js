import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Custom Vite plugin to handle disk persistence and physical image optimization
function catalogApiPlugin() {
  const dataDir = path.resolve(__dirname, 'src/data');
  const catalogStorePath = path.resolve(dataDir, 'catalogStore.json');
  const jarvisConfigPath = path.resolve(dataDir, 'jarvisConfig.json');
  const publicUploadsThumb = path.resolve(__dirname, 'public/posters/uploads/thumb');
  const publicUploadsFull = path.resolve(__dirname, 'public/posters/uploads/full');
  const publicJarvisRefs = path.resolve(__dirname, 'public/jarvis/references');

  // Ensure directories exist
  [publicUploadsThumb, publicUploadsFull, publicJarvisRefs, dataDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

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
              
              // Also sync catalogData.js for seamless static exports
              try {
                const catalogDataPath = path.resolve(dataDir, 'catalogData.js');
                const esmContent = `// Official 6 Sizes and Pricing Matrix (in Quetzales)
export const OFFICIAL_SIZES = [
  { id: 'MINI', name: 'Mini', dimensions: '14 x 21 cm', widthCm: 14, heightCm: 21, price: 25.00, badge: 'Ideal para coleccionar y escritorios' },
  { id: 'PEQUENO', name: 'Pequeño', dimensions: '21 x 27 cm', widthCm: 21, heightCm: 27, price: 35.00, badge: 'Espacios reducidos y cabeceras' },
  { id: 'PORTADA_ALBUM', name: 'Portada de Álbum', dimensions: '30 x 30 cm', widthCm: 30, heightCm: 30, price: 55.00, badge: 'Formato vinilo cuadrado para música' },
  { id: 'MEDIANO', name: 'Mediano', dimensions: '30 x 45 cm', widthCm: 30, heightCm: 45, price: 65.00, badge: '⭐ El más vendido para habitaciones' },
  { id: 'GRANDE', name: 'Grande', dimensions: '45 x 60 cm', widthCm: 45, heightCm: 60, price: 125.00, badge: 'Protagonista para salas y oficinas' },
  { id: 'GIGANTE', name: 'Gigante', dimensions: '60 x 100 cm', widthCm: 60, heightCm: 100, price: 210.00, badge: 'Impacto visual monumental' }
];

export const CATEGORIES = ${JSON.stringify(categories || [], null, 2)};

export const ROOM_ENVIRONMENTS = [
  { id: 'LIVING', name: 'Sala de Estar', wallColor: '#1a1f2c', bgGradient: 'radial-gradient(circle at center, #242c3d 0%, #121620 100%)' },
  { id: 'GAMER', name: 'Setup Gamer', wallColor: '#0e1320', bgGradient: 'radial-gradient(circle at center, #1c1538 0%, #080a14 100%)' },
  { id: 'OFFICE', name: 'Oficina / Estudio', wallColor: '#202428', bgGradient: 'radial-gradient(circle at center, #2c3238 0%, #14171a 100%)' },
  { id: 'BEDROOM', name: 'Habitación', wallColor: '#161922', bgGradient: 'radial-gradient(circle at center, #222938 0%, #0d1017 100%)' }
];

export const CATALOG_POSTERS = ${JSON.stringify(posters || [], null, 2)};

export const INITIAL_FRANCHISES = ${JSON.stringify(franchises || [], null, 2)};
`;
                fs.writeFileSync(catalogDataPath, esmContent, 'utf-8');
              } catch (syncErr) {
                console.warn('[Deco Storage] Non-fatal sync to catalogData.js:', syncErr);
              }

              console.log(`[Deco Storage] Persisted ${posters.length} posters directly to physical disk and synced catalogData.js.`);
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
              .webp({ quality: 88 })
              .toFile(fullDestPath);

            // 2. Thumbnail Version (max 480px, 80% quality)
            await sharp(buffer)
              .resize(480, 480, { fit: 'inside', withoutEnlargement: true })
              .webp({ quality: 80 })
              .toFile(thumbDestPath);

            console.log(`[Deco Image Engine] Generated physical WebP files on disk: ${baseFileName}`);
            res.statusCode = 200;
            res.end(JSON.stringify({
              success: true,
              imageFull: `/posters/uploads/full/${baseFileName}`,
              imageThumb: `/posters/uploads/thumb/${baseFileName}`
            }));
          } catch (err) {
            console.error('[Deco Storage Error] Failed to process image upload:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
          return;
        }

        // 4. GET /api/jarvis (Load Jarvis training memory)
        if (url === '/api/jarvis' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          try {
            if (fs.existsSync(jarvisConfigPath)) {
              const raw = fs.readFileSync(jarvisConfigPath, 'utf-8');
              res.statusCode = 200;
              res.end(raw);
            } else {
              res.statusCode = 200;
              res.end(JSON.stringify({}));
            }
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // 5. POST /api/jarvis/save (Persist Jarvis memory to SSD)
        if (url === '/api/jarvis/save' && req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json');
          try {
            const payload = await readBody(req);
            const dataToSave = {
              updatedAt: new Date().toISOString(),
              ...payload
            };
            fs.writeFileSync(jarvisConfigPath, JSON.stringify(dataToSave, null, 2), 'utf-8');
            console.log('[Deco Jarvis] Persisted Jarvis training memory to SSD.');
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true }));
          } catch (err) {
            console.error('[Deco Jarvis Error] Failed to persist Jarvis memory:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
          return;
        }

        // 6. POST /api/jarvis/upload (Upload reference images for Jarvis)
        if (url === '/api/jarvis/upload' && req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json');
          try {
            const { dataUrl, title } = await readBody(req);
            if (!dataUrl) {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: 'Missing dataUrl' }));
              return;
            }
            const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            const cleanTitle = (title || 'ref-' + Date.now()).toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const fileName = `${cleanTitle}-${Date.now().toString().slice(-4)}.webp`;
            const destPath = path.resolve(publicJarvisRefs, fileName);

            await sharp(buffer)
              .resize(1000, 1000, { fit: 'inside', withoutEnlargement: true })
              .webp({ quality: 85 })
              .toFile(destPath);

            res.statusCode = 200;
            res.end(JSON.stringify({
              success: true,
              url: `/jarvis/references/${fileName}`
            }));
          } catch (err) {
            console.error('[Deco Jarvis Error] Failed to process reference image:', err);
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
  },
  build: {
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'lucide-react'],
          gemini: ['@google/generative-ai'],
          firebase: ['firebase/app', 'firebase/firestore']
        }
      }
    }
  }
});
