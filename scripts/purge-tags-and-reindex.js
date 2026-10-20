/**
 * scripts/purge-tags-and-reindex.js
 *
 * CIRUGÍA DE DATOS Y VECTORES [COM-20261020-001]
 * 1. Snapshot de seguridad en backups/pre-tag-purge-backup-20261020.json (solo si aún no existe o tiene tags > 0).
 * 2. Limpieza atómica de tags (tags = '{}') preservando intacto updatedAt y createdAt en PostgreSQL.
 * 3. Re-vectorización láser de todas las obras con gemini-embedding-001 (768 dims) en lotes de 16
 *    preservando updatedAt original de cada obra.
 *
 * USO:
 *   node scripts/purge-tags-and-reindex.js --dry-run   (Por defecto: simulación sin escritura)
 *   node scripts/purge-tags-and-reindex.js --apply     (Ejecución real en PostgreSQL)
 */

import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../services/catalogService.js';
import { getJarvisApiKey } from '../services/jarvisService.js';
import {
  buildSemanticPosterText,
  invalidateEmbeddingsCache,
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
} from '../services/embeddingService.js';

const BATCH_SIZE = 16;
const BATCH_DELAY_MS = 350;
const BACKUP_DIR = path.resolve(process.cwd(), 'backups');
const BACKUP_FILE = path.join(BACKUP_DIR, 'pre-tag-purge-backup-20261020.json');

function ensureGitignoreHasBackups() {
  try {
    const gitignorePath = path.resolve(process.cwd(), '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const content = fs.readFileSync(gitignorePath, 'utf-8');
      if (!content.split(/\r?\n/).some((line) => line.trim() === 'backups/' || line.trim() === 'backups')) {
        fs.appendFileSync(gitignorePath, '\nbackups/\n', 'utf-8');
      }
    }
  } catch (err) {
    console.warn('[Gitignore Check] Aviso:', err.message);
  }
}

async function sendBatchWithRetry(requests, apiKey, maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:batchEmbedContents`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({ requests }),
      }
    );

    if (res.ok) {
      const data = await res.json();
      return data.embeddings || [];
    }

    if ((res.status === 429 || res.status >= 500) && attempt < maxRetries) {
      const backoffMs = Math.pow(2, attempt) * 2000;
      console.log(
        `   ⏳ HTTP ${res.status} recibido. Backoff exponencial de ${(backoffMs / 1000).toFixed(1)}s (Intento ${attempt}/${maxRetries})...`
      );
      await new Promise((r) => setTimeout(r, backoffMs));
      continue;
    }

    const errText = await res.text();
    throw new Error(`Fallo en batchEmbedContents (${res.status}): ${errText}`);
  }
  throw new Error('Se agotaron los reintentos para batchEmbedContents.');
}

async function main() {
  const startTime = Date.now();
  const isApply = process.argv.includes('--apply');
  const isDryRun = !isApply;

  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('🏛️  [COM-20261020-001] CIRUGÍA DE DATOS Y VECTORES: PURGA DE TAGS Y RE-INDEXACIÓN');
  console.log(`⚙️  MODO: ${isDryRun ? 'DRY-RUN (SIMULACIÓN SEGURA)' : 'APPLY (EJECUCIÓN REAL EN BD)'}`);
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');

  // 1. Verificación Pre-Vuelo (Snapshot de Seguridad)
  const posters = await prisma.poster.findMany({
    select: {
      id: true,
      titulo: true,
      subtitulo: true,
      descripcion: true,
      categoria: true,
      franchiseId: true,
      franchise: true,
      tags: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const postersWithTags = posters.filter((p) => Array.isArray(p.tags) && p.tags.length > 0);

  console.log(`📊 Total de obras en BD: ${posters.length}`);
  console.log(`🏷️  Total de obras con tags.length > 0: ${postersWithTags.length}`);

  const topRecentBefore = [...posters]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  console.log('\n🕒 Top 5 obras más recientes (ANTES de la cirugía):');
  for (const r of topRecentBefore) {
    console.log(
      `   - [${r.id}] ${r.titulo} | createdAt: ${r.createdAt.toISOString()} | updatedAt: ${r.updatedAt.toISOString()} | tags: ${r.tags.length}`
    );
  }

  ensureGitignoreHasBackups();
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  // Solo sobreescribir el respaldo si no existe o si todavía hay tags en BD (evita pisar el backup con tags vacíos en re-ejecuciones)
  if (!fs.existsSync(BACKUP_FILE) || postersWithTags.length > 0) {
    const backupPayload = posters.map((p) => ({
      id: p.id,
      titulo: p.titulo,
      tags: Array.isArray(p.tags) ? p.tags : [],
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(backupPayload, null, 2), 'utf-8');
    console.log(`\n💾 Snapshot de seguridad guardado en: ${BACKUP_FILE} (${backupPayload.length} registros)`);
  } else {
    console.log(`\n💾 Snapshot de seguridad previo preservado en: ${BACKUP_FILE}`);
  }

  if (isDryRun) {
    console.log('\n🔍 Previsualización de texto semántico limpio (primeras 3 obras con tags: []):');
    for (const sample of posters.slice(0, 3)) {
      const cleanSemantic = buildSemanticPosterText({ ...sample, tags: [] });
      console.log(`   • [${sample.titulo}] -> "${cleanSemantic.slice(0, 140)}..."`);
    }
    console.log('\n✅ [DRY-RUN COMPLETADO] Cero modificaciones realizadas en PostgreSQL.');
    console.log('👉 Para ejecutar la cirugía real, corra: node scripts/purge-tags-and-reindex.js --apply\n');
    return;
  }

  // Verificar API key antes de tocar nada
  const apiKey = (
    getJarvisApiKey() ||
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    ''
  ).trim();

  if (!apiKey) {
    throw new Error('No se encontró GEMINI_API_KEY válida para recalcular los vectores RAG.');
  }

  // 2. Fase A — Limpieza Total de tags Preservando updatedAt
  console.log('\n🧹 FASE A: Vaciamiento atómico de tags (tags = "{}") preservando updatedAt...');
  const clearedCount = await prisma.$executeRawUnsafe(
    `UPDATE "posters" SET "tags" = '{}' WHERE cardinality("tags") > 0`
  );
  console.log(`   ✅ Filas actualizadas en PostgreSQL: ${clearedCount}`);

  const remainingWithTags = await prisma.poster.count({
    where: {
      NOT: {
        tags: { equals: [] },
      },
    },
  });

  if (remainingWithTags !== 0) {
    throw new Error(`Verificación fallida: aún quedan ${remainingWithTags} obras con tags no vacíos.`);
  }
  console.log(`   🔒 Verificación estricta: ${remainingWithTags} obras con tags > 0 (100% limpias con tags: []).`);

  // 3. Fase B — Recálculo de los Vectores RAG (embedding de 768 dimensiones) sin alterar updatedAt
  console.log(
    `\n🧠 FASE B: Re-vectorización láser de ${posters.length} obras con ${EMBEDDING_MODEL} (${EMBEDDING_DIMENSIONS} dims)...`
  );

  let reindexedCount = 0;

  for (let i = 0; i < posters.length; i += BATCH_SIZE) {
    const chunk = posters.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(posters.length / BATCH_SIZE);

    const requests = chunk.map((p) => {
      const semanticText = buildSemanticPosterText({ ...p, tags: [] });
      return {
        model: `models/${EMBEDDING_MODEL}`,
        content: { parts: [{ text: semanticText }] },
        outputDimensionality: EMBEDDING_DIMENSIONS,
      };
    });

    const embeddings = await sendBatchWithRetry(requests, apiKey);

    if (embeddings.length !== chunk.length) {
      throw new Error(
        `Inconsistencia en lote ${batchNum}: se esperaban ${chunk.length} vectores y llegaron ${embeddings.length}`
      );
    }

    for (let j = 0; j < chunk.length; j++) {
      const poster = chunk[j];
      const vector = embeddings[j]?.values;

      if (!Array.isArray(vector) || vector.length !== EMBEDDING_DIMENSIONS) {
        throw new Error(
          `Vector inválido para obra [${poster.id}] (${poster.titulo}): longitud ${vector?.length}`
        );
      }

      // Actualizar preservando estrictamente updatedAt original
      await prisma.poster.update({
        where: { id: poster.id },
        data: {
          embedding: vector,
          updatedAt: poster.updatedAt,
        },
      });

      reindexedCount++;
    }

    console.log(
      `   📦 Lote ${batchNum}/${totalBatches} completado (${reindexedCount}/${posters.length} obras vectorizadas)`
    );

    if (i + BATCH_SIZE < posters.length) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  // Invalidar caché RAG en memoria local
  invalidateEmbeddingsCache();
  console.log('   🔄 Caché vectorial en memoria invalidada (invalidateEmbeddingsCache).');

  // 4. Verificación Forense Post-Cirugía
  const postCheck = await prisma.$queryRawUnsafe(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE cardinality("tags") > 0)::int AS with_tags,
      COUNT(*) FILTER (WHERE "tags" IS NULL)::int AS null_tags,
      COUNT(*) FILTER (WHERE cardinality("embedding") = 768)::int AS valid_embeddings
    FROM "posters"
  `);

  const stats = postCheck[0] || {};
  const afterPosters = await prisma.poster.findMany({
    select: { id: true, titulo: true, createdAt: true, updatedAt: true, tags: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n═══════════════════════════════════════════════════════════════════════════════');
  console.log('🏁 REPORTE FORENSE FINAL [COM-20261020-001]');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log(`⏱️  Tiempo total de ejecución:        ${durationSec} s`);
  console.log(`📦 Total obras en catálogo:          ${stats.total}`);
  console.log(`🧹 Obras con tags > 0:               ${stats.with_tags} (Esperado: 0)`);
  console.log(`🛡️  Obras con tags NULL:              ${stats.null_tags} (Esperado: 0)`);
  console.log(`🧠 Obras con embedding = 768 dims:   ${stats.valid_embeddings} / ${stats.total}`);
  console.log('\n🕒 Top 5 obras más recientes (DESPUÉS de la cirugía - Verificación de Timestamps):');
  for (const r of afterPosters) {
    console.log(
      `   - [${r.id}] ${r.titulo} | createdAt: ${r.createdAt.toISOString()} | updatedAt: ${r.updatedAt.toISOString()} | tags: []`
    );
  }
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');
}

main()
  .catch((err) => {
    console.error('💥 Error crítico en purge-tags-and-reindex:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
