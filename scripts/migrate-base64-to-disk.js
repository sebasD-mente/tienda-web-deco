import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const catalogStorePath = path.resolve(rootDir, 'src/data/catalogStore.json');
const vpsDataStorePath = path.resolve(rootDir, 'data/catalogStore.json');
const catalogDataPath = path.resolve(rootDir, 'src/data/catalogData.js');

const uploadsFullDir = path.resolve(rootDir, 'public/posters/uploads/full');
const uploadsThumbDir = path.resolve(rootDir, 'public/posters/uploads/thumb');
const franchisesDir = path.resolve(rootDir, 'public/franchises');

// Ensure directories exist
[uploadsFullDir, uploadsThumbDir, franchisesDir, path.resolve(rootDir, 'data')].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

async function migrateBase64ToDisk() {
  console.log('🔄 Starting Base64 to Physical WebP Migration on Disk...');
  
  if (!fs.existsSync(catalogStorePath)) {
    console.error('❌ catalogStore.json not found at:', catalogStorePath);
    return;
  }

  const raw = fs.readFileSync(catalogStorePath, 'utf-8');
  const catalog = JSON.parse(raw);

  let migratedPosters = 0;
  let migratedFranchises = 0;

  // 1. Process Franchises
  if (Array.isArray(catalog.franchises)) {
    for (const item of catalog.franchises) {
      if (item.img && item.img.startsWith('data:image')) {
        try {
          const base64Data = item.img.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          const cleanId = (item.id || 'franchise-' + Date.now()).toLowerCase().replace(/[^a-z0-9]+/g, '-');
          const fileName = `${cleanId}.webp`;
          const destPath = path.resolve(franchisesDir, fileName);

          await sharp(buffer)
            .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(destPath);

          item.img = `/franchises/${fileName}`;
          migratedFranchises++;
          console.log(`  ✅ Migrated franchise icon: ${item.name} -> /franchises/${fileName}`);
        } catch (err) {
          console.error(`  ❌ Error migrating franchise ${item.name}:`, err.message);
        }
      }
    }
  }

  // 2. Process Posters
  if (Array.isArray(catalog.posters)) {
    for (const poster of catalog.posters) {
      const cleanId = (poster.id || 'poster-' + Date.now()).toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const baseFileName = `${cleanId}.webp`;

      const fullDest = path.resolve(uploadsFullDir, baseFileName);
      const thumbDest = path.resolve(uploadsThumbDir, baseFileName);

      // Check if image is Base64
      if (poster.image && poster.image.startsWith('data:image')) {
        try {
          const base64Data = poster.image.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');

          // Full WebP (Max 1200x1200px, quality 85%)
          await sharp(buffer)
            .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 85 })
            .toFile(fullDest);

          // Thumb WebP (Max 400x400px, quality 78%)
          await sharp(buffer)
            .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 78 })
            .toFile(thumbDest);

          poster.image = `/posters/uploads/full/${baseFileName}`;
          poster.thumb = `/posters/uploads/thumb/${baseFileName}`;
          migratedPosters++;
          console.log(`  ✅ Migrated poster to disk: "${poster.title}" -> /posters/uploads/.../${baseFileName}`);
        } catch (err) {
          console.error(`  ❌ Error migrating poster ${poster.title}:`, err.message);
        }
      } else if (!poster.thumb && poster.image) {
        poster.thumb = poster.image;
      }
    }
  }

  // Ensure default store settings exist (including real WhatsApp number)
  if (!catalog.settings) {
    catalog.settings = {};
  }
  catalog.settings.whatsappPhone = catalog.settings.whatsappPhone || '50238375078';
  catalog.settings.updatedAt = new Date().toISOString();

  // Save back to JSON files
  fs.writeFileSync(catalogStorePath, JSON.stringify(catalog, null, 2), 'utf-8');
  fs.writeFileSync(vpsDataStorePath, JSON.stringify(catalog, null, 2), 'utf-8');
  console.log(`💾 Saved cleaned catalogStore.json (${migratedPosters} posters, ${migratedFranchises} franchises converted to disk WebP)`);

  // Generate lightweight catalogData.js
  const catalogDataCode = `// Official 6 Sizes and Pricing Matrix (in Quetzales)
export const OFFICIAL_SIZES = [
  { id: 'MINI', name: 'Mini', dimensions: '14 x 21 cm', widthCm: 14, heightCm: 21, price: 25.00, badge: 'Ideal para coleccionar y escritorios' },
  { id: 'PEQUENO', name: 'Pequeño', dimensions: '21 x 27 cm', widthCm: 21, heightCm: 27, price: 35.00, badge: 'Espacios reducidos y cabeceras' },
  { id: 'PORTADA_ALBUM', name: 'Portada de Álbum', dimensions: '30 x 30 cm', widthCm: 30, heightCm: 30, price: 55.00, badge: 'Formato vinilo cuadrado para música' },
  { id: 'MEDIANO', name: 'Mediano', dimensions: '30 x 45 cm', widthCm: 30, heightCm: 45, price: 65.00, badge: '⭐ El más vendido para habitaciones' },
  { id: 'GRANDE', name: 'Grande', dimensions: '45 x 60 cm', widthCm: 45, heightCm: 60, price: 125.00, badge: 'Protagonista para salas y oficinas' },
  { id: 'GIGANTE', name: 'Gigante', dimensions: '60 x 100 cm', widthCm: 60, heightCm: 100, price: 210.00, badge: 'Impacto visual monumental' }
];

export const CATEGORIES = ${JSON.stringify(catalog.categories || [], null, 2)};

export const ROOM_ENVIRONMENTS = [
  { id: 'LIVING', name: 'Sala de Estar', wallColor: '#1a1f2c', bgGradient: 'radial-gradient(circle at center, #242c3d 0%, #121620 100%)' },
  { id: 'GAMER', name: 'Setup Gamer', wallColor: '#0e1320', bgGradient: 'radial-gradient(circle at center, #1c1538 0%, #080a14 100%)' },
  { id: 'OFFICE', name: 'Oficina / Estudio', wallColor: '#202428', bgGradient: 'radial-gradient(circle at center, #2c3238 0%, #14171a 100%)' },
  { id: 'BEDROOM', name: 'Habitación', wallColor: '#161922', bgGradient: 'radial-gradient(circle at center, #222938 0%, #0d1017 100%)' }
];

export const CATALOG_POSTERS = ${JSON.stringify(catalog.posters || [], null, 2)};

export const INITIAL_FRANCHISES = ${JSON.stringify(catalog.franchises || [], null, 2)};

export const STORE_SETTINGS = ${JSON.stringify(catalog.settings || { whatsappPhone: '50238375078' }, null, 2)};
`;

  fs.writeFileSync(catalogDataPath, catalogDataCode, 'utf-8');
  console.log(`✅ Generated ultra-lightweight src/data/catalogData.js (Zero Base64 strings)!`);
}

migrateBase64ToDisk().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
