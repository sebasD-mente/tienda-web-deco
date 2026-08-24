import React, { useState } from 'react';
import { X, ShoppingBag, Trash2, MessageSquare, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CartDrawer({ isOpen, onClose, cartItems, onRemoveItem, onClearCart }) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerDept, setCustomerDept] = useState('Guatemala');

  if (!isOpen) return null;

  const total = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleCheckoutWhatsApp = () => {
    if (cartItems.length === 0) return;

    let itemsText = cartItems.map((it, idx) => {
      return `${idx + 1}. *${it.poster.title}*\n   • Tamaño: ${it.size.name} (${it.size.dimensions})\n   • Cantidad: ${it.quantity}\n   • Subtotal: Q${(it.price * it.quantity).toFixed(2)}`;
    }).join('\n\n');

    let message = `🛍️ *NUEVO PEDIDO DESDE LA WEB DECO VINTAGE*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *Cliente:* ${customerName || 'Cliente Web'}\n` +
      `📞 *Teléfono:* ${customerPhone || 'Por coordinar'}\n` +
      `📍 *Ubicación / Depto:* ${customerAddress || 'Por coordinar'} (${customerDept})\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📦 *DETALLE DE PÓSTERS RÍGIDOS MDF 5.5mm:*\n\n` +
      `${itemsText}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 *TOTAL A PAGAR: Q${total.toFixed(2)}*\n` +
      `✨ _Incluye cinta Tessa industrial para montaje inmediato._\n\n` +
      `Hola, me gustaría confirmar mi pedido. ¿Qué métodos de pago tienen disponibles?`;

    // Confetti celebration
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00f2fe', '#38bdf8', '#00f5a0']
    });

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="glass-card"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '460px',
          maxWidth: '100vw',
          borderRadius: '0',
          borderLeft: '2px solid rgba(0, 242, 254, 0.4)',
          background: '#06080e',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1001,
          animation: 'slideInRight 0.3s ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cart Header */}
        <div style={{
          padding: '20px 24px',
          background: 'rgba(10, 14, 24, 0.95)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingBag size={22} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
              Tu Carrito ({cartItems.length})
            </h3>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Cart Items List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <ShoppingBag size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Tu carrito está vacío</p>
              <p style={{ fontSize: '0.85rem' }}>Elige tus posters y tamaños en el catálogo</p>
            </div>
          ) : (
            cartItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: '14px',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(0, 242, 254, 0.15)',
                  alignItems: 'center'
                }}
              >
                <img
                  src={item.poster.image}
                  alt={item.poster.title}
                  style={{
                    width: '60px',
                    height: '75px',
                    objectFit: 'cover',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    color: '#fff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {item.poster.title}
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
                    {item.size.name} • {item.size.dimensions}
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '2px' }}>
                    Q {(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>

                <button
                  onClick={() => onRemoveItem(idx)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ff5f56',
                    cursor: 'pointer',
                    padding: '8px'
                  }}
                  title="Eliminar póster"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Checkout Data & Actions */}
        {cartItems.length > 0 && (
          <div style={{
            padding: '24px',
            background: 'rgba(9, 13, 20, 0.98)',
            borderTop: '1px solid var(--border-subtle)'
          }}>
            {/* Quick Customer Inputs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="Tu Nombre (Opcional)"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
              <input
                type="text"
                placeholder="Dirección o Municipio de Entrega"
                value={customerAddress}
                onChange={e => setCustomerAddress(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Total Row */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Estimado:</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-cyan)' }}>
                  Q {total.toFixed(2)}
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                MDF 5.5mm + Cinta Tessa
              </div>
            </div>

            {/* WhatsApp Checkout Button */}
            <button
              onClick={handleCheckoutWhatsApp}
              className="btn-cyan"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '16px',
                fontSize: '1rem'
              }}
            >
              <MessageSquare size={20} />
              <span>Confirmar Pedido por WhatsApp</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}

      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
