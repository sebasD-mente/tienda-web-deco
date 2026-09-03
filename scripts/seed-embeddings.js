/**
 * scripts/seed-embeddings.js
 * 
 * SCRIPT DE VECTORIZACIÓN Y SEEDING RAG PARA J.A.R.V.I.S. (PASO 2.0)
 * 
 * Utiliza batchEmbedContents con reintento automático para vectorizar todas las obras
 * de forma óptima (768 dimensiones MRL) y persistirlas en PostgreSQL.
 */

import { prisma } from '../services/catalogService.js';
import { getJarvisApiKey } from '../services/jarvisService.js';
import { buildSemanticPosterText } from '../services/embeddingService.js';

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('🧠 INICIANDO VECTORIZACIÓN Y SEEDING DE EMBEDDINGS (768d MRL - Google Gemini)');
console.log('═══════════════════════════════════════════════════════════════════════════════\n');

const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIMENSIONS = 768;

async function sendBatchWithRetry(requests, apiKey, maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:batchEmbedContents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({ requests }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.embeddings || [];
    }

    if (res.status === 429 && attempt < maxRetries) {
      const waitSec = attempt * 12;
      console.log(`   ⏳ Cuota 429 por minuto alcanzada. Esperando ${waitSec}s antes de reintentar (Intento ${attempt}/${maxRetries})...`);
      await new Promise(r => setTimeout(r, waitSec * 1000));
      continue;
    }

    const errText = await res.text();
    throw new Error(`Fallo en batchEmbedContents (${res.status}): ${errText}`);
  }
}

async function seedEmbeddingsBatch() {
  const startTime = Date.now();
  const apiKey = (getJarvisApiKey() || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '').trim();

  if (!apiKey) {
    throw new Error('No se encontró GEMINI_API_KEY en el entorno.');
  }

  const posters = await prisma.poster.findMany({
    include: {
      franchise: true,
      sizes: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`📊 Obras encontradas en PostgreSQL: ${posters.length}\n`);

  const forceReindex = process.argv.includes('--force');
  const pendingPosters = forceReindex 
    ? posters 
    : posters.filter(p => !Array.isArray(p.embedding) || p.embedding.length !== EMBEDDING_DIMENSIONS);
  const alreadyVectorized = forceReindex ? 0 : (posters.length - pendingPosters.length);

  console.log(`✅ Obras previamente vectorizadas: ${alreadyVectorized}`);
  console.log(`🔄 Obras pendientes de vectorizar: ${pendingPosters.length}\n`);

  if (pendingPosters.length === 0) {
    console.log(`🎉 ¡Todas las ${posters.length} obras ya se encuentran 100% vectorizadas en PostgreSQL!`);
    return;
  }

  // Dividir en lotes de 16
  const BATCH_SIZE = 16;
  let successCount = 0;

  for (let i = 0; i < pendingPosters.length; i += BATCH_SIZE) {
    const chunk = pendingPosters.slice(i, i + BATCH_SIZE);
    console.log(`📦 Enviando lote de ${chunk.length} obras a Gemini batchEmbedContents...`);

    const requests = chunk.map((p) => {
      const semanticText = buildSemanticPosterText(p);

      return {
        model: `models/${EMBEDDING_MODEL}`,
        content: { parts: [{ text: semanticText }] },
        outputDimensionality: EMBEDDING_DIMENSIONS,
      };
    });

    const embeddings = await sendBatchWithRetry(requests, apiKey);

    if (embeddings.length !== chunk.length) {
      throw new Error(`Se esperaban ${chunk.length} embeddings pero se recibieron ${embeddings.length}`);
    }

    // Persistir vectores en PostgreSQL
    for (let j = 0; j < chunk.length; j++) {
      const poster = chunk[j];
      const vector = embeddings[j].values;

      await prisma.poster.update({
        where: { id: poster.id },
        data: {
          embedding: vector,
          updatedAt: new Date(),
        },
      });

      successCount++;
      console.log(`   ✅ Vectorizado e indexado [${poster.titulo}] (${vector.length} dims)`);
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n═══════════════════════════════════════════════════════════════════════════════');
  console.log('🏁 REPORTE FINAL DE VECTORIZACIÓN Y SEEDING RAG');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log(`⏱️  Tiempo de ejecución: ${durationSec} segundos`);
  console.log(`📦 Total obras en catálogo: ${posters.length}`);
  console.log(`🧠 Obras recién vectorizadas: ${successCount}`);
  console.log(`⏭️  Obras previamente vectorizadas: ${alreadyVectorized}`);
  console.log(`🎉 Total obras vectorizadas en PostgreSQL: ${successCount + alreadyVectorized} / ${posters.length}`);
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');
}

seedEmbeddingsBatch()
  .catch((err) => {
    console.error('💥 Error durante el batch embedding:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
