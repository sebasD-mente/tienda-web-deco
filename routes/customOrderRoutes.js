/**
 * routes/customOrderRoutes.js
 * Endpoints modulares para cotizaciones y pedidos personalizados.
 * 100% Stateless y respaldado en PostgreSQL + Google Cloud Storage.
 */

import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';
import {
  createCustomOrder,
  getAllCustomOrders,
  getCustomOrderById,
  updateCustomOrderStatus,
  deleteCustomOrder
} from '../services/customOrderService.js';

const router = Router();

import path from 'path';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp'
]);

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

/**
 * Valida la firma binaria (magic bytes) de la imagen en memoria.
 */
function isValidImageSignature(buffer) {
  if (!buffer || buffer.length < 12) return false;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return true;
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return true;
  // WebP: RIFF....WEBP
  const riff = buffer.toString('ascii', 0, 4);
  const webp = buffer.toString('ascii', 8, 12);
  if (riff === 'RIFF' && webp === 'WEBP') return true;

  return false;
}

// Configuración endurecida de Multer en memoria para pedidos personalizados
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max por archivo
    files: 5                     // Máximo 5 archivos por pedido
  },
  fileFilter: (req, file, cb) => {
    // 1. Verificación de tipo MIME declarado
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error('Formato no permitido. Solo se aceptan imágenes JPEG, PNG o WebP.'), false);
    }
    // 2. Verificación de extensión de archivo
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (ext && !ALLOWED_EXTENSIONS.has(ext)) {
      return cb(new Error('Extensión no permitida. Solo se aceptan extensiones .jpg, .jpeg, .png, .webp.'), false);
    }
    cb(null, true);
  }
});

/**
 * Middleware receptor de imágenes con límite estricto de 5 y manejo de errores.
 * Soporta 'images' (array) y mantiene compatibilidad con 'image_0'...'image_4'.
 */
const uploadOrderImages = (req, res, next) => {
  const fields = [
    { name: 'images', maxCount: 5 },
    { name: 'image_0', maxCount: 1 },
    { name: 'image_1', maxCount: 1 },
    { name: 'image_2', maxCount: 1 },
    { name: 'image_3', maxCount: 1 },
    { name: 'image_4', maxCount: 1 },
  ];

  upload.fields(fields)(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: 'Archivo demasiado grande. El límite máximo es de 10 MB por imagen.'
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            error: 'Demasiadas imágenes. El límite máximo es de 5 imágenes por pedido.'
          });
        }
        return res.status(400).json({ success: false, error: `Error de subida: ${err.message}` });
      }
      return res.status(400).json({ success: false, error: err.message });
    }

    // Normalizar archivos a req.files plano
    const files = [];
    if (req.files) {
      if (Array.isArray(req.files.images)) files.push(...req.files.images);
      for (let i = 0; i < 5; i++) {
        if (Array.isArray(req.files[`image_${i}`])) files.push(...req.files[`image_${i}`]);
      }
    }

    if (files.length > 5) {
      return res.status(400).json({
        success: false,
        error: 'Demasiadas imágenes. El límite máximo es de 5 imágenes por pedido.'
      });
    }

    req.files = files;
    next();
  });
};

/**
 * POST /api/custom-orders
 * Endpoint público: Recibe las especificaciones y archivos de imagen del cliente.
 */
router.post('/', uploadOrderImages, async (req, res) => {
  try {
    let items = [];
    if (req.body.items) {
      items = typeof req.body.items === 'string' ? JSON.parse(req.body.items) : req.body.items;
    }

    const totalPrice = Number(req.body.totalPrice) || 0;
    const totalUnits = Number(req.body.totalUnits) || (Array.isArray(items) ? items.length : 1);
    const customerPhone = req.body.customerPhone || null;
    const customerNotes = req.body.customerNotes || null;
    const files = req.files || [];

    // Verificación estricta de firma binaria (magic bytes) para cada archivo en memoria
    for (const file of files) {
      if (!isValidImageSignature(file.buffer)) {
        return res.status(400).json({
          success: false,
          error: `El archivo "${file.originalname || 'subido'}" no contiene una firma binaria válida de imagen (JPEG, PNG, WebP).`
        });
      }
    }

    const order = await createCustomOrder({
      items,
      totalPrice,
      totalUnits,
      customerPhone,
      customerNotes,
      files
    });

    return res.status(201).json({
      success: true,
      orderNumber: order.orderNumber,
      order
    });
  } catch (err) {
    console.error('[API Error] POST /api/custom-orders:', err);
    return res.status(500).json({
      success: false,
      error: 'Error al registrar el pedido personalizado.',
      details: err.message
    });
  }
});

/**
 * GET /api/custom-orders
 * Endpoint protegido (Admin): Lista todas las cotizaciones ordenadas cronológicamente.
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const orders = await getAllCustomOrders();
    return res.status(200).json(orders);
  } catch (err) {
    console.error('[API Error] GET /api/custom-orders:', err);
    return res.status(500).json({
      error: 'Error al obtener las cotizaciones.',
      details: err.message
    });
  }
});

/**
 * GET /api/custom-orders/:id
 * Endpoint protegido (Admin): Detalle de una cotización específica.
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const order = await getCustomOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado.' });
    }
    return res.status(200).json(order);
  } catch (err) {
    console.error('[API Error] GET /api/custom-orders/:id:', err);
    return res.status(500).json({ error: 'Error al obtener el pedido.', details: err.message });
  }
});

/**
 * PATCH /api/custom-orders/:id/status
 * Endpoint protegido (Admin): Cambia el estado de una cotización.
 */
router.patch('/:id/status', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'El estado es requerido.' });
    }
    const updated = await updateCustomOrderStatus(req.params.id, status);
    return res.status(200).json({ success: true, order: updated });
  } catch (err) {
    console.error('[API Error] PATCH /api/custom-orders/:id/status:', err);
    return res.status(500).json({ error: 'Error al actualizar el estado.', details: err.message });
  }
});

/**
 * DELETE /api/custom-orders/:id
 * Endpoint protegido (Admin): Elimina una cotización.
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const deleted = await deleteCustomOrder(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Pedido no encontrado para eliminar.' });
    }
    return res.status(200).json({ success: true, message: 'Pedido eliminado correctamente.' });
  } catch (err) {
    console.error('[API Error] DELETE /api/custom-orders/:id:', err);
    return res.status(500).json({ error: 'Error al eliminar el pedido.', details: err.message });
  }
});

export default router;
