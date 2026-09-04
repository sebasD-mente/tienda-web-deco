import { prisma } from '../config/prisma.js';
import { getStorageClient } from '../services/gcsService.js';
const BUCKET_NAME = (process.env.GCS_BUCKET_NAME || 'decovintage-master-media').trim().replace(/^gs:\/\//, '').replace(/\/+$/, '');

async function runCleanup() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🧹 AUDITORÍA & HIGIENIZACIÓN DE ARCHIVOS EN GOOGLE CLOUD STORAGE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    const client = getStorageClient();
    if (!client) {
      throw new Error('No se pudo inicializar el cliente de Google Cloud Storage.');
    }

    const bucket = client.bucket(BUCKET_NAME);
    const [exists] = await bucket.exists();
    if (!exists) {
      throw new Error(`El bucket "${BUCKET_NAME}" no existe o no se tiene acceso.`);
    }

    // 1. Obtener todas las imágenes activas de PostgreSQL
    const posters = await prisma.poster.findMany({
      select: { id: true, titulo: true, imageUrl: true, thumbUrl: true }
    });
    const franchises = await prisma.franchise.findMany({
      select: { id: true, name: true, imageUrl: true }
    });

    const activeUrls = new Set();
    const activeFilePaths = new Set();

    posters.forEach(p => {
      if (p.imageUrl) {
        activeUrls.add(p.imageUrl);
        const relative = p.imageUrl.replace(`https://storage.googleapis.com/${BUCKET_NAME}/`, '');
        activeFilePaths.add(relative);
      }
      if (p.thumbUrl) {
        activeUrls.add(p.thumbUrl);
        const relative = p.thumbUrl.replace(`https://storage.googleapis.com/${BUCKET_NAME}/`, '');
        activeFilePaths.add(relative);
      }
    });

    franchises.forEach(f => {
      if (f.imageUrl) {
        activeUrls.add(f.imageUrl);
        const relative = f.imageUrl.replace(`https://storage.googleapis.com/${BUCKET_NAME}/`, '');
        activeFilePaths.add(relative);
      }
    });

    console.log(`📊 Obras activas en BD:       ${posters.length}`);
    console.log(`📊 Franquicias activas en BD: ${franchises.length}`);
    console.log(`📊 Total archivos esperados:  ${activeFilePaths.size}\n`);

    // 2. Listar archivos en GCS
    console.log('🔍 Escaneando archivos en el bucket de Google Cloud Storage...');
    const [files] = await bucket.getFiles({ prefix: 'posters/' });
    const [franchiseFiles] = await bucket.getFiles({ prefix: 'franchises/' });
    const allFiles = [...files, ...franchiseFiles];

    console.log(`📦 Archivos encontrados en GCS: ${allFiles.length}\n`);

    let orphanCount = 0;
    let freedBytes = 0;
    const deletedList = [];

    for (const file of allFiles) {
      const fileName = file.name;
      const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${fileName}`;

      const isReferenced = activeFilePaths.has(fileName) || activeUrls.has(publicUrl);

      if (!isReferenced) {
        orphanCount++;
        const [metadata] = await file.getMetadata().catch(() => [{}]);
        const size = Number(metadata.size || 0);
        freedBytes += size;

        console.log(`🗑️ Eliminando huérfano: ${fileName} (${(size / 1024).toFixed(1)} KB)`);
        await file.delete().catch(err => {
          console.warn(`⚠️ Error al eliminar ${fileName}:`, err.message);
        });
        deletedList.push({ name: fileName, sizeKB: (size / 1024).toFixed(1) });
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ REPORTE FINAL DE HIGIENIZACIÓN');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`• Archivos escaneados en GCS:    ${allFiles.length}`);
    console.log(`• Archivos legítimos y activos:  ${allFiles.length - orphanCount}`);
    console.log(`• Archivos huérfanos eliminados: ${orphanCount}`);
    console.log(`• Espacio liberado en la nube:   ${(freedBytes / (1024 * 1024)).toFixed(2)} MB`);
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (err) {
    console.error('❌ Error durante la higienización:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runCleanup();
