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

  // 2. Fallback: Almacenamiento local en uploads/custom
  const uploadDir = path.join(PROJECT_ROOT, 'public', 'uploads', 'custom');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const ext = path.extname(originalName) || '.webp';
  const fileName = `${cleanId}-${Date.now()}${ext}`;
  const filePath = path.join(uploadDir, fileName);
  fs.writeFileSync(filePath, buffer);

  const localUrl = `/uploads/custom/${fileName}`;
  return {
    imageUrl: localUrl,
    thumbUrl: localUrl
  };
}

/**
 * Crea una nueva orden / cotización personalizada en la base de datos
 */
export async function createCustomOrder({
  items = [],
  totalPrice = 0,
  totalUnits = 1,
  customerPhone = null,
  customerNotes = null,
  files = []
}) {
  const orderNumber = generateOrderNumber();

  // Procesar y asociar imágenes a cada póster del pedido
  const processedItems = [];

  for (let i = 0; i < items.length; i++) {
    const item = { ...items[i] };
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
      totalPrice: Number(totalPrice) || 0,
      totalUnits: Number(totalUnits) || processedItems.length || 1,
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
