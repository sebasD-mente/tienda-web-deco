import React, { useState, useEffect } from 'react';
import { 
  X, ShoppingBag, Trash2, MessageSquare, ArrowRight, 
  Plus, Minus, Phone, User, MapPin, ShieldCheck, 
  Clock, CreditCard, Sparkles, Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CartDrawer({ 
  isOpen, 
  onClose, 
  cartItems = [], 
  onRemoveItem, 
  onUpdateQuantity,
  onClearCart 
}) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerDept, setCustomerDept] = useState('Guatemala');

  // Comprehensive Mobile & Desktop Body Scroll Lock
  useEffect(() => {
    if (isOpen) {
      const prevBodyOverflow = document.body.style.overflow;
      const prevHtmlOverflow = document.documentElement.style.overflow;
      const prevBodyTouchAction = document.body.style.touchAction;

      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      return () => {
        document.body.style.overflow = prevBodyOverflow;
        document.documentElement.style.overflow = prevHtmlOverflow;
        document.body.style.touchAction = prevBodyTouchAction;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalItemsCount = cartItems.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0);
  const total = cartItems.reduce((acc, item) => acc + (item.price * (Number(item.quantity) || 1)), 0);
  const deposit50 = total * 0.5;

  const handleCheckoutWhatsApp = () => {
    if (cartItems.length === 0) return;

    if (!customerPhone.trim()) {
      alert('Por favor ingresa tu número de teléfono o WhatsApp para coordinar la entrega de tu pedido.');
      return;
    }

    let itemsText = cartItems.map((it, idx) => {
      const qty = Number(it.quantity) || 1;
      const subtotal = (it.price * qty).toFixed(2);
      return `${idx + 1}. *${it.poster.title}*\n   • Tamaño: ${it.size.name} (${it.size.dimensions})\n   • Cantidad: *${qty} unidad(es)*\n   • Precio Unitario: Q${it.price.toFixed(2)}\n   • Subtotal: *Q${subtotal}*`;
    }).join('\n\n');

    let message = `🛍️ *NUEVO PEDIDO DESDE LA WEB DECO VINTAGE*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *Cliente:* ${customerName.trim() || 'Cliente Web'}\n` +
      `📞 *Teléfono / WhatsApp:* ${customerPhone.trim()}\n` +
      `📍 *Ubicación / Depto:* ${customerAddress.trim() || 'Por coordinar'} (${customerDept})\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📦 *DETALLE DE PÓSTERS RÍGIDOS MDF 5.5mm:*\n\n` +
      `${itemsText}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 *TOTAL A PAGAR: Q${total.toFixed(2)}*\n` +
      `💳 *Anticipo del 50% para producción: Q${deposit50.toFixed(2)}*\n` +
      `🚚 *Saldo del 50% contra entrega: Q${deposit50.toFixed(2)}*\n` +
      `✨ _Incluye cinta Tesa industrial de montaje rápido._\n\n` +
      `Hola, me gustaría confirmar mi pedido y coordinar el método de pago del anticipo del 50%. ¿Cuáles son los datos de transferencia?`;

    // Confetti celebration
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00f2fe', '#38bdf8', '#00f5a0']
      });
    } catch (e) {
      // Ignore if confetti fails
    }

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div 
      className="cart-drawer-backdrop" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100dvh',
        background: 'rgba(4, 6, 10, 0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 1100,
        padding: 0,
        margin: 0,
        overflow: 'hidden',
        touchAction: 'none'
      }}
    >
      <div
        className="glass-card cart-drawer-panel"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          height: '100dvh',
          maxHeight: '100dvh',
          width: '480px',
          maxWidth: '100vw',
          borderRadius: 0,
          borderTop: 'none',
          borderRight: 'none',
          borderBottom: 'none',
          borderLeft: '2px solid rgba(0, 242, 254, 0.4)',
          background: '#06080e',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1101,
          animation: 'slideInRight 0.3s ease',
          boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.9)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header Fijo (Sin scroll) */}
        <div style={{
          padding: '16px 20px',
          background: 'rgba(10, 14, 24, 0.98)',
          borderBottom: '1px solid rgba(0, 242, 254, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(0, 242, 254, 0.1)',
              border: '1px solid rgba(0, 242, 254, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShoppingBag size={20} color="var(--accent-cyan)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                Tu Carrito de Compras
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {totalItemsCount} {totalItemsCount === 1 ? 'obra seleccionada' : 'obras seleccionadas'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title="Cerrar carrito"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2. ÚNICO Contenedor de Scroll Unificado para todo el contenido */}
        <div 
          className="cart-single-scroll-body"
          style={{
            flex: 1,
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
            padding: '16px 20px 32px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {/* Carrito Vacío */}
          {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
              <div style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: 'rgba(0, 242, 254, 0.05)',
                border: '1px solid rgba(0, 242, 254, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}>
                <ShoppingBag size={32} color="var(--accent-cyan)" style={{ opacity: 0.6 }} />
              </div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>Tu carrito está vacío</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>
                Explora el catálogo y agrega tus pósters favoritos en tus medidas preferidas.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="btn-cyan"
                style={{ padding: '10px 22px', fontSize: '0.85rem', margin: '0 auto' }}
              >
                <span>Explorar Catálogo</span>
                <ArrowRight size={15} />
              </button>
            </div>
          ) : (
            <>
              {/* SECCIÓN 1: Lista de Artículos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Obras en tu Pedido:
                </div>

                {cartItems.map((item, idx) => {
                  const qty = Number(item.quantity) || 1;
                  const itemSubtotal = item.price * qty;

                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(0, 242, 254, 0.2)',
                        alignItems: 'center',
                        position: 'relative'
                      }}
                    >
                      {/* Thumbnail */}
                      <div style={{
                        width: '64px',
                        height: '80px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        background: '#04070e',
                        position: 'relative'
                      }}>
                        <img
                          src={item.poster.thumb || item.poster.image}
                          alt={item.poster.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        {qty > 1 && (
                          <span style={{
                            position: 'absolute',
                            bottom: '4px',
                            right: '4px',
                            background: 'var(--accent-cyan)',
                            color: '#040609',
                            fontSize: '0.68rem',
                            fontWeight: 900,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.6)'
                          }}>
                            x{qty}
                          </span>
                        )}
                      </div>

                      {/* Detalles */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{
                          fontSize: '0.92rem',
                          fontWeight: 800,
                          color: '#fff',
                          margin: '0 0 2px 0',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {item.poster.title}
                        </h4>

                        <div style={{ fontSize: '0.76rem', color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: '6px' }}>
                          {item.size.name} • {item.size.dimensions}
                        </div>

                        {/* Stepper y Precio */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '8px'
                        }}>
                          {/* Botones de Cantidad */}
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'rgba(0, 0, 0, 0.5)',
                            border: '1px solid rgba(0, 242, 254, 0.3)',
                            borderRadius: '6px',
                            padding: '2px 4px'
                          }}>
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity ? onUpdateQuantity(idx, -1) : onRemoveItem(idx)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--accent-cyan)',
                                cursor: 'pointer',
                                padding: '2px 6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.85rem'
                              }}
                              title="Disminuir cantidad"
                            >
                              <Minus size={13} strokeWidth={3} />
                            </button>

                            <span style={{
                              fontSize: '0.82rem',
                              fontWeight: 900,
                              color: '#ffffff',
                              minWidth: '20px',
                              textAlign: 'center'
                            }}>
                              {qty}
                            </span>

                            <button
                              type="button"
                              onClick={() => onUpdateQuantity ? onUpdateQuantity(idx, 1) : null}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--accent-cyan)',
                                cursor: 'pointer',
                                padding: '2px 6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.85rem'
                              }}
                              title="Aumentar cantidad"
                            >
                              <Plus size={13} strokeWidth={3} />
                            </button>
                          </div>

                          {/* Precio */}
                          <div style={{ textAlign: 'right' }}>
                            {qty > 1 && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                {qty} x Q{item.price.toFixed(2)}
                              </div>
                            )}
                            <div style={{ fontSize: '0.92rem', fontWeight: 900, color: 'var(--accent-cyan)' }}>
                              Q {itemSubtotal.toFixed(2)}
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* Botón Eliminar */}
                      <button
                        type="button"
                        onClick={() => onRemoveItem(idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '6px',
                          borderRadius: '6px',
                          opacity: 0.75,
                          transition: 'opacity 0.2s ease',
                          flexShrink: 0
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '0.75'}
                        title="Eliminar póster"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* SECCIÓN 2: Formulario de Datos del Cliente */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '14px'
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
                  Datos de Entrega y Coordinación:
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Nombre */}
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Tu Nombre Completo (Opcional)"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px 9px 34px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#fff',
                        fontSize: '0.85rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <User size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '11px' }} />
                  </div>

                  {/* Teléfono */}
                  <div style={{ position: 'relative' }}>
                    <input
                      type="tel"
                      placeholder="Teléfono / WhatsApp de Contacto *"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px 9px 34px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: customerPhone ? '1px solid rgba(0, 242, 254, 0.4)' : '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#fff',
                        fontSize: '0.85rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <Phone size={15} color={customerPhone ? 'var(--accent-cyan)' : 'var(--text-muted)'} style={{ position: 'absolute', left: '10px', top: '11px' }} />
                  </div>

                  {/* Dirección */}
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Dirección, Zona o Municipio de Entrega"
                      value={customerAddress}
                      onChange={e => setCustomerAddress(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px 9px 34px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#fff',
                        fontSize: '0.85rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <MapPin size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '11px' }} />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: Desglose de Total y Anticipo del 50% */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                padding: '12px 16px',
                background: 'rgba(0, 242, 254, 0.04)',
                border: '1px solid rgba(0, 242, 254, 0.25)',
                borderRadius: '10px'
              }}>
                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Total a Pagar ({totalItemsCount} {totalItemsCount === 1 ? 'obra' : 'obras'}):
                  </span>
                  <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--accent-cyan)', lineHeight: 1.1, marginTop: '2px' }}>
                    Q {total.toFixed(2)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 800, display: 'block' }}>
                    50% Anticipo: Q {deposit50.toFixed(2)}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    Saldo contra entrega: Q {deposit50.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* SECCIÓN 4: Políticas de Fabricación y Entrega */}
              <div style={{
                padding: '10px 12px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: '1.35' }}>
                  <CreditCard size={13} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span>
                    <strong style={{ color: '#fff' }}>Anticipo del 50%:</strong> Requerido para iniciar fabricación artesanal en MDF 5.5mm. Saldo restante contra entrega o previo a despacho.
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: '1.35' }}>
                  <Clock size={13} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span>
                    <strong style={{ color: '#fff' }}>Tiempo de Entrega:</strong> 2 a 4 días hábiles en toda Guatemala.
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: '1.35' }}>
                  <ShieldCheck size={13} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span>
                    <strong style={{ color: '#fff' }}>Garantía:</strong> Tintas HP Látex de alta definición. Incluye cinta Tesa de montaje rápido.
                  </span>
                </div>
              </div>

              {/* SECCIÓN 5: Botón de Checkout por WhatsApp */}
              <button
                type="button"
                onClick={handleCheckoutWhatsApp}
                className="btn-cyan"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '14px',
                  fontSize: '0.92rem',
                  boxShadow: '0 0 20px rgba(0, 242, 254, 0.35)',
                  marginTop: '4px'
                }}
              >
                <MessageSquare size={18} />
                <span>Confirmar Pedido por WhatsApp</span>
                <ArrowRight size={16} />
              </button>
            </>
          )}

        </div>

      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        .cart-single-scroll-body::-webkit-scrollbar {
          width: 5px;
        }
        .cart-single-scroll-body::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }
        .cart-single-scroll-body::-webkit-scrollbar-thumb {
          background: rgba(0, 242, 254, 0.25);
          border-radius: 4px;
        }
        .cart-single-scroll-body::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 242, 254, 0.5);
        }
      `}</style>
    </div>
  );
}
