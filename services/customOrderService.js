/**
 * services/customOrderService.js
 * Servicio modular y desacoplado para gestión de pedidos y cotizaciones personalizadas.
 * Cero Split-Brain: 100% sobre PostgreSQL (Prisma) y Google Cloud Storage.
 */

import { prisma } from '../config/prisma.js';
import { uploadBufferToGCS, deleteFromGCS } from './gcsService.js';
import { processImageBuffer } from './imageService.js';
import path from 'path';
import fs from 'fs';
import { PROJECT_ROOT } from '../config/paths.js';

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

const PVC_SURCHARGE = 15.0;

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
export function calculateAuthoritativeOrderTotals(rawItems = [], cm2Rate = 0.048) {
  const safeRate = Number(cm2Rate) > 0 ? Number(cm2Rate) : 0.048;
  const normalizedItems = [];
  let totalOrderPrice = 0;
  let totalOrderUnits = 0;

  for (const rawItem of (Array.isArray(rawItems) ? rawItems : [])) {
    const item = { ...rawItem };
    const qty = Math.max(1, Math.min(500, Math.floor(Number(item.quantity) || 1)));
    const material = String(item.baseMaterial || 'mdf').toLowerCase();

    let basePrice = 0;
    if (item.sizeMode === 'custom' || (Number(item.customWidth) > 0 && Number(item.customHeight) > 0)) {
      const w = Math.max(1, Math.min(500, Number(item.customWidth) || 0));
      const h = Math.max(1, Math.min(500, Number(item.customHeight) || 0));
      const area = Number((w * h).toFixed(2));
      item.customArea = area;
      basePrice = area * safeRate;
    } else {
      const resolvedStd = resolveStandardBasePrice(item.selectedStandardSize);
      basePrice = resolvedStd != null
        ? resolvedStd
        : Math.max(25, Number(item.unitPrice) || 25);
    }

    let unitPrice = basePrice;
    if (material === 'pvc') {
      unitPrice = basePrice + PVC_SURCHARGE;
    } else if (material === 'vinyl_only') {
      unitPrice = basePrice * 0.5;
    }

    const roundedUnit = Number(unitPrice.toFixed(2));
    const roundedSubtotal = Number((roundedUnit * qty).toFixed(2));

    item.quantity = qty;
    item.unitPrice = roundedUnit;
    item.totalPrice = roundedSubtotal;

    totalOrderUnits += qty;
    totalOrderPrice = Number((totalOrderPrice + roundedSubtotal).toFixed(2));
    normalizedItems.push(item);
  }

  return {
    items: normalizedItems,
    totalPrice: totalOrderPrice,
    totalUnits: totalOrderUnits || 1,
  };
}

/**
 * Crea una nueva orden / cotización personalizada en la base de datos
 */
export async function createCustomOrder({
  items = [],
  customerPhone = null,
  customerNotes = null,
  files = []
}) {
  const orderNumber = generateOrderNumber();

  let cm2Rate = 0.048;
  try {
    const settings = await prisma.storeSettings.findUnique({ where: { id: 'default' } });
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

  const createdOrder = await prisma.customOrder.create({
    data: {
      orderNumber,
      totalPrice: authoritative.totalPrice,
      totalUnits: authoritative.totalUnits,
      items: processedItems,
      status: 'PENDIENTE',
      customerPhone: customerPhone ? String(customerPhone).trim() : null,
      customerNotes: customerNotes ? String(customerNotes).trim() : null
    }
  });

  return createdOrder;
}

/**
 * Obtiene todas las cotizaciones personalizadas ordenadas por fecha reciente
 */
export async function getAllCustomOrders() {
  return await prisma.customOrder.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Obtiene una orden por su ID
 */
export async function getCustomOrderById(id) {
  return await prisma.customOrder.findUnique({
    where: { id }
  });
}

/**
 * Actualiza el estado de una orden personalizada
 */
export async function updateCustomOrderStatus(id, status) {
  return await prisma.customOrder.update({
    where: { id },
    data: { status }
  });
}

/**
 * Elimina una orden personalizada de la base de datos
 */
export async function deleteCustomOrder(id) {
  const order = await prisma.customOrder.findUnique({ where: { id } });
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

  return await prisma.customOrder.delete({
    where: { id }
  });
}
