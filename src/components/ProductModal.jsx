import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, MessageSquare, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { OFFICIAL_SIZES } from '../data/catalogData';

export default function ProductModal({ poster, onClose, onAddToCart, onQuickWhatsApp, onOpenCart }) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const availableSizes = Array.isArray(poster?.availableSizes) && poster.availableSizes.length > 0
    ? OFFICIAL_SIZES.filter(s => poster.availableSizes.includes(s.id))
    : (Array.isArray(poster?.sizes) && poster.sizes.length > 0
        ? OFFICIAL_SIZES.filter(s => poster.sizes.some(ps => (ps.sizeId || ps.id) === s.id))
        : OFFICIAL_SIZES);

  const [selectedSizeId, setSelectedSizeId] = useState(
    availableSizes.find(s => s.id === 'GRANDE')?.id || availableSizes[0]?.id || 'MEDIANO'
  );

  useEffect(() => {
    if (poster) {
      const valid = Array.isArray(poster.availableSizes) && poster.availableSizes.length > 0
        ? OFFICIAL_SIZES.filter(s => poster.availableSizes.includes(s.id))
        : (Array.isArray(poster.sizes) && poster.sizes.length > 0
            ? OFFICIAL_SIZES.filter(s => poster.sizes.some(ps => (ps.sizeId || ps.id) === s.id))
            : OFFICIAL_SIZES);
      if (!valid.some(s => s.id === selectedSizeId)) {
        setSelectedSizeId(valid.find(s => s.id === 'GRANDE')?.id || valid[0]?.id || 'MEDIANO');
      }
      setQuantity(1);
      setAdded(false);
    }
  }, [poster]);

  if (!poster) return null;

  const selectedSize = availableSizes.find(s => s.id === selectedSizeId) || availableSizes[0] || OFFICIAL_SIZES[0];
  const currentPrice = selectedSize.price * quantity;

  const handleAdd = () => {
    onAddToCart({
      poster,
      size: selectedSize,
      price: selectedSize.price,
      quantity
    });
    
    // Confetti effect on add to cart
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#00f2fe', '#38bdf8', '#00f5a0']
    });

    setAdded(true);
  };

  const handleWhatsApp = () => {
    onQuickWhatsApp({
      poster,
      size: selectedSize,
      price: currentPrice,
      quantity
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '960px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '0',
          position: 'relative',
          border: '2px solid rgba(0, 242, 254, 0.45)',
          background: '#090d16',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(0, 242, 254, 0.2)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.7)',
            border: '1px solid var(--border-subtle)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-cyan)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
        >
          <X size={18} />
        </button>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '0'
        }}>
          
          {/* Left Column: Image (Top-Justified, Uncropped Full Ratio) & Description Underneath */}
          <div style={{
            background: 'radial-gradient(circle at top, #0c121e 0%, #04060a 100%)',
            padding: '28px 24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'center',
            borderRight: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            {/* Poster Image Frame */}
            <div style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 15px 40px rgba(0, 0, 0, 0.85), 0 0 25px rgba(0, 242, 254, 0.2)',
              border: '2px solid rgba(0, 242, 254, 0.35)',
              padding: '8px',
              background: '#040609',
              marginBottom: '18px'
            }}>
              <img
                src={poster.image || poster.thumb}
                alt={poster.title}
                style={{
                  maxWidth: '100%',
                  maxHeight: '380px',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  display: 'block',
                  borderRadius: '6px'
                }}
              />
            </div>

            {/* Poster Description Box Underneath the Image */}
            {poster.description && (
              <div style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.025)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '10px',
                padding: '14px 16px',
                boxSizing: 'border-box'
              }}>
                <div style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: 'var(--accent-cyan)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '6px'
                }}>
                  Detalles de la Obra
                </div>
                <p style={{
                  fontSize: '0.84rem',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.55',
                  margin: 0
                }}>
                  {poster.description}
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Details, Size Picker & Purchase Controls (Compact & Scroll-Free) */}
          <div style={{
            padding: '28px 30px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start'
          }}>
            
            {/* Category Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge-cyan" style={{ fontSize: '0.72rem', padding: '2px 10px' }}>
                {poster.category}
              </span>
            </div>

            {/* Main Title & Subtitle */}
            <h2 style={{ fontSize: '1.55rem', fontWeight: 900, color: '#fff', marginBottom: '4px', lineHeight: 1.2 }}>
              {poster.title}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              {poster.subtitle}
            </p>

            {/* Official Sizes Section */}
            <div style={{ marginBottom: '18px' }}>
              {availableSizes.length === 1 ? (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-cyan)', marginBottom: '8px' }}>
                    Tamaño Disponible:
                  </label>
                  <div style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(0, 242, 254, 0.12)',
                    border: '2px solid var(--accent-cyan)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--accent-cyan)' }}>
                        {availableSizes[0].name} ({availableSizes[0].dimensions})
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {availableSizes[0].badge || 'Formato Oficial Grande para Salas y Oficinas'}
                      </div>
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#00f2fe' }}>
                      Q {availableSizes[0].price.toFixed(2)}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-cyan)', marginBottom: '8px' }}>
                    Selecciona tu Tamaño Oficial ({availableSizes.length} disponibles):
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {availableSizes.map((s) => {
                      const isSelected = selectedSize.id === s.id;
                      return (
                        <div
                          key={s.id}
                          onClick={() => setSelectedSizeId(s.id)}
                          style={{
                            padding: '9px 11px',
                            borderRadius: 'var(--radius-sm)',
                            background: isSelected ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                            border: isSelected ? '2px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.82rem' }}>
                            <span style={{ color: isSelected ? 'var(--accent-cyan)' : '#fff' }}>{s.name}</span>
                            <span style={{ color: '#00f2fe' }}>Q {s.price.toFixed(2)}</span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                            {s.dimensions}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Price & Quantity Box */}
            <div style={{
              background: 'rgba(6, 8, 14, 0.9)',
              padding: '15px 18px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block' }}>Total a Pagar:</span>
                  <span style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--accent-cyan)' }}>
                    Q {currentPrice.toFixed(2)}
                  </span>
                </div>

                {/* Quantity Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: 'none',
                      color: '#fff',
                      fontSize: '1.1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    -
                  </button>
                  <span style={{ fontWeight: 800, fontSize: '1rem', minWidth: '20px', textAlign: 'center' }}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: 'none',
                      color: '#fff',
                      fontSize: '1.1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Actions Buttons */}
            {added ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{
                  background: 'rgba(0, 245, 160, 0.12)',
                  border: '1px solid rgba(0, 245, 160, 0.4)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: '#00f5a0',
                  fontSize: '0.86rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  <Check size={18} />
                  <span>¡Obra agregada al carrito con éxito!</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    onClick={() => {
                      if (onOpenCart) onOpenCart();
                      else onClose();
                    }}
                    className="btn-cyan"
                    style={{ justifyContent: 'center', padding: '13px 14px', fontSize: '0.88rem' }}
                  >
                    <ShoppingBag size={18} />
                    <span>Ir al Carrito</span>
                  </button>

                  <button
                    onClick={onClose}
                    className="btn-secondary"
                    style={{ justifyContent: 'center', padding: '13px 14px', fontSize: '0.88rem' }}
                  >
                    <span>Seguir Comprando</span>
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleAdd}
                  className="btn-cyan"
                  style={{ flex: 1, justifyContent: 'center', padding: '13px' }}
                >
                  <ShoppingBag size={18} />
                  <span>Añadir al Carrito</span>
                </button>

                <button
                  onClick={handleWhatsApp}
                  className="btn-secondary"
                  style={{ padding: '13px 18px', borderColor: '#25d366', color: '#25d366' }}
                  title="Comprar por WhatsApp"
                >
                  <MessageSquare size={18} />
                  <span>WhatsApp</span>
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
