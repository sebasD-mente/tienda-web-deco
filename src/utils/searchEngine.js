/**
 * Deco Vintage Intelligent Fuzzy Search Engine
 * Features:
 * - Accent/Diacritic stripping (é -> e, ü -> u, etc.)
 * - Punctuation and hyphen normalization (Spider-Man -> spiderman / spider man)
 * - Multi-token word matching in any order
 * - Typo tolerance via Damerau-Levenshtein distance (porshe -> porsche)
 * - Synonym and keyword expansion (carros -> autos, dbz -> dragon ball, etc.)
 * - Relevance scoring & ranking
 */

// Common synonyms and aliases in pop-culture / posters
const SYNONYMS = {
  'spiderman': ['spider-man', 'spider man', 'hombre arana', 'peter parker', 'marvel', 'miles morales'],
  'spider-man': ['spiderman', 'spider man', 'hombre arana', 'marvel'],
  'ironman': ['iron man', 'tony stark', 'marvel', 'avengers'],
  'iron man': ['ironman', 'tony stark', 'marvel', 'avengers'],
  'batman': ['caballero de la noche', 'dark knight', 'bruce wayne', 'dc comics', 'gotham'],
  'goku': ['dragon ball', 'dragonball', 'dbz', 'super saiyan', 'kakaroto', 'anime'],
  'dragonball': ['dragon ball', 'dbz', 'goku', 'vegeta', 'anime'],
  'dbz': ['dragon ball', 'dragonball', 'goku', 'vegeta', 'anime'],
  'porshe': ['porsche', 'gt3', '911', 'carrera', 'turbo'],
  'porche': ['porsche', 'gt3', '911', 'carrera', 'turbo'],
  'porsche': ['porsche 911', 'gt3', 'carrera', 'turbo', 'rs'],
  'gtr': ['nissan', 'skyline', 'r34', 'r35', 'godzilla', 'jdm'],
  'skyline': ['nissan', 'gtr', 'r34', 'jdm', 'paul walker'],
  'delorean': ['volver al futuro', 'back to the future', 'doc brown', 'marty mcfly', 'cine'],
  'starwars': ['star wars', 'darth vader', 'yoda', 'jedi', 'sith', 'skywalker', 'mandalorian'],
  'star wars': ['starwars', 'darth vader', 'yoda', 'jedi', 'mandalorian'],
  'f1': ['formula 1', 'formula uno', 'senna', 'ayrton senna', 'red bull', 'ferrari', 'monaco', 'carreras', 'carlos sainz', 'leclerc', 'hamilton', 'verstappen', 'checo perez', 'autos'],
  'formula 1': ['f1', 'formula uno', 'carreras', 'senna', 'monaco', 'red bull', 'ferrari', 'leclerc', 'verstappen', 'checo perez', 'carlos sainz', 'autos'],
  'autos': ['f1', 'formula 1', 'formula uno', 'carreras', 'ferrari', 'red bull', 'carros', 'coches', 'automovilismo', 'bolidos', 'senna', 'leclerc', 'checo perez', 'verstappen', 'sainz'],
  'auto': ['autos', 'f1', 'formula 1', 'carreras', 'ferrari', 'red bull', 'carros', 'coches'],
  'carros': ['autos', 'vehiculos', 'coches', 'f1', 'formula 1', 'carreras', 'ferrari', 'red bull'],
  'coches': ['autos', 'carros', 'vehiculos', 'f1', 'formula 1'],
  'bicho': ['cr7', 'cristiano ronaldo', 'cristiano', 'el bicho', 'comandante', 'futbol', 'real madrid', 'portugal', 'siuuu'],
  'el bicho': ['bicho', 'cr7', 'cristiano ronaldo', 'futbol'],
  'cr7': ['cristiano ronaldo', 'bicho', 'el bicho', 'comandante', 'futbol', 'real madrid', 'portugal', 'siuuu'],
  'cristiano': ['cristiano ronaldo', 'cr7', 'bicho', 'futbol'],
  'messi': ['lionel messi', 'la pulga', 'pulga', 'futbol', 'argentina', 'barcelona', 'inter miami', 'd10s', 'goat'],
  'pulga': ['messi', 'lionel messi', 'futbol'],
  'futbol': ['messi', 'cristiano ronaldo', 'cr7', 'bicho', 'soccer'],
  'jordan': ['michael jordan', 'basketball', 'nba', 'bulls', 'chicago bulls', '23'],
  'michael jordan': ['jordan', 'basketball', 'nba', 'bulls'],
  'basketball': ['michael jordan', 'jordan', 'nba', 'baloncesto'],
  'fnaf': ['five nights at freddy', 'five nights at freddys', 'freddy fazbear', 'terror'],
  'cars': ['rayo mcqueen', 'mcqueen', 'carreras', 'copa piston', 'disney'],
  'mcqueen': ['rayo mcqueen', 'cars', 'carreras'],
  'zelda': ['the legend of zelda', 'link', 'trifuerza', 'nintendo', 'videojuegos'],
  'mario': ['super mario', 'mario bros', 'nintendo', 'luigi', 'videojuegos'],
  'sonic': ['sonic the hedgehog', 'sega', 'videojuegos'],
  'avengers': ['vengadores', 'marvel', 'iron man', 'spider-man', 'thor', 'capitan america'],
  'vengadores': ['avengers', 'marvel', 'iron man', 'spider-man'],
  'peliculas': ['series y peliculas', 'cine', 'cinema', 'hollywood', 'movies'],
  'pelicula': ['series y peliculas', 'cine', 'cinema', 'hollywood', 'movies'],
  'anime': ['manga', 'japon', 'shonen', 'otaku', 'dragon ball', 'naruto', 'one piece', 'demon slayer', 'attack on titan']
};

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
 * Checks if queryWord fuzzy matches targetWord with allowed typo threshold
 */
function isFuzzyMatch(queryWord, targetWord) {
  if (!queryWord || !targetWord) return false;
  if (queryWord === targetWord) return true;

  // Exact without spaces/hyphens
  const cleanQ = queryWord.replace(/\s+/g, '');
  const cleanT = targetWord.replace(/\s+/g, '');
  if (cleanQ === cleanT) return true;

  // Substring inclusion: only for words of meaningful length (>= 3 chars)
  // to avoid single-letter tokens ('s', 'to', 'at', 'de') falsely matching words like 'autos'
  if (cleanQ.length >= 3 && cleanT.length >= 3) {
    if (cleanT.includes(cleanQ)) return true;
    if (cleanQ.includes(cleanT) && cleanT.length >= cleanQ.length * 0.75) return true;
  }

  // Typo thresholds:
  // length <= 3: exact only
  if (cleanQ.length <= 3 || cleanT.length <= 3) return false;

  const maxLen = Math.max(cleanQ.length, cleanT.length);
  const minLen = Math.min(cleanQ.length, cleanT.length);
  if (maxLen - minLen > 2) return false;

  const maxDist = cleanQ.length <= 5 ? 1 : 2;
  const dist = levenshteinDistance(cleanQ, cleanT);
  return dist <= maxDist;
}

const STOP_WORDS = new Set(['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'en', 'para', 'con', 'por', 'y', 'o', 'a', 'al', 'que', 'se', 'su', 'sus', 'es']);

/**
 * Main Search Function with Ranking
 */
export function searchPosters(rawQuery, posters = []) {
  if (!rawQuery || !rawQuery.trim()) return [];
  if (!Array.isArray(posters) || posters.length === 0) return [];

  const rawClean = rawQuery.trim().toLowerCase();
  const normalizedQuery = normalizeText(rawQuery);
  const queryTokens = normalizedQuery.split(' ').filter(t => t.length > 0 && !STOP_WORDS.has(t));

  // Expand query tokens with known synonyms
  const expandedTokens = new Set(queryTokens);
  queryTokens.forEach(token => {
    if (SYNONYMS[token]) {
      SYNONYMS[token].forEach(syn => {
        normalizeText(syn).split(' ').forEach(st => {
          if (st.length >= 2 && !STOP_WORDS.has(st)) expandedTokens.add(st);
        });
      });
    }
  });

  // Also check full query string synonym
  if (SYNONYMS[rawClean]) {
    SYNONYMS[rawClean].forEach(syn => {
      normalizeText(syn).split(' ').forEach(st => {
        if (st.length >= 2 && !STOP_WORDS.has(st)) expandedTokens.add(st);
      });
    });
  }

  const tokenList = Array.from(expandedTokens);

  const scoredResults = [];

  for (const poster of posters) {
    let score = 0;

    const normTitle = normalizeText(poster.title);
    const compactTitle = normTitle.replace(/\s+/g, '');
    const normCat = normalizeText(poster.category);
    const normFran = normalizeText(poster.franchise);
    const normDesc = normalizeText(poster.description);
    const normTags = Array.isArray(poster.tags) ? poster.tags.map(t => normalizeText(t)) : [];

    const titleWords = normTitle.split(' ');
    const tagWords = normTags.join(' ').split(' ');

    // 1. Direct exact or substring match on title (Highest priority)
    if (normTitle.includes(normalizedQuery)) {
      score += 150;
    } else if (compactTitle.includes(normalizedQuery.replace(/\s+/g, ''))) {
      score += 130;
    }

    // 2. Token Matching Across Title, Category, Franchise, Tags
    let matchedTokenCount = 0;

    for (const token of tokenList) {
      let tokenMatched = false;

      // Match in Title words
      if (titleWords.some(tw => tw === token)) {
        score += 40;
        tokenMatched = true;
      } else if (titleWords.some(tw => isFuzzyMatch(token, tw))) {
        score += 25;
        tokenMatched = true;
      } else if (normTitle.includes(token)) {
        score += 20;
        tokenMatched = true;
      }

      // Match in Category
      if (normCat.includes(token)) {
        score += 25;
        tokenMatched = true;
      }

      // Match in Franchise
      if (normFran.includes(token)) {
        score += 35;
        tokenMatched = true;
      }

      // Match in Tags
      if (tagWords.some(tw => tw === token || isFuzzyMatch(token, tw))) {
        score += 20;
        tokenMatched = true;
      }

      // Match in Description (only meaningful tokens)
      if (token.length >= 3 && !STOP_WORDS.has(token) && normDesc.includes(token)) {
        score += 10;
        tokenMatched = true;
      }

      if (tokenMatched) {
        matchedTokenCount++;
      }
    }

    // Require at least 1 token match
    if (score > 0 || matchedTokenCount > 0) {
      // Bonus if all original query tokens matched
      const allOriginalsMatched = queryTokens.every(qt => 
        normTitle.includes(qt) || 
        normFran.includes(qt) || 
        normCat.includes(qt) || 
        tagWords.some(tw => isFuzzyMatch(qt, tw)) || 
        titleWords.some(tw => isFuzzyMatch(qt, tw))
      );
      if (allOriginalsMatched && queryTokens.length > 1) {
        score += 50;
      }

      scoredResults.push({
        poster,
        score
      });
    }
  }

  // Sort by highest score first
  scoredResults.sort((a, b) => b.score - a.score);

  return scoredResults.map(r => r.poster);
}
