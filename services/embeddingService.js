/**
 * services/embeddingService.js
 * High-performance vector embeddings & RAG engine for Deco Vintage Guate.
 * 
 * Powered by Google Gemini Embedding API (768-dimensional MRL vectors).
 * Computes semantic similarity for instant, accurate inventory recommendation in J.A.R.V.I.S.
 */

import { prisma, formatPosterForClient } from './catalogService.js';
import { getJarvisApiKey } from './jarvisService.js';

const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIMENSIONS = 768;

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

export const MIN_SIMILARITY_THRESHOLD = 0.50;

/**
 * Searches the catalog in PostgreSQL using Semantic Vector Similarity (RAG).
 * Retrieves the Top-N most relevant posters for a user's prompt.
 * 
 * @param {string} userQuery - The user question or search phrase.
 * @param {number} [limit=4] - Max items to return (default Top-4).
 * @param {string} [customApiKey] - Optional API key.
 * @param {number} [minThreshold=MIN_SIMILARITY_THRESHOLD] - Minimum cosine similarity threshold.
 * @returns {Promise<Array<{ poster: object, score: number }>>}
 */
export async function findSimilarPosters(userQuery, limit = 4, customApiKey, minThreshold = MIN_SIMILARITY_THRESHOLD) {
  try {
    const queryVector = await generateEmbedding(userQuery, customApiKey);

    // Fetch all published posters with their embeddings and relations
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

    // Rank posters by Cosine Similarity score against the query vector
    const scoredPosters = rawPosters.map((p) => {
      let score = 0;
      if (Array.isArray(p.embedding) && p.embedding.length === EMBEDDING_DIMENSIONS) {
        score = computeCosineSimilarity(queryVector, p.embedding);
      }
      return {
        poster: formatPosterForClient(p),
        score,
      };
    });

    // Filter by minimum similarity threshold to prevent hallucinated / irrelevant recommendations
    const relevantPosters = scoredPosters.filter(p => p.score >= minThreshold);

    // Sort descending by similarity score
    relevantPosters.sort((a, b) => b.score - a.score);

    return relevantPosters.slice(0, limit);
  } catch (err) {
    console.warn('[Embedding Search Warning] Fallback due to error:', err.message);
    // Fallback: Return empty gracefully
    return [];
  }
}
