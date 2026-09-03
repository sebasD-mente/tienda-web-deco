/**
 * services/embeddingService.js
 * High-performance vector embeddings & Hybrid RAG engine for Deco Vintage Guate.
 * 
 * Powered by Google Gemini Embedding API (768-dimensional MRL vectors).
 * Computes semantic vector similarity + lexical keyword matching for instant,
 * accurate inventory recommendation in J.A.R.V.I.S.
 */

import { prisma, formatPosterForClient } from './catalogService.js';
import { getJarvisApiKey } from './jarvisService.js';

export const EMBEDDING_MODEL = 'gemini-embedding-001';
export const EMBEDDING_DIMENSIONS = 768;
export const MIN_SIMILARITY_THRESHOLD = 0.48;

let isSyncingEmbeddings = false;

/**
 * Builds the canonical semantic text representation of a poster for vectorization.
 * @param {object} p - Poster object
 * @returns {string} Clean semantic text string
 */
export function buildSemanticPosterText(p) {
  if (!p) return '';
  const title = p.titulo || p.title || '';
  const category = p.categoria || p.category || 'GENERAL';
  const subtitle = (p.subtitulo || p.subtitle) ? `Subtítulo: ${p.subtitulo || p.subtitle}.` : '';
  const franchiseName = p.franchise?.name || (typeof p.franchise === 'string' ? p.franchise : '');
  const franchiseStr = franchiseName ? `Franquicia: ${franchiseName}.` : '';
  const tags = Array.isArray(p.tags) && p.tags.length > 0 ? `Etiquetas: ${p.tags.join(', ')}.` : '';
  const desc = (p.descripcion || p.description) ? `Descripción: ${p.descripcion || p.description}.` : '';
  return `Obra: ${title}. Categoría: ${category}. ${subtitle} ${franchiseStr} ${tags} ${desc}`
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 2048);
}

/**
 * Generates a 768-dimensional vector embedding for a given text prompt.
 * @param {string} text - Text to vectorize (e.g. title, tags, description, user query).
 * @param {string} [customApiKey] - Optional API key override.
 * @returns {Promise<number[]>} Array of 768 floating point numbers.
 */
export async function generateEmbedding(text, customApiKey) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return new Array(EMBEDDING_DIMENSIONS).fill(0);
  }

  const apiKey = (customApiKey || getJarvisApiKey() || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error('Gemini API key is required to generate embeddings.');
  }

  const cleanText = text.replace(/\s+/g, ' ').trim().slice(0, 2048);

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      model: `models/${EMBEDDING_MODEL}`,
      content: {
        parts: [{ text: cleanText }],
      },
      outputDimensionality: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Embedding API failed (${res.status}): ${errorBody}`);
  }

  const data = await res.json();
  const vector = data.embedding?.values;

  if (!Array.isArray(vector) || vector.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(`Invalid embedding vector returned. Expected ${EMBEDDING_DIMENSIONS} dimensions, got ${vector?.length}`);
  }

  return vector;
}

/**
 * Generates and returns the vector embedding for a single poster.
 * @param {object} poster
 * @param {string} [customApiKey]
 * @returns {Promise<number[]>}
 */
export async function generatePosterEmbedding(poster, customApiKey) {
  const semanticText = buildSemanticPosterText(poster);
  return await generateEmbedding(semanticText, customApiKey);
}

/**
 * Computes standard Cosine Similarity between two numerical vectors.
 * @param {number[]} vecA
 * @param {number[]} vecB
 * @returns {number} Value between -1.0 and 1.0 (typically 0.0 to 1.0 for embeddings).
 */
export function computeCosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Computes lexical / keyword relevance score between a query and a poster.
 * Handles tokenization, diacritics normalization and property weighting.
 * @param {string} query
 * @param {object} p
 * @returns {number} Value between 0.0 and 1.0
 */
export function computeLexicalSimilarity(query, p) {
  if (!query || !p) return 0;
  const normalize = (str) => String(str || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  const qClean = normalize(query);
  const qTokens = qClean.split(/[\s,.-]+/).filter(t => t.length >= 2);
  if (qTokens.length === 0) return 0;

  const title = normalize(p.titulo || p.title);
  const sub = normalize(p.subtitulo || p.subtitle);
  const cat = normalize(p.categoria || p.category);
  const franchise = normalize(p.franchise?.name || p.franchise);
  const desc = normalize(p.descripcion || p.description);
  const tags = (Array.isArray(p.tags) ? p.tags : []).map(normalize);

  let rawScore = 0;
  let matchCount = 0;

  for (const token of qTokens) {
    if (title.includes(token)) {
      rawScore += 0.55;
      matchCount++;
    } else if (franchise.includes(token)) {
      rawScore += 0.45;
      matchCount++;
    } else if (tags.some(t => t.includes(token))) {
      rawScore += 0.40;
      matchCount++;
    } else if (sub.includes(token)) {
      rawScore += 0.30;
      matchCount++;
    } else if (cat.includes(token)) {
      rawScore += 0.25;
      matchCount++;
    } else if (desc.includes(token)) {
      rawScore += 0.15;
      matchCount++;
    }
  }

  if (matchCount === 0) return 0;

  // Exact whole phrase match boost in title or tags
  if (title.includes(qClean) || tags.some(t => t.includes(qClean))) {
    rawScore += 0.30;
  }

  const coverage = matchCount / qTokens.length;
  return Math.min(1.0, rawScore * coverage);
}

/**
 * Searches the catalog in PostgreSQL using Hybrid Search (Semantic Vectors + Lexical Keywords).
 * Retrieves the Top-N most relevant posters for a user's prompt.
 * 
 * @param {string} userQuery - The user question or search phrase.
 * @param {number} [limit=4] - Max items to return (default Top-4).
 * @param {string} [customApiKey] - Optional API key.
 * @param {number} [minThreshold=MIN_SIMILARITY_THRESHOLD] - Minimum similarity threshold.
 * @returns {Promise<Array<{ poster: object, score: number }>>}
 */
export async function findSimilarPosters(userQuery, limit = 4, customApiKey, minThreshold = MIN_SIMILARITY_THRESHOLD) {
  try {
    let queryVector = null;
    try {
      queryVector = await generateEmbedding(userQuery, customApiKey);
    } catch (embErr) {
      console.warn('[Embedding Search] Query embedding failed, falling back to lexical search:', embErr.message);
    }

    // Fetch all published posters with their relations
    const rawPosters = await prisma.poster.findMany({
      where: {
        isPublished: true,
        estado: { not: 'DESCONTINUADO' },
      },
      include: {
        sizes: true,
        franchise: true,
      },
    });

    if (!rawPosters || rawPosters.length === 0) {
      return [];
    }

    // Check if any posters lack embeddings, trigger non-blocking background sync if needed
    const pendingCount = rawPosters.filter(p => !Array.isArray(p.embedding) || p.embedding.length !== EMBEDDING_DIMENSIONS).length;
    if (pendingCount > 0 && !isSyncingEmbeddings) {
      // Fire-and-forget background auto-index
      syncPendingEmbeddings(customApiKey).catch(err => {
        console.warn('[Background Embedding Sync] Non-blocking warning:', err.message);
      });
    }

    // Score each poster using Hybrid Strategy (Semantic Cosine + Lexical Keywords)
    const scoredPosters = rawPosters.map((p) => {
      let vectorScore = 0;
      if (queryVector && Array.isArray(p.embedding) && p.embedding.length === EMBEDDING_DIMENSIONS) {
        vectorScore = computeCosineSimilarity(queryVector, p.embedding);
      }

      const lexicalScore = computeLexicalSimilarity(userQuery, p);

      let finalScore = 0;
      if (vectorScore > 0) {
        // Hybrid blend: 70% semantic vector, 30% lexical keyword
        finalScore = (vectorScore * 0.70) + (lexicalScore * 0.30);
        // Boost if direct exact lexical match exists
        if (lexicalScore >= 0.40) {
          finalScore = Math.max(finalScore, vectorScore * 0.50 + 0.50);
        }
      } else {
        // If poster doesn't have vector yet or query vector failed, use lexical score
        finalScore = lexicalScore;
      }

      return {
        poster: formatPosterForClient(p),
        score: finalScore,
        vectorScore,
        lexicalScore
      };
    });

    // Filter by threshold (either hybrid score meets threshold OR strong lexical match)
    const relevantPosters = scoredPosters.filter(p => p.score >= minThreshold || p.lexicalScore >= 0.35);

    // Sort descending by score
    relevantPosters.sort((a, b) => b.score - a.score);

    return relevantPosters.slice(0, limit);
  } catch (err) {
    console.warn('[Embedding Search Warning] Fallback due to error:', err.message);
    return [];
  }
}

/**
 * Automatically vectorizes and indexes all pending posters in PostgreSQL.
 * Uses batch processing with retry for maximum speed and zero rate-limiting.
 * 
 * @param {string} [customApiKey]
 * @param {number} [batchSize=16]
 * @returns {Promise<{ total: number, synced: number, alreadySynced: number, durationSec: string }>}
 */
export async function syncPendingEmbeddings(customApiKey, batchSize = 16) {
  if (isSyncingEmbeddings) {
    return { alreadyRunning: true };
  }

  isSyncingEmbeddings = true;
  const startTime = Date.now();

  try {
    const apiKey = (customApiKey || getJarvisApiKey() || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '').trim();
    if (!apiKey) {
      throw new Error('No se encontró GEMINI_API_KEY en el entorno para sincronizar embeddings.');
    }

    const allPosters = await prisma.poster.findMany({
      include: { franchise: true, sizes: true },
      orderBy: { createdAt: 'desc' },
    });

    const pendingPosters = allPosters.filter(
      p => !Array.isArray(p.embedding) || p.embedding.length !== EMBEDDING_DIMENSIONS
    );
    const alreadySynced = allPosters.length - pendingPosters.length;

    if (pendingPosters.length === 0) {
      return {
        total: allPosters.length,
        synced: 0,
        alreadySynced,
        durationSec: '0.00',
        message: 'Todas las obras ya se encuentran 100% vectorizadas.'
      };
    }

    console.log(`[RAG Auto-Sync] Iniciando vectorización de ${pendingPosters.length} obras pendientes...`);

    let successCount = 0;

    for (let i = 0; i < pendingPosters.length; i += batchSize) {
      const chunk = pendingPosters.slice(i, i + batchSize);

      const requests = chunk.map((p) => ({
        model: `models/${EMBEDDING_MODEL}`,
        content: { parts: [{ text: buildSemanticPosterText(p) }] },
        outputDimensionality: EMBEDDING_DIMENSIONS,
      }));

      // Call batchEmbedContents with retry
      let embeddings = [];
      for (let attempt = 1; attempt <= 4; attempt++) {
        try {
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
            embeddings = data.embeddings || [];
            break;
          }

          if (res.status === 429 && attempt < 4) {
            const waitSec = attempt * 8;
            console.log(`[RAG Auto-Sync] ⏳ Cuota 429. Esperando ${waitSec}s antes de reintentar chunk...`);
            await new Promise(r => setTimeout(r, waitSec * 1000));
            continue;
          }

          const errText = await res.text();
          throw new Error(`Fallo en batchEmbedContents (${res.status}): ${errText}`);
        } catch (fetchErr) {
          if (attempt === 4) throw fetchErr;
          await new Promise(r => setTimeout(r, 3000));
        }
      }

      // Persist generated vectors
      for (let j = 0; j < chunk.length; j++) {
        const poster = chunk[j];
        const vector = embeddings[j]?.values;

        if (Array.isArray(vector) && vector.length === EMBEDDING_DIMENSIONS) {
          await prisma.poster.update({
            where: { id: poster.id },
            data: { embedding: vector },
          });
          successCount++;
        }
      }
    }

    const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[RAG Auto-Sync] ✅ Sincronización finalizada: ${successCount} obras vectorizadas en ${durationSec}s.`);

    return {
      total: allPosters.length,
      synced: successCount,
      alreadySynced,
      durationSec,
      message: `Se vectorizaron exitosamente ${successCount} obras.`
    };
  } finally {
    isSyncingEmbeddings = false;
  }
}
