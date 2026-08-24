import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Eye, Star, Sparkles } from 'lucide-react';
import { CATEGORIES, CATALOG_POSTERS } from '../data/catalogData';
import OptimizedImage from './OptimizedImage';

export default function CategoryShelf({
  onSelectPoster,
  filterCategory,
  searchQuery
}) {
  const scrollRefs = useRef({});

  const handleScroll = (catId, direction) => {
    const container = scrollRefs.current[catId];
    if (container) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const displayedCategories = filterCategory && filterCategory !== 'TODOS'
    ? CATEGORIES.filter(c => c.id === filterCategory)
    : CATEGORIES.filter(c => c.id !== 'TODOS');

  const filterPosters = (catId) => {
    return CATALOG_POSTERS.filter(p => {
      const matchesCategory = p.category === catId;
      const matchesSearch = !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  };

  return (
    <section id="catalogo" style={{ padding: '80px 0', position: 'relative' }}>
      <div className="container">
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <div className="badge-cyan">
            <Sparkles size={14} />
            <span>CATÁLOGO DINÁMICO MEOWMEOW STYLE</span>
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 900, marginBottom: '14px' }}>
            Explora Nuestras <span className="text-gradient-cyan">Colecciones Oficiales</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto', fontSize: '1.05rem' }}>
            Desliza horizontalmente para descubrir cada obra. Diseños en orientación horizontal y vertical disponibles en los 6 tamaños sobre madera rígida MDF de 5.5mm.
          </p>
        </div>

        {/* Categories Shelves Loop */}
        {displayedCategories.map((category) => {
          const posters = filterPosters(category.id);
          if (posters.length === 0) return null;

          return (
            <div key={category.id} style={{ marginBottom: '60px' }}>
              
              {/* Shelf Category Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(0, 242, 254, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-cyan)'
                  }}>
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
                      {category.name}
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {posters.length} diseños disponibles
                    </span>
                  </div>
                </div>

                {/* Left/Right Carousel Nav Arrows */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleScroll(category.id, 'left')}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid var(--border-subtle)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-cyan)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                    title="Desplazar a la izquierda"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => handleScroll(category.id, 'right')}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid var(--border-subtle)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-cyan)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                    title="Desplazar a la derecha"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              {/* Horizontal Scroll Shelf Track */}
              <div
                ref={el => scrollRefs.current[category.id] = el}
                className="shelf-track"
              >
                {posters.map((poster) => (
                  <div
                    key={poster.id}
                    className="shelf-item glass-card"
                    style={{
                      padding: '0',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      position: 'relative',
                      background: '#090d16',
                      border: '1px solid rgba(0, 242, 254, 0.18)',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    onClick={() => onSelectPoster(poster)}
                  >
                    {/* Poster Exhibition Frame: Keeps 100% full uncropped proportions */}
                    <div style={{
                      width: '100%',
                      height: '270px',
                      position: 'relative',
                      background: 'radial-gradient(circle at center, #0a0f1a 0%, #04060a 100%)',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <OptimizedImage
                        src={poster.thumb || poster.image}
                        alt={poster.title}
                        objectFit="contain"
                        style={{ background: 'transparent' }}
                      />

                      {/* Top Badges */}
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        right: '10px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        zIndex: 2
                      }}>
                        <div style={{
                          background: 'rgba(6, 8, 14, 0.85)',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          backdropFilter: 'blur(6px)'
                        }}>
                          <Star size={12} color="#00f2fe" fill="#00f2fe" />
                          <span>{poster.rating}</span>
                        </div>

                        <div style={{
                          background: 'var(--grad-cyan)',
                          color: '#06080e',
                          fontWeight: 800,
                          fontSize: '0.68rem',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-full)'
                        }}>
                          MDF 5.5mm
                        </div>
                      </div>

                      {/* Hover Overlay Button */}
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(6, 8, 14, 0.65)',
                        opacity: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'opacity 0.25s ease',
                        backdropFilter: 'blur(3px)',
                        zIndex: 3
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                      >
                        <span className="btn-cyan" style={{ padding: '10px 18px', fontSize: '0.85rem' }}>
                          <Eye size={16} />
                          <span>Ver Tamaños</span>
                        </span>
                      </div>
                    </div>

                    {/* Poster Card Details */}
                    <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <h4 style={{
                          fontSize: '1rem',
                          fontWeight: 800,
                          color: '#fff',
                          marginBottom: '4px',
                          lineHeight: '1.3'
                        }}>
                          {poster.title}
                        </h4>
                        <p style={{
                          fontSize: '0.78rem',
                          color: 'var(--text-secondary)',
                          marginBottom: '14px'
                        }}>
                          {poster.subtitle}
                        </p>
                      </div>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '10px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.06)'
                      }}>
                        <div>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Desde</span>
                          <span style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--accent-cyan)' }}>
                            Q 25.00
                          </span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPoster(poster);
                          }}
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--border-subtle)',
                            color: '#fff',
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'var(--grad-cyan)';
                            e.currentTarget.style.color = '#06080e';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            e.currentTarget.style.color = '#fff';
                          }}
                        >
                          Configurar
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>

            </div>
          );
        })}

      </div>
    </section>
  );
}
