import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputDir = path.resolve(__dirname, '../public/posters');
const outThumbDir = path.resolve(__dirname, '../public/posters/optimized/thumb');
const outFullDir = path.resolve(__dirname, '../public/posters/optimized/full');

// Ensure output directories exist
fs.mkdirSync(outThumbDir, { recursive: true });
fs.mkdirSync(outFullDir, { recursive: true });

async function processImages() {
  const files = fs.readdirSync(inputDir).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
  
  console.log(`🖼️  Iniciando optimización de ${files.length} imágenes...`);
  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;

  for (const file of files) {
    const inputPath = path.join(inputDir, file);
    const stat = fs.statSync(inputPath);
    totalOriginalSize += stat.size;

    const baseName = path.parse(file).name.replace(/\s+/g, '-').toLowerCase();
    const thumbPath = path.join(outThumbDir, `${baseName}.webp`);
    const fullPath = path.join(outFullDir, `${baseName}.webp`);

    // 1. Generate Full HD Web Preview (Max width 1100px, WebP Q85)
    await sharp(inputPath)
      .resize({ width: 1100, withoutEnlargement: true })
      .webp({ quality: 85, effort: 6 })
      .toFile(fullPath);

    // 2. Generate Catalog Thumbnail (Max width 500px, WebP Q80)
    await sharp(inputPath)
      .resize({ width: 500, withoutEnlargement: true })
      .webp({ quality: 80, effort: 6 })
      .toFile(thumbPath);

    const fullStat = fs.statSync(fullPath);
    const thumbStat = fs.statSync(thumbPath);
    totalOptimizedSize += (fullStat.size + thumbStat.size);

    console.log(`✅ [${file}] -> Original: ${(stat.size / 1024 / 1024).toFixed(2)} MB | WebP Full: ${(fullStat.size / 1024).toFixed(1)} KB | Thumb: ${(thumbStat.size / 1024).toFixed(1)} KB`);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🎉 Optimización finalizada con éxito:`);
  console.log(`📦 Peso Total Original: ${(totalOriginalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`⚡ Peso Total Optimizado (Full + Thumbs): ${(totalOptimizedSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`🚀 Reducción de ancho de banda: ${((1 - (totalOptimizedSize / totalOriginalSize)) * 100).toFixed(1)}%`);
}

processImages().catch(err => {
  console.error('Error al optimizar imágenes:', err);
  process.exit(1);
});
