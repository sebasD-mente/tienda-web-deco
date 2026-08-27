import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { FRANCHISES_DATA } from '../src/data/franchisesData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateMarvel() {
  const marvel = FRANCHISES_DATA.find(f => f.id === 'marvel');
  if (marvel && marvel.img.startsWith('data:image')) {
    const base64 = marvel.img.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');
    const dest = path.resolve(__dirname, '../public/franchises/marvel.webp');
    await sharp(buffer).webp({ quality: 85 }).toFile(dest);
    console.log('Saved /franchises/marvel.webp');
  }

  const updatedFranchises = FRANCHISES_DATA.map(f => ({
    ...f,
    img: f.id === 'marvel' ? '/franchises/marvel.webp' : f.img
  }));

  const fileContent = `// Catalog Franchises\nexport const FRANCHISES_DATA = ${JSON.stringify(updatedFranchises, null, 2)};\n`;
  fs.writeFileSync(path.resolve(__dirname, '../src/data/franchisesData.js'), fileContent, 'utf-8');
  console.log('Updated franchisesData.js');
}

migrateMarvel().catch(console.error);
