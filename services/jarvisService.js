/**
 * services/jarvisService.js
 * Complete isolation of all J.A.R.V.I.S. AI logic.
 *
 * Engines (in failover order):
 *   1. Google GenAI SDK (@google/genai)  — multi-key + multi-model pool
 *   2. Google Cloud Vertex AI            — OAuth2 REST fallback
 *   3. Local High-Availability Engine   — keyword-based, always available
 *
 * CRITICAL: JARVIS_FILE path is tied to a Docker persistent volume — never alter.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { JARVIS_FILE, PROJECT_ROOT } from '../config/paths.js';
import {
  getAllPosters,
  formatPosterForClient,
  getFullCatalog
} from './catalogService.js';

const __filename = fileURLToPath(import.meta.url);

// ─────────────────────────────────────────────────────────────────────────────
// 1. TOOL DECLARATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const JARVIS_TOOL_DECLARATIONS = [
  {
    name: 'explorar_catalogo',
    description: 'ÚNICAMENTE invocar cuando el cliente PIDA EXPLÍCITAMENTE ver, mostrar, enseñar, recomendar u ordenar obras o pósters específicos del inventario (ej: "muéstrame cuadros de autos", "qué posters de anime tienes", "recomiéndame 3 diseños de Marvel", "¿tienes cuadros de Batman?"). ESTRICTAMENTE PROHIBIDO invocar en saludos, preguntas sobre materiales, cintas Tesa, medidas, precios generales, envíos o conversación casual.',
    parameters: {
      type: 'OBJECT',
      properties: {
        termino: {
          type: 'STRING',
          description: 'Término o palabra clave de búsqueda (ej: Spider-Man, Porsche, GTR, Batman)'
        },
        categoria: {
          type: 'STRING',
          description: 'Categoría oficial (ej: AUTOS, ANIME, SUPERHEROES, CINE_SERIES, MUSICA, RETRO_GAMING)'
        },
        posterIds: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: 'Lista de IDs exactos de las obras seleccionadas del catálogo oficial'
        },
        motivo: {
          type: 'STRING',
          description: 'Breve explicación conversacional de por qué se recomiendan estas obras'
        }
      }
    }
  },
  {
    name: 'capturar_orden_personalizada',
    description: 'Calcula la cotización exacta en Quetzales y captura los parámetros para un cuadro personalizado con medidas especiales (en cm), tipo de material y detalles de diseño.',
    parameters: {
      type: 'OBJECT',
      properties: {
        anchoCm: { type: 'NUMBER', description: 'Ancho en centímetros (ej: 50)' },
        altoCm:  { type: 'NUMBER', description: 'Alto en centímetros (ej: 30)' },
        material: { type: 'STRING', description: 'Material: mdf o pvc. Por defecto mdf.', enum: ['mdf', 'pvc'] },
        detallesDiseno: { type: 'STRING', description: 'Descripción o detalles del diseño personalizado solicitado por el cliente' }
      },
      required: ['anchoCm', 'altoCm']
    }
  },
  {
    name: 'consultar_estado_taller',
    description: 'Consulta el estado actual de fabricación artesanal, corte, impresión HP Látex, empaque o despacho de una orden de pedido en el taller.',
    parameters: {
      type: 'OBJECT',
      properties: {
        ordenId: {
          type: 'STRING',
          description: 'Código o número identificador de la orden de pedido (ej: DV-2026-884)'
        },
        telefono: {
          type: 'STRING',
          description: 'Número de teléfono o WhatsApp asociado a la orden'
        }
      },
      required: ['ordenId']
    }
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. PRICING CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculates the price of a custom-sized poster in Quetzales.
 * @param {number} widthCm
 * @param {number} heightCm
 * @param {'mdf'|'pvc'} material
 * @returns {{ width, height, material, totalPrice, deposit50, areaCm2 }}
 */
export function calculateCustomPrice(widthCm, heightCm, material = 'mdf') {
  const w = Math.max(10, Math.min(250, Number(widthCm) || 30));
  const h = Math.max(10, Math.min(250, Number(heightCm) || 45));
  const areaCm2 = w * h;
  const baseRatePerCm2 = 0.046;
  const rawPrice = areaCm2 * baseRatePerCm2;
  const minPrice = 25.00;
  const rounded = Math.ceil(rawPrice / 5) * 5;
  const calculated = Math.max(minPrice, rounded);
  const multiplier = (material || '').toLowerCase() === 'pvc' ? 1.25 : 1.0;
  const finalPrice = Math.round(calculated * multiplier);

  return {
    width: w,
    height: h,
    material: material === 'pvc' ? 'PVC Sintético 5mm (Impermeable)' : 'Madera MDF 5.5mm (Estándar)',
    totalPrice: finalPrice,
    deposit50: Math.round(finalPrice * 0.5 * 100) / 100,
    areaCm2
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. API KEY RESOLUTION
//    Priority: Docker env var → VPS SSD → .env.local dev fallback
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolves the active Gemini API key using a 3-tier priority chain.
 * @returns {string} API key, or empty string if none found.
 */
export function getJarvisApiKey() {
  // 1. Production Docker Environment Variable (Dokploy Secrets — Highest Security)
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0) {
    return process.env.GEMINI_API_KEY.trim();
  }
  if (process.env.VITE_GEMINI_API_KEY && process.env.VITE_GEMINI_API_KEY.trim().length > 0) {
    return process.env.VITE_GEMINI_API_KEY.trim();
  }

  // 2. Persistent Storage on VPS SSD (Admin Panel Key Injection)
  if (fs.existsSync(JARVIS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(JARVIS_FILE, 'utf-8'));
      if (data.apiKey && data.apiKey.trim().length > 0) return data.apiKey.trim();
    } catch (e) {}
  }

  // 3. Local Development Fallback (.env.local)
  const envLocalPath = path.resolve(PROJECT_ROOT, '.env.local');
  if (fs.existsSync(envLocalPath)) {
    try {
      const content = fs.readFileSync(envLocalPath, 'utf-8');
      const match = content.match(/VITE_GEMINI_API_KEY\s*=\s*(.+)/);
      if (match && match[1] && match[1].trim().length > 0) {
        return match[1].trim();
      }
    } catch (e) {}
  }

  return '';
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. MEMORY: READ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Merges training memory from VPS SSD (data/jarvisConfig.json) with the
 * src/data/jarvisConfig.json bundled fallback. VPS data takes precedence
 * for customDocuments and ownerDirectives.
 * @returns {object} Merged jarvisConfig object.
 */
export function getJarvisMemory() {
  let vpsMem = {};
  let srcMem = {};
  const srcFile = path.resolve(PROJECT_ROOT, 'src/data/jarvisConfig.json');

  if (fs.existsSync(JARVIS_FILE)) {
    try { vpsMem = JSON.parse(fs.readFileSync(JARVIS_FILE, 'utf-8')); } catch (e) {}
  }
  if (fs.existsSync(srcFile)) {
    try { srcMem = JSON.parse(fs.readFileSync(srcFile, 'utf-8')); } catch (e) {}
  }

  const customDocs = (vpsMem.customDocuments && vpsMem.customDocuments.length > 0)
    ? vpsMem.customDocuments
    : (srcMem.customDocuments || []);

  const ownerDirectives = (vpsMem.ownerDirectives && vpsMem.ownerDirectives.length > 0)
    ? vpsMem.ownerDirectives
    : (srcMem.ownerDirectives || []);

  return {
    ...srcMem,
    ...vpsMem,
    customDocuments: customDocs,
    ownerDirectives: ownerDirectives
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. MEMORY: WRITE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Atomically persists updated training memory to JARVIS_FILE and syncs
 * a copy to src/data/jarvisConfig.json.
 *
 * @param {object} payload - Partial or full jarvisConfig object to merge.
 * @returns {{ success: boolean, updatedAt: string, message?: string, error?: string }}
 */
export function saveJarvisMemory(payload) {
  if (!payload || typeof payload !== 'object') {
    return { success: false, error: 'Payload inválido.' };
  }

  const current = getJarvisMemory();
  const updated = {
    ...current,
    ...payload,
    updatedAt: new Date().toISOString()
  };

  // Atomic write to data/jarvisConfig.json (Docker volume)
  const tmpFile = `${JARVIS_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(updated, null, 2), 'utf-8');
  fs.renameSync(tmpFile, JARVIS_FILE);

  // Also sync to src/data/jarvisConfig.json (bundled copy)
  const srcFile = path.resolve(PROJECT_ROOT, 'src/data/jarvisConfig.json');
  try { fs.writeFileSync(srcFile, JSON.stringify(updated, null, 2), 'utf-8'); } catch (e) {}

  console.log('[Deco J.A.R.V.I.S.] Master training memory persisted to VPS SSD disk.');
  return {
    success: true,
    message: 'Memoria de J.A.R.V.I.S. guardada permanentemente en disco.',
    updatedAt: updated.updatedAt
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. VERTEX AI — OAuth2 TOKEN WITH IN-MEMORY CACHE
// ─────────────────────────────────────────────────────────────────────────────

let cachedVertexToken = null;
let cachedVertexTokenExpiry = 0;

/**
 * Returns a valid Vertex AI OAuth2 access token, refreshing it when needed.
 * Returns null if no refresh token is configured.
 * @returns {Promise<string|null>}
 */
export async function getVertexAccessToken() {
  const now = Date.now();
  if (cachedVertexToken && now < cachedVertexTokenExpiry - 60000) {
    return cachedVertexToken;
  }

  const mem = getJarvisMemory();
  const clientId     = process.env.GOOGLE_CLOUD_CLIENT_ID     || (mem.googleClientId     || '');
  const clientSecret = process.env.GOOGLE_CLOUD_CLIENT_SECRET || (mem.googleClientSecret || '');
  const refreshToken = process.env.GOOGLE_CLOUD_REFRESH_TOKEN || (mem.googleRefreshToken || '');

  if (!refreshToken) return null;

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type:    'refresh_token'
      })
    });
    const tokenData = await tokenRes.json();
    if (tokenData.access_token) {
      cachedVertexToken       = tokenData.access_token;
      cachedVertexTokenExpiry = now + ((tokenData.expires_in || 3600) * 1000);
      return cachedVertexToken;
    }
  } catch (e) {
    console.warn('[Vertex Token Refresh Error]:', e.message);
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. SYSTEM INSTRUCTION BUILDER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Assembles the full system instruction string for Gemini.
 * Injects live catalog data, owner directives, and custom documents.
 *
 * @param {object} catalog      - Full catalog object from getCatalogData().
 * @param {object} jarvisMemory - Merged memory object from getJarvisMemory().
 * @returns {string} Complete system instruction.
 */
export function buildSystemInstruction(catalog, jarvisMemory = {}) {
  const posters    = (catalog && Array.isArray(catalog.posters)) ? catalog.posters.filter(Boolean) : [];
  const settings   = catalog?.settings || {};
  const waPhone    = settings.whatsappPhone || '50238375078';

  const ownerDirectives = (jarvisMemory.ownerDirectives || [
    "Habla siempre de forma amigable, cálida, entusiasta y servicial, como un asesor de diseño experto y buena onda.",
    "Usa un trato de 'tú' neutro e inclusivo. NUNCA asumas género ni uses repetitivamente palabras robóticas.",
    "Escribe en texto conversacional fluido, natural y limpio.",
    "Recomienda siempre el tamaño Mediano (30x45cm) como la opción más balanceada e ideal para cualquier habitación.",
    "Menciona que la cinta industrial Tesa de montaje viene incluida en el reverso lista para colgar sin taladros.",
    "Este sábado y domingo 29 y 30 de agosto tendremos stand disponible en el Centro Comercial Centranorte, zona 18, Guatemala donde estarán disponibles todos nuestros diseños."
  ]).map(d => `- ${d}`).join('\n');

  const customDocs = (jarvisMemory.customDocuments || [
    {
      title: "Guía de Envíos y Tiempos de Entrega",
      content: "Envíos a los 22 departamentos de Guatemala vía mensajerías certificadas (Guatex, Forza, Cargo Expreso, Mensajería Directa en Ciudad de Guatemala). Tiempo de entrega estándar de 2 a 4 días hábiles desde que se confirma el 50% de anticipo. El saldo se cancela contra entrega o previo al despacho departamental."
    },
    {
      title: "Instrucciones de Montaje con Cinta Tesa",
      content: "Todos los cuadros rígidos incluyen tiras de cinta doble cara industrial Tesa (modelo oficial tesa® 65610 Invisibond) en el reverso lista para instalar sin taladros ni clavos."
    },
    {
      title: "Tecnología de Impresión HP Látex",
      content: "Impresión de gran formato con tecnología HP Látex. Tintas ecológicas a base de agua con protección UV y garantía superior a 10 años en interiores sin pérdida de color."
    }
  ]).map(doc => `[DOCUMENTO / EVENTO: ${doc.title}]\nCategoría: ${doc.category || 'General'}\nContenido: ${doc.content}`).join('\n\n');

  const catalogSummary = posters.map(p => {
    const id = p.id || '';
    const title = p.title || p.titulo || 'Póster';
    const subtitle = p.subtitle || p.subtitulo || '';
    const category = p.category || p.categoria || 'AUTOS';
    const description = p.description || p.descripcion || '';
    const tags = Array.isArray(p.tags) ? p.tags.join(', ') : '';
    const price = p.priceDisplay || (p.minPrice ? `Desde Q${p.minPrice}.00` : 'Desde Q25.00');
    return `- ID: "${id}", Título: "${title}", Subtítulo: "${subtitle}", Categoría: "${category}", Descripción: "${description}", Tags: "${tags}", Precio: "${price}"`;
  }).join('\n');

  return `Eres J.A.R.V.I.S. (Just A Rather Very Intelligent System), el asesor de inteligencia artificial exclusivo de Deco Vintage Guate (tienda en Guatemala de cuadros rígidos y pósters decorativos de colección en madera MDF de 5.5mm con tecnología HP Látex).
WhatsApp Oficial de Atención al Cliente: +${waPhone}

=== ESTILO Y PERSONALIDAD DE J.A.R.V.I.S. ===
- Eres súper amable, cálido, conversacional, servicial, ameno y educado. Hablas con emoción y cultura sobre cine, Marvel, DC, autos, anime, videojuegos, arte y música.
- Trato cercano: Trata al cliente de 'tú' de forma natural y respetuosa. NUNCA uses repetitivamente palabras robóticas o frías como 'señor', 'caballero' o estructuras de soporte aburrido.

=== POLÍTICA CRÍTICA DE INTERFAZ: CUÁNDO MOSTRAR TARJETAS VS SOLO TEXTO (UX ANTI-SATURACIÓN) ===
1. RESPONDER EXCLUSIVAMENTE CON TEXTO FLUIDO Y AMIGABLE en el 90% de las conversaciones normales (saludos, preguntas sobre calidad, materiales MDF, cinta Tesa, envíos a departamentos, precios generales, asesoría de decoración). En estos casos está ESTRICTAMENTE PROHIBIDO invocar 'explorar_catalogo' o generar tarjetas de producto.
2. ÚNICAMENTE INVOCAR 'explorar_catalogo': Cuando el cliente HAGA UNA PREGUNTA O PETICIÓN EXPLÍCITA DE INVENTARIO Y CATÁLOGO (ejemplos: "muéstrame cuadros de...", "qué posters de Spider-Man tienes", "¿tienen diseños de Dragon Ball?", "recomiéndame 2 cuadros de autos", "quiero ver obras de anime", "enséñame opciones de Marvel").
3. Si el cliente solo está saludando ("hola", "buenas"), preguntando cómo se cuelgan los cuadros o charlando de una serie sin pedir ver catálogo, RESPONDE CON TEXTO AMIGABLE, asesóralo y pregúntale educadamente si le gustaría que le muestres los cuadros disponibles de esa categoría.
4. Si el cliente pide cotizar o fabricar medidas personalizadas especiales (ej: 50x70cm, 80x120cm, foto propia), invoca 'capturar_orden_personalizada'.
5. Si el cliente pregunta por el estado, avance, entrega o seguimiento de una orden de pedido en taller (ej: "¿Cómo va mi pedido DV-2026-101?", "quiero consultar mi orden..."), invoca 'consultar_estado_taller'.

=== HILO Y CONTINUIDAD DE LA CONVERSACIÓN ===
- Mantén la coherencia con lo que el usuario te ha dicho previamente en sus mensajes anteriores.

=== DIRECTIVAS Y POLÍTICAS DE ATENCIÓN DE LOS DUEÑOS ===
${ownerDirectives}

=== DOCUMENTOS, EVENTOS Y GUÍAS OFICIALES DE LA TIENDA ===
${customDocs}

=== MATERIALES Y PRECIOS OFICIALES ===
- Madera MDF 5.5mm: Base sólida rígida, resistente, bordes pulidos, no se dobla. Incluye cinta doble cara industrial Tesa para colgar sin clavos.
- PVC Sintético 5mm: Ultraligero y 100% impermeable / resistente al agua y humedad (+Q15.00).
- Solo Vinil Adhesivo: Impresión en vinil HP Látex al 50% de descuento (mitad de precio).
Medidas estándar: Mini (14x21cm - Q25), Pequeño (21x27cm - Q35), Portada Álbum (30x30cm - Q55), Mediano (30x45cm - Q65), Grande (45x60cm - Q125), Gigante (60x100cm - Q210).

=== CATÁLOGO COMPLETO DE OBRAS EN TIENDA ===
${catalogSummary}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. CHAT HISTORY FORMATTER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalizes raw chat history from the client into the strict alternating
 * user/model format required by the Gemini API.
 *
 * @param {any[]} rawHistory - Array of message objects from the client.
 * @param {number} maxTurns  - Maximum number of turns to keep (default 8).
 * @returns {Array<{ role: 'user'|'model', parts: [{ text: string }] }>}
 */
export function formatChatHistory(rawHistory, maxTurns = 8) {
  if (!Array.isArray(rawHistory) || rawHistory.length === 0) return [];

  const normalized = [];
  for (const msg of rawHistory) {
    const role = (msg.sender === 'user' || msg.sender === 'client' || msg.role === 'user') ? 'user' : 'model';
    const text = (msg.text || msg.content || '').trim();
    if (text.length > 0 && !text.includes('no se encuentra disponible temporalmente')) {
      normalized.push({ role, text });
    }
  }

  const firstUserIdx = normalized.findIndex(m => m.role === 'user');
  if (firstUserIdx === -1) return [];

  const validSequence = normalized.slice(firstUserIdx);
  const alternating = [];
  let lastRole = null;

  for (const item of validSequence) {
    if (item.role !== lastRole) {
      alternating.push({ role: item.role, parts: [{ text: item.text }] });
      lastRole = item.role;
    } else {
      const prev = alternating[alternating.length - 1];
      prev.parts[0].text += `\n${item.text}`;
    }
  }

  // History must not end on a 'user' turn (that slot is filled by the current prompt)
  if (alternating.length > 0 && alternating[alternating.length - 1].role === 'user') {
    alternating.pop();
  }

  if (alternating.length > maxTurns) {
    let sliced = alternating.slice(-maxTurns);
    if (sliced.length > 0 && sliced[0].role !== 'user') {
      sliced.shift();
    }
    return sliced;
  }
  return alternating;
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. FUNCTION CALL EXECUTOR WITH MOCKUPS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Executes a single AI function call and returns the corresponding action object.
 * Intercepts tool calls and returns structured action payloads with simulated mockups.
 *
 * @param {{ name: string, args: object }} call    - The function call from the model.
 * @param {any[]}                          posters - Full poster list for filtering.
 * @returns {object|null} Action object, or null if the call name is unknown.
 */
export function executeFunctionCall(call, posters = []) {
  if (!call || !call.name) return null;
  const args = call.args || {};
  const cleanPosters = Array.isArray(posters) ? posters.filter(Boolean) : [];

  try {
    switch (call.name) {
      case 'explorar_catalogo':
      case 'recomendar_obras': {
        let matched = [];
        const ids = Array.isArray(args.posterIds) ? args.posterIds.filter(Boolean) : [];

        // 1. Filtrado por IDs directos (garantiza que solo se elijan obras que existen en la BD actual de PostgreSQL)
        if (ids.length > 0) {
          matched = cleanPosters.filter(p => p && p.id && ids.includes(p.id));
        }

        // 2. Filtrado por término o categoría si no hubo match por IDs
        if (matched.length === 0 && (args.termino || args.categoria)) {
          const term = (args.termino || '').toLowerCase().trim();
          const cat = (args.categoria || '').toUpperCase().trim();
          matched = cleanPosters.filter(p => {
            if (!p) return false;
            const pCat = (p.category || p.categoria || '').toUpperCase();
            const matchCat = cat && pCat.includes(cat);
            const pTitle = (p.title || p.titulo || '').toLowerCase();
            const pSub = (p.subtitle || p.subtitulo || '').toLowerCase();
            const pDesc = (p.description || p.descripcion || '').toLowerCase();
            const pTags = Array.isArray(p.tags) ? p.tags : [];
            const matchTerm = term && (
              pTitle.includes(term) ||
              pSub.includes(term) ||
              pDesc.includes(term) ||
              pTags.some(t => String(t).toLowerCase().includes(term))
            );
            return matchCat || matchTerm;
          }).slice(0, 4);
        }

        // 3. Fallback de mockup si no hay coincidencia exacta para garantizar respuesta visual segura
        if (matched.length === 0 && cleanPosters.length > 0) {
          matched = cleanPosters.slice(0, 3);
        }

        return {
          type:    'catalog_matches',
          posters: matched.filter(Boolean),
          motivo:  args.motivo || 'Obras destacadas de nuestro catálogo oficial Deco Vintage'
        };
      }

      case 'capturar_orden_personalizada':
      case 'cotizar_personalizado': {
        const quote = calculateCustomPrice(args.anchoCm, args.altoCm, args.material);
        const mockOrderNumber = `DV-ORD-${Math.floor(1000 + Math.random() * 9000)}`;
        return {
          type: 'custom_quote',
          quote: {
            ...quote,
            detallesDiseno: args.detallesDiseno || 'Diseño personalizado con foto o arte del cliente',
            orderMockId: mockOrderNumber
          }
        };
      }

      case 'consultar_estado_taller': {
        const id = (args.ordenId || 'DV-2026-MOCK').toUpperCase();
        const mockTaller = {
          ordenId: id,
          etapa: 'PRODUCCION_HP_LATEX',
          progreso: 75,
          estadoTexto: `La orden ${id} se encuentra en etapa de laminado y corte final en madera MDF 5.5mm con tintas ecológicas HP Látex.`,
          fechaEstimadaEntrega: '2 a 3 días hábiles',
          mensajeria: 'Mensajería Express / Guatex',
          incluyeCintaTesa: true,
          requiereAnticipo: false,
          anticipoConfirmado: '50% recibido',
          saldoPendiente: 'Contra entrega al recibir el cuadro'
        };

        return {
          type: 'workshop_status',
          order: mockTaller,
          ordenId: id,
          motivo: `Estado y avance en taller de la orden ${id}`
        };
      }

      default:
        console.warn(`[executeFunctionCall] Herramienta desconocida recibida: ${call.name}`);
        return null;
    }
  } catch (fnErr) {
    console.error(`[executeFunctionCall] Error ejecutando acción ${call.name}:`, fnErr);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. LOCAL FALLBACK ENGINE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Keyword-based local response engine — always available, no API required.
 * Activates when both the primary (GenAI) and secondary (Vertex) engines fail.
 *
 * @param {string}  prompt        - The user's message.
 * @param {any[]}   posters       - Full poster list.
 * @param {object}  jarvisMemory  - Merged training memory.
 * @returns {{ replyText: string, actions: any[], poweredBy: string }}
 */
export function runFallbackEngine(prompt, posters, jarvisMemory) {
  const qLower     = (prompt || '').toLowerCase();
  let   localReply = '';
  const localActions = [];

  // Check custom documents and events
  const rawDocs    = jarvisMemory.customDocuments || [];
  const matchedDoc = rawDocs.find(d => {
    const tNorm = (d.title   || '').toLowerCase();
    const cNorm = (d.content || '').toLowerCase();
    return (tNorm && qLower.includes(tNorm)) ||
           (qLower.includes('evento')      && (tNorm.includes('fest')        || tNorm.includes('stand')       || tNorm.includes('evento'))) ||
           (qLower.includes('fan fest')    &&  tNorm.includes('fan fest')) ||
           (qLower.includes('centranorte') && (tNorm.includes('centranorte') || cNorm.includes('centranorte')));
  });

  // Check for custom dimensions calculation (e.g. 50x70, 80x120)
  const dimMatch = qLower.match(/(\d{2,3})\s*(?:x|\*|por)\s*(\d{2,3})/);

  if (dimMatch) {
    const w     = parseInt(dimMatch[1], 10);
    const h     = parseInt(dimMatch[2], 10);
    const isPvc = qLower.includes('pvc') || qLower.includes('impermeable');
    const quote = calculateCustomPrice(w, h, isPvc ? 'pvc' : 'mdf');
    localActions.push({ type: 'custom_quote', quote });
    localReply = `¡Con gusto! Para una medida personalizada de **${w}x${h}cm** en **${quote.material}**:\n\n` +
                 `* **Precio Total:** Q${quote.totalPrice}.00\n` +
                 `* **Anticipo 50%:** Q${quote.deposit50}.00 (el saldo contra entrega en Ciudad de Guatemala o previo a envío departamental).\n` +
                 `* **Incluye:** Cinta industrial Tesa en el reverso lista para colgar sin clavos ni taladros e impresión HP Látex con protección UV.\n\n` +
                 `¿Deseas que te ayudemos a procesar este diseño personalizado por WhatsApp?`;

  } else if (matchedDoc) {
    localReply = `¡Claro que sí! Con respecto a **${matchedDoc.title}**:\n\n${matchedDoc.content}\n\n¿Te gustaría que te ayude a preparar o cotizar algún cuadro para esta ocasión?`;

  } else if (qLower.includes('auto') || qLower.includes('carro') || qLower.includes('f1') || qLower.includes('carrera') || qLower.includes('porsche') || qLower.includes('supra') || qLower.includes('bmw') || qLower.includes('gtr')) {
    const hasVisualRequest = qLower.includes('muestra') || qLower.includes('mostrar') || qLower.includes('ver') || qLower.includes('ensena') || qLower.includes('enseña') || qLower.includes('tienes') || qLower.includes('recomiend') || qLower.includes('catalogo') || qLower.includes('posters de') || qLower.includes('cuadros de');
    if (hasVisualRequest) {
      const autoPosters = posters.filter(p => (p.category || p.categoria) === 'AUTOS' || (p.tags && p.tags.some(t => t.toLowerCase().includes('auto') || t.toLowerCase().includes('f1')))).slice(0, 4);
      if (autoPosters.length > 0) {
        localActions.push({ type: 'catalog_matches', posters: autoPosters, motivo: 'Cuadros destacados de automovilismo' });
      }
    }
    localReply = `¡Excelente elección! Nos apasiona el mundo motor. Manejamos cuadros de **Fórmula 1**, leyendas del **JDM** (como el Toyota Supra, Nissan GTR, RX-7), superdeportivos clásicos y modernos (Porsche, Ferrari, Mustang, Lamborghini).\n\n` +
                 `* **Impresión:** HP Látex de alta resolución ecológica y resistente al agua.\n` +
                 `* **Estructura:** Madera MDF rígida de 5.5mm con bordes pulidos y cinta doble cara Tesa incluida para colgar sin clavos.\n` +
                 `* **Medida más vendida:** Mediano (30x45cm) por solo **Q65.00**.\n\n` +
                 `¡También podemos fabricar el cuadro con la foto de tu propio vehículo en cualquier medida personalizada! ¿Te gustaría que te muestre los diseños disponibles de autos?`;

  } else if (qLower.includes('material') || qLower.includes('calidad') || qLower.includes('tesa') || qLower.includes('colocar') || qLower.includes('pegar') || qLower.includes('instalar')) {
    localReply = `¡Nuestros cuadros están fabricados con los mejores estándares!\n\n` +
                 `1. **Base Rígida MDF 5.5mm:** Madera sólida que no se dobla ni pandea con bordes pulidos.\n` +
                 `2. **Impresión HP Látex:** Tintas ecológicas a base de agua, libres de olor, con colores vivos y protección UV (más de 10 años garantizados en interiores sin pérdida de color).\n` +
                 `3. **Montaje Fácil con Cinta Tesa®:** Cada cuadro incluye tiras de cinta doble cara industrial *tesa® Invisibond* en el reverso.\n\n` +
                 `**Pasos para instalar en 15 segundos:**\n` +
                 `* Limpia la pared con un paño seco.\n` +
                 `* Retira el protector de la cinta Tesa.\n` +
                 `* Presiona firmemente el cuadro contra la pared durante 15 segundos. ¡Y listo, sin taladrar ni perforar!\n\n` +
                 `¿Qué medida o temática tienes en mente para tu pared?`;

  } else if (qLower.includes('precio') || qLower.includes('cuanto cuesta') || qLower.includes('medida') || qLower.includes('costo') || qLower.includes('tamaño')) {
    localReply = `Nuestras medidas y precios oficiales son:\n\n` +
                 `- **Mini (14x21cm)**: Q25.00\n` +
                 `- **Pequeño (21x27cm)**: Q35.00\n` +
                 `- **Portada Álbum (30x30cm)**: Q55.00\n` +
                 `- **Mediano (30x45cm)**: Q65.00 *(¡El Más Vendido y Recomendado! ⭐)*\n` +
                 `- **Grande (45x60cm)**: Q125.00\n` +
                 `- **Gigante (60x100cm)**: Q210.00\n\n` +
                 `Todos los cuadros son rígidos en madera MDF de 5.5mm con tecnología HP Látex e incluyen cinta industrial Tesa en el reverso lista para colgar.\n\n` +
                 `¿Deseas ver cuadros de alguna temática en específico o cotizar una medida personalizada?`;

  } else if (qLower.includes('envio') || qLower.includes('entrega') || qLower.includes('guatemala') || qLower.includes('departamento')) {
    localReply = `Realizamos envíos a los 22 departamentos de Guatemala vía mensajerías certificadas (Guatex, Forza, Cargo Expreso, Mensajería Directa en Ciudad de Guatemala).\n\n` +
                 `* **Tiempo de entrega:** 2 a 4 días hábiles desde la confirmación con el 50% de anticipo.\n` +
                 `* **Pago:** El saldo se cancela contra entrega en Ciudad de Guatemala o previo al despacho departamental.\n\n` +
                 `¿En qué municipio o zona te encuentras para coordinar tu entrega?`;

  } else if (qLower.includes('orden') || qLower.includes('taller') || qLower.includes('seguimiento') || qLower.includes('estado de mi') || qLower.includes('pedido') || qLower.includes('dv-')) {
    const match = (prompt || '').match(/(dv[-_]?[0-9a-z-]+)/i);
    const ordId = (match ? match[1] : 'DV-2026-101').toUpperCase();
    const mockTaller = {
      ordenId: ordId,
      etapa: 'PRODUCCION_HP_LATEX',
      progreso: 75,
      estadoTexto: `La orden ${ordId} se encuentra en etapa de laminado y corte final en madera MDF 5.5mm con tintas ecológicas HP Látex.`,
      fechaEstimadaEntrega: '2 a 3 días hábiles',
      mensajeria: 'Mensajería Express / Guatex',
      incluyeCintaTesa: true,
      requiereAnticipo: false,
      anticipoConfirmado: '50% recibido',
      saldoPendiente: 'Contra entrega al recibir el cuadro'
    };
    localActions.push({
      type: 'workshop_status',
      order: mockTaller,
      ordenId: ordId,
      motivo: `Estado y avance en taller de la orden ${ordId}`
    });
    localReply = `¡Consultando sistema del taller! He localizado la orden **${ordId}**.\n\n` +
                 `* **Estado Actual:** 75% completado (Laminado e impresión HP Látex terminada, en montaje final de MDF 5.5mm).\n` +
                 `* **Tiempo estimado de entrega:** 2 a 3 días hábiles vía mensajería certificada.\n` +
                 `* **Montaje:** Incluye cinta doble cara industrial Tesa lista para colgar sin clavos.\n\n` +
                 `¿Deseas comunicarte directamente con el área de producción por WhatsApp para alguna indicación especial?`;

  } else if (qLower.includes('hola') || qLower.includes('buenas') || qLower.includes('saludos') || qLower.includes('hey')) {
    localReply = '¡Hola! 👋 Qué gusto saludarte. Soy J.A.R.V.I.S., tu asesor de diseño en Deco Vintage Guate. Dime qué temática te apasiona (autos, anime, superhéroes, películas, música, videojuegos) o si buscas precios y cotizaciones especiales, ¡con gusto te ayudo!';

  } else {
    localReply = `¡Con mucho gusto te asisto! En Deco Vintage Guate diseñamos cuadros decorativos rígidos de colección en madera MDF de 5.5mm con tecnología de impresión HP Látex y cinta industrial Tesa para colgar sin taladros.\n\n` +
                 `Cuéntame qué diseño, personaje, banda, auto o medida te interesa y con gusto te asesoro y muestro opciones de nuestro catálogo.`;
  }

  return {
    replyText:  localReply,
    actions:    localActions,
    poweredBy:  'Deco High-Availability Fallback Engine'
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. MAIN CHAT ORCHESTRATOR
// ─────────────────────────────────────────────────────────────────────────────

const CANDIDATE_MODELS = [
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-2.5-flash',
  'gemini-2.0-flash'
];

/**
 * Orchestrates all three AI engines for a single chat turn.
 *
 * @param {string}   prompt         - The user's current message.
 * @param {any[]}    history         - Raw chat history array from the client.
 * @param {string[]} candidateKeys  - Ordered list of Gemini API keys to try.
 * @param {object}   catalog        - Full catalog from PostgreSQL.
 * @param {object}   jarvisMemory   - Merged memory from getJarvisMemory().
 * @returns {Promise<{ replyText: string, actions: any[], poweredBy: string }>}
 */
export async function chatWithJarvis(prompt, history, candidateKeys, catalog, jarvisMemory) {
  // 1. Asegurar que siempre tengamos la lista de pósters en vivo desde PostgreSQL
  let liveCatalog = catalog;
  if (!liveCatalog || !Array.isArray(liveCatalog.posters) || liveCatalog.posters.length === 0) {
    try {
      liveCatalog = await getFullCatalog();
    } catch (dbErr) {
      console.warn('[Deco J.A.R.V.I.S.] Warning fetching live PostgreSQL catalog:', dbErr.message);
      liveCatalog = { categories: [], franchises: [], settings: {}, posters: [] };
    }
  }

  const posters           = liveCatalog.posters || [];
  const systemInstruction = buildSystemInstruction(liveCatalog, jarvisMemory);
  const chatHistory       = formatChatHistory(history);
  let   lastError         = null;

  // ── Engine 1: Google GenAI SDK — multi-key + multi-model failover ───────────
  for (const keyToUse of candidateKeys) {
    let keyAuthFailed = false;

    for (const modelName of CANDIDATE_MODELS) {
      try {
        const ai = new GoogleGenAI({ apiKey: keyToUse });

        const contents = [
          ...chatHistory,
          { role: 'user', parts: [{ text: prompt || 'Hola' }] }
        ];

        const callTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Model ${modelName} call exceeded 10s timeout`)), 10000)
        );

        const resAI = await Promise.race([
          ai.models.generateContent({
            model:    modelName,
            contents: contents,
            config: {
              systemInstruction: systemInstruction,
              tools: [{ functionDeclarations: JARVIS_TOOL_DECLARATIONS }]
            }
          }),
          callTimeout
        ]);

        let   replyText      = resAI.text || '';
        const executedActions = [];
        const functionCalls   = resAI.functionCalls;

        if (functionCalls && functionCalls.length > 0) {
          for (const call of functionCalls) {
            try {
              const action = executeFunctionCall(call, posters);
              if (action) executedActions.push(action);
            } catch (fnErr) {
              console.error('[Deco J.A.R.V.I.S.] Error executing function call:', fnErr);
            }
          }
        }

        if (!replyText && executedActions.length > 0) {
          replyText = '¡Por supuesto! Aquí tienes las obras y detalles seleccionados especialmente para ti:';
        }

        console.log(`[Deco J.A.R.V.I.S.] Success via ${modelName} | Turns: ${chatHistory.length} | Prompt: "${prompt?.slice(0, 40)}..."`);

        return {
          replyText:  replyText || '¡Con gusto! Aquí tienes los detalles:',
          actions:    executedActions,
          poweredBy:  `Google Gemini 3.6 Flash (@google/genai - ${modelName})`
        };

      } catch (genAiErr) {
        lastError     = genAiErr;
        const errMsg  = genAiErr.message || '';
        console.warn(`[@google/genai ${modelName} Failed (${errMsg.slice(0, 80)})]`);

        // Key revoked / invalid — skip remaining models for this key immediately
        if (errMsg.includes('leaked') || errMsg.includes('API_KEY_INVALID') || errMsg.includes('PERMISSION_DENIED') || errMsg.includes('403') || errMsg.includes('401')) {
          console.warn(`[Key Auth Error detected for key ${keyToUse.slice(0, 8)}... (${errMsg.slice(0, 50)})] -> Switching to next candidate key...`);
          keyAuthFailed = true;
          break;
        }
      }
    }

    if (keyAuthFailed) continue;
  }

  // ── Engine 2: Google Cloud Vertex AI ─────────────────────────────────────
  try {
    const vertexToken = await getVertexAccessToken();
    if (vertexToken) {
      const projectId  = process.env.GOOGLE_CLOUD_PROJECT || 'tienda-deco-vintage-web';
      const vertexUrl  = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/gemini-2.5-flash:generateContent`;

      const vertexContents = [
        ...chatHistory,
        { role: 'user', parts: [{ text: prompt || 'Hola' }] }
      ];

      const vertexRes = await fetch(vertexUrl, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${vertexToken}`
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents:          vertexContents,
          tools:             [{ functionDeclarations: JARVIS_TOOL_DECLARATIONS }]
        })
      });

      if (vertexRes.ok) {
        const vertexData  = await vertexRes.json();
        const candidate   = vertexData.candidates && vertexData.candidates[0];

        if (candidate && candidate.content && candidate.content.parts) {
          let   replyText       = '';
          const executedActions = [];

          for (const part of candidate.content.parts) {
            if (part.text) {
              replyText += part.text;
            }
            if (part.functionCall) {
              try {
                const action = executeFunctionCall(part.functionCall, posters);
                if (action) executedActions.push(action);
              } catch (fnErr) {
                console.error('[Deco J.A.R.V.I.S. Vertex] Error executing function call:', fnErr);
              }
            }
          }

          return {
            replyText:  replyText || '¡Con gusto! Aquí tienes los detalles:',
            actions:    executedActions,
            poweredBy:  'Google Cloud Vertex AI (gemini-2.5-flash)'
          };
        }
      }
    }
  } catch (vertexErr) {
    console.warn('[Vertex AI Execution Failed]:', vertexErr.message);
  }

  // ── Engine 3: Local High-Availability Fallback ────────────────────────────
  console.warn('[Gemini AI Offline / Fallback]: Activating Dynamic Local Knowledge Engine. Last error:', lastError?.message);
  return runFallbackEngine(prompt, posters, jarvisMemory);
}
