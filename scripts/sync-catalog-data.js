import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storePath = path.resolve(__dirname, '../src/data/catalogStore.json');
const targetPath = path.resolve(__dirname, '../src/data/catalogData.js');

const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

const code = `// Official 6 Sizes and Pricing Matrix (in Quetzales)
export const OFFICIAL_SIZES = [
  {
    id: 'MINI',
    name: 'Mini',
    dimensions: '14 x 21 cm',
    widthCm: 14,
    heightCm: 21,
    price: 25.00,
    badge: 'Ideal para coleccionar y escritorios'
  },
  {
    id: 'PEQUENO',
    name: 'Pequeño',
    dimensions: '21 x 27 cm',
    widthCm: 21,
    heightCm: 27,
    price: 35.00,
    badge: 'Espacios reducidos y cabeceras'
  },
  {
    id: 'PORTADA_ALBUM',
    name: 'Portada de Álbum',
    dimensions: '30 x 30 cm',
    widthCm: 30,
    heightCm: 30,
    price: 55.00,
    badge: 'Formato vinilo cuadrado para música'
  },
  {
    id: 'MEDIANO',
    name: 'Mediano',
    dimensions: '30 x 45 cm',
    widthCm: 30,
    heightCm: 45,
    price: 65.00,
    badge: '⭐ El más vendido para habitaciones'
  },
  {
    id: 'GRANDE',
    name: 'Grande',
    dimensions: '45 x 60 cm',
    widthCm: 45,
    heightCm: 60,
    price: 125.00,
    badge: 'Protagonista para salas y oficinas'
  },
  {
    id: 'GIGANTE',
    name: 'Gigante',
    dimensions: '60 x 100 cm',
    widthCm: 60,
    heightCm: 100,
    price: 210.00,
    badge: 'Impacto visual monumental'
  }
];

export const CATEGORIES = ${JSON.stringify(store.categories, null, 2)};

export const ROOM_ENVIRONMENTS = [
  {
    id: 'LIVING',
    name: 'Sala de Estar',
    wallColor: '#1a1f2c',
    bgGradient: 'radial-gradient(circle at center, #242c3d 0%, #121620 100%)'
  },
  {
    id: 'GAMER',
    name: 'Setup Gamer',
    wallColor: '#0e1320',
    bgGradient: 'radial-gradient(circle at center, #182038 0%, #080b12 100%)'
  },
  {
    id: 'OFFICE',
    name: 'Oficina Ejecutiva',
    wallColor: '#2b2623',
    bgGradient: 'radial-gradient(circle at center, #3d3530 0%, #171412 100%)'
  }
];

export const CATALOG_POSTERS = ${JSON.stringify(store.posters, null, 2)};
`;

fs.writeFileSync(targetPath, code, 'utf8');
console.log('✅ Synchronized catalogData.js with full 32 posters and 7 categories!');
