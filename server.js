/**
 * Deco Vintage Guate - Production Backend Server (Node.js + Express + Sharp)
 * Runs on Hostinger VPS (145.223.120.56) utilizing the 100 GB SSD storage.
 */

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 80;

// Security Credentials & Secrets
const ADMIN_USER = process.env.ADMIN_USER || 'SebasDmente';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || '4214294880101';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';

// High body limit for image uploads
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Paths on VPS Disk (100 GB SSD)
const DATA_DIR = path.resolve(__dirname, 'data');
const CATALOG_FILE = path.resolve(DATA_DIR, 'catalogStore.json');
const JARVIS_FILE = path.resolve(DATA_DIR, 'jarvisConfig.json');
const UPLOADS_DIR = path.resolve(__dirname, 'public/posters/uploads');
const UPLOADS_FULL = path.resolve(UPLOADS_DIR, 'full');
const UPLOADS_THUMB = path.resolve(UPLOADS_DIR, 'thumb');
const FRANCHISES_DIR = path.resolve(__dirname, 'public/franchises');
const JARVIS_REFS = path.resolve(__dirname, 'public/jarvis/references');
const DIST_DIR = path.resolve(__dirname, 'dist');

// Ensure directories exist on VPS 100 GB SSD
[DATA_DIR, UPLOADS_DIR, UPLOADS_FULL, UPLOADS_THUMB, FRANCHISES_DIR, JARVIS_REFS].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Stateless HMAC Token System (Survives server restarts and container reloads)
const AUTH_SECRET = process.env.ADMIN_SECRET || 'deco_vintage_guate_secret_2026_master_key';

function generateAuthToken() {
  const payload = JSON.stringify({ user: ADMIN_USER, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 }); // Valid for 30 days
  const b64 = Buffer.from(payload).toString('base64url');
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(b64).digest('base64url');
  return `${b64}.${sig}`;
}

function verifyAuthToken(token) {
  if (!token || !token.includes('.')) return false;
  const [b64, sig] = token.split('.');
  const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(b64).digest('base64url');
  if (sig !== expectedSig) return false;
  try {
    const payload = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return false;
    return payload && payload.user === ADMIN_USER;
  } catch (e) {
    return false;
  }
}

// Authentication Middleware
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/, '').trim();
  
  if (token && verifyAuthToken(token)) {
    return next();
  }
  return res.status(401).json({ success: false, error: 'Acceso no autorizado. Inicie sesión nuevamente.' });
}

// Rate Limiter for AI endpoint (Max 30 requests per minute per IP)
const ipRequestCounts = new Map();
function rateLimitAI(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000;
  
  const record = ipRequestCounts.get(ip) || { count: 0, resetTime: now + windowMs };
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
  } else {
    record.count++;
  }
  ipRequestCounts.set(ip, record);

  if (record.count > 30) {
    return res.status(429).json({ error: 'Límite de mensajes alcanzado. Por favor espera unos momentos.' });
  }
  next();
}

// Serve static images directly from VPS disk with caching
app.use('/posters/uploads', express.static(UPLOADS_DIR, { maxAge: '30d' }));
app.use('/posters', express.static(path.resolve(__dirname, 'public/posters'), { maxAge: '30d' }));
app.use('/franchises', express.static(FRANCHISES_DIR, { maxAge: '30d' }));
app.use('/jarvis/references', express.static(JARVIS_REFS, { maxAge: '30d' }));

// Helper to get catalog data safely
function getCatalogData() {
  if (fs.existsSync(CATALOG_FILE)) {
    const raw = fs.readFileSync(CATALOG_FILE, 'utf-8');
    return JSON.parse(raw);
  }
  return { categories: [], franchises: [], posters: [], settings: { whatsappPhone: '50238375078' } };
}

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Usuario y contraseña requeridos.' });
  }

  if (username.trim() === ADMIN_USER && password.trim() === ADMIN_PASS) {
    const token = generateAuthToken();
    console.log(`[Deco Auth] Admin "${username}" authenticated successfully.`);
    return res.status(200).json({
      success: true,
      token,
      user: { username: ADMIN_USER, role: 'admin' }
    });
  }

  return res.status(401).json({ success: false, error: 'Usuario o contraseña incorrectos.' });
});

app.post('/api/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/, '').trim();
  if (token && verifyAuthToken(token)) {
    return res.status(200).json({ valid: true, user: ADMIN_USER });
  }
  return res.status(401).json({ valid: false });
});

// ==========================================
// 2. CATALOG & INVENTORY ENDPOINTS
// ==========================================

// GET /api/catalog (Public - Central source of truth for all web clients)
app.get('/api/catalog', (req, res) => {
  try {
    const catalog = getCatalogData();
    return res.status(200).json(catalog);
  } catch (err) {
    console.error('[API Error] GET /api/catalog:', err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/catalog/save (Protected Admin - Persists entire catalog to VPS SSD)
app.post('/api/catalog/save', requireAuth, async (req, res) => {
  try {
    const { categories, posters, franchises, settings } = req.body;
    if (!Array.isArray(posters)) {
      return res.status(400).json({ error: 'posters must be an array' });
    }

    // Auto-process and sanitize images: convert base64 to WebP files on disk and fix any truncated extensions
    const processedPosters = await Promise.all(posters.map(async (p) => {
      const cleanPoster = { ...p };
      const cleanId = (cleanPoster.id || 'obra-' + Date.now()).toLowerCase().replace(/[^a-z0-9]+/g, '-');

      // Auto-correct truncated .web extension
      if (cleanPoster.thumb && cleanPoster.thumb.endsWith('.web')) {
        cleanPoster.thumb = cleanPoster.thumb + 'p';
      }
      if (cleanPoster.image && cleanPoster.image.endsWith('.web')) {
        cleanPoster.image = cleanPoster.image + 'p';
      }

      // Convert full image base64 if present
      if (cleanPoster.image && cleanPoster.image.startsWith('data:image/')) {
        try {
          const base64Data = cleanPoster.image.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          const fileName = `${cleanId}-${Date.now().toString().slice(-4)}.webp`;
          const fullDest = path.resolve(UPLOADS_FULL, fileName);
          const thumbDest = path.resolve(UPLOADS_THUMB, fileName);

          await sharp(buffer).resize(1400, 1400, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 86 }).toFile(fullDest);
          await sharp(buffer).resize(480, 480, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toFile(thumbDest);

          cleanPoster.image = `/posters/uploads/full/${fileName}`;
          cleanPoster.thumb = `/posters/uploads/thumb/${fileName}`;
        } catch (imgErr) {
          console.warn(`[Auto WebP Conversion Failed for ${cleanId}]:`, imgErr.message);
        }
      }

      return cleanPoster;
    }));

    const currentCatalog = getCatalogData();
    const dataToSave = {
      updatedAt: new Date().toISOString(),
      categories: categories || currentCatalog.categories || [],
      franchises: franchises || currentCatalog.franchises || [],
      posters: processedPosters,
      settings: {
        ...currentCatalog.settings,
        ...(settings || {}),
        updatedAt: new Date().toISOString()
      }
    };

    const tmpFile = `${CATALOG_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(dataToSave, null, 2), 'utf-8');
    fs.renameSync(tmpFile, CATALOG_FILE);
    console.log(`[VPS Disk] Atomic persist of ${processedPosters.length} posters to 100 GB SSD.`);
    return res.status(200).json({ success: true, count: processedPosters.length, updatedAt: dataToSave.updatedAt });
  } catch (err) {
    console.error('[API Error] POST /api/catalog/save:', err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/catalog/upload (Protected Admin - Converts uploaded images to physical WebP on SSD)
app.post('/api/catalog/upload', requireAuth, async (req, res) => {
  try {
    const { dataUrl, fileName, posterId } = req.body;
    if (!dataUrl) {
      return res.status(400).json({ error: 'Falta la imagen (dataUrl).' });
    }

    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const cleanId = (posterId || 'obra-' + Date.now()).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const baseFileName = `${cleanId}-${Date.now().toString().slice(-4)}.webp`;

    const fullDest = path.resolve(UPLOADS_FULL, baseFileName);
    const thumbDest = path.resolve(UPLOADS_THUMB, baseFileName);

    // Full High-Res (Max 1400x1400px, 86% WebP)
    await sharp(buffer)
      .resize(1400, 1400, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 86 })
      .toFile(fullDest);

    // Fast Thumbnail (Max 480x480px, 78% WebP)
    await sharp(buffer)
      .resize(480, 480, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(thumbDest);

    console.log(`[VPS Storage] Created physical WebP files on SSD: ${baseFileName}`);
    return res.status(200).json({
      success: true,
      image: `/posters/uploads/full/${baseFileName}`,
      thumb: `/posters/uploads/thumb/${baseFileName}`
    });
  } catch (err) {
    console.error('[API Error] POST /api/catalog/upload:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. STORE SETTINGS & WHATSAPP CONFIG
// ==========================================

// GET /api/settings
app.get('/api/settings', (req, res) => {
  try {
    const catalog = getCatalogData();
    return res.status(200).json(catalog.settings || { whatsappPhone: '50238375078' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/settings/save (Protected Admin)
app.post('/api/settings/save', requireAuth, (req, res) => {
  try {
    const { whatsappPhone } = req.body;
    const catalog = getCatalogData();
    catalog.settings = {
      ...catalog.settings,
      whatsappPhone: (whatsappPhone || '50238375078').replace(/[^0-9]/g, ''),
      updatedAt: new Date().toISOString()
    };
    const tmpFile = `${CATALOG_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(catalog, null, 2), 'utf-8');
    fs.renameSync(tmpFile, CATALOG_FILE);
    console.log(`[Deco Settings] Updated WhatsApp phone to: ${catalog.settings.whatsappPhone}`);
    return res.status(200).json({ success: true, settings: catalog.settings });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. J.A.R.V.I.S. AI SECURE BACKEND PROXY
// ==========================================

const JARVIS_TOOL_DECLARATIONS = [
  {
    name: 'recomendar_obras',
    description: 'Despliega tarjetas visuales interactivas de las obras del catálogo cuando el cliente pide recomendaciones de arte, personajes, anime, autos o películas.',
    parameters: {
      type: 'OBJECT',
      properties: {
        posterIds: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: 'Lista de IDs exactos de las obras seleccionadas del catálogo oficial'
        },
        motivo: {
          type: 'STRING',
          description: 'Breve explicación conversacional de por qué se adjunta esta obra'
        }
      },
      required: ['posterIds']
    }
  },
  {
    name: 'cotizar_personalizado',
    description: 'Calcula la cotización exacta en Quetzales y prepara la tarjeta interactiva para un cuadro personalizado con medidas especiales.',
    parameters: {
      type: 'OBJECT',
      properties: {
        anchoCm: { type: 'NUMBER', description: 'Ancho en centímetros (ej: 50)' },
        altoCm: { type: 'NUMBER', description: 'Alto en centímetros (ej: 30)' },
        material: { type: 'STRING', description: 'Material: mdf o pvc. Por defecto mdf.', enum: ['mdf', 'pvc'] }
      },
      required: ['anchoCm', 'altoCm']
    }
  }
];

function calculateCustomPrice(widthCm, heightCm, material = 'mdf') {
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

const OFFICIAL_GEMINI_KEY = 'AIzaSyD0nwfJgzkpJ4VFSLIa5h9RPAC-9ioA3RA';

function getJarvisApiKey() {
  if (fs.existsSync(JARVIS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(JARVIS_FILE, 'utf-8'));
      if (data.apiKey && data.apiKey.trim().length > 0) return data.apiKey.trim();
    } catch (e) {}
  }
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0) return process.env.GEMINI_API_KEY.trim();
  if (process.env.VITE_GEMINI_API_KEY && process.env.VITE_GEMINI_API_KEY.trim().length > 0) return process.env.VITE_GEMINI_API_KEY.trim();

  // Auto-read from .env.local if running in local environment
  const envLocalPath = path.resolve(__dirname, '.env.local');
  if (fs.existsSync(envLocalPath)) {
    try {
      const content = fs.readFileSync(envLocalPath, 'utf-8');
      const match = content.match(/VITE_GEMINI_API_KEY\s*=\s*(.+)/);
      if (match && match[1] && match[1].trim().length > 0) {
        return match[1].trim();
      }
    } catch (e) {}
  }

  return OFFICIAL_GEMINI_KEY;
}

// POST /api/jarvis/save-key (Protected Admin - Persists Gemini API Key to VPS SSD)
app.post('/api/jarvis/save-key', requireAuth, (req, res) => {
  try {
    const { apiKey } = req.body;
    let config = {};
    if (fs.existsSync(JARVIS_FILE)) {
      try { config = JSON.parse(fs.readFileSync(JARVIS_FILE, 'utf-8')); } catch (e) {}
    }
    config.apiKey = (apiKey || '').trim();
    config.updatedAt = new Date().toISOString();
    fs.writeFileSync(JARVIS_FILE, JSON.stringify(config, null, 2), 'utf-8');
    console.log('[Deco J.A.R.V.I.S.] Saved Gemini API key to VPS SSD.');
    return res.status(200).json({ success: true, message: 'Clave de Gemini API guardada en VPS SSD.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/jarvis/chat (Public with Rate Limiting - Secure Server-Side Gemini AI)
app.post('/api/jarvis/chat', rateLimitAI, async (req, res) => {
  try {
    const { prompt, history } = req.body;
    const clientKey = req.headers['x-gemini-key'] || req.body.apiKey;
    const apiKey = (clientKey && clientKey.trim().length > 0) ? clientKey.trim() : getJarvisApiKey();

    const catalog = getCatalogData();
    const posters = catalog.posters || [];
    const categories = catalog.categories || [];
    const settings = catalog.settings || {};
    const waPhone = settings.whatsappPhone || '50238375078';

    // Load rich training memory from jarvisConfig.json if available
    let jarvisMemory = {};
    if (fs.existsSync(JARVIS_FILE)) {
      try { jarvisMemory = JSON.parse(fs.readFileSync(JARVIS_FILE, 'utf-8')); } catch (e) {}
    }

    const ownerDirectives = (jarvisMemory.ownerDirectives || [
      "Habla siempre de forma amigable, cálida, entusiasta y servicial, como un asesor de diseño experto y buena onda.",
      "Usa un trato de 'tú' neutro e inclusivo. NUNCA asumas género ni uses repetitivamente la palabra 'señor' o 'caballero'.",
      "Escribe en texto conversacional fluido, natural y limpio. Evita llenar las respuestas de asteriscos, títulos rígidos '###' o estructuras de reporte técnico aburrido.",
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
    ]).map(doc => `[DOCUMENTO: ${doc.title}]\n${doc.content}`).join('\n\n');

    // Rich catalog summary with FULL descriptions and tags
    const catalogSummary = posters.map(p => 
      `- ID: "${p.id}", Título: "${p.title}", Subtítulo: "${p.subtitle || ''}", Categoría: "${p.category}", Descripción: "${p.description || ''}", Tags: "${(p.tags || []).join(', ')}", Precio: "${p.priceDisplay || 'Desde Q25.00'}"`
    ).join('\n');

    const systemInstruction = `Eres J.A.R.V.I.S. (Just A Rather Very Intelligent System), el asistente de inteligencia artificial exclusivo de Deco Vintage Guate (tienda en Guatemala de cuadros rígidos y pósters decorativos de colección en madera MDF de 5.5mm con tecnología HP Látex).
WhatsApp Oficial de Atención al Cliente: +${waPhone}

=== DIRECTIVAS Y POLÍTICAS DE ATENCIÓN ===
${ownerDirectives}

=== DOCUMENTOS Y GUÍAS DE LA TIENDA ===
${customDocs}

=== MATERIALES Y PRECIOS OFICIALES ===
- Madera MDF 5.5mm: Base sólida rígida, resistente, bordes pulidos, no se dobla. Incluye cinta doble cara industrial Tesa para colgar sin clavos.
- PVC Sintético 5mm: Ultraligero y 100% impermeable / resistente al agua y humedad (+Q15.00).
- Solo Vinil Adhesivo: Impresión en vinil HP Látex al 50% de descuento (mitad de precio).
Medidas estándar: Mini (13x18cm - Q25), Pequeño (20x25cm - Q40), Portada Álbum 30x30cm (Q60), Mediano (30x45cm - Q75), Grande (40x60cm - Q125), Gigante (60x90cm - Q210).

=== CATÁLOGO COMPLETO DE OBRAS EN TIENDA (CON DESCRIPCIONES Y DETALLES) ===
${catalogSummary}

=== REGLAS CRÍTICAS DE CONVERSACIÓN ===
1. Eres culto, amable, natural, inteligente y conversacional. Hablas con pasión sobre cine, Marvel, autos, anime, videojuegos y música.
2. Si el cliente te pregunta sobre detalles de una película, personajes, historia del arte, materiales, envíos, promociones o eventos (como el stand en Centranorte), responde con tu texto inteligente de forma completa y amena.
3. REGLA ESTRICTA DE TARJETAS: ÚNICAMENTE debes invocar la herramienta 'recomendar_obras' cuando el cliente te pida EXPLÍCITAMENTE VER, MOSTRAR, RECOMENDAR U ORDENAR cuadros (ej: "muéstrame cuadros de...", "qué opciones tienes de...", "recomiéndame diseños de..."). Si el cliente solo está conversando o preguntando si tienes algo sin pedir verlos, responde primero con texto conversacional explicando lo que tienes y pregúntale si desea que se los muestres.
4. Si el cliente pide cotizar medidas personalizadas especiales (ej: 50x70cm, 80x120cm), invoca 'cotizar_personalizado'.
5. Escribe siempre en un tono natural, fluido, limpio y elegante, evitando formatos robóticos.`;

    const configuredKey = getJarvisApiKey();
    const keysToTry = [...new Set([OFFICIAL_GEMINI_KEY, configuredKey, clientKey].filter(k => !!k && k.trim().length > 10 && k.startsWith('AIzaSy')))];

    if (keysToTry.length === 0) {
      return res.status(200).json({
        replyText: 'El asistente de inteligencia artificial J.A.R.V.I.S. no se encuentra disponible en este momento. Por favor contáctanos directamente a nuestro WhatsApp oficial.',
        actions: []
      });
    }

    const CANDIDATE_MODELS = [
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.6-flash',
      'gemini-1.5-flash',
      'gemini-2.0-flash'
    ];
    let lastError = null;

    for (const keyToUse of keysToTry) {
      for (const modelName of CANDIDATE_MODELS) {
        try {
          const genAI = new GoogleGenerativeAI(keyToUse);
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemInstruction,
            tools: [{ functionDeclarations: JARVIS_TOOL_DECLARATIONS }]
          });

          // Format conversation history for Gemini if available
          const chatHistory = [];
          if (Array.isArray(history) && history.length > 0) {
            for (const msg of history.slice(-6)) {
              const role = msg.sender === 'user' ? 'user' : 'model';
              const text = msg.text || '';
              if (text.trim().length > 0) {
                chatHistory.push({ role, parts: [{ text }] });
              }
            }
          }

          const chat = model.startChat({ history: chatHistory });
          const result = await chat.sendMessage(prompt || 'Hola');
          const response = result.response;
          const functionCalls = response.functionCalls();
          let replyText = response.text ? response.text() : '';
          const executedActions = [];

          if (functionCalls && functionCalls.length > 0) {
            for (const call of functionCalls) {
              if (call.name === 'recomendar_obras') {
                const ids = call.args.posterIds || [];
                const matched = posters.filter(p => ids.includes(p.id));
                executedActions.push({
                  type: 'catalog_matches',
                  posters: matched,
                  motivo: call.args.motivo || 'Obras recomendadas de nuestro catálogo oficial'
                });
              } else if (call.name === 'cotizar_personalizado') {
                const quote = calculateCustomPrice(call.args.anchoCm, call.args.altoCm, call.args.material);
                executedActions.push({
                  type: 'custom_quote',
                  quote
                });
              }
            }
          }

          return res.status(200).json({
            replyText: replyText || '¡Con gusto! Aquí tienes los detalles:',
            actions: executedActions
          });
        } catch (modelErr) {
          lastError = modelErr;
          console.warn(`[Gemini Model ${modelName} with Key ...${keyToUse.slice(-6)} Failed]:`, modelErr.message);
        }
      }
    }

    // Offline response ONLY if all models failed
    console.warn('[Gemini AI Offline]: All models failed:', lastError?.message);
    return res.status(200).json({
      replyText: 'El asistente J.A.R.V.I.S. no se encuentra disponible temporalmente. Por favor contáctanos vía WhatsApp.',
      actions: []
    });
  } catch (err) {
    console.error('[API Error] POST /api/jarvis/chat:', err);
    return res.status(500).json({ error: 'Error al procesar consulta con J.A.R.V.I.S.: ' + err.message });
  }
});

// GET & POST Jarvis Training Memory
app.get('/api/jarvis', (req, res) => {
  try {
    if (fs.existsSync(JARVIS_FILE)) {
      const raw = fs.readFileSync(JARVIS_FILE, 'utf-8');
      return res.status(200).json(JSON.parse(raw));
    }
    return res.status(200).json({});
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/jarvis/save', requireAuth, (req, res) => {
  try {
    const dataToSave = {
      updatedAt: new Date().toISOString(),
      ...req.body
    };
    fs.writeFileSync(JARVIS_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const catalog = getCatalogData();
  res.json({
    status: 'ok',
    vps: true,
    storage: '100 GB SSD Hostinger',
    postersCount: catalog.posters?.length || 0,
    timestamp: new Date().toISOString()
  });
});

// Serve static assets from public/ and dist/
app.use(express.static(path.resolve(__dirname, 'public'), { maxAge: '30d' }));
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR, { maxAge: '1y', immutable: true }));

  // Never return index.html for missing .js / .css / .webp assets (prevents MIME type errors)
  app.use('/assets', (req, res) => {
    res.status(404).send('Asset not found');
  });

  app.use((req, res) => {
    res.sendFile(path.resolve(DIST_DIR, 'index.html'));
  });
}

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [Deco Vintage Server] Running on http://0.0.0.0:${PORT} on VPS Hostinger 100 GB SSD.`);
});

