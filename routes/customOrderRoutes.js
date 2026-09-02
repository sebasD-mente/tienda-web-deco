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

// Configuración de Multer en memoria para archivos de imagen
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB max por imagen
});

/**
 * POST /api/custom-orders
 * Endpoint público: Recibe las especificaciones y archivos de imagen del cliente.
 */
router.post('/', upload.any(), async (req, res) => {
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
