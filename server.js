/**
 * Deco Vintage Guate - Production Backend Server (Node.js + Express + Sharp)
 * Runs on Hostinger VPS (145.223.120.56) utilizing the 100 GB SSD storage.
 */

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable HTTP Gzip/Brotli compression for ultra-fast payload delivery
app.use(compression());

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

app.get('/api/version', (req, res) => {
  res.json({
    version: 'v7.0-genai-modern',
    engine: '@google/genai-gemini-3.6-flash',
    hasApiKey: !!getJarvisApiKey(),
    keyPrefix: (getJarvisApiKey() || '').substring(0, 10)
  });
});

// Serve static images directly from VPS disk with caching
app.use('/posters/uploads', express.static(UPLOADS_DIR, { maxAge: '30d' }));
app.use('/posters', express.static(path.resolve(__dirname, 'public/posters'), { maxAge: '30d' }));
app.use('/franchises', express.static(FRANCHISES_DIR, { maxAge: '30d' }));
app.use('/jarvis/references', express.static(JARVIS_REFS, { maxAge: '30d' }));

// Helper to get catalog data safely
function getCatalogData() {
  if (fs.existsSync(CATALOG_FILE)) {
    try {
      let raw = fs.readFileSync(CATALOG_FILE, 'utf-8');
      if (raw.charCodeAt(0) === 0xFEFF) {
        raw = raw.slice(1);
      }
      return JSON.parse(raw.trim());
    } catch (err) {
      console.error('[Deco Catalog] Error parsing catalog JSON:', err.message);
    }
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
        } catch (e) {
          console.warn('[Deco Storage] Failed to convert base64 image:', e.message);
        }
      }

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

function getJarvisApiKey() {
  // 1. Production Docker Environment Variable (Dokploy Secrets - Highest Security)
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

  return '';
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

// GET /api/jarvis & /api/jarvis/config (Public - Fetches Master Training Memory & Directives)
app.get(['/api/jarvis', '/api/jarvis/config'], (req, res) => {
  try {
    const memory = getJarvisMemory();
    const safeMemory = { ...memory };
    delete safeMemory.googleClientSecret;
    delete safeMemory.googleRefreshToken;
    return res.status(200).json(safeMemory);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/jarvis/save (Persists Full Training Memory, Documents & Directives to VPS Disk)
app.post('/api/jarvis/save', (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ success: false, error: 'Payload inválido.' });
    }

    const current = getJarvisMemory();
    const updated = {
      ...current,
      ...payload,
      updatedAt: new Date().toISOString()
    };

    // Atomic write to data/jarvisConfig.json
    const tmpFile = `${JARVIS_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(updated, null, 2), 'utf-8');
    fs.renameSync(tmpFile, JARVIS_FILE);

    // Also sync to src/data/jarvisConfig.json
    const srcFile = path.resolve(__dirname, 'src/data/jarvisConfig.json');
    try { fs.writeFileSync(srcFile, JSON.stringify(updated, null, 2), 'utf-8'); } catch (e) {}

    console.log('[Deco J.A.R.V.I.S.] Master training memory persisted to VPS SSD disk.');
    return res.status(200).json({
      success: true,
      message: 'Memoria de J.A.R.V.I.S. guardada permanentemente en disco.',
      updatedAt: updated.updatedAt
    });
  } catch (err) {
    console.error('[Deco J.A.R.V.I.S. Save Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

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

let cachedVertexToken = null;
let cachedVertexTokenExpiry = 0;

async function getVertexAccessToken() {
  const now = Date.now();
  if (cachedVertexToken && now < cachedVertexTokenExpiry - 60000) {
    return cachedVertexToken;
  }
  const clientId = process.env.GOOGLE_CLOUD_CLIENT_ID || (getJarvisMemory().googleClientId || '');
  const clientSecret = process.env.GOOGLE_CLOUD_CLIENT_SECRET || (getJarvisMemory().googleClientSecret || '');
  const refreshToken = process.env.GOOGLE_CLOUD_REFRESH_TOKEN || (getJarvisMemory().googleRefreshToken || '');

  if (!refreshToken) {
    return null;
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });
    const tokenData = await tokenRes.json();
    if (tokenData.access_token) {
      cachedVertexToken = tokenData.access_token;
      cachedVertexTokenExpiry = now + ((tokenData.expires_in || 3600) * 1000);
      return cachedVertexToken;
    }
  } catch (e) {
    console.warn('[Vertex Token Refresh Error]:', e.message);
  }
  return null;
}

// POST /api/jarvis/chat (Public with Rate Limiting - Secure Server-Side Gemini AI)
app.post('/api/jarvis/chat', rateLimitAI, async (req, res) => {
  try {
    const { prompt, history } = req.body;
    const clientKey = req.headers['x-gemini-key'] || req.body.apiKey;
    const masterServerKey = getJarvisApiKey();

    // Prioritize master server key (VPS environment) over any client-provided header
    const candidateKeys = [];
    if (masterServerKey && masterServerKey.trim().length > 0) {
      candidateKeys.push(masterServerKey.trim());
    }
    if (clientKey && clientKey.trim().length > 0 && !candidateKeys.includes(clientKey.trim())) {
      candidateKeys.push(clientKey.trim());
    }

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

    const systemInstruction = `Eres J.A.R.V.I.S. (Just A Rather Very Intelligent System), el asesor de inteligencia artificial exclusivo de Deco Vintage Guate (tienda en Guatemala de cuadros rígidos y pósters decorativos de colección en madera MDF de 5.5mm con tecnología HP Látex).
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

    const CANDIDATE_MODELS = [
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-flash-latest',
      'gemini-3.5-flash-lite',
      'gemini-flash-lite-latest'
    ];
    let lastError = null;

    // 1. Format conversation history for Gemini with strict validation:
    const formatChatHistory = (rawHistory, maxTurns = 8) => {
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
    };

    const chatHistory = formatChatHistory(history);

    // 1. Primary Engine: Official Modern Google GenAI SDK (@google/genai)
    // Multi-key & Multi-model auto-failover pool
    for (const keyToUse of candidateKeys) {
      let keyAuthFailed = false;
      for (const modelName of CANDIDATE_MODELS) {
        try {
          const ai = new GoogleGenAI({ apiKey: keyToUse });
          
          const contents = [
            ...chatHistory,
            { role: 'user', parts: [{ text: prompt || 'Hola' }] }
          ];

          const resAI = await ai.models.generateContent({
            model: modelName,
            contents: contents,
            config: {
              systemInstruction: systemInstruction,
              tools: [{ functionDeclarations: JARVIS_TOOL_DECLARATIONS }]
            }
          });

          let replyText = resAI.text || '';
          const executedActions = [];
          const functionCalls = resAI.functionCalls;

          if (functionCalls && functionCalls.length > 0) {
            for (const call of functionCalls) {
              if (call.name === 'recomendar_obras') {
                const ids = call.args?.posterIds || [];
                const matched = posters.filter(p => ids.includes(p.id));
                executedActions.push({
                  type: 'catalog_matches',
                  posters: matched,
                  motivo: call.args?.motivo || 'Obras recomendadas de nuestro catálogo oficial'
                });
              } else if (call.name === 'cotizar_personalizado') {
                const quote = calculateCustomPrice(call.args?.anchoCm, call.args?.altoCm, call.args?.material);
                executedActions.push({
                  type: 'custom_quote',
                  quote
                });
              }
            }
          }

          if (!replyText && executedActions.length > 0) {
            replyText = '¡Por supuesto! Aquí tienes las obras y detalles seleccionados especialmente para ti:';
          }

          console.log(`[Deco J.A.R.V.I.S.] Success via ${modelName} | Turns: ${chatHistory.length} | Prompt: "${prompt?.slice(0, 40)}..."`);

          return res.status(200).json({
            replyText: replyText || '¡Con gusto! Aquí tienes los detalles:',
            actions: executedActions,
            poweredBy: `Google Gemini 3.6 Flash (@google/genai - ${modelName})`
          });
        } catch (genAiErr) {
          lastError = genAiErr;
          const errMsg = genAiErr.message || '';
          console.warn(`[@google/genai ${modelName} Failed (${errMsg.slice(0, 80)})]`);

          // If key is revoked, leaked, or invalid (401/403), skip remaining models for this key immediately
          if (errMsg.includes('leaked') || errMsg.includes('API_KEY_INVALID') || errMsg.includes('PERMISSION_DENIED') || errMsg.includes('403') || errMsg.includes('401')) {
            console.warn(`[Key Auth Error detected for key ${keyToUse.slice(0, 8)}... (${errMsg.slice(0, 50)})] -> Switching to next candidate key...`);
            keyAuthFailed = true;
            break;
          }
        }
      }
      if (keyAuthFailed) continue;
    }

    // 2. Secondary Engine: Google Cloud Vertex AI
    try {
      const vertexToken = await getVertexAccessToken();
      if (vertexToken) {
        const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'tienda-deco-vintage-web';
        const vertexUrl = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/gemini-2.5-flash:generateContent`;
        
        const vertexContents = [
          ...chatHistory,
          { role: 'user', parts: [{ text: prompt || 'Hola' }] }
        ];

        const vertexRes = await fetch(vertexUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${vertexToken}`
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: vertexContents,
            tools: [{ functionDeclarations: JARVIS_TOOL_DECLARATIONS }]
          })
        });

        if (vertexRes.ok) {
          const vertexData = await vertexRes.json();
          const candidate = vertexData.candidates && vertexData.candidates[0];
          if (candidate && candidate.content && candidate.content.parts) {
            let replyText = '';
            const executedActions = [];

            for (const part of candidate.content.parts) {
              if (part.text) {
                replyText += part.text;
              }
              if (part.functionCall) {
                const call = part.functionCall;
                if (call.name === 'recomendar_obras') {
                  const ids = call.args?.posterIds || [];
                  const matched = posters.filter(p => ids.includes(p.id));
                  executedActions.push({
                    type: 'catalog_matches',
                    posters: matched,
                    motivo: call.args?.motivo || 'Obras recomendadas de nuestro catálogo oficial'
                  });
                } else if (call.name === 'cotizar_personalizado') {
                  const quote = calculateCustomPrice(call.args?.anchoCm, call.args?.altoCm, call.args?.material);
                  executedActions.push({
                    type: 'custom_quote',
                    quote
                  });
                }
              }
            }

            return res.status(200).json({
              replyText: replyText || '¡Con gusto! Aquí tienes los detalles:',
              actions: executedActions,
              poweredBy: 'Google Cloud Vertex AI (gemini-2.5-flash)'
            });
          }
        }
      }
    } catch (vertexErr) {
      console.warn('[Vertex AI Execution Failed]:', vertexErr.message);
    }

    // 3. High-Availability Intelligent Fallback Engine
    console.warn('[Gemini AI Offline / Fallback]: Activating Dynamic Local Knowledge Engine. Last error:', lastError?.message);

    const qLower = (prompt || '').toLowerCase();
    let localReply = '';
    const localActions = [];

    // Check custom documents and events
    const rawDocs = jarvisMemory.customDocuments || [];
    const matchedDoc = rawDocs.find(d => {
      const tNorm = (d.title || '').toLowerCase();
      const cNorm = (d.content || '').toLowerCase();
      return (tNorm && qLower.includes(tNorm)) || 
             (qLower.includes('evento') && (tNorm.includes('fest') || tNorm.includes('stand') || tNorm.includes('evento'))) ||
             (qLower.includes('fan fest') && tNorm.includes('fan fest')) ||
             (qLower.includes('centranorte') && (tNorm.includes('centranorte') || cNorm.includes('centranorte')));
    });

    // Check for custom dimensions calculation (e.g. 50x70, 80x120)
    const dimMatch = qLower.match(/(\d{2,3})\s*(?:x|\*|por)\s*(\d{2,3})/);

    if (dimMatch) {
      const w = parseInt(dimMatch[1], 10);
      const h = parseInt(dimMatch[2], 10);
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
      const autoPosters = posters.filter(p => p.category === 'AUTOS' || (p.tags && p.tags.some(t => t.toLowerCase().includes('auto') || t.toLowerCase().includes('f1')))).slice(0, 4);
      if (autoPosters.length > 0) {
        localActions.push({ type: 'catalog_matches', posters: autoPosters, motivo: 'Cuadros destacados de automovilismo' });
      }
      localReply = `¡Excelente elección! Nos apasiona el mundo motor. Manejamos cuadros de **Fórmula 1**, leyendas del **JDM** (como el Toyota Supra, Nissan GTR, RX-7), superdeportivos clásicos y modernos (Porsche, Ferrari, Mustang, Lamborghini).\n\n` +
                   `* **Impresión:** HP Látex de alta resolución ecológica y resistente al agua.\n` +
                   `* **Estructura:** Madera MDF rígida de 5.5mm con bordes pulidos y cinta doble cara Tesa incluida para colgar sin clavos.\n` +
                   `* **Medida más vendida:** Mediano (30x45cm) por solo **Q65.00**.\n\n` +
                   `¡También podemos fabricar el cuadro con la foto de tu propio vehículo en cualquier medida personalizada! ¿Qué estilo de auto te gustaría lucir?`;
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
    } else if (qLower.includes('hola') || qLower.includes('buenas') || qLower.includes('saludos') || qLower.includes('hey')) {
      localReply = '¡Hola! 👋 Qué gusto saludarte. Soy J.A.R.V.I.S., tu asesor de diseño en Deco Vintage Guate. Dime qué temática te apasiona (autos, anime, superhéroes, películas, música, videojuegos) o si buscas precios y cotizaciones especiales, ¡con gusto te ayudo!';
    } else {
      localReply = `¡Con mucho gusto te asisto! En Deco Vintage Guate diseñamos cuadros decorativos rígidos de colección en madera MDF de 5.5mm con tecnología de impresión HP Látex y cinta industrial Tesa para colgar sin taladros.\n\n` +
                   `Cuéntame qué diseño, personaje, banda, auto o medida te interesa y con gusto te asesoro y muestro opciones de nuestro catálogo.`;
    }

    return res.status(200).json({
      replyText: localReply,
      actions: localActions,
      poweredBy: 'Deco High-Availability Fallback Engine'
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
  // Hashed assets in /assets/ (immutable 1 year)
  app.use('/assets', express.static(path.resolve(DIST_DIR, 'assets'), {
    maxAge: '1y',
    immutable: true,
    fallthrough: false
  }));

  // Never return index.html for missing .js / .css / .webp assets (prevents MIME type errors)
  app.use('/assets', (req, res) => {
    res.status(404).send('Asset not found');
  });

  // Serve root static files from dist, strictly forbidding cache on HTML
  app.use(express.static(DIST_DIR, {
    maxAge: '1d',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }
  }));

  // SPA fallback for all HTML routes (strictly no-cache)
  app.use((req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.resolve(DIST_DIR, 'index.html'));
  });
}

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [Deco Vintage Server] Running on http://0.0.0.0:${PORT} on VPS Hostinger 100 GB SSD.`);
});

