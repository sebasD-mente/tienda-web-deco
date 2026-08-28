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

// Trust reverse proxy (Dokploy / Traefik / Nginx) for accurate client IP rate limiting
app.set('trust proxy', 1);

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
  const b64 = Buffer.from(payload).toString('hex');
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(b64).digest('hex');
  return `${b64}.${sig}`;
}

function verifyAuthToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const b64 = parts[0];
  const sig = parts[1];
  const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(b64).digest('hex');
  if (sig !== expectedSig) return false;
  try {
    const payload = JSON.parse(Buffer.from(b64, 'hex').toString('utf8'));
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
      // Normalize poster schema fields to match master standard
      cleanPoster.availableSizes = (Array.isArray(cleanPoster.availableSizes) && cleanPoster.availableSizes.length > 0)
        ? cleanPoster.availableSizes
        : ['MINI', 'PEQUENO', 'MEDIANO', 'GRANDE', 'GIGANTE'];
      cleanPoster.tags = Array.isArray(cleanPoster.tags) ? cleanPoster.tags : [cleanPoster.category];
      cleanPoster.description = cleanPoster.description || '';
      cleanPoster.priceDisplay = cleanPoster.priceDisplay || 'Desde Q 25.00';

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
    return res.status(200).json({ success: true, count: processedPosters.length, updatedAt: dataToSave.updatedAt, catalog: dataToSave });
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

const OFFICIAL_GEMINI_KEY = Buffer.from('QUl6YVN5RGJoTnptWWZyN3ZFOEdWT2wtd2xpRnJ1SkRnUGZvYThZ', 'base64').toString('utf-8');

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

function getJarvisMemory() {
  let vpsMem = {};
  let srcMem = {};
  const srcFile = path.resolve(__dirname, 'src/data/jarvisConfig.json');

  if (fs.existsSync(JARVIS_FILE)) {
    try { vpsMem = JSON.parse(fs.readFileSync(JARVIS_FILE, 'utf-8')); } catch (e) {}
  }
  if (fs.existsSync(srcFile)) {
    try { srcMem = JSON.parse(fs.readFileSync(srcFile, 'utf-8')); } catch (e) {}
  }

  const mergedDocsMap = new Map();
  (srcMem.customDocuments || []).forEach(d => mergedDocsMap.set(d.id || d.title, d));
  (vpsMem.customDocuments || []).forEach(d => mergedDocsMap.set(d.id || d.title, d));

  const mergedDirectives = [...new Set([...(srcMem.ownerDirectives || []), ...(vpsMem.ownerDirectives || [])])];

  return {
    ...srcMem,
    ...vpsMem,
    customDocuments: Array.from(mergedDocsMap.values()),
    ownerDirectives: mergedDirectives
  };
}

// POST /api/jarvis/save-key (Protected Admin - Persists Gemini API Key to VPS SSD)
app.post('/api/jarvis/save-key', requireAuth, (req, res) => {
  try {
    const { apiKey } = req.body;
    let config = getJarvisMemory();
    config.apiKey = (apiKey || '').trim();
    config.updatedAt = new Date().toISOString();
    fs.writeFileSync(JARVIS_FILE, JSON.stringify(config, null, 2), 'utf-8');
    const srcFile = path.resolve(__dirname, 'src/data/jarvisConfig.json');
    try { fs.writeFileSync(srcFile, JSON.stringify(config, null, 2), 'utf-8'); } catch (e) {}
    console.log('[Deco J.A.R.V.I.S.] Saved Gemini API key to VPS SSD & src config.');
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

    // Load merged rich training memory (custom documents + directives + events)
    const jarvisMemory = getJarvisMemory();

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

    // Rich catalog summary with FULL descriptions and tags
    const catalogSummary = posters.map(p => 
      `- ID: "${p.id}", Título: "${p.title}", Subtítulo: "${p.subtitle || ''}", Categoría: "${p.category}", Descripción: "${p.description || ''}", Tags: "${(p.tags || []).join(', ')}", Precio: "${p.priceDisplay || 'Desde Q25.00'}"`
    ).join('\n');

    const systemInstruction = `Eres J.A.R.V.I.S. (Just A Rather Very Intelligent System), el asistente de inteligencia artificial exclusivo de Deco Vintage Guate (tienda en Guatemala de cuadros rígidos y pósters decorativos de colección en madera MDF de 5.5mm con tecnología HP Látex).
WhatsApp Oficial de Atención al Cliente: +${waPhone}

=== ESTILO Y PERSONALIDAD DE J.A.R.V.I.S. ===
- Eres súper amable, cálido, conversacional, servicial, ameno y educado. Hablas con emoción y cultura sobre cine, Marvel, DC, autos, anime, videojuegos, arte y música.
- Trato cercano: Trata al cliente de 'tú' de forma natural y respetuosa. NUNCA uses repetitivamente palabras robóticas o frías como 'señor', 'caballero' o estructuras de soporte aburrido.

=== REGLA ESTRICTA DE HERRAMIENTAS Y TARJETAS (MUY IMPORTANTE) ===
1. Responde 100% CON TEXTO FLUIDO Y AMIGABLE en la inmensa mayoría de interacciones.
2. ÚNICAMENTE debes invocar la herramienta 'recomendar_obras' si el usuario pide EXPLÍCITAMENTE VER, MOSTRAR, ENSEÑAR U ORDENAR cuadros (ej: "muéstrame cuadros de...", "quiero ver diseños de...", "enséñame qué opciones tienes...").
3. Si el usuario SOLO está conversando, preguntando si tienes alguna temática (ej: "¿Tienen cuadros de Spider-Man?"), preguntando sobre un evento o haciendo preguntas generales, RESPONDE 100% CON TEXTO CONVERSACIONAL ENTUSIASTA explicando lo que tienes y pregúntale amablemente si le gustaría que se los muestres.
4. Si el cliente pide cotizar medidas personalizadas especiales (ej: 50x70cm, 80x120cm), invoca 'cotizar_personalizado'.

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

    const configuredKey = getJarvisApiKey();
    const keysToTry = [...new Set([OFFICIAL_GEMINI_KEY, configuredKey, clientKey].filter(k => !!k && k.trim().length > 10 && k.startsWith('AIzaSy')))];

    if (keysToTry.length === 0) {
      return res.status(200).json({
        replyText: 'El asistente de inteligencia artificial J.A.R.V.I.S. no se encuentra disponible en este momento. Por favor contáctanos directamente a nuestro WhatsApp oficial.',
        actions: []
      });
    }

    const CANDIDATE_MODELS = [
      'gemini-3.5-flash-lite',
      'gemini-3.5-flash',
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

          // Format conversation history for Gemini with strict role alternation (user <-> model)
          const chatHistory = [];
          if (Array.isArray(history) && history.length > 0) {
            let lastRole = null;
            for (const msg of history.slice(-10)) {
              const role = (msg.sender === 'user' || msg.sender === 'client') ? 'user' : 'model';
              const text = (msg.text || msg.content || '').trim();
              if (text.length > 0 && role !== lastRole) {
                chatHistory.push({ role, parts: [{ text }] });
                lastRole = role;
              }
            }
            if (chatHistory.length > 0 && chatHistory[0].role !== 'user') {
              chatHistory.shift();
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
    return res.status(500).json({ error: 'Error procesando consulta de J.A.R.V.I.S.: ' + err.message });
  }
});

app.post('/api/catalog/delete-image', requireAuth, (req, res) => {
  try {
    const { imagePath, thumbPath } = req.body;
    if (imagePath && imagePath.startsWith('/posters/uploads/')) {
      const fullFile = path.resolve(__dirname, 'public', imagePath.replace(/^\//, ''));
      if (fs.existsSync(fullFile)) fs.unlinkSync(fullFile);
    }
    if (thumbPath && thumbPath.startsWith('/posters/uploads/')) {
      const thumbFile = path.resolve(__dirname, 'public', thumbPath.replace(/^\//, ''));
      if (fs.existsSync(thumbFile)) fs.unlinkSync(thumbFile);
    }
    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// GET & POST Jarvis Training Memory
app.get('/api/jarvis', (req, res) => {
  try {
    const memory = getJarvisMemory();
    return res.status(200).json(memory);
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
    const srcFile = path.resolve(__dirname, 'src/data/jarvisConfig.json');
    try { fs.writeFileSync(srcFile, JSON.stringify(dataToSave, null, 2), 'utf-8'); } catch (e) {}
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

