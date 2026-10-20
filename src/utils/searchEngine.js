/**
 * Deco Vintage Intelligent Fuzzy Search Engine
 * Features:
 * - Accent/Diacritic stripping (é -> e, ü -> u, etc.)
 * - Punctuation and hyphen normalization (Spider-Man -> spiderman / spider man)
 * - Multi-token word matching in any order
 * - Typo tolerance via Damerau-Levenshtein distance (porshe -> porsche)
 * - Laser precision: No blind substrings for short tokens
 * - Evaluates Title, Subtitle, Category, Franchise, Workshop Tags
 * - Excludes description paragraph to eliminate noise
 * - Relevance scoring & ranking
 */

// Common synonyms and aliases (Kept empty to eliminate hallucinated expansions)
const SYNONYMS = {};

/**
 * Strips accents, removes special characters, and normalizes text.
 */
export function normalizeText(text) {
  if (!text) return '';
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics / accents
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // replace punctuation/hyphens with spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates Levenshtein Distance for typo tolerance
 */
function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Checks if queryWord fuzzy matches targetWord with allowed typo threshold or valid prefix (>= 3 chars)
 */
function isFuzzyMatch(queryWord, targetWord) {
  if (!queryWord || !targetWord) return false;
  if (queryWord === targetWord) return true;

  // Exact without spaces/hyphens
  const cleanQ = queryWord.replace(/\s+/g, '');
  const cleanT = targetWord.replace(/\s+/g, '');
  if (cleanQ === cleanT) return true;

  // Prefix matching: only for words of meaningful length (>= 3 chars)
  // to avoid short tokens ('rs', 'de', 'el') falsely matching arbitrary words ('wars', 'cars')
  if (cleanQ.length >= 3 && cleanT.length >= 3) {
    if (cleanT.startsWith(cleanQ)) return true;
    if (cleanQ.startsWith(cleanT) && cleanT.length >= cleanQ.length * 0.75) return true;
  }

  // Typo thresholds: length <= 3 requires exact match
  if (cleanQ.length <= 3 || cleanT.length <= 3) return false;

  const maxLen = Math.max(cleanQ.length, cleanT.length);
  const minLen = Math.min(cleanQ.length, cleanT.length);
  if (maxLen - minLen > 2) return false;

  const maxDist = cleanQ.length <= 5 ? 1 : 2;
  const dist = levenshteinDistance(cleanQ, cleanT);
  return dist <= maxDist;
}

/**
 * Builds candidate words including adjacent compounds (e.g., 'spider' + 'man' -> 'spiderman')
 */
function buildCandidateWords(words) {
  if (!Array.isArray(words) || words.length === 0) return [];
  const candidates = [...words];
  for (let i = 0; i < words.length - 1; i++) {
    candidates.push(words[i] + words[i + 1]);
  }
  return candidates;
}

const STOP_WORDS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
  'de', 'del', 'en', 'para', 'con', 'por', 'y', 'o',
  'a', 'al', 'que', 'se', 'su', 'sus', 'es'
]);

/**
 * Main Search Function with Ranking
 */
export function searchPosters(rawQuery, posters = []) {
  if (!rawQuery || !rawQuery.trim()) return [];
  if (!Array.isArray(posters) || posters.length === 0) return [];

  const normalizedQuery = normalizeText(rawQuery);
  const queryTokens = normalizedQuery.split(' ').filter(t => t.length > 0 && !STOP_WORDS.has(t));
  if (queryTokens.length === 0) return [];

  const compactQuery = normalizedQuery.replace(/\s+/g, '');
  const isSingleWordQuery = !normalizedQuery.includes(' ');
  const scoredResults = [];

  for (const poster of posters) {
    let score = 0;

    const normTitle = normalizeText(poster.title || poster.titulo);
    const compactTitle = normTitle.replace(/\s+/g, '');
    const normSubtitle = normalizeText(poster.subtitle || poster.subtitulo);
    const compactSubtitle = normSubtitle.replace(/\s+/g, '');
    const normCat = normalizeText(poster.category || poster.categoria);
    const normFran = normalizeText(poster.franchise?.name || poster.franchise);
    const normTags = Array.isArray(poster.tags) ? poster.tags.map(t => normalizeText(t)).filter(Boolean) : [];

    const titleWords = normTitle.split(' ').filter(Boolean);
    const candidateTitleWords = buildCandidateWords(titleWords);

    const subtitleWords = normSubtitle.split(' ').filter(Boolean);
    const candidateSubtitleWords = buildCandidateWords(subtitleWords);

    const catWords = normCat.split(' ').filter(Boolean);
    const candidateCatWords = buildCandidateWords(catWords);

    const franWords = normFran.split(' ').filter(Boolean);
    const candidateFranWords = buildCandidateWords(franWords);

    const tagWords = normTags.join(' ').split(' ').filter(Boolean);
    const candidateTagWords = buildCandidateWords(tagWords);

    // 1. Direct exact or full phrase match
    // En Título (+150): frase exacta, o palabra exacta / prefijo >= 3 letras
    if (normTitle.length > 0) {
      if (!isSingleWordQuery && normTitle.includes(normalizedQuery)) {
        score += 150;
      } else if (isSingleWordQuery && candidateTitleWords.some(tw => tw === normalizedQuery || (normalizedQuery.length >= 3 && tw.startsWith(normalizedQuery)))) {
        score += 150;
      } else if (compactQuery.length >= 4 && compactTitle.startsWith(compactQuery)) {
        score += 130;
      }
    }

    // En Subtítulo (+120): frase exacta, o palabra exacta / prefijo >= 3 letras
    if (normSubtitle.length > 0) {
      if (!isSingleWordQuery && normSubtitle.includes(normalizedQuery)) {
        score += 120;
      } else if (isSingleWordQuery && candidateSubtitleWords.some(sw => sw === normalizedQuery || (normalizedQuery.length >= 3 && sw.startsWith(normalizedQuery)))) {
        score += 120;
      } else if (compactQuery.length >= 4 && compactSubtitle.startsWith(compactQuery)) {
        score += 100;
      }
    }

    // En Tags (+140): coincidencia exacta de la consulta con la Palabra Clave de Taller
    if (normTags.some(t => t === normalizedQuery)) {
      score += 140;
    }

    // 2. Token Matching Across Title, Subtitle, Tags, Franchise, Category
    let matchedTokenCount = 0;

    for (const token of queryTokens) {
      let tokenMatched = false;

      // Title Words
      if (candidateTitleWords.some(tw => tw === token)) {
        score += 45;
        tokenMatched = true;
      } else if (candidateTitleWords.some(tw => isFuzzyMatch(token, tw))) {
        score += 25;
        tokenMatched = true;
      }

      // Subtitle Words
      if (candidateSubtitleWords.some(sw => sw === token)) {
        score += 35;
        tokenMatched = true;
      } else if (candidateSubtitleWords.some(sw => isFuzzyMatch(token, sw))) {
        score += 20;
        tokenMatched = true;
      }

      // Workshop Tags
      if (candidateTagWords.some(tw => tw === token)) {
        score += 40;
        tokenMatched = true;
      } else if (candidateTagWords.some(tw => isFuzzyMatch(token, tw))) {
        score += 25;
        tokenMatched = true;
      }

      // Franchise
      if (candidateFranWords.some(fw => fw === token)) {
        score += 35;
        tokenMatched = true;
      } else if (candidateFranWords.some(fw => isFuzzyMatch(token, fw))) {
        score += 20;
        tokenMatched = true;
      }

      // Category
      if (candidateCatWords.some(cw => cw === token)) {
        score += 25;
        tokenMatched = true;
      } else if (candidateCatWords.some(cw => isFuzzyMatch(token, cw))) {
        score += 15;
        tokenMatched = true;
      }

      if (tokenMatched) {
        matchedTokenCount++;
      }
    }

    // 3. Multi-Token and Match Filtering
    if (queryTokens.length > 1) {
      // Exigir que TODOS los tokens coincidan en algún metadato de la obra
      if (matchedTokenCount === queryTokens.length) {
        score += 50; // Bonus por match completo
        scoredResults.push({ poster, score });
      }
    } else {
      // Para consulta de 1 token, requerir al menos 1 match válido
      if (score > 0 && matchedTokenCount >= 1) {
        scoredResults.push({ poster, score });
      }
    }
  }

  // Sort by highest score first
  scoredResults.sort((a, b) => b.score - a.score);

  return scoredResults.map(r => r.poster);
}
