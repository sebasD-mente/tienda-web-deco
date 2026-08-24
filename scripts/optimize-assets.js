import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outDir = path.resolve(__dirname, '../public/assets');
fs.mkdirSync(outDir, { recursive: true });

async function run() {
  // 1. Logo Navbar
  await sharp(path.resolve(__dirname, '../docs del proyecto/Imagenes/logo navbar.png'))
    .resize({ width: 300, withoutEnlargement: true })
    .png({ quality: 95 })
    .toFile(path.join(outDir, 'logo-navbar.png'));
  
  await sharp(path.resolve(__dirname, '../docs del proyecto/Imagenes/logo navbar.png'))
    .resize({ width: 300, withoutEnlargement: true })
    .webp({ quality: 95 })
    .toFile(path.join(outDir, 'logo-navbar.webp'));
  console.log('✅ Logo Navbar processed');

  // 2. Fondo Hero
  await sharp(path.resolve(__dirname, '../docs del proyecto/Imagenes/fondo hero.png'))
    .resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(path.join(outDir, 'fondo-hero.webp'));
  console.log('✅ Fondo Hero processed');

  // 3. Boton Categorias
  await sharp(path.resolve(__dirname, '../docs del proyecto/Imagenes/boton categorias disponibles.png'))
    .png({ quality: 95 })
    .toFile(path.join(outDir, 'boton-categorias.png'));

  await sharp(path.resolve(__dirname, '../docs del proyecto/Imagenes/boton categorias disponibles.png'))
    .webp({ quality: 95 })
    .toFile(path.join(outDir, 'boton-categorias.webp'));
  console.log('✅ Boton Categorias processed');
}

run().catch(console.error);
