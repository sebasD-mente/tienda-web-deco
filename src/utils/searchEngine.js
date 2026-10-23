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

const STOP_WORDS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
  'de', 'del', 'en', 'para', 'con', 'por', 'y', 'o',
  'a', 'al', 'que', 'se', 'su', 'sus', 'es'
]);

/**
 * Checks if queryWord fuzzy matches targetWord with allowed typo threshold or valid prefix.
 * - When allowShortPrefix is true (Title, Subtitle, Tags), prefix matching starts at 1 char
 *   so progressive typing ('Harry P', 'Harry Po') matches 'Potter' without dropping results.
 * - When allowShortPrefix is false (Franchise, Category), prefix matching requires >= 3 chars
 *   so 1-2 char tokens ('p', 's') do not falsely match category/franchise names ('portadas-de-discos', 'seriesypeliculas').
 * - Never uses .includes() so short suffixes ('rs') never match ends of words ('wars', 'cars').
 */
function isFuzzyMatch(queryWord, targetWord, { allowShortPrefix = true } = {}) {
  if (!queryWord || !targetWord) return false;
  if (queryWord === targetWord) return true;

  // Exact without spaces/hyphens
  const cleanQ = queryWord.replace(/\s+/g, '');
  const cleanT = targetWord.replace(/\s+/g, '');
  if (cleanQ === cleanT) return true;

  const minPrefixLen = allowShortPrefix ? 1 : 3;
  if (cleanQ.length >= minPrefixLen && cleanT.length >= minPrefixLen) {
    if (cleanT.startsWith(cleanQ)) return true;
    if (cleanQ.length >= 3 && cleanT.length >= 3 && cleanQ.startsWith(cleanT) && cleanT.length >= cleanQ.length * 0.75) {
      return true;
    }
  }

  // Typo thresholds: length <= 3 requires exact/prefix match only
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
 * Excludes stop words from compound concatenation so 'de' + 'la' never forms 'dela'.
 */
function buildCandidateWords(words) {
  if (!Array.isArray(words) || words.length === 0) return [];
  const candidates = [...words];
  for (let i = 0; i < words.length - 1; i++) {
    if (!STOP_WORDS.has(words[i]) && !STOP_WORDS.has(words[i + 1])) {
      candidates.push(words[i] + words[i + 1]);
    }
  }
  return candidates;
}

/**
 * Internal scoring & filtering pass for a resolved token set
 */
function executeTokenSearch(queryTokens, normalizedQuery, posters, stopWordPrefixOnly = false) {
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

    // 1. Direct exact or full phrase match (when not in single-stop-word prefix mode)
    if (!stopWordPrefixOnly) {
      if (normTitle.length > 0) {
        if (!isSingleWordQuery && normTitle.includes(normalizedQuery)) {
          score += 150;
        } else if (isSingleWordQuery && candidateTitleWords.some(tw => tw === normalizedQuery || tw.startsWith(normalizedQuery))) {
          score += 150;
        } else if (compactQuery.length >= 4 && compactTitle.startsWith(compactQuery)) {
          score += 130;
        }
      }

      if (normSubtitle.length > 0) {
        if (!isSingleWordQuery && normSubtitle.includes(normalizedQuery)) {
          score += 120;
        } else if (isSingleWordQuery && candidateSubtitleWords.some(sw => sw === normalizedQuery || sw.startsWith(normalizedQuery))) {
          score += 120;
        } else if (compactQuery.length >= 4 && compactSubtitle.startsWith(compactQuery)) {
          score += 100;
        }
      }

      if (normTags.some(t => t === normalizedQuery)) {
        score += 140;
      }
    }

    // 2. Token Matching Across Title, Subtitle, Tags, Franchise, Category
    let matchedTokenCount = 0;

    for (const token of queryTokens) {
      let tokenMatched = false;

      // Special guard when the user typed a single word that happens to be in STOP_WORDS (e.g. 'Por' for 'Porsche', 'Su' for 'Superman'):
      // Only match as a prefix of a non-stop content word in Title, Subtitle or Tags.
      if (stopWordPrefixOnly && STOP_WORDS.has(token)) {
        if (titleWords.some(tw => !STOP_WORDS.has(tw) && tw.startsWith(token))) {
          score += 45;
          tokenMatched = true;
        } else if (subtitleWords.some(sw => !STOP_WORDS.has(sw) && sw.startsWith(token))) {
          score += 35;
          tokenMatched = true;
        } else if (tagWords.some(tw => !STOP_WORDS.has(tw) && tw.startsWith(token))) {
          score += 40;
          tokenMatched = true;
        }
        if (tokenMatched) matchedTokenCount++;
        continue;
      }

      // Title Words (short prefixes >= 1 char allowed for live typing)
      if (candidateTitleWords.some(tw => tw === token)) {
        score += 45;
        tokenMatched = true;
      } else if (candidateTitleWords.some(tw => isFuzzyMatch(token, tw, { allowShortPrefix: true }))) {
        score += 25;
        tokenMatched = true;
      }

      // Subtitle Words (short prefixes >= 1 char allowed for live typing)
      if (candidateSubtitleWords.some(sw => sw === token)) {
        score += 35;
        tokenMatched = true;
      } else if (candidateSubtitleWords.some(sw => isFuzzyMatch(token, sw, { allowShortPrefix: true }))) {
        score += 20;
        tokenMatched = true;
      }

      // Workshop Tags (short prefixes >= 1 char allowed)
      if (candidateTagWords.some(tw => tw === token)) {
        score += 40;
        tokenMatched = true;
      } else if (candidateTagWords.some(tw => isFuzzyMatch(token, tw, { allowShortPrefix: true }))) {
        score += 25;
        tokenMatched = true;
      }

      // Franchise (prefix/fuzzy requires >= 3 chars to avoid 1-letter category/franchise noise)
      if (candidateFranWords.some(fw => fw === token)) {
        score += 35;
        tokenMatched = true;
      } else if (candidateFranWords.some(fw => isFuzzyMatch(token, fw, { allowShortPrefix: false }))) {
        score += 20;
        tokenMatched = true;
      }

      // Category (prefix/fuzzy requires >= 3 chars to avoid 1-letter category/franchise noise)
      if (candidateCatWords.some(cw => cw === token)) {
        score += 25;
        tokenMatched = true;
      } else if (candidateCatWords.some(cw => isFuzzyMatch(token, cw, { allowShortPrefix: false }))) {
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

/**
 * Main Search Function with Ranking
 */
export function searchPosters(rawQuery, posters = []) {
  if (!rawQuery || !rawQuery.trim()) return [];
  if (!Array.isArray(posters) || posters.length === 0) return [];

  const normalizedQuery = normalizeText(rawQuery);
  const allTokens = normalizedQuery.split(' ').filter(Boolean);
  if (allTokens.length === 0) return [];

  const nonStopTokens = allTokens.filter(t => !STOP_WORDS.has(t));

  // If all tokens are stop words:
  // - Multi-word stop-word-only queries ('de los en') return []
  // - Single-word queries ('Por' while typing 'Porsche', 'Su' while typing 'Superman') match prefixes of content words
  if (nonStopTokens.length === 0) {
    if (allTokens.length === 1) {
      return executeTokenSearch(allTokens, normalizedQuery, posters, true);
    }
    return [];
  }

  // If the user is actively typing a multi-word query and the last token happens to match a stop word
  // without a trailing space (e.g. 'Avengers En', 'Toyota Su', 'Harry La'), try matching with the last token included first.
  const lastToken = allTokens[allTokens.length - 1];
  const hasTrailingSpace = /\s$/.test(rawQuery);
  if (allTokens.length > 1 && STOP_WORDS.has(lastToken) && !hasTrailingSpace) {
    const tokensWithLast = [...nonStopTokens, lastToken];
    const strictResults = executeTokenSearch(tokensWithLast, normalizedQuery, posters, false);
    if (strictResults.length > 0) {
      return strictResults;
    }
  }

  return executeTokenSearch(nonStopTokens, normalizedQuery, posters, false);
}
