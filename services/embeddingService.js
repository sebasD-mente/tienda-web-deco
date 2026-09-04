/**
 * services/embeddingService.js
 * High-performance vector embeddings & Intelligent Hybrid RAG engine for Deco Vintage Guate.
 * 
 * Powered by Google Gemini Embedding API (768-dimensional MRL vectors).
 * Computes semantic vector similarity + entity alias expansion + lexical keyword matching
 * for instant, human-grade, accurate inventory recommendation in J.A.R.V.I.S.
 */

import { prisma, formatPosterForClient } from './catalogService.js';
import { getJarvisApiKey } from './jarvisService.js';

export const EMBEDDING_MODEL = 'gemini-embedding-001';
export const EMBEDDING_DIMENSIONS = 768;
export const MIN_SIMILARITY_THRESHOLD = 0.45;

let isSyncingEmbeddings = false;

// ── IN-MEMORY VECTOR CACHE (Cero latencia & Cero sobrecarga de RAM/Event Loop) ──
let cachedPostersWithEmbeddings = null;
let cacheExpiryTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos de TTL

export function invalidateEmbeddingsCache() {
  cachedPostersWithEmbeddings = null;
  cacheExpiryTime = 0;
}

export async function getCachedPublishedPosters() {
  const now = Date.now();
  if (cachedPostersWithEmbeddings && now < cacheExpiryTime && Array.isArray(cachedPostersWithEmbeddings) && cachedPostersWithEmbeddings.length > 0) {
    return cachedPostersWithEmbeddings;
  }

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

  cachedPostersWithEmbeddings = rawPosters;
  cacheExpiryTime = now + CACHE_TTL_MS;
  return rawPosters;
}

// ── DICCIONARIO DE ENTIDADES, ALIAS Y NICKNAMES CULTURALES ──────────────────
export const ENTITY_ALIASES = [
  {
    canonical: 'Cristiano Ronaldo',
    keywords: ['bicho', 'el bicho', 'cr7', 'cristiano ronaldo', 'cristiano', 'comandante', 'el comandante', 'siuuu', 'siu', 'mister champions', 'ronaldo', 'el 7'],
    synonyms: 'Cristiano Ronaldo El Bicho CR7 El Comandante Siuuu Real Madrid Manchester United Portugal Futbolista Leyenda Balon de Oro Champions'
  },
  {
    canonical: 'Messi',
    keywords: ['messi', 'lionel messi', 'la pulga', 'pulga', 'd10s', 'goat', 'lio', 'leo messi', 'campeon del mundo', 'el 10'],
    synonyms: 'Lionel Messi La Pulga D10S GOAT Leo Argentina Barcelona Inter Miami Mundial Campeon del Mundo Balon de Oro Futbolista'
  },
  {
    canonical: 'Spider-Man',
    keywords: ['spiderman', 'spider-man', 'hombre arana', 'el hombre arana', 'spidey', 'peter parker', 'miles morales', 'spiderverse', 'venom'],
    synonyms: 'Spider-Man Spiderman El Hombre Arana Spidey Peter Parker Miles Morales Marvel Superheroes Vengadores'
  },
  {
    canonical: 'Batman',
    keywords: ['batman', 'caballero de la noche', 'el caballero de la noche', 'hombre murcielago', 'bruce wayne', 'gotham', 'joker', 'el guason'],
    synonyms: 'Batman El Caballero de la Noche El Hombre Murcielago Bruce Wayne Gotham DC Comics Superheroes'
  },
  {
    canonical: 'Super Mario Bros',
    keywords: ['mario', 'mario bros', 'super mario', 'luigi', 'peach', 'princesa peach', 'bowser', 'toad', 'nintendo', 'champinon', 'fontanero'],
    synonyms: 'Super Mario Bros Mario Luigi Princesa Peach Bowser Toad Reino Champinon Nintendo Videojuegos'
  },
  {
    canonical: 'Sonic',
    keywords: ['sonic', 'sonic the hedgehog', 'erizo azul', 'tails', 'knuckles', 'shadow', 'sega', 'velocidad supersonica'],
    synonyms: 'Sonic The Hedgehog El Erizo Azul Tails Knuckles Shadow Sega Videojuegos'
  },
  {
    canonical: 'Rayo McQueen',
    keywords: ['rayo mcqueen', 'mcqueen', 'rayo', 'el rayo', 'copa piston', 'cars', 'radiador springs', 'mate', 'el 95', 'cuchau', 'cuchao'],
    synonyms: 'Rayo McQueen Lightning McQueen Cars Copa Piston Radiador Springs Mate Disney Pixar Carreras 95'
  },
  {
    canonical: 'Elsa y Anna',
    keywords: ['frozen', 'elsa', 'anna', 'elsa y anna', 'olaf', 'arendelle', 'let it go', 'libre soy'],
    synonyms: 'Elsa y Anna Frozen Princesa Reina del Hielo Olaf Arendelle Disney Princesas'
  },
  {
    canonical: 'Lilo & Stitch',
    keywords: ['stitch', 'lilo', 'lilo y stitch', 'lilo & stitch', 'experimento 626', 'ohana'],
    synonyms: 'Lilo & Stitch Stitch Experimento 626 Ohana Hawai Disney'
  },
  {
    canonical: 'Dragon Ball',
    keywords: ['dragon ball', 'goku', 'vegeta', 'gohan', 'piccolo', 'trunks', 'saiyajin', 'super saiyan', 'kakarotto', 'kamehameha', 'ultra instinto', 'saiyan'],
    synonyms: 'Dragon Ball Z Super Goku Vegeta Saiyajin Ultra Instinto Kamehameha Anime Akira Toriyama'
  },
  {
    canonical: 'Kimetsu no Yaiba',
    keywords: ['kimetsu', 'demon slayer', 'tanjiro', 'nezuko', 'zenitsu', 'inosuke', 'rengoku', 'pilares', 'cazador de demonios'],
    synonyms: 'Demon Slayer Kimetsu no Yaiba Tanjiro Kamado Nezuko Rengoku Pilares Anime Manga'
  },
  {
    canonical: 'Attack on Titan',
    keywords: ['attack on titan', 'shingeki', 'shingeki no kyojin', 'eren', 'levi', 'mikasa', 'titanes', 'titan', 'retumbar', 'legion de reconocimiento'],
    synonyms: 'Attack on Titan Shingeki no Kyojin Eren Jaeger Levi Ackerman Titanes Anime'
  },
  {
    canonical: 'One Piece',
    keywords: ['one piece', 'luffy', 'zoro', 'sanji', 'nami', 'sombrero de paja', 'mugiwara', 'gear 5', 'joy boy'],
    synonyms: 'One Piece Monkey D Luffy Roronoa Zoro Sombrero de Paja Gear 5 Piratas Anime Manga'
  },
  {
    canonical: 'Formula 1',
    keywords: ['f1', 'formula 1', 'formula uno', 'senna', 'ayrton senna', 'hamilton', 'lewis hamilton', 'verstappen', 'max verstappen', 'checo', 'checo perez', 'sergio perez', 'perez', 'ferrari', 'red bull', 'red bull racing', 'bull racing', 'leclerc', 'charles leclerc', 'sainz', 'carlos sainz', 'mclaren', 'monaco', 'gran premio', 'carreras', 'bolidos', 'automovilismo', 'pista'],
    synonyms: 'Formula 1 F1 Automovilismo Gran Premio Ayrton Senna Ferrari Red Bull Carreras Bólidos Max Verstappen Checo Perez Lewis Hamilton Charles Leclerc Carlos Sainz Velocidad Pista'
  },
  {
    canonical: 'Autos',
    keywords: ['auto', 'autos', 'carro', 'carros', 'coche', 'coches', 'automovilismo', 'carreras', 'bolido', 'bolidos', 'motor', 'porsche', 'gtr', 'supra', 'nissan', 'bmw', 'mercedes', 'mustang', 'ford mustang', 'jdm', 'ferrari', 'red bull'],
    synonyms: 'Autos Coches Vehiculos Deportivos Porsche 911 Nissan GTR Supra JDM Motor Automovilismo Formula 1 F1 Ferrari Red Bull Carreras Bólidos Velocidad'
  },
  {
    canonical: 'El Padrino',
    keywords: ['el padrino', 'godfather', 'vito corleone', 'corleone', 'marlon brando', 'michael corleone'],
    synonyms: 'El Padrino The Godfather Vito Corleone Mafia Cine Clasico Peliculas'
  },
  {
    canonical: 'Breaking Bad',
    keywords: ['breaking bad', 'walter white', 'heisenberg', 'jesse pinkman', 'pollos hermanos', 'saul goodman'],
    synonyms: 'Breaking Bad Walter White Heisenberg Jesse Pinkman Metanfetamina Serie'
  },
  {
    canonical: 'Peaky Blinders',
    keywords: ['peaky blinders', 'peaky', 'tommy shelby', 'thomas shelby', 'shelby'],
    synonyms: 'Peaky Blinders Thomas Tommy Shelby Gangster Serie Birmingham'
  },
  {
    canonical: 'Star Wars',
    keywords: ['star wars', 'guerra de las galaxias', 'darth vader', 'vader', 'yoda', 'luke skywalker', 'mandalorian', 'grogu'],
    synonyms: 'Star Wars La Guerra de las Galaxias Darth Vader Yoda Jedi Sith Sci-Fi Cine'
  },
  {
    canonical: 'Pablo Escobar',
    keywords: ['pablo escobar', 'escobar', 'el patron', 'patron', 'patron del mal', 'medellin', 'narcos', 'pablo'],
    synonyms: 'Pablo Escobar El Patron Patron del Mal Medellin Narcos Sneakerhead Sonrisa Historica Colombia Serie Historia'
  },
  {
    canonical: 'Scarface',
    keywords: ['scarface', 'tony montana', 'cara cortada', 'caracortada', 'al pacino', 'montana'],
    synonyms: 'Scarface Tony Montana Cara Cortada Al Pacino Peliculas Cine Clasico Gangster Miami'
  },
  {
    canonical: 'Pulp Fiction',
    keywords: ['pulp fiction', 'tiempos violentos', 'tarantino', 'vincent vega', 'jules winnfield', 'mia wallace'],
    synonyms: 'Pulp Fiction Tiempos Violentos Quentin Tarantino Mia Wallace Cine Clasico Peliculas'
  }
];

// ── STOPWORDS EN ESPAÑOL (Palabras funcionales a ignorar en búsqueda léxica) ─
export const SPANISH_STOPWORDS = new Set([
  'de', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas', 'al', 'del',
  'y', 'o', 'u', 'e', 'en', 'por', 'para', 'con', 'sin', 'sobre', 'tras',
  'que', 'se', 'su', 'sus', 'mi', 'mis', 'tu', 'tus', 'me', 'te', 'nos',
  'hay', 'tienen', 'tiene', 'tienes', 'tendra', 'tendran', 'habra',
  'mostrame', 'mostrar', 'muestrame', 'ensenar', 'ensename', 'ver', 'quiero',
  'busca', 'buscar', 'cuadros', 'cuadro', 'posters', 'poster', 'obra', 'obras',
  'fotos', 'foto', 'disenos', 'diseno', 'mas', 'otro', 'otros', 'otra', 'otras',
  'todos', 'todas', 'todo', 'toda', 'cuales', 'cual', 'quien', 'quienes',
  'como', 'donde', 'cuando', 'hola', 'buenas', 'saludos', 'porfa', 'favor',
  'dl', 'd'
]);

/**
 * Normaliza una cadena quitando tildes, diacríticos y caracteres especiales.
 */
export function normalizeText(str) {
  return String(str || '')
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Builds the enriched semantic text representation of a poster with entity aliases.
 * @param {object} p - Poster object
 * @returns {string} Rich semantic text string
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

  const normTitle = normalizeText(title);
  const normSub = normalizeText(p.subtitulo || p.subtitle);
  const normCat = normalizeText(category);

  // Detección virtual de F1 / Automovilismo para pósters de BASKETBALL_Y_FORMULA_1 sin tags en BD
  const isF1Poster = (category === 'BASKETBALL_Y_FORMULA_1' || normCat.includes('formula')) &&
    !normTitle.includes('jordan') && !normTitle.includes('michael');

  const virtualRacingTags = isF1Poster
    ? 'Etiquetas: Formula 1, F1, Automovilismo, Autos, Carreras, Bólidos, Gran Premio, Motores, Velocidad, Pista.'
    : '';

  const effectiveTags = tags || virtualRacingTags;

  // Buscar si el título o subtítulo coincide con alguna entidad para enriquecer su vector
  const matchedEntity = ENTITY_ALIASES.find(ent => 
    normTitle.includes(normalizeText(ent.canonical)) ||
    ent.keywords.some(kw => normTitle.includes(normalizeText(kw)) || normSub.includes(normalizeText(kw)))
  );

  let entityBonus = matchedEntity ? `Alias y Términos Clave de Búsqueda: ${matchedEntity.synonyms}.` : '';
  if (isF1Poster && !matchedEntity) {
    entityBonus = 'Alias y Términos Clave de Búsqueda: Formula 1 F1 Automovilismo Gran Premio Ayrton Senna Ferrari Red Bull Carreras Bólidos Max Verstappen Checo Perez Lewis Hamilton Charles Leclerc Carlos Sainz Velocidad Pista.';
  }

  return `Obra: ${title}. Categoría: ${category}. ${subtitle} ${franchiseStr} ${effectiveTags} ${entityBonus} ${desc}`
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 2048);
}

/**
 * Generates a 768-dimensional vector embedding for a given text prompt.
 * @param {string} text - Text to vectorize.
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
    signal: AbortSignal.timeout(3500),
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
 * Expands a user query with known entity aliases and conversation context.
 * @param {string} userQuery
 * @param {any[]} [conversationHistory=[]]
 * @returns {{ expandedQuery: string, matchedEntities: object[], activeSubject: string|null }}
 */
export function expandQueryWithContext(userQuery, conversationHistory = []) {
  const qNorm = normalizeText(userQuery);
  const matchedEntities = [];

  // 1. Detección directa en la consulta actual
  for (const entity of ENTITY_ALIASES) {
    const found = entity.keywords.some(kw => {
      const kwNorm = normalizeText(kw);
      return qNorm === kwNorm || qNorm.includes(` ${kwNorm} `) || qNorm.startsWith(`${kwNorm} `) || qNorm.endsWith(` ${kwNorm}`) || qNorm.includes(kwNorm);
    });
    if (found) {
      matchedEntities.push(entity);
    }
  }

  // 2. Detección en el historial reciente si la consulta es de seguimiento (ej: "y cuales otros hay?", "tienes mas?", "y de el?")
  let activeSubject = null;
  const isFollowUp = qNorm.includes('otro') || qNorm.includes('mas') || qNorm.includes('tambien') || qNorm.includes('ademas') || qNorm.length < 15;

  if (matchedEntities.length === 0 && isFollowUp && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
    const recentMessages = conversationHistory.slice(-4);
    for (const msg of recentMessages.reverse()) {
      const msgText = normalizeText(msg.text || msg.content || '');
      for (const entity of ENTITY_ALIASES) {
        if (entity.keywords.some(kw => msgText.includes(normalizeText(kw)))) {
          matchedEntities.push(entity);
          activeSubject = entity.canonical;
          break;
        }
      }
      if (matchedEntities.length > 0) break;
    }
  }

  // 3. Construir query expandida para la vectorización
  let expandedQuery = userQuery;
  if (matchedEntities.length > 0) {
    const entityTerms = matchedEntities.map(e => `${e.canonical} ${e.synonyms}`).join(' ');
    expandedQuery = `${userQuery} ${entityTerms}`.trim();
  }

  return {
    expandedQuery,
    matchedEntities,
    activeSubject: activeSubject || (matchedEntities[0]?.canonical || null)
  };
}

/**
 * Computes lexical / keyword relevance score between a query and a poster.
 * Uses strict stopword filtering, entity alias matching, and property weighting.
 * @param {string} query
 * @param {object} p
 * @param {object[]} [matchedEntities=[]]
 * @returns {number} Value between 0.0 and 1.0
 */
export function computeLexicalSimilarity(query, p, matchedEntities = []) {
  if (!query || !p) return 0;

  const qClean = normalizeText(query);
  // Filtrar estrictamente stopwords en español
  const rawTokens = qClean.split(/[\s,.-]+/).filter(t => t.length >= 2);
  const qTokens = rawTokens.filter(t => !SPANISH_STOPWORDS.has(t));

  const title = normalizeText(p.titulo || p.title);
  const sub = normalizeText(p.subtitulo || p.subtitle);
  const cat = normalizeText(p.categoria || p.category);
  const franchise = normalizeText(p.franchise?.name || p.franchise);
  const desc = normalizeText(p.descripcion || p.description);

  // Virtual tags para F1 / Automovilismo en BASKETBALL_Y_FORMULA_1
  const isF1Poster = (cat.includes('formula') || cat === 'basketball y formula 1') &&
    !title.includes('jordan') && !title.includes('michael');

  const rawTags = (Array.isArray(p.tags) ? p.tags : []).map(normalizeText);
  const virtualTags = isF1Poster
    ? ['formula 1', 'f1', 'automovilismo', 'autos', 'auto', 'carro', 'carros', 'carreras', 'bolidos', 'coche', 'coches', 'gran premio', 'ferrari', 'red bull', 'motor', 'velocidad', 'racing']
    : [];
  const tags = [...rawTags, ...virtualTags];

  // 1. Verificación directa de entidades reconocidas (ej: "el bicho" -> Cristiano Ronaldo)
  for (const ent of matchedEntities) {
    const canonicalNorm = normalizeText(ent.canonical);
    if (title.includes(canonicalNorm) || franchise.includes(canonicalNorm)) {
      return 1.0; // Coincidencia perfecta de entidad
    }
    // Si la entidad es Fórmula 1 o Autos, y el póster es de F1, Mustang o McQueen
    if ((canonicalNorm === 'formula 1' || canonicalNorm === 'autos') && (isF1Poster || title.includes('mustang') || title.includes('mcqueen'))) {
      return 0.95; // Coincidencia semántica directa de temática motor/F1
    }
  }

  // Si no quedaron tokens tras el filtrado de stopwords, verificar frase completa o fallback
  if (qTokens.length === 0) {
    if (rawTokens.length > 0 && title.includes(rawTokens.join(' '))) return 0.50;
    return 0;
  }

  let rawScore = 0;
  let matchCount = 0;

  for (const token of qTokens) {
    if (title.includes(token)) {
      rawScore += 0.60;
      matchCount++;
    } else if (franchise.includes(token)) {
      rawScore += 0.50;
      matchCount++;
    } else if (tags.some(t => t.includes(token))) {
      rawScore += 0.45;
      matchCount++;
    } else if (sub.includes(token)) {
      rawScore += 0.35;
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

  // Exact whole keyword match boost in title or tags
  for (const token of qTokens) {
    if (title === token || tags.includes(token)) {
      rawScore += 0.40;
    }
  }

  const coverage = matchCount / qTokens.length;
  return Math.min(1.0, rawScore * coverage);
}

/**
 * Searches the catalog in PostgreSQL using Hybrid Search (Semantic Vectors + Entity Aliases + Lexical Keywords).
 * Retrieves the Top-N most relevant posters for a user's prompt.
 * 
 * @param {string} userQuery - The user question or search phrase.
 * @param {number} [limit=8] - Max items to return (default Top-8).
 * @param {string} [customApiKey] - Optional API key.
 * @param {number} [minThreshold=MIN_SIMILARITY_THRESHOLD] - Minimum similarity threshold.
 * @param {any[]} [conversationHistory=[]] - Recent conversation turns.
 * @returns {Promise<Array<{ poster: object, score: number }>>}
 */
export async function findSimilarPosters(userQuery, limit = 8, customApiKey, minThreshold = MIN_SIMILARITY_THRESHOLD, conversationHistory = []) {
  try {
    // 1. Expansión inteligente de la consulta con entidades y contexto conversacional
    const { expandedQuery, matchedEntities } = expandQueryWithContext(userQuery, conversationHistory);

    let queryVector = null;
    try {
      queryVector = await generateEmbedding(expandedQuery, customApiKey);
    } catch (embErr) {
      console.warn('[Embedding Search] Query embedding failed, falling back to lexical search:', embErr.message);
    }

    // 2. Obtener obras publicadas con caché inteligente en RAM (5 min TTL)
    const rawPosters = await getCachedPublishedPosters();

    if (!rawPosters || rawPosters.length === 0) {
      return [];
    }

    // Auto-sync no bloqueante si hay obras sin vector
    const pendingCount = rawPosters.filter(p => !Array.isArray(p.embedding) || p.embedding.length !== EMBEDDING_DIMENSIONS).length;
    if (pendingCount > 0 && !isSyncingEmbeddings) {
      syncPendingEmbeddings(customApiKey).catch(err => {
        console.warn('[Background Embedding Sync] Warning:', err.message);
      });
    }

    // 3. Puntuar cada obra con la estrategia híbrida mejorada
    const scoredPosters = rawPosters.map((p) => {
      let vectorScore = 0;
      if (queryVector && Array.isArray(p.embedding) && p.embedding.length === EMBEDDING_DIMENSIONS) {
        vectorScore = computeCosineSimilarity(queryVector, p.embedding);
      }

      const lexicalScore = computeLexicalSimilarity(userQuery, p, matchedEntities);

      let finalScore = 0;
      if (vectorScore > 0 && lexicalScore > 0) {
        // Coincidencia híbrida: vector + léxico con sinergia
        finalScore = Math.max(vectorScore, (vectorScore * 0.60) + (lexicalScore * 0.40));
        if (lexicalScore >= 0.80) {
          finalScore = Math.max(finalScore, 0.92);
        } else if (lexicalScore >= 0.40) {
          finalScore = Math.max(finalScore, (vectorScore * 0.40) + 0.60);
        }
      } else if (vectorScore > 0) {
        // Coincidencia puramente semántica (el modelo de embeddings asocia la semántica aunque no comparta palabras exactas)
        finalScore = vectorScore;
      } else {
        finalScore = lexicalScore;
      }

      return {
        poster: formatPosterForClient(p),
        score: finalScore,
        vectorScore,
        lexicalScore
      };
    });

    // 4. Filtrar por umbral de relevancia
    const relevantPosters = scoredPosters.filter(p => p.score >= minThreshold || p.lexicalScore >= 0.35 || p.vectorScore >= 0.48);

    // 5. Ordenar descendente por score
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
 * @param {boolean} [forceReindex=false]
 * @returns {Promise<{ total: number, synced: number, alreadySynced: number, durationSec: string }>}
 */
export async function syncPendingEmbeddings(customApiKey, batchSize = 16, forceReindex = false) {
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

    const pendingPosters = forceReindex
      ? allPosters
      : allPosters.filter(p => !Array.isArray(p.embedding) || p.embedding.length !== EMBEDDING_DIMENSIONS);
      
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

    console.log(`[RAG Auto-Sync] Iniciando vectorización enriquecida de ${pendingPosters.length} obras...`);

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

    invalidateEmbeddingsCache();

    return {
      total: allPosters.length,
      synced: successCount,
      alreadySynced: allPosters.length - successCount,
      durationSec,
      message: `Se vectorizaron exitosamente ${successCount} obras con alias semánticos enriquecidos.`
    };
  } finally {
    isSyncingEmbeddings = false;
  }
}
