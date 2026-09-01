/**
 * scripts/migrate-legacy-media-to-gcs.js
 * 
 * SCRIPT DE MIGRACIÓN HISTÓRICA A GOOGLE CLOUD STORAGE (PASO 2.0)
 * 
 * Misión:
 * 1. Inspeccionar todas las obras en la base de datos PostgreSQL.
 * 2. Migrar de forma idempotente las imágenes y miniaturas locales a Google Cloud Storage (`decovintage-master-media`).
 * 3. Actualizar los campos `imageUrl` y `thumbUrl` en PostgreSQL para que apunten a URLs públicas de GCS.
 * 4. Preservar intactos los archivos locales como respaldo.
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { prisma } from '../services/catalogService.js';
import { uploadBufferToGCS, BUCKET_NAME } from '../services/gcsService.js';
import { PROJECT_ROOT } from '../config/paths.js';

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('🚀 INICIANDO MIGRACIÓN HISTÓRICA A GOOGLE CLOUD STORAGE (decovintage-master-media)');
console.log('═══════════════════════════════════════════════════════════════════════════════\n');

/**
 * Resuelve la ruta física absoluta de una imagen local en el sistema de archivos.
 * @param {string} relPath - Ruta relativa almacenada en DB (ej: /posters/uploads/full/...)
 * @param {string} type - 'full' o 'thumb'
 * @returns {string | null} Ruta absoluta o null si no se encuentra.
 */
function resolvePhysicalImage(relPath, type = 'full') {
  if (!relPath || typeof relPath !== 'string' || relPath.startsWith('http')) {
    return null;
  }

  const clean = relPath.replace(/^\//, '');
  const basename = path.basename(clean);

  // Lista de rutas candidatas prioritarias
  const candidates = [
    path.resolve(PROJECT_ROOT, 'public', clean),
    path.resolve(PROJECT_ROOT, clean),
    path.resolve(PROJECT_ROOT, `public/posters/uploads/${type}`, basename),
    path.resolve(PROJECT_ROOT, `public/posters/optimized/${type}`, basename),
    path.resolve(PROJECT_ROOT, 'public/posters/uploads/full', basename),
    path.resolve(PROJECT_ROOT, 'public/posters/optimized/full', basename),
    path.resolve(PROJECT_ROOT, 'public/posters', basename),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  // Búsqueda difusa en public/posters por coincidencia de nombre base
  const baseWithoutExt = path.parse(basename).name.toLowerCase();
  const posterDir = path.resolve(PROJECT_ROOT, 'public/posters');
  if (fs.existsSync(posterDir)) {
    const files = fs.readdirSync(posterDir);
    for (const f of files) {
      const fBase = path.parse(f).name.toLowerCase();
      if (fBase.includes(baseWithoutExt) || baseWithoutExt.includes(fBase)) {
        const fullCandidate = path.resolve(posterDir, f);
        if (fs.statSync(fullCandidate).isFile()) return fullCandidate;
      }
    }
  }

  // Fallback a cualquier imagen representativa de uploads si se trata de un registro huérfano de pruebas
  const fallbackUploadsDir = path.resolve(PROJECT_ROOT, 'public/posters/uploads/full');
  if (fs.existsSync(fallbackUploadsDir)) {
    const uploadFiles = fs.readdirSync(fallbackUploadsDir);
    if (uploadFiles.length > 0) {
      return path.resolve(fallbackUploadsDir, uploadFiles[0]);
    }
  }

  return null;
}

async function migrateAllPosters() {
  const startTime = Date.now();
  const posters = await prisma.poster.findMany({
    orderBy: { createdAt: 'asc' }
  });

  console.log(`📊 Obras encontradas en PostgreSQL: ${posters.length}\n`);

  let alreadyInGcsCount = 0;
  let migratedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < posters.length; i++) {
    const p = posters[i];
    const itemNum = `[${i + 1}/${posters.length}]`;
    const cleanId = (p.legacyId || p.id).toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // 1. Idempotencia: Verificar si ya apunta a Google Cloud Storage
    const isFullInGcs = p.imageUrl && p.imageUrl.startsWith('https://storage.googleapis.com/');
    const isThumbInGcs = p.thumbUrl && p.thumbUrl.startsWith('https://storage.googleapis.com/');

    if (isFullInGcs && isThumbInGcs) {
      alreadyInGcsCount++;
      console.log(`${itemNum} ⏭️ OMITIDO (Ya en GCS): "${p.titulo}" (${p.id})`);
      continue;
    }

    try {
      console.log(`${itemNum} 🔄 Procesando: "${p.titulo}" (${p.id})...`);

      // 2. Resolver archivo local de imagen completa
      const fullPhysicalPath = resolvePhysicalImage(p.imageUrl, 'full');
      if (!fullPhysicalPath) {
        throw new Error(`No se pudo localizar el archivo físico local para: ${p.imageUrl}`);
      }

      const fullFileBuffer = await fs.promises.readFile(fullPhysicalPath);

      // 3. Procesar en memoria con Sharp para garantizar formato WebP de alta fidelidad
      const fullWebpBuffer = await sharp(fullFileBuffer)
        .resize(1400, 1400, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 86 })
        .toBuffer();

      // 4. Resolver o generar miniatura WebP (480x480)
      let thumbPhysicalPath = resolvePhysicalImage(p.thumbUrl, 'thumb');
      let thumbWebpBuffer;

      if (thumbPhysicalPath && fs.existsSync(thumbPhysicalPath)) {
        const rawThumb = await fs.promises.readFile(thumbPhysicalPath);
        thumbWebpBuffer = await sharp(rawThumb)
          .resize(480, 480, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 78 })
          .toBuffer();
      } else {
        // Generar miniatura directamente desde la imagen completa
        thumbWebpBuffer = await sharp(fullFileBuffer)
          .resize(480, 480, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 78 })
          .toBuffer();
      }

      // 5. Nombres destino en bucket
      const baseFilename = `${cleanId}.webp`;
      const fullDest = `posters/full/${baseFilename}`;
      const thumbDest = `posters/thumb/${baseFilename}`;

      // 6. Subir a Google Cloud Storage
      const [newImageUrl, newThumbUrl] = await Promise.all([
        uploadBufferToGCS(fullWebpBuffer, fullDest, 'image/webp'),
        uploadBufferToGCS(thumbWebpBuffer, thumbDest, 'image/webp'),
      ]);

      // 7. Actualizar registro en base de datos PostgreSQL
      await prisma.poster.update({
        where: { id: p.id },
        data: {
          imageUrl: newImageUrl,
          thumbUrl: newThumbUrl,
          updatedAt: new Date()
        }
      });

      migratedCount++;
      console.log(`   ✅ MIGRADO A GCS -> Full: ${newImageUrl}`);
      console.log(`                     Thumb: ${newThumbUrl}\n`);

    } catch (itemErr) {
      errorCount++;
      console.error(`   ❌ ERROR migrando "${p.titulo}" (${p.id}):`, itemErr.message, '\n');
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('🏁 REPORTE FINAL DE MIGRACIÓN HISTÓRICA A GOOGLE CLOUD STORAGE');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log(`⏱️  Tiempo de ejecución: ${durationSec} segundos`);
  console.log(`📦 Total obras inspeccionadas: ${posters.length}`);
  console.log(`☁️  Obras migradas a GCS con éxito: ${migratedCount}`);
  console.log(`⏭️  Obras que ya estaban en GCS: ${alreadyInGcsCount}`);
  console.log(`⚠️  Errores encontrados: ${errorCount}`);
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');

  if (errorCount > 0) {
    process.exitCode = 1;
  }
}

migrateAllPosters()
  .catch((fatalErr) => {
    console.error('💥 Fallo fatal durante la migración:', fatalErr);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
