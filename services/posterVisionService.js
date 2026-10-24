/**
 * services/posterVisionService.js
 * Motor multimodal de Visión con IA para autocompletado de fichas de obras.
 *
 * Características:
 *  - Multimodalidad nativa con @google/genai y catálogo Gemini 3/4.
 *  - Failover determinista: gemini-3.8-flash → gemini-3.6-flash → gemini-3.1-flash-lite.
 *  - Soporte dual de imagen: base64 (dataUrl) o URL remota/local.
 *  - Inyección de categorías y franquicias reales desde PostgreSQL (Prisma).
 *  - Sanitización estricta anti-MDF, anti-materiales, anti-precios y anti-clichés.
 *  - Salida limpia tipada con Zod (Cero tags, cero sizes emitidos).
 */

import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { getJarvisApiKey } from './jarvisService.js';
import { getAllCategories, getAllFranchises } from './catalogService.js';
import { PROJECT_ROOT } from '../config/paths.js';

export const VISION_CANDIDATE_MODELS = [
  { name: 'gemini-3.8-flash', timeoutMs: 12000 },
  { name: 'gemini-3.6-flash', timeoutMs: 12000 },
  { name: 'gemini-3.1-flash-lite', timeoutMs: 10000 }
];

export const posterVisionRawSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  subtitle: z.string().min(1, 'El subtítulo es requerido'),
  description: z.string().min(20, 'La descripción debe tener al menos 20 caracteres'),
  category: z.string(),
  franchiseId: z.string().optional().nullable()
});

/**
 * Purgador determinista de menciones a materiales de fábrica y precios.
 * @param {string} text
 * @returns {string}
 */
export function stripProhibitedTerms(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\b(madera\s+)?mdf(\s+de)?\s*(5\.5\s*mm)?/gi, '')
    .replace(/\b5\.5\s*mm\b/gi, '')
    .replace(/\bhp\s*l[aá]tex\b/gi, '')
    .replace(/\bcintas?\s+tesa\b/gi, '')
    .replace(/\btesa\b/gi, '')
    .replace(/\bvinil\b/gi, '')
    .replace(/\bpvc\b/gi, '')
    .replace(/\bquetzales?\b/gi, '')
    .replace(/\bq\s*\d+(\.\d+)?\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;:])/g, '$1')
    .trim();
}

/**
 * Purgador de arranques cliché acartonados.
 * @param {string} text
 * @returns {string}
 */
export function stripCliches(text) {
  if (!text || typeof text !== 'string') return '';
  const CLICHE_REGEX = /^((espectacular|hermosa?|incre[ií]ble|maravillos[oa]|impresionante|fascinante)\s+(p[oó]ster|composici[oó]n|cuadro|l[aá]mina|dise[ñn]o|obra)\s+(de\s+|que\s+)?)/i;
  let clean = text.trim();
  while (CLICHE_REGEX.test(clean)) {
    clean = clean.replace(CLICHE_REGEX, '').trim();
    if (clean.length > 0) {
      clean = clean.charAt(0).toUpperCase() + clean.slice(1);
    }
  }
  return clean;
}

/**
 * Sanitiza y homologa el análisis de visión contra la base de datos real.
 * @param {object} rawAnalysis
 * @param {Array} validCategories
 * @param {Array} validFranchises
 * @returns {{ title: string, subtitle: string, description: string, category: string, franchiseId: string, modelUsed: string|null }}
 */
export function sanitizeVisionAnalysis(rawAnalysis, validCategories = [], validFranchises = []) {
  if (!rawAnalysis || typeof rawAnalysis !== 'object') {
    throw new Error('El análisis de visión debe ser un objeto válido.');
  }

  // 1. Sanitizar textos
  const title = (rawAnalysis.title || '').trim();
  const subtitle = (rawAnalysis.subtitle || '').trim();
  let description = stripProhibitedTerms(rawAnalysis.description || '');
  description = stripCliches(description);

  // 2. Mapear categoría contra PostgreSQL
  const activeCats = validCategories.filter(c => {
    const id = typeof c === 'string' ? c : c.id;
    return id && id !== 'TODOS';
  });

  const rawCat = String(rawAnalysis.category || '').toUpperCase().trim();
  let matchedCategory = '';

  // Coincidencia exacta por ID
  const directCat = activeCats.find(c => {
    const id = typeof c === 'string' ? c : c.id;
    return id.toUpperCase() === rawCat;
  });

  if (directCat) {
    matchedCategory = typeof directCat === 'string' ? directCat : directCat.id;
  } else {
    // Coincidencia por nombre normalizado
    const nameMatch = activeCats.find(c => {
      const name = typeof c === 'object' && c.name ? c.name.toUpperCase() : '';
      return name && (name === rawCat || rawCat.includes(name) || name.includes(rawCat));
    });
    if (nameMatch) {
      matchedCategory = typeof nameMatch === 'string' ? nameMatch : nameMatch.id;
    } else {
      matchedCategory = activeCats[0] ? (typeof activeCats[0] === 'string' ? activeCats[0] : activeCats[0].id) : 'GENERAL';
    }
  }

  // 3. Mapear franquicia contra PostgreSQL
  const rawFranchise = String(rawAnalysis.franchiseId || '').toLowerCase().trim();
  let matchedFranchiseId = '';

  if (rawFranchise && !['ninguna', 'none', 'null', 'independiente', 'n/a', 'undefined'].includes(rawFranchise)) {
    const foundFranchise = validFranchises.find(f => {
      const fId = String(f.id || '').toLowerCase();
      const fSlug = String(f.slug || '').toLowerCase();
      const fName = String(f.name || '').toLowerCase();
      return fId === rawFranchise || fSlug === rawFranchise || fName === rawFranchise;
    });
    if (foundFranchise) {
      matchedFranchiseId = foundFranchise.slug || foundFranchise.id;
    }
  }

  // 4. Salida limpia: estrictamente CERO tags, CERO sizes
  return {
    title,
    subtitle,
    description,
    category: matchedCategory,
    franchiseId: matchedFranchiseId,
    modelUsed: rawAnalysis.modelUsed || null
  };
}

/**
 * Convierte un dataUrl o una URL en un payload base64 inlineData para Gemini.
 * @param {{ dataUrl?: string, imageUrl?: string }} source
 * @returns {Promise<{ mimeType: string, base64Data: string }>}
 */
const ALLOWED_REMOTE_IMAGE_HOSTS = new Set([
  'storage.googleapis.com'
]);

const ALLOWED_LOCAL_IMAGE_EXTENSIONS = new Set([
  '.webp',
  '.png',
  '.jpg',
  '.jpeg'
]);

export async function resolveImageInlineData({ dataUrl, imageUrl }) {
  if (dataUrl && typeof dataUrl === 'string' && dataUrl.startsWith('data:')) {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/s);
    if (!match) throw new Error('El formato dataUrl de la imagen no es un base64 válido.');
    return {
      mimeType: match[1] || 'image/jpeg',
      base64Data: match[2]
    };
  }

  if (imageUrl && typeof imageUrl === 'string') {
    const trimmedUrl = imageUrl.trim();

    if (trimmedUrl.includes('\0') || /%00/i.test(trimmedUrl)) {
      throw new Error('Ruta local no permitida: contiene caracteres inválidos.');
    }

    // 1. URL remota: Permitir exclusivamente HTTPS desde Google Cloud Storage oficial (Anti-SSRF)
    if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
      let parsedUrl;
      try {
        parsedUrl = new URL(trimmedUrl);
      } catch {
        throw new Error('SSRF bloqueado: URL remota malformada.');
      }

      if (parsedUrl.protocol !== 'https:' || !ALLOWED_REMOTE_IMAGE_HOSTS.has(parsedUrl.hostname.toLowerCase())) {
        throw new Error('SSRF bloqueado: Solo se permiten URLs HTTPS del bucket oficial storage.googleapis.com.');
      }

      const response = await fetch(parsedUrl.toString(), {
        signal: AbortSignal.timeout(10000)
      });
      if (!response.ok) {
        throw new Error(`No se pudo descargar la imagen desde ${trimmedUrl} (HTTP ${response.status})`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const mimeType = response.headers.get('content-type') || 'image/jpeg';
      return {
        mimeType,
        base64Data: Buffer.from(arrayBuffer).toString('base64')
      };
    }

    // 2. Ruta local: Confinada estrictamente dentro de public/posters/uploads (Anti-Path Traversal)
    let decodedPath = trimmedUrl;
    try {
      decodedPath = decodeURIComponent(trimmedUrl);
    } catch {
      throw new Error('Ruta local no permitida: codificación URL inválida.');
    }

    if (decodedPath.includes('..') || decodedPath.includes('\\')) {
      throw new Error('Ruta local no permitida: intento de Path Traversal detectado.');
    }

    const cleanRelPath = decodedPath.replace(/^\/+/, '');
    const allowedUploadsRoot = path.resolve(PROJECT_ROOT, 'public', 'posters', 'uploads');
    const candidatePath = path.resolve(PROJECT_ROOT, 'public', cleanRelPath);

    if (!candidatePath.startsWith(allowedUploadsRoot + path.sep)) {
      throw new Error('Ruta local no permitida: el archivo debe residir dentro de /posters/uploads/.');
    }

    const ext = path.extname(candidatePath).toLowerCase();
    if (!ALLOWED_LOCAL_IMAGE_EXTENSIONS.has(ext)) {
      throw new Error('Ruta local no permitida: extensión de imagen no permitida.');
    }

    if (fs.existsSync(candidatePath)) {
      const fileBuffer = await fs.promises.readFile(candidatePath);
      const mimeType = ext === '.webp' ? 'image/webp' : (ext === '.png' ? 'image/png' : 'image/jpeg');
      return {
        mimeType,
        base64Data: fileBuffer.toString('base64')
      };
    }

    throw new Error(`No se encontró el archivo local de imagen en: ${imageUrl}`);
  }

  throw new Error('Debes proporcionar un "dataUrl" en base64 o una "imageUrl" válida.');
}

/**
 * Ejecuta el análisis multimodal de la imagen con Gemini.
 * @param {{ dataUrl?: string, imageUrl?: string }} imageSource
 * @param {{ categories?: Array, franchises?: Array }} [options]
 * @returns {Promise<{ title: string, subtitle: string, description: string, category: string, franchiseId: string, modelUsed: string }>}
 */
export async function analyzePosterImageWithVision(imageSource, options = {}) {
  const apiKey = getJarvisApiKey();
  if (!apiKey) {
    throw new Error('No se ha configurado la API Key de Gemini (GEMINI_API_KEY o VITE_GEMINI_API_KEY).');
  }

  const { mimeType, base64Data } = await resolveImageInlineData(imageSource);

  // Obtener categorías y franquicias vivas de PostgreSQL si no fueron inyectadas
  const rawCategories = Array.isArray(options.categories) && options.categories.length > 0
    ? options.categories
    : await getAllCategories();

  const activeCategories = rawCategories.filter(c => (typeof c === 'string' ? c : c.id) !== 'TODOS');

  const rawFranchises = Array.isArray(options.franchises) && options.franchises.length > 0
    ? options.franchises
    : await getAllFranchises();

  const categoriesPromptList = activeCategories
    .map(c => `ID: "${c.id}" — Nombre: "${c.name || c.id}"`)
    .join('\n  ');

  const franchisesPromptList = rawFranchises
    .map(f => `ID: "${f.slug || f.id}" — Colección: "${f.name}"`)
    .join('\n  ');

  const promptText = `
Eres el Curador Experto en Arte Pop, Cine, Música, Automovilismo, Videojuegos y Cuadros de Colección de Deco Vintage Guate.
Tu tarea es analizar visualmente la imagen proporcionada de un póster decorativo y autocompletar con máxima precisión la ficha técnica de la obra.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EJEMPLOS DE REFERENCIA DEL CATÁLOGO REAL DE DECO VINTAGE (TONO Y LONGITUD EXACTA):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ejemplo 1 (Deportes):
{
  "title": "Lionel Messi",
  "subtitle": "La Sonrisa del Campeón del Mundo",
  "description": "Emotivo retrato de Lionel Messi luciendo la histórica camiseta albiceleste de las tres estrellas con el parche dorado de Campeón del Mundo de la FIFA. La fotografía captura la sonrisa serena y plena del astro argentino tras alcanzar la gloria eterna en Qatar, iluminada con un cálido contraste que resalta cada detalle del uniforme. Una pieza cargada de inspiración y orgullo futbolero, ideal para destacar en salas de televisión, estudios, oficinas o rincones deportivos.",
  "category": "FUTBOL",
  "franchiseId": ""
}

Ejemplo 2 (Música / Portada Retro):
{
  "title": "Sabrina Carpenter",
  "subtitle": "Espresso Vintage Cinema Poster",
  "description": "Diseño de inspiración retro estilo cartelera de cine clásico años 50 dedicado al éxito mundial 'Espresso' de Sabrina Carpenter. La composición presenta a la artista en una pose veraniega junto al mar con tipografía vintage en tonos turquesa, crema y bronceado costero que evocan el glamour clásico de Hollywood. Perfecto para dar un toque fresco, pop y sofisticado a dormitorios, vestidores, estudios creativos o rincones musicales.",
  "category": "MUSICA",
  "franchiseId": "portadas-de-discos"
}

Ejemplo 3 (Cine):
{
  "title": "Rocky Balboa",
  "subtitle": "Victoria Épica en Rocky IV",
  "description": "Icónica escena de triunfo de Sylvester Stallone como Rocky Balboa alzando el brazo en el cuadrilátero envuelto en las barras y estrellas tras su legendario combate en Rocky IV. La intensa iluminación dramática del ring resalta la determinación, el esfuerzo y la resiliencia del campeón más querido del cine. Una lámina de pura motivación y carácter, perfecta para gimnasios en casa, zonas de entrenamiento, oficinas o salas de entretenimiento.",
  "category": "SERIESYPELICULAS",
  "franchiseId": ""
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ESTRUCTURA DE CAMPOS A COMPLETAR:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. title: Nombre limpio y directo del protagonista, artista, vehículo, película o tema (ej: "Porsche 911 GT3 RS", "Spider-Man", "Goku Super Saiyajin", "The Beatles").
2. subtitle: El rasgo diferenciador específico: nombre del álbum, escena icónica, año, edición o estilo visual (ej: "Edición Técnica Blueprint", "Enfrentamiento en Namekusei", "Abbey Road Vintage Session").
3. category: DEBE ser uno de los IDs exactos de la lista de CATEGORÍAS DISPONIBLES.
4. franchiseId: Si la obra pertenece a una de las FRANQUICIAS DISPONIBLES, usa su ID exacto. Si no pertenece a ninguna de la lista, asigna "" (cadena vacía).
5. description: Un único párrafo orgánico y fluido de 3 oraciones (~45 a 75 palabras):
   - Oración 1: Contexto histórico, cultural, cinematográfico, musical o automovilístico real de la obra.
   - Oración 2: Lectura visual y artística de la composición (paleta de colores, pose, iluminación, tipografía o estilo gráfico).
   - Oración 3: Atmósfera que transmite y recomendación natural de espacios donde luce ideal.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CANDADOS COERCITIVOS (PROHIBICIONES ESTRICTAS):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- PROHIBIDO mencionar materiales de fabricación o acabados físicos (MDF, 5.5mm, HP Látex, vinil, cinta Tesa, PVC, madera, etc.).
- PROHIBIDO mencionar precios o monedas (Q25, Quetzales, etc.).
- PROHIBIDO comenzar la descripción con clichés como "Espectacular póster...", "Hermosa composición...", "Increíble cuadro...", "Maravilloso diseño..." o "Impresionante lámina...". Inicia directo con el protagonista, la escena o la historia.
- PROHIBIDO emitir campos de medidas, tamaños o palabras clave (tags).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LISTA DE CATEGORÍAS DISPONIBLES (Usa el ID exacto):
  ${categoriesPromptList}

LISTA DE FRANQUICIAS DISPONIBLES (Usa el ID exacto o "" si no aplica):
  ${franchisesPromptList}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Devuelve ÚNICAMENTE un JSON con esta estructura:
{
  "title": "string",
  "subtitle": "string",
  "description": "string",
  "category": "ID_CATEGORIA",
  "franchiseId": "ID_FRANQUICIA_O_VACIO"
}
`.trim();

  let lastError = null;

  for (const candidate of VISION_CANDIDATE_MODELS) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      // Timeout con Promise.race
      const apiCallPromise = ai.models.generateContent({
        model: candidate.name,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Data
                }
              },
              {
                text: promptText
              }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      let timeoutId;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error(`Timeout tras ${candidate.timeoutMs}ms con el modelo ${candidate.name}`)),
          candidate.timeoutMs
        );
      });

      let response;
      try {
        response = await Promise.race([apiCallPromise, timeoutPromise]);
      } finally {
        clearTimeout(timeoutId);
      }
      const rawText = response.text || '';
      const parsedJson = JSON.parse(rawText);

      // Validación Fail-Fast Zod
      const validated = posterVisionRawSchema.parse(parsedJson);

      // Sanitización determinista anti-clichés y anti-materiales
      const sanitized = sanitizeVisionAnalysis(
        { ...validated, modelUsed: candidate.name },
        activeCategories,
        rawFranchises
      );

      return sanitized;
    } catch (err) {
      console.warn(`[PosterVisionService] Falló modelo ${candidate.name}: ${err.message}. Probando siguiente modelo...`);
      lastError = err;
    }
  }

  throw new Error(`El análisis de visión con IA no pudo completarse tras consultar los modelos candidatos: ${lastError?.message || 'Error desconocido'}`);
}
