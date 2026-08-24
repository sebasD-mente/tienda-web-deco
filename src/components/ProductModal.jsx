import React, { useState } from 'react';
import { X, ShoppingBag, MessageSquare, Check, Star } from 'lucide-react';
import confetti from 'canvas-confetti';
import { OFFICIAL_SIZES } from '../data/catalogData';
import OptimizedImage from './OptimizedImage';

export default function ProductModal({ poster, onClose, onAddToCart, onQuickWhatsApp }) {
  const [selectedSize, setSelectedSize] = useState(OFFICIAL_SIZES[3]); // Mediano default
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!poster) return null;

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
    setTimeout(() => setAdded(false), 2000);
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
          maxWidth: '900px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '0',
          position: 'relative',
          border: '2px solid rgba(0, 242, 254, 0.45)',
          background: '#090d16'
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
            background: 'rgba(0, 0, 0, 0.6)',
            border: '1px solid var(--border-subtle)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'all 0.2s'
          }}
        >
          <X size={18} />
        </button>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '0'
        }}>
          
          {/* Left Column: Full HD Optimized Image Preview */}
          <div style={{
            background: '#06080e',
            padding: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <div style={{
              width: '100%',
              maxWidth: '340px',
              aspectRatio: '3/4',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(0, 242, 254, 0.25)',
              border: '3px solid rgba(0, 242, 254, 0.3)'
            }}>
              <OptimizedImage
                src={poster.image || poster.thumb}
                alt={poster.title}
                priority={true}
              />
            </div>
          </div>

          {/* Right Column: Size Picker & Configuration */}
          <div style={{ padding: '36px' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge-cyan" style={{ fontSize: '0.75rem', padding: '3px 10px' }}>
                {poster.category}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                <Star size={14} fill="#00f2fe" color="#00f2fe" />
                <span>{poster.rating} ({poster.reviewsCount} reseñas)</span>
              </div>
            </div>

            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', marginBottom: '4px', lineHeight: 1.2 }}>
              {poster.title}
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              {poster.subtitle}
            </p>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '24px' }}>
              {poster.description}
            </p>

            {/* Official 6 Sizes Grid */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-cyan)', marginBottom: '10px' }}>
                Selecciona tu Tamaño Oficial:
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {OFFICIAL_SIZES.map((s) => {
                  const isSelected = selectedSize.id === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSize(s)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: isSelected ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected ? '2px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.85rem' }}>
                        <span style={{ color: isSelected ? 'var(--accent-cyan)' : '#fff' }}>{s.name}</span>
                        <span style={{ color: '#00f2fe' }}>Q {s.price.toFixed(2)}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {s.dimensions}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Price & Quantity Box */}
            <div style={{
              background: 'rgba(6, 8, 14, 0.9)',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Total a Pagar:</span>
                  <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-cyan)' }}>
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
                      cursor: 'pointer'
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
                      cursor: 'pointer'
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Actions Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleAdd}
                className="btn-cyan"
                style={{ flex: 1, justifyContent: 'center', padding: '14px' }}
              >
                {added ? <Check size={18} /> : <ShoppingBag size={18} />}
                <span>{added ? '¡Añadido!' : 'Añadir al Carrito'}</span>
              </button>

              <button
                onClick={handleWhatsApp}
                className="btn-secondary"
                style={{ padding: '14px 20px', borderColor: '#25d366', color: '#25d366' }}
                title="Comprar por WhatsApp"
              >
                <MessageSquare size={18} />
                <span>WhatsApp</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
