/**
 * services/customOrderService.js
 * Servicio modular y desacoplado para gestión de pedidos, cotizaciones personalizadas
 * e integración S2S (Push Webhook + Pull Inbox + Status Callback) con Modulo_Ventas.
 * Cero Split-Brain: 100% sobre PostgreSQL (Prisma) y Google Cloud Storage.
 */

import { prisma } from '../config/prisma.js';
import { deleteFromGCS } from './gcsService.js';
import { processImageBuffer } from './imageService.js';
import path from 'path';
import fs from 'fs';
import { PROJECT_ROOT } from '../config/paths.js';
import {
  DEFAULT_CM2_RATE,
  parseDecimalCm,
  calculateCanonicalPosterItemPrice,
} from '../utils/customPricing.js';

// Capability Seams para pruebas unitarias/integración sin acoplar PostgreSQL ni red externa
let activeOrderDb = prisma;
let activeWebhookFetch = null;

export function __setCustomOrderDbForTests(mockDb) {
  activeOrderDb = mockDb || prisma;
}

export function __setWebhookFetchForTests(mockFetch) {
  activeWebhookFetch = typeof mockFetch === 'function' ? mockFetch : null;
}

export const VALID_ORDER_SOURCES = new Set([
  'WEB_CART',
  'WEB_CUSTOM',
  'WEB_QUICK_POSTER',
]);

export function normalizeOrderSource(raw) {
  const normalized = String(raw || '').trim().toUpperCase();
  return VALID_ORDER_SOURCES.has(normalized) ? normalized : 'WEB_CUSTOM';
}

export function normalizeBaseMaterial(rawMaterial) {
  const val = String(rawMaterial || 'mdf').trim().toLowerCase();
  if (val === 'pvc' || val === 'pvc_5mm') return 'pvc';
  if (val === 'vinyl_only' || val === 'vinilo_solo' || val === 'vinyl') return 'vinyl_only';
  return 'mdf';
}

export function mapCanonicalMaterial(rawMaterial) {
  const base = normalizeBaseMaterial(rawMaterial);
  if (base === 'pvc') return 'PVC_5MM';
  if (base === 'vinyl_only') return 'VINILO_SOLO';
  return 'MDF_5_5MM';
}

export function getPublicWebUrl() {
  const raw = (process.env.PUBLIC_WEB_URL || 'https://decovintage.online').trim();
  return raw.replace(/\/+$/, '') || 'https://decovintage.online';
}

export function getSalesModuleBaseUrl() {
  const raw = (
    process.env.VENTAS_API_URL ||
    process.env.SALES_WEBHOOK_BASE_URL ||
    'https://ventas.decovintage.online'
  ).trim();
  return raw.replace(/\/+$/, '') || 'https://ventas.decovintage.online';
}

/**
 * Normaliza cualquier imageUrl / thumbUrl a una URL pública absoluta HTTPS
 * sin barras duplicadas. Descarta esquemas efímeros (blob:, data:).
 */
export function toAbsolutePublicUrl(rawUrl, baseUrl = getPublicWebUrl()) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return null;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  const cleanBase = String(baseUrl || 'https://decovintage.online').trim().replace(/\/+$/, '');
  const cleanPath = trimmed.replace(/^\/+/, '');
  return `${cleanBase}/${cleanPath}`;
}

/**
 * Construye el contrato canónico WebOrderPayload hacia Modulo_Ventas.
 */
export function buildWebOrderPayload(order, options = {}) {
  const publicWebUrl = options.publicWebUrl || getPublicWebUrl();
  const rawItems = Array.isArray(order?.items) ? order.items : [];

  const items = rawItems.map((rawItem, idx) => {
    const item = rawItem && typeof rawItem === 'object' ? rawItem : {};
    const parsedW = parseDecimalCm(item.customWidth);
    const parsedH = parseDecimalCm(item.customHeight);
    const sizeMode = item.sizeMode === 'custom' || (!item.sizeMode && parsedW > 0 && parsedH > 0)
      ? 'custom'
      : 'standard';

    const posterId = item.posterId ? String(item.posterId).trim() : null;
    const legacyId = item.legacyId ? String(item.legacyId).trim() : null;
    const isCustom = typeof item.isCustom === 'boolean'
      ? item.isCustom
      : (sizeMode === 'custom' || !posterId);

    const sku = item.sku
      ? String(item.sku).trim()
      : (!isCustom && (legacyId || posterId)
        ? `WEB-${legacyId || posterId}`
        : null);

    const title = String(
      item.title ||
      item.titulo ||
      (isCustom ? `Póster Personalizado #${idx + 1}` : `Póster Catálogo #${idx + 1}`)
    ).trim();

    let sizeId = null;
    let sizeLabel = null;
    let customWidth = null;
    let customHeight = null;
    let customArea = null;

    if (sizeMode === 'custom') {
      customWidth = parsedW > 0 ? parsedW : null;
      customHeight = parsedH > 0 ? parsedH : null;
      const computedArea = customWidth && customHeight
        ? Number((customWidth * customHeight).toFixed(2))
        : null;
      customArea = Number(item.customArea) > 0 ? Number(item.customArea) : computedArea;
      sizeId = item.sizeId ? String(item.sizeId).trim() : 'PERSONALIZADO';
      sizeLabel = item.sizeLabel
        ? String(item.sizeLabel).trim()
        : (customWidth && customHeight ? `${customWidth} x ${customHeight} cm` : 'Medida Especial');
    } else {
      const std = item.selectedStandardSize && typeof item.selectedStandardSize === 'object'
        ? item.selectedStandardSize
        : {};
      sizeId = String(item.sizeId || std.id || std.sizeId || '').trim() || null;
      const stdName = String(std.name || std.nombre || '').trim();
      const stdDims = String(std.dimensions || std.dimensiones || '').trim();
      if (item.sizeLabel) {
        sizeLabel = String(item.sizeLabel).trim();
      } else if (stdName && stdDims) {
        sizeLabel = `${stdName} (${stdDims})`;
      } else {
        sizeLabel = stdName || stdDims || null;
      }
    }

    const baseMaterial = normalizeBaseMaterial(item.baseMaterial || item.material);
    const material = mapCanonicalMaterial(baseMaterial);
    const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
    const unitPrice = Number(Number(item.unitPrice || 0).toFixed(2));
    const subtotal = Number(Number(item.subtotal ?? item.totalPrice ?? (unitPrice * quantity)).toFixed(2));

    const rawImg = item.imageUrl || item.image || null;
    const rawThumb = item.thumbUrl || item.thumb || rawImg || null;
    const imageUrl = toAbsolutePublicUrl(rawImg, publicWebUrl);
    const thumbUrl = toAbsolutePublicUrl(rawThumb, publicWebUrl) || imageUrl;

    const rawNote = item.customNote ?? item.notes ?? item.note ?? null;
    const customNote = rawNote ? String(rawNote).trim() || null : null;

    return {
      isCustom,
      posterId,
      legacyId,
      sku,
      title,
      sizeMode,
      sizeId,
      sizeLabel,
      customWidth,
      customHeight,
      customArea,
      material,
      baseMaterial,
      quantity,
      unitPrice,
      subtotal,
      imageUrl,
      thumbUrl,
      customNote,
    };
  });

  const createdAtIso = order?.createdAt instanceof Date
    ? order.createdAt.toISOString()
    : (order?.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString());

  return {
    externalOrderId: String(order?.id || ''),
    orderNumber: String(order?.orderNumber || ''),
    orderSource: normalizeOrderSource(order?.orderSource),
    status: String(order?.status || 'PENDIENTE'),
    customer: {
      fullName: order?.customerName ? String(order.customerName).trim() : null,
      phone: order?.customerPhone ? String(order.customerPhone).trim() : null,
      address: order?.customerAddress ? String(order.customerAddress).trim() : null,
      department: order?.customerDepartment ? String(order.customerDepartment).trim() : null,
      notes: order?.customerNotes ? String(order.customerNotes).trim() : null,
    },
    totalUnits: Math.max(1, Math.floor(Number(order?.totalUnits) || 1)),
    quotedTotal: Number(Number(order?.totalPrice || 0).toFixed(2)),
    externalSaleNumber: order?.externalSaleNumber ? String(order.externalSaleNumber).trim() : null,
    importedAt: order?.importedAt
      ? (order.importedAt instanceof Date ? order.importedAt.toISOString() : new Date(order.importedAt).toISOString())
      : null,
    createdAt: createdAtIso,
    items,
  };
}

/**
 * Emite el Webhook Push asíncrono no bloqueante hacia Modulo_Ventas
 * con AbortController (5000ms). Nunca lanza excepciones hacia el caller HTTP.
 */
export async function notifySalesModuleNewOrder(createdOrder, options = {}) {
  const secret = String(
    options.secret ??
    process.env.WEB_ORDERS_WEBHOOK_SECRET ??
    process.env.CATALOG_WEBHOOK_SECRET ??
    ''
  ).trim();

  if (!secret) {
    return { sent: false, reason: 'missing_secret' };
  }

  const baseUrl = String(options.baseUrl || getSalesModuleBaseUrl()).trim().replace(/\/+$/, '');
  const endpoint = `${baseUrl}/api/webhooks/web-orders`;
  const timeoutMs = Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : 5000;
  const fetchFn = options.fetchImpl || activeWebhookFetch || globalThis.fetch;

  if (typeof fetchFn !== 'function') {
    return { sent: false, reason: 'fetch_unavailable' };
  }

  const payload = {
    event: 'web_order.created',
    order: buildWebOrderPayload(createdOrder, { publicWebUrl: options.publicWebUrl }),
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  if (typeof timer.unref === 'function') timer.unref();

  try {
    const response = await fetchFn(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': secret,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn(
        `[CustomOrderService] Webhook S2S respondió HTTP ${response.status} para ${createdOrder?.orderNumber || 'orden'}.`
      );
      return { sent: false, status: response.status };
    }

    return { sent: true, status: response.status };
  } catch (err) {
    console.warn(
      `[CustomOrderService] Push S2S diferido para ${createdOrder?.orderNumber || 'orden'} (${err?.name === 'AbortError' ? 'timeout' : err?.message || 'network_error'}). Disponible vía Pull /integration/inbox.`
    );
    return { sent: false, error: err?.message || 'network_error' };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Genera un código de cotización único, legible y memorable (ej. "CP-4821")
 */
function generateOrderNumber() {
  const timestampPart = Date.now().toString().slice(-4);
  const randomPart = Math.floor(10 + Math.random() * 90);
  return `CP-${timestampPart}${randomPart}`;
}

/**
 * Guarda un archivo de imagen en GCS o en el sistema local si GCS no está disponible
 */
async function saveCustomImage(buffer, originalName = 'custom-poster') {
  const cleanBase = originalName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
  const cleanId = `custom-${cleanBase}`;

  try {
    // 1. Intentar procesar y subir a Google Cloud Storage
    const processed = await processImageBuffer(buffer, cleanId);
    if (processed && processed.image) {
      return {
        imageUrl: processed.image,
        thumbUrl: processed.thumb || processed.image
      };
    }
  } catch (gcsErr) {
    console.warn('[CustomOrderService] GCS no disponible, usando almacenamiento local:', gcsErr.message);
  }

  // 2. Fallback: Almacenamiento local dentro del volumen persistente /posters/uploads/custom
  const uploadDir = path.join(PROJECT_ROOT, 'public', 'posters', 'uploads', 'custom');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const ext = path.extname(originalName) || '.webp';
  const fileName = `${cleanId}-${Date.now()}${ext}`;
  const filePath = path.join(uploadDir, fileName);
  fs.writeFileSync(filePath, buffer);

  const localUrl = `/posters/uploads/custom/${fileName}`;
  return {
    imageUrl: localUrl,
    thumbUrl: localUrl
  };
}

const AUTHORITATIVE_STANDARD_PRICES = {
  MINI: 25,
  PEQUENO: 35,
  PEQUEÑO: 35,
  PORTADA_ALBUM: 55,
  'PORTADA DE ÁLBUM': 55,
  'PORTADA DE ALBUM': 55,
  MEDIANO: 65,
  GRANDE: 125,
  GIGANTE: 210,
};

const AUTHORITATIVE_DIMENSIONS_PRICES = {
  '14x21': 25,
  '20x30': 25,
  '21x27': 35,
  '30x30': 55,
  '29x43': 65,
  '30x45': 65,
  '40x60': 125,
  '45x60': 125,
  '60x90': 210,
  '60x100': 210,
};

function resolveStandardBasePrice(stdSize) {
  if (!stdSize || typeof stdSize !== 'object') return null;
  const rawId = String(stdSize.id || stdSize.sizeId || '').trim().toUpperCase();
  if (rawId && AUTHORITATIVE_STANDARD_PRICES[rawId] != null) {
    return AUTHORITATIVE_STANDARD_PRICES[rawId];
  }
  const rawName = String(stdSize.name || stdSize.nombre || '').trim().toUpperCase();
  if (rawName && AUTHORITATIVE_STANDARD_PRICES[rawName] != null) {
    return AUTHORITATIVE_STANDARD_PRICES[rawName];
  }
  const cleanDims = String(stdSize.dimensions || stdSize.dimensiones || '')
    .toLowerCase()
    .replace(/cm|\s+/g, '');
  if (cleanDims && AUTHORITATIVE_DIMENSIONS_PRICES[cleanDims] != null) {
    return AUTHORITATIVE_DIMENSIONS_PRICES[cleanDims];
  }
  return null;
}

/**
 * Recalcula de forma autoritativa en el servidor los precios unitarios, subtotales y unidades
 * de una orden, impidiendo cualquier manipulación financiera desde el cliente.
 */
export function calculateAuthoritativeOrderTotals(rawItems = [], cm2Rate = DEFAULT_CM2_RATE) {
  const safeRate = Number(cm2Rate) > 0 ? Number(cm2Rate) : DEFAULT_CM2_RATE;
  const normalizedItems = [];
  let totalOrderPrice = 0;
  let totalOrderUnits = 0;

  for (const rawItem of (Array.isArray(rawItems) ? rawItems : [])) {
    const item = { ...rawItem };
    const material = normalizeBaseMaterial(item.baseMaterial || item.material);
    const parsedW = parseDecimalCm(item.customWidth);
    const parsedH = parseDecimalCm(item.customHeight);
    const isCustomMode = item.sizeMode === 'custom' || (parsedW > 0 && parsedH > 0);

    let canonical;
    if (isCustomMode) {
      const w = Math.max(1, Math.min(500, parsedW || 1));
      const h = Math.max(1, Math.min(500, parsedH || 1));
      canonical = calculateCanonicalPosterItemPrice({
        sizeMode: 'custom',
        customWidth: w,
        customHeight: h,
        baseMaterial: material,
        quantity: item.quantity,
        cm2Rate: safeRate,
      });
      item.customWidth = w;
      item.customHeight = h;
      item.customArea = canonical.customArea;
    } else {
      const resolvedStd = resolveStandardBasePrice(item.selectedStandardSize);
      const stdBase = resolvedStd != null
        ? resolvedStd
        : Math.max(25, Number(item.unitPrice) || 25);
      canonical = calculateCanonicalPosterItemPrice({
        sizeMode: 'standard',
        standardSizePrice: stdBase,
        baseMaterial: material,
        quantity: item.quantity,
        cm2Rate: safeRate,
      });
    }

    item.baseMaterial = material;
    item.quantity = canonical.quantity;
    item.unitPrice = canonical.unitPrice;
    item.totalPrice = canonical.totalPrice;

    totalOrderUnits += canonical.quantity;
    totalOrderPrice = Number((totalOrderPrice + canonical.totalPrice).toFixed(2));
    normalizedItems.push(item);
  }

  return {
    items: normalizedItems,
    totalPrice: totalOrderPrice,
    totalUnits: totalOrderUnits || 1,
  };
}

function sanitizeNullableString(val, maxLen = 500) {
  if (val === null || val === undefined) return null;
  const trimmed = String(val).trim();
  return trimmed ? trimmed.slice(0, maxLen) : null;
}

/**
 * Crea una nueva orden / cotización personalizada en la base de datos y
 * dispara en segundo plano la notificación S2S hacia Modulo_Ventas.
 */
export async function createCustomOrder({
  items = [],
  orderSource = 'WEB_CUSTOM',
  customerName = null,
  customerPhone = null,
  customerAddress = null,
  customerDepartment = null,
  customerNotes = null,
  files = []
}) {
  const orderNumber = generateOrderNumber();
  const normalizedSource = normalizeOrderSource(orderSource);

  let cm2Rate = DEFAULT_CM2_RATE;
  try {
    const settings = await activeOrderDb.storeSettings.findUnique({ where: { id: 'default' } });
    if (settings?.customCm2Price != null && Number(settings.customCm2Price) > 0) {
      cm2Rate = Number(settings.customCm2Price);
    }
  } catch (_) {}

  const authoritative = calculateAuthoritativeOrderTotals(items, cm2Rate);
  const processedItems = [];

  for (let i = 0; i < authoritative.items.length; i++) {
    const item = { ...authoritative.items[i] };
    const matchingFile = files.find(f => f.fieldname === `image_${i}` || f.fieldname === `file_${i}`) || files[i];

    if (matchingFile && matchingFile.buffer) {
      try {
        const uploadResult = await saveCustomImage(matchingFile.buffer, matchingFile.originalname || `poster_${i + 1}`);
        item.imageUrl = uploadResult.imageUrl;
        item.thumbUrl = uploadResult.thumbUrl;
        item.originalFileName = matchingFile.originalname;
      } catch (err) {
        console.error(`[CustomOrderService] Error procesando imagen del item ${i}:`, err);
      }
    } else if (item.uploadedImage && typeof item.uploadedImage === 'string' && item.uploadedImage.startsWith('data:image/')) {
      // Si la imagen viene en Base64 dataURL
      try {
        const base64Data = item.uploadedImage.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const uploadResult = await saveCustomImage(buffer, item.imageDetails?.name || `poster_${i + 1}`);
        item.imageUrl = uploadResult.imageUrl;
        item.thumbUrl = uploadResult.thumbUrl;
        item.originalFileName = item.imageDetails?.name || `poster_${i + 1}`;
        delete item.uploadedImage; // No guardar el string base64 pesado en DB
      } catch (err) {
        console.error(`[CustomOrderService] Error procesando imagen Base64 del item ${i}:`, err);
      }
    }

    processedItems.push(item);
  }

  const createdOrder = await activeOrderDb.customOrder.create({
    data: {
      orderNumber,
      orderSource: normalizedSource,
      totalPrice: authoritative.totalPrice,
      totalUnits: authoritative.totalUnits,
      items: processedItems,
      status: 'PENDIENTE',
      customerName: sanitizeNullableString(customerName, 200),
      customerPhone: sanitizeNullableString(customerPhone, 50),
      customerAddress: sanitizeNullableString(customerAddress, 1000),
      customerDepartment: sanitizeNullableString(customerDepartment, 100),
      customerNotes: sanitizeNullableString(customerNotes, 2000),
    }
  });

  // Push S2S asíncrono no bloqueante hacia Modulo_Ventas
  Promise.resolve()
    .then(() => notifySalesModuleNewOrder(createdOrder))
    .catch((err) => {
      console.warn(
        `[CustomOrderService] Error inesperado en Push S2S para ${createdOrder.orderNumber}:`,
        err?.message || err
      );
    });

  return createdOrder;
}

/**
 * Consulta la bandeja de pedidos pendientes para sincronización Pull S2S desde Modulo_Ventas.
 */
export async function getIntegrationInboxOrders({ status = 'PENDIENTE', limit = 100 } = {}) {
  const rawStatus = String(status || 'PENDIENTE').trim().toUpperCase();
  let where = {};

  if (rawStatus !== 'ALL' && rawStatus !== 'TODOS') {
    if (rawStatus.includes(',')) {
      const statuses = rawStatus.split(',').map((s) => s.trim()).filter(Boolean);
      where = statuses.length > 0 ? { status: { in: statuses } } : { status: 'PENDIENTE' };
    } else {
      where = { status: rawStatus };
    }
  }

  const parsedLimit = Number(limit);
  const safeLimit = Number.isFinite(parsedLimit) && parsedLimit > 0
    ? Math.min(200, Math.max(1, Math.floor(parsedLimit)))
    : 100;

  const orders = await activeOrderDb.customOrder.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: safeLimit,
  });

  return orders.map((order) => buildWebOrderPayload(order));
}

/**
 * Actualiza el estado y metadatos de importación de una orden desde el callback S2S de Modulo_Ventas.
 * Preserva importedAt previo si la orden ya había sido marcada como importada anteriormente.
 */
export async function updateCustomOrderIntegrationStatus(
  orderNumber,
  { status, externalSaleNumber } = {}
) {
  const cleanOrderNumber = String(orderNumber || '').trim().replace(/^#/, '');
  if (!cleanOrderNumber) return null;

  const existing = await activeOrderDb.customOrder.findUnique({
    where: { orderNumber: cleanOrderNumber },
  });
  if (!existing) return null;

  const data = { status };

  if (externalSaleNumber !== undefined) {
    const cleanSale = externalSaleNumber === null ? null : String(externalSaleNumber).trim();
    data.externalSaleNumber = cleanSale || null;
  }

  if ((status === 'IMPORTADO' || status === 'EN_PRODUCCION') && !existing.importedAt) {
    data.importedAt = new Date();
  }

  return await activeOrderDb.customOrder.update({
    where: { orderNumber: cleanOrderNumber },
    data,
  });
}

/**
 * Obtiene todas las cotizaciones personalizadas ordenadas por fecha reciente
 */
export async function getAllCustomOrders() {
  return await activeOrderDb.customOrder.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Obtiene una orden por su ID
 */
export async function getCustomOrderById(id) {
  return await activeOrderDb.customOrder.findUnique({
    where: { id }
  });
}

/**
 * Actualiza el estado de una orden personalizada
 */
export async function updateCustomOrderStatus(id, status) {
  return await activeOrderDb.customOrder.update({
    where: { id },
    data: { status }
  });
}

/**
 * Elimina una orden personalizada de la base de datos
 */
export async function deleteCustomOrder(id) {
  const order = await activeOrderDb.customOrder.findUnique({ where: { id } });
  if (!order) return null;

  // Limpieza opcional de imágenes en GCS
  if (Array.isArray(order.items)) {
    for (const item of order.items) {
      if (item.imageUrl && item.imageUrl.includes('storage.googleapis.com')) {
        try {
          await deleteFromGCS(item.imageUrl);
        } catch (e) {
          // Silent catch
        }
      }
    }
  }

  return await activeOrderDb.customOrder.delete({
    where: { id }
  });
}
