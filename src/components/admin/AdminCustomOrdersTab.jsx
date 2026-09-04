import React, { useState, useEffect } from 'react';
import {
  Download, Trash2, RefreshCw, Eye, CheckCircle2, Clock,
  Package, AlertCircle, ExternalLink, Filter, Calendar, Tag, ChevronDown
} from 'lucide-react';
import {
  apiGetCustomOrders,
  apiUpdateCustomOrderStatus,
  apiDeleteCustomOrder
} from '../../utils/apiClient';
import ConfirmDialog from '../common/ConfirmDialog';

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
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' };
      case 'EN_PRODUCCION':
        return { bg: 'rgba(0, 242, 254, 0.15)', text: '#00f2fe', border: 'rgba(0, 242, 254, 0.3)' };
      case 'COMPLETADO':
        return { bg: 'rgba(0, 245, 160, 0.15)', text: '#00f5a0', border: 'rgba(0, 245, 160, 0.3)' };
      case 'CANCELADO':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
      default:
        return { bg: 'rgba(255, 255, 255, 0.1)', text: '#fff', border: 'rgba(255, 255, 255, 0.2)' };
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.25s ease' }}>
      
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
          <Package size={22} color="var(--accent-cyan)" />
          <div>
            <h2 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
              Cotizaciones y Pedidos Personalizados
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', margin: '2px 0 0 0' }}>
              Gestión de fotos de clientes y descargas originales en alta resolución
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Status Filter Buttons */}
          <div style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.4)',
            padding: '3px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            {[
              { id: 'ALL', label: 'Todos' },
              { id: 'PENDIENTE', label: 'Pendientes' },
              { id: 'EN_PRODUCCION', label: 'En Producción' },
              { id: 'COMPLETADO', label: 'Completados' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
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
            title="Actualizar lista de cotizaciones"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Refrescar</span>
          </button>
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
          <RefreshCw size={30} className="animate-spin" color="var(--accent-cyan)" style={{ margin: '0 auto 12px auto' }} />
          <p style={{ fontSize: '0.9rem' }}>Cargando cotizaciones...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'rgba(14, 20, 35, 0.4)',
          borderRadius: '16px',
          border: '1px dashed rgba(255, 255, 255, 0.1)'
        }}>
          <Package size={40} color="rgba(255, 255, 255, 0.2)" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>
            No hay cotizaciones {filterStatus !== 'ALL' ? 'con este estado' : 'registradas aún'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', maxWidth: '400px', margin: '0 auto' }}>
            Cuando los clientes coticen pósters personalizados en la web, aparecerán aquí con sus especificaciones e imágenes para descargar.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {filteredOrders.map((order) => {
            const statusStyle = getStatusColor(order.status);
            const dateStr = new Date(order.createdAt).toLocaleString('es-GT', {
              dateStyle: 'medium',
              timeStyle: 'short'
            });
            const items = Array.isArray(order.items) ? order.items : [];

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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '1.15rem',
                      fontWeight: 900,
                      color: 'var(--accent-cyan)',
                      fontFamily: 'var(--font-display)',
                      letterSpacing: '0.04em'
                    }}>
                      #{order.orderNumber}
                    </span>

                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: 'var(--text-secondary)',
                      fontSize: '0.78rem'
                    }}>
                      <Calendar size={13} />
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Estado:</span>
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                        style={{
                          background: statusStyle.bg,
                          color: statusStyle.text,
                          border: `1px solid ${statusStyle.border}`,
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          outline: 'none'
                        }}
                      >
                        <option value="PENDIENTE" style={{ background: '#0a101c', color: '#f59e0b' }}>PENDIENTE</option>
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
                      title="Eliminar registro de cotización"
                    >
                      <Trash2 size={13} />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>

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
                      : `Medida Especial: ${item.customWidth} x ${item.customHeight} cm (${(item.customArea || 0).toLocaleString()} cm²)`;

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
                                alt={item.originalFileName || `Póster #${idx + 1}`}
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
                              Póster #{idx + 1}: {sizeText}
                            </div>
                            <div style={{ color: '#ffffff', fontSize: '0.78rem', fontWeight: 600, marginTop: '2px' }}>
                              🪵 {materialText}
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
                              Q {(Number(item.totalPrice) || 0).toFixed(2)}
                            </div>
                          </div>

                          {item.imageUrl && (
                            <a
                              href={item.imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={item.originalFileName || `poster_personalizado_${order.orderNumber}_${idx + 1}`}
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
                              title="Descargar foto en calidad original"
                            >
                              <Download size={14} />
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
                  justifyContent: 'flex-end',
                  alignItems: 'baseline',
                  gap: '10px'
                }}>
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

    </div>
  );
}
