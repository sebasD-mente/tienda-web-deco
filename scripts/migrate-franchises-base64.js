/**
 * scripts/migrate-franchises-base64.js
 * Migra logotipos en Base64 de la tabla franchises a Google Cloud Storage / disco local.
 * Deco Vintage Guate — Architecture Hardening (Phase 2)
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { prisma } from '../config/prisma.js';
import { uploadBufferToGCS } from '../services/gcsService.js';
import { dataUrlToBuffer } from '../services/imageService.js';
import { PROJECT_ROOT } from '../config/paths.js';

async function run() {
  console.log('🔄 Iniciando migración de logotipos Base64 en PostgreSQL...');
  
  const base64Franchises = await prisma.franchise.findMany({
    where: { imageUrl: { startsWith: 'data:image/' } }
  });

  console.log(`🔍 Se encontraron ${base64Franchises.length} franquicias con Base64.`);

  for (const f of base64Franchises) {
    console.log(`   Procesando: [${f.slug}] ${f.name} (${f.imageUrl.length} bytes)...`);
    const buffer = dataUrlToBuffer(f.imageUrl);
    
    // Optimizar a WebP 400x400
    const webpBuffer = await sharp(buffer)
      .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 90 })
      .toBuffer();

    let canonicalUrl = '';

    try {
      // Intentar subir a GCS
      const destPath = `franchises/${f.slug}.webp`;
      canonicalUrl = await uploadBufferToGCS(webpBuffer, destPath, 'image/webp');
      console.log(`   ☁️ Subido a GCS: ${canonicalUrl}`);
    } catch (gcsErr) {
      console.warn(`   ⚠️ Falló GCS (${gcsErr.message}). Guardando en disco local...`);
      const franchisesDir = path.resolve(PROJECT_ROOT, 'public/franchises');
      if (!fs.existsSync(franchisesDir)) {
        fs.mkdirSync(franchisesDir, { recursive: true });
      }
      const localFile = path.resolve(franchisesDir, `${f.slug}.webp`);
      await fs.promises.writeFile(localFile, webpBuffer);
      canonicalUrl = `/franchises/${f.slug}.webp`;
      console.log(`   💾 Guardado localmente: ${canonicalUrl}`);
    }

    // Actualizar PostgreSQL
    await prisma.franchise.update({
      where: { id: f.id },
      data: { imageUrl: canonicalUrl }
    });

    console.log(`   ✅ Franquicia [${f.slug}] actualizada en base de datos.`);
  }

  console.log('🎉 Migración completada exitosamente.');
  await prisma.$disconnect();
}

run().catch(async (e) => {
  console.error('❌ Error en migración:', e);
  await prisma.$disconnect();
  process.exit(1);
});
