import React, { useState, useEffect } from 'react';
import {
  Download, Trash2, RefreshCw, CheckCircle2,
  Package, Calendar, User, Phone, MapPin, Link2, ShoppingBag
} from 'lucide-react';
import {
  apiGetCustomOrders,
  apiUpdateCustomOrderStatus,
  apiDeleteCustomOrder
} from '../../utils/apiClient';
import ConfirmDialog from '../common/ConfirmDialog';

function getOrderSourceMeta(orderSource) {
  switch (orderSource) {
    case 'WEB_CART':
      return {
        label: 'Carrito Catálogo',
        code: 'WEB_CART',
        bg: 'rgba(56, 189, 248, 0.14)',
        text: '#38bdf8',
        border: 'rgba(56, 189, 248, 0.35)'
      };
    case 'WEB_QUICK_POSTER':
      return {
        label: 'Compra Rápida',
        code: 'WEB_QUICK_POSTER',
        bg: 'rgba(37, 211, 102, 0.14)',
        text: '#4ade80',
        border: 'rgba(37, 211, 102, 0.35)'
      };
    case 'WEB_CUSTOM':
    default:
      return {
        label: 'Cotizador Personalizado',
        code: 'WEB_CUSTOM',
        bg: 'rgba(0, 242, 254, 0.12)',
        text: '#00f2fe',
        border: 'rgba(0, 242, 254, 0.3)'
      };
  }
}

export default function AdminCustomOrdersTab({ showToast }) {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [deletingId, setDeletingId] = useState(null);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [isDeletingOrder, setIsDeletingOrder] = useState(false);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await apiGetCustomOrders();
      let orderList = [];
      if (Array.isArray(response)) {
        orderList = response;
      } else if (response && Array.isArray(response.data)) {
        orderList = response.data;
      } else if (response && Array.isArray(response.orders)) {
        orderList = response.orders;
      }
      setOrders(orderList);
    } catch (err) {
      console.error('Error fetching custom orders:', err);
      if (showToast) showToast('No se pudieron cargar las cotizaciones', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await apiUpdateCustomOrderStatus(id, newStatus);
      setOrders(prev => prev.map(o => (o.id === id ? { ...o, status: newStatus } : o)));
      if (showToast) showToast(`Estado actualizado a ${newStatus}`, 'success');
    } catch (err) {
      console.error('Error updating status:', err);
      if (showToast) showToast('Error al actualizar el estado', 'error');
    }
  };

  const handleDeleteOrder = (id, orderNumber) => {
    setOrderToDelete({ id, orderNumber });
  };

  const handleConfirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    const { id, orderNumber } = orderToDelete;
    setIsDeletingOrder(true);
    setDeletingId(id);
    try {
      await apiDeleteCustomOrder(id);
      setOrders(prev => prev.filter(o => o.id !== id));
      if (showToast) showToast(`Cotización #${orderNumber} eliminada correctamente`, 'success');
      setOrderToDelete(null);
    } catch (err) {
      console.error('Error deleting order:', err);
      if (showToast) showToast('Error al eliminar la cotización', 'error');
    } finally {
      setIsDeletingOrder(false);
      setDeletingId(null);
    }
  };

  const filteredOrders = orders.filter(o => {
    if (filterStatus === 'ALL') return true;
    return o.status === filterStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDIENTE':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.35)', label: 'PENDIENTE' };
      case 'IMPORTADO':
        return { bg: 'rgba(168, 85, 247, 0.16)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.42)', label: 'IMPORTADO' };
      case 'EN_PRODUCCION':
        return { bg: 'rgba(0, 242, 254, 0.15)', text: '#00f2fe', border: 'rgba(0, 242, 254, 0.35)', label: 'EN PRODUCCIÓN' };
      case 'COMPLETADO':
        return { bg: 'rgba(0, 245, 160, 0.15)', text: '#00f5a0', border: 'rgba(0, 245, 160, 0.35)', label: 'COMPLETADO' };
      case 'CANCELADO':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.35)', label: 'CANCELADO' };
      default:
        return { bg: 'rgba(255, 255, 255, 0.1)', text: '#fff', border: 'rgba(255, 255, 255, 0.2)', label: status || 'PENDIENTE' };
    }
  };

  const formatWhatsAppHref = (rawPhone) => {
    const digits = String(rawPhone || '').replace(/\D/g, '');
    if (!digits) return null;
    const normalized = digits.length === 8 ? `502${digits}` : digits;
    return `https://wa.me/${normalized}`;
  };

  return (
    <div className="admin-custom-orders-root" style={{ animation: 'fadeIn 0.25s ease' }}>

      {/* Header & Controls Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px',
        marginBottom: '24px',
        background: 'rgba(14, 20, 35, 0.7)',
        padding: '16px 20px',
        borderRadius: '14px',
        border: '1px solid rgba(0, 242, 254, 0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Package size={22} color="var(--accent-cyan)" aria-hidden="true" />
          <div>
            <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
              Pedidos Web y Cotizaciones Personalizadas
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', margin: '2px 0 0 0' }}>
              Bandeja unificada con datos de cliente, estado de importación hacia Modulo_Ventas y descargas HD
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Status Filter Buttons */}
          <div
            role="group"
            aria-label="Filtrar pedidos por estado"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '2px',
              background: 'rgba(0, 0, 0, 0.4)',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            {[
              { id: 'ALL', label: 'Todos' },
              { id: 'PENDIENTE', label: 'Pendientes' },
              { id: 'IMPORTADO', label: 'Importados' },
              { id: 'EN_PRODUCCION', label: 'En Producción' },
              { id: 'COMPLETADO', label: 'Completados' },
              { id: 'CANCELADO', label: 'Cancelados' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                aria-pressed={filterStatus === tab.id}
                onClick={() => setFilterStatus(tab.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: filterStatus === tab.id ? 'var(--accent-cyan)' : 'transparent',
                  color: filterStatus === tab.id ? '#040609' : 'var(--text-secondary)',
                  fontWeight: 800,
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchOrders}
            disabled={isLoading}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Actualizar lista de pedidos"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} aria-hidden="true" />
            <span>Refrescar</span>
          </button>
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
          <RefreshCw size={30} className="animate-spin" color="var(--accent-cyan)" style={{ margin: '0 auto 12px auto' }} aria-hidden="true" />
          <p style={{ fontSize: '0.9rem' }}>Cargando pedidos y cotizaciones...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'rgba(14, 20, 35, 0.4)',
          borderRadius: '16px',
          border: '1px dashed rgba(255, 255, 255, 0.1)'
        }}>
          <Package size={40} color="rgba(255, 255, 255, 0.2)" style={{ margin: '0 auto 12px auto' }} aria-hidden="true" />
          <h3 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>
            No hay pedidos {filterStatus !== 'ALL' ? `en estado ${filterStatus}` : 'registrados aún'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', maxWidth: '420px', margin: '0 auto' }}>
            Cuando los clientes realicen pedidos desde el Carrito, Compra Rápida o el Cotizador Personalizado, aparecerán aquí con sus datos y enlaces.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {filteredOrders.map((order) => {
            const statusStyle = getStatusColor(order.status);
            const sourceMeta = getOrderSourceMeta(order.orderSource);
            const dateStr = new Date(order.createdAt).toLocaleString('es-GT', {
              dateStyle: 'medium',
              timeStyle: 'short'
            });
            const importedAtStr = order.importedAt
              ? new Date(order.importedAt).toLocaleString('es-GT', {
                  dateStyle: 'short',
                  timeStyle: 'short'
                })
              : null;
            const items = Array.isArray(order.items) ? order.items : [];
            const hasCustomerMeta = Boolean(
              order.customerName ||
              order.customerPhone ||
              order.customerDepartment ||
              order.customerAddress ||
              order.customerNotes
            );
            const waHref = formatWhatsAppHref(order.customerPhone);
            const statusSelectId = `order-status-select-${order.id}`;

            return (
              <div
                key={order.id}
                style={{
                  background: 'rgba(10, 16, 28, 0.85)',
                  border: '1px solid rgba(0, 242, 254, 0.18)',
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Order Top Bar */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  paddingBottom: '14px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '1.15rem',
                      fontWeight: 900,
                      color: 'var(--accent-cyan)',
                      fontFamily: 'var(--font-display)',
                      letterSpacing: '0.04em'
                    }}>
                      #{order.orderNumber}
                    </span>

                    {/* Status Badge */}
                    <span style={{
                      background: statusStyle.bg,
                      color: statusStyle.text,
                      border: `1px solid ${statusStyle.border}`,
                      padding: '2px 9px',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      letterSpacing: '0.03em'
                    }}>
                      {statusStyle.label}
                    </span>

                    {/* Order Source Badge */}
                    <span
                      title={`Canal de origen: ${sourceMeta.code}`}
                      style={{
                        background: sourceMeta.bg,
                        color: sourceMeta.text,
                        border: `1px solid ${sourceMeta.border}`,
                        padding: '2px 9px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <ShoppingBag size={12} aria-hidden="true" />
                      <span>{sourceMeta.label}</span>
                    </span>

                    {/* External Sale Number Badge (Modulo_Ventas) */}
                    {order.externalSaleNumber && (
                      <span
                        title={importedAtStr ? `Importado en Modulo_Ventas el ${importedAtStr}` : 'Vinculado con Modulo_Ventas'}
                        style={{
                          background: 'rgba(168, 85, 247, 0.16)',
                          color: '#d8b4fe',
                          border: '1px solid rgba(168, 85, 247, 0.45)',
                          padding: '2px 10px',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <Link2 size={12} aria-hidden="true" />
                        <span>Venta: {order.externalSaleNumber}</span>
                      </span>
                    )}

                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: 'var(--text-secondary)',
                      fontSize: '0.78rem'
                    }}>
                      <Calendar size={13} aria-hidden="true" />
                      <span>{dateStr}</span>
                    </span>

                    <span style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      color: '#fff',
                      fontWeight: 700
                    }}>
                      {order.totalUnits} {order.totalUnits === 1 ? 'cuadro' : 'cuadros'} ({items.length} {items.length === 1 ? 'diseño' : 'diseños'})
                    </span>
                  </div>

                  {/* Actions & Status Dropdown */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <label htmlFor={statusSelectId} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Estado:
                      </label>
                      <select
                        id={statusSelectId}
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                        style={{
                          background: statusStyle.bg,
                          color: statusStyle.text,
                          border: `1px solid ${statusStyle.border}`,
                          padding: '5px 8px',
                          borderRadius: '6px',
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="PENDIENTE" style={{ background: '#0a101c', color: '#f59e0b' }}>PENDIENTE</option>
                        <option value="IMPORTADO" style={{ background: '#0a101c', color: '#c084fc' }}>IMPORTADO</option>
                        <option value="EN_PRODUCCION" style={{ background: '#0a101c', color: '#00f2fe' }}>EN PRODUCCIÓN</option>
                        <option value="COMPLETADO" style={{ background: '#0a101c', color: '#00f5a0' }}>COMPLETADO</option>
                        <option value="CANCELADO" style={{ background: '#0a101c', color: '#ef4444' }}>CANCELADO</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteOrder(order.id, order.orderNumber)}
                      disabled={deletingId === order.id}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#ef4444',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}
                      title="Eliminar registro de pedido"
                    >
                      <Trash2 size={13} aria-hidden="true" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>

                {/* Structured Customer Details Panel */}
                {hasCustomerMeta && (
                  <div style={{
                    marginTop: '14px',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                    gap: '10px',
                    fontSize: '0.78rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#fff' }}>
                      <User size={14} color="var(--accent-cyan)" aria-hidden="true" style={{ flexShrink: 0 }} />
                      <div>
                        <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.7rem' }}>Cliente</span>
                        <strong>{order.customerName || 'Cliente Web'}</strong>
                      </div>
                    </div>

                    {order.customerPhone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#fff' }}>
                        <Phone size={14} color="#25d366" aria-hidden="true" style={{ flexShrink: 0 }} />
                        <div>
                          <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.7rem' }}>WhatsApp / Teléfono</span>
                          {waHref ? (
                            <a
                              href={waHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#4ade80', fontWeight: 800, textDecoration: 'none' }}
                            >
                              {order.customerPhone}
                            </a>
                          ) : (
                            <strong>{order.customerPhone}</strong>
                          )}
                        </div>
                      </div>
                    )}

                    {(order.customerDepartment || order.customerAddress) && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', color: '#fff' }}>
                        <MapPin size={14} color="var(--accent-cyan)" aria-hidden="true" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.7rem' }}>
                            Entrega {order.customerDepartment ? `(${order.customerDepartment})` : ''}
                          </span>
                          <strong>{order.customerAddress || order.customerDepartment}</strong>
                        </div>
                      </div>
                    )}

                    {importedAtStr && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#d8b4fe' }}>
                        <CheckCircle2 size={14} color="#c084fc" aria-hidden="true" style={{ flexShrink: 0 }} />
                        <div>
                          <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.7rem' }}>Sincronizado en Ventas</span>
                          <strong>{importedAtStr}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Items Breakdown */}
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {items.map((item, idx) => {
                    const materialText = item.baseMaterial === 'mdf'
                      ? 'Madera MDF 5.5 mm (Cuadro Completo)'
                      : item.baseMaterial === 'pvc'
                        ? 'PVC Espumado 5 mm Impermeable'
                        : 'Solo Impresión en Vinil Adhesivo HD (Sin Base)';

                    const sizeText = item.sizeMode === 'standard' && item.selectedStandardSize
                      ? `${item.selectedStandardSize.name} (${item.selectedStandardSize.dimensions})`
                      : item.customWidth && item.customHeight
                        ? `Medida Especial: ${item.customWidth} x ${item.customHeight} cm (${(item.customArea || 0).toLocaleString()} cm²)`
                        : (item.selectedStandardSize?.name || 'Estándar');

                    const itemHeading = item.title
                      ? `${item.title} — ${sizeText}`
                      : `Póster #${idx + 1}: ${sizeText}`;

                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '14px',
                          background: 'rgba(0, 0, 0, 0.35)',
                          padding: '12px 16px',
                          borderRadius: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.05)'
                        }}
                      >
                        {/* Image Preview & Details */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          {item.imageUrl || item.thumbUrl ? (
                            <div style={{
                              width: '65px',
                              height: '80px',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              background: '#000',
                              border: '1px solid rgba(0, 242, 254, 0.3)',
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <img
                                src={item.thumbUrl || item.imageUrl}
                                alt={item.title || item.originalFileName || `Póster #${idx + 1}`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </div>
                          ) : (
                            <div style={{
                              width: '65px',
                              height: '80px',
                              borderRadius: '8px',
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px dashed rgba(255, 255, 255, 0.15)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--text-secondary)',
                              fontSize: '0.7rem',
                              textAlign: 'center',
                              padding: '4px',
                              flexShrink: 0
                            }}>
                              Sin foto
                            </div>
                          )}

                          <div>
                            <div style={{ color: 'var(--accent-cyan)', fontWeight: 800, fontSize: '0.85rem' }}>
                              {itemHeading}
                            </div>
                            <div style={{ color: '#ffffff', fontSize: '0.78rem', fontWeight: 600, marginTop: '2px' }}>
                              🪵 {materialText}
                              {item.sku && (
                                <span style={{ marginLeft: '8px', color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                                  • SKU: <strong style={{ color: '#cbd5e1' }}>{item.sku}</strong>
                                </span>
                              )}
                            </div>
                            {item.originalFileName && (
                              <div style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', marginTop: '2px' }}>
                                📁 Archivo: <span style={{ color: '#fff' }}>{item.originalFileName}</span>
                              </div>
                            )}
                            {item.customNote && (
                              <div style={{ color: '#f59e0b', fontSize: '0.72rem', marginTop: '2px' }}>
                                📝 Nota: {item.customNote}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Price & Download Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                              {item.quantity || 1} {item.quantity === 1 ? 'unidad' : 'unidades'}
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                              Q {(Number(item.totalPrice ?? (Number(item.unitPrice || 0) * Number(item.quantity || 1))) || 0).toFixed(2)}
                            </div>
                          </div>

                          {item.imageUrl && (
                            <a
                              href={item.imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={item.originalFileName || `poster_${order.orderNumber}_${idx + 1}`}
                              className="btn-cyan"
                              style={{
                                padding: '8px 14px',
                                fontSize: '0.78rem',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                borderRadius: '8px',
                                textDecoration: 'none'
                              }}
                              title="Ver o descargar arte en alta resolución"
                            >
                              <Download size={14} aria-hidden="true" />
                              <span>Descargar Foto</span>
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Order Footer with Grand Total */}
                <div style={{
                  marginTop: '16px',
                  paddingTop: '12px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {order.customerNotes ? `Notas: ${order.customerNotes}` : ''}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginLeft: 'auto' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Total Cotizado:
                    </span>
                    <span style={{
                      fontSize: '1.4rem',
                      fontWeight: 900,
                      color: 'var(--accent-cyan)',
                      fontFamily: 'var(--font-display)'
                    }}>
                      Q {(Number(order.totalPrice) || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Accessible Order Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(orderToDelete)}
        title="¿Eliminar cotización?"
        message={`¿Seguro que deseas eliminar la cotización #${orderToDelete?.orderNumber}?\nEsta acción liberará el espacio en la nube y no se puede deshacer.`}
        confirmText="Eliminar cotización"
        cancelText="Cancelar"
        type="danger"
        isLoading={isDeletingOrder}
        onConfirm={handleConfirmDeleteOrder}
        onClose={() => !isDeletingOrder && setOrderToDelete(null)}
      />

      <style>{`
        .admin-custom-orders-root button:focus-visible,
        .admin-custom-orders-root select:focus-visible,
        .admin-custom-orders-root a:focus-visible {
          outline: 2px solid var(--accent-cyan);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
