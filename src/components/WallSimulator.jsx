import React, { useState } from 'react';
import { Sliders, Maximize2, ShoppingBag, MessageSquare, Check, Sparkles, Eye, ArrowRight } from 'lucide-react';
import { OFFICIAL_SIZES, ROOM_ENVIRONMENTS, CATALOG_POSTERS } from '../data/catalogData';

export default function WallSimulator({ onAddToCart, onQuickWhatsApp }) {
  const [selectedPoster, setSelectedPoster] = useState(CATALOG_POSTERS[0]);
  const [selectedSize, setSelectedSize] = useState(OFFICIAL_SIZES[3]); // Mediano as default
  const [selectedRoom, setSelectedRoom] = useState(ROOM_ENVIRONMENTS[0]);
  const [added, setAdded] = useState(false);

  // Calculate visual pixel height/width based on real centimeters
  // Base scale: 1 cm = ~3.2 pixels in simulator container
  const scaleFactor = 2.8;
  const posterWidthPx = selectedSize.widthCm * scaleFactor;
  const posterHeightPx = selectedSize.heightCm * scaleFactor;

  const handleAdd = () => {
    onAddToCart({
      poster: selectedPoster,
      size: selectedSize,
      price: selectedSize.price,
      quantity: 1
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  const handleWhatsApp = () => {
    onQuickWhatsApp({
      poster: selectedPoster,
      size: selectedSize,
      price: selectedSize.price
    });
  };

  return (
    <section id="simulador" style={{ padding: '80px 0', position: 'relative' }}>
      <div className="container">
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div className="badge-gold">
            <Sliders size={14} />
            <span>DISPLATE-STYLE SIMULATOR</span>
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 900, marginBottom: '14px' }}>
            Simulador de Pared & <span className="text-gradient-gold">Escala Real</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '680px', margin: '0 auto', fontSize: '1.05rem' }}>
            Mira con exactitud cómo lucirá tu póster en tu pared antes de comprarlo. Cambia de ambiente y compara los <strong>6 tamaños exactos en madera MDF de 5.5mm</strong>.
          </p>
        </div>

        {/* Main Simulator Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '32px',
          alignItems: 'start'
        }}>
          
          {/* Left / Top: Interactive Room Visualizer */}
          <div className="glass-card" style={{
            padding: '0',
            overflow: 'hidden',
            border: '2px solid rgba(245, 158, 11, 0.3)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)'
          }}>
            {/* Room Tabs Bar */}
            <div style={{
              background: 'rgba(10, 13, 20, 0.95)',
              padding: '12px 20px',
              display: 'flex',
              gap: '10px',
              borderBottom: '1px solid var(--border-subtle)',
              overflowX: 'auto'
            }}>
              {ROOM_ENVIRONMENTS.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-full)',
                    background: selectedRoom.id === room.id ? 'var(--grad-gold)' : 'rgba(255, 255, 255, 0.05)',
                    color: selectedRoom.id === room.id ? '#07090e' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.25s ease'
                  }}
                >
                  {room.name}
                </button>
              ))}
            </div>

            {/* Simulated 3D Wall View */}
            <div style={{
              height: '460px',
              position: 'relative',
              background: selectedRoom.wallColor,
              backgroundImage: selectedRoom.bgGradient,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden'
            }}>
              
              {/* Wall Light / Lamp Ambience */}
              <div style={{
                position: 'absolute',
                top: 0,
                width: '100%',
                height: '140px',
                background: 'radial-gradient(ellipse at top, rgba(245, 158, 11, 0.18) 0%, transparent 70%)',
                pointerEvents: 'none'
              }} />

              {/* The Scaled Poster on Wall */}
              <div style={{
                width: `${posterWidthPx}px`,
                height: `${posterHeightPx}px`,
                maxHeight: '320px',
                maxWidth: '90%',
                borderRadius: '6px',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: '0 18px 40px rgba(0, 0, 0, 0.85), 0 0 20px rgba(0, 0, 0, 0.5)',
                border: '4px solid #07090e',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                zIndex: 2
              }}>
                <img
                  src={selectedPoster.image}
                  alt={selectedPoster.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
                
                {/* Subtle Print Gloss Glare */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, transparent 40%, rgba(0, 0, 0, 0.2) 100%)',
                  pointerEvents: 'none'
                }} />
              </div>

              {/* Dimensions Indicator Overlay */}
              <div style={{
                marginTop: '16px',
                background: 'rgba(7, 9, 14, 0.85)',
                padding: '6px 16px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.85rem',
                color: 'var(--accent-gold)',
                fontWeight: 700,
                backdropFilter: 'blur(8px)',
                zIndex: 2
              }}>
                {selectedSize.name} • {selectedSize.dimensions} (Escala 1:1)
              </div>

              {/* Bottom Furniture Representation (Couch / Desk Silhouette) */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '70px',
                background: 'linear-gradient(to top, #06080d 0%, rgba(10, 13, 20, 0.8) 100%)',
                borderTop: '2px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase'
              }}>
                {selectedRoom.id === 'LIVING' && '🛋️ Referencia: Sofá Sala de Estar'}
                {selectedRoom.id === 'GAMER' && '🎮 Referencia: Escritorio Setup Gamer'}
                {selectedRoom.id === 'OFFICE' && '💼 Referencia: Mueble Oficina Ejecutiva'}
              </div>

            </div>
          </div>

          {/* Right: Controls, Poster Picker & Size Configuration */}
          <div className="glass-card" style={{ padding: '32px' }}>
            
            {/* Active Poster Selector Dropdown / Thumbnail strip */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                1. Selecciona el Póster a Simular:
              </label>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                {CATALOG_POSTERS.slice(0, 7).map((post) => (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPoster(post)}
                    style={{
                      flex: '0 0 60px',
                      height: '75px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: selectedPoster.id === post.id ? '2px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      opacity: selectedPoster.id === post.id ? 1 : 0.6,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <img src={post.image} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', marginTop: '8px' }}>
                {selectedPoster.title}
              </div>
            </div>

            {/* Official 6 Sizes Picker Grid */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                2. Elige el Tamaño Oficial Deco Vintage:
              </label>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {OFFICIAL_SIZES.map((s) => {
                  const isSelected = selectedSize.id === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSize(s)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: isSelected ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected ? '2px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: isSelected ? 'var(--accent-gold)' : '#fff' }}>
                          {s.name}
                        </span>
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: '#00f5a0' }}>
                          Q {s.price.toFixed(2)}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {s.dimensions}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {s.badge}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total Price & Purchase Actions */}
            <div style={{
              background: 'rgba(6, 8, 13, 0.9)',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Precio Oficial:</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-gold)', fontFamily: 'var(--font-display)' }}>
                    Q {selectedSize.price.toFixed(2)}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <div>Madera MDF 5.5mm</div>
                  <div>Cinta Tessa incluida</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleAdd}
                  className="btn-gold"
                  style={{ flex: 1, justifyContent: 'center', padding: '14px 20px' }}
                >
                  {added ? <Check size={18} color="#07090e" /> : <ShoppingBag size={18} />}
                  <span>{added ? '¡Añadido al Carrito!' : 'Añadir al Carrito'}</span>
                </button>

                <button
                  onClick={handleWhatsApp}
                  className="btn-secondary"
                  style={{ padding: '14px 18px', borderColor: '#25d366', color: '#25d366' }}
                  title="Comprar directo por WhatsApp"
                >
                  <MessageSquare size={18} />
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
