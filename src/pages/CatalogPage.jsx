import React, { useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Layers, ArrowRight, Grid } from 'lucide-react';
import OptimizedImage from '../components/OptimizedImage';

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function CatalogPage({
  categories = [],
  posters = [],
  onSelectPoster,
  onSelectCategory,
  onNavigate
}) {
  const scrollRefs = useRef({});

  const handleScroll = (catId, direction) => {
    const el = scrollRefs.current[catId];
    if (el) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Filter out the 'TODAS' / 'TODOS' meta-category for individual shelves
  const activeCategories = categories.filter(c => c.id !== 'TODAS' && c.id !== 'TODOS');

  // Randomize and limit each category shelf to a max of 8 posters for optimal preview performance
  const categoryPostersMap = useMemo(() => {
    const map = {};
    activeCategories.forEach(category => {
      const allInCat = posters.filter(p => p.category === category.id);
      map[category.id] = {
        totalCount: allInCat.length,
        previewItems: shuffleArray(allInCat).slice(0, 8)
      };
    });
    return map;
  }, [activeCategories, posters]);

  return (
    <div style={{
      paddingTop: '125px',
      paddingBottom: '80px',
      minHeight: '100vh',
      background: '#060910',
      color: '#ffffff'
    }}>
      <div className="container">

        {/* 1. Header Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(6, 18, 30, 0.9) 0%, rgba(9, 13, 22, 0.95) 100%)',
          border: '1px solid rgba(0, 242, 254, 0.25)',
          borderRadius: '20px',
          padding: 'clamp(24px, 5vw, 40px)',
          marginBottom: '36px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)'
        }}>
          {/* Cyber Glow background */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-10%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(0, 242, 254, 0.12) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          <div style={{ position: 'relative', zIndex: 2, maxWidth: '850px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(0, 242, 254, 0.1)',
              border: '1px solid rgba(0, 242, 254, 0.3)',
              color: 'var(--accent-cyan)',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: '12px'
            }}>
              <Sparkles size={13} />
              <span>Catálogo Maestro Oficial • {activeCategories.filter(c => posters.some(p => p.category === c.id)).length} Colecciones • {posters.length} Obras</span>
            </div>

            <h1 style={{
              fontFamily: 'var(--font-bebas)',
              fontSize: 'clamp(2.5rem, 6vw, 4rem)',
              letterSpacing: '0.04em',
              lineHeight: 1.05,
              margin: '0 0 14px 0',
              color: '#ffffff',
              textTransform: 'uppercase'
            }}>
              CATÁLOGO COMPLETO DE COLECCIONES
            </h1>

            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '0.95rem',
              lineHeight: 1.6,
              margin: 0
            }}>
              Explora todas nuestras colecciones temáticas. Desliza las vitrinas para una vista previa o haz clic en <strong>"Ver Colección Completa"</strong> para acceder a la galería individual de cada categoría con todos sus diseños en alta resolución.
            </p>
          </div>

          {/* Quick jump category pills */}
          <div style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            {activeCategories.map(cat => {
              const count = posters.filter(p => p.category === cat.id).length;
              if (count === 0) return null;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 'var(--radius-full)',
                    padding: '6px 14px',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(0, 242, 254, 0.2)';
                    e.currentTarget.style.borderColor = 'var(--accent-cyan)';
                    e.currentTarget.style.color = 'var(--accent-cyan)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                >
                  <span>{cat.name}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontWeight: 800 }}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Horizontal Shelf Showcase for Each Category */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '50px' }}>
          {activeCategories.map((category) => {
            const catData = categoryPostersMap[category.id] || { totalCount: 0, previewItems: [] };
            if (catData.totalCount === 0) return null;

            return (
              <div key={category.id} style={{ position: 'relative' }}>
                
                {/* Category Header with Title, Count and "Ver Colección Completa" button */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '18px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  paddingBottom: '12px',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <h2 style={{
                      fontFamily: 'var(--font-bebas)',
                      fontSize: '2.4rem',
                      letterSpacing: '0.04em',
                      color: '#ffffff',
                      textTransform: 'uppercase',
                      lineHeight: 1,
                      margin: 0
                    }}>
                      {category.name}
                    </h2>

                    {/* Subtle Badge Button: Number of designs & Ver todos */}
                    <button
                      onClick={() => onSelectCategory && onSelectCategory(category.id)}
                      style={{
                        background: 'rgba(4, 6, 9, 0.85)',
                        border: '1px solid rgba(0, 242, 254, 0.35)',
                        color: '#00f2fe',
                        padding: '4px 14px',
                        borderRadius: '9999px',
                        cursor: 'pointer',
                        backdropFilter: 'blur(8px)',
                        display: 'inline-flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        fontFamily: 'var(--font-body)',
                        lineHeight: 1.25,
                        transition: 'all 0.25s ease',
                        boxShadow: '0 0 10px rgba(0, 242, 254, 0.12)',
                        textDecoration: 'none'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(0, 242, 254, 0.15)';
                        e.currentTarget.style.borderColor = '#00f2fe';
                        e.currentTarget.style.boxShadow = '0 0 16px rgba(0, 242, 254, 0.35)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(4, 6, 9, 0.85)';
                        e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.35)';
                        e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 242, 254, 0.12)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                      title={`Ver todos los diseños de ${category.name}`}
                    >
                      <span style={{
                        fontSize: '0.62rem',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        opacity: 0.9
                      }}>
                        {catData.totalCount} {catData.totalCount === 1 ? 'Diseño' : 'Diseños'}
                      </span>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        letterSpacing: '0.02em'
                      }}>
                        Ver todos
                      </span>
                    </button>
                  </div>

                  {/* Actions: Navigation Arrows */}
                  <div className="carousel-nav-arrows" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Scroll buttons */}
                    <button
                      onClick={() => handleScroll(category.id, 'left')}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(0, 242, 254, 0.2)';
                        e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.6)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      }}
                      title="Anterior"
                    >
                      <ChevronLeft size={18} />
                    </button>

                    <button
                      onClick={() => handleScroll(category.id, 'right')}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(0, 242, 254, 0.2)';
                        e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.6)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      }}
                      title="Siguiente"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                {/* Horizontal Scrollable Shelf Track */}
                <div
                  ref={el => scrollRefs.current[category.id] = el}
                  className="shelf-track"
                  style={{ paddingBottom: '14px' }}
                >
                  {catData.previewItems.map((poster, index) => (
                    <div
                      key={poster.id}
                      className="shelf-item glass-card"
                      style={{
                        padding: 0,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        background: '#070b12',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: '16px'
                      }}
                      onClick={() => onSelectPoster(poster)}
                    >
                      {/* Poster Frame */}
                      <div style={{
                        width: '100%',
                        height: '240px',
                        position: 'relative',
                        background: '#040609',
                        padding: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                      }}>
                        <OptimizedImage
                          src={poster.thumb || poster.image}
                          alt={poster.title}
                          objectFit="contain"
                          priority={index < 2}
                          style={{ background: 'transparent' }}
                        />

                        {/* Size Pill */}
                        <div style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          background: 'rgba(4, 6, 9, 0.85)',
                          border: '1px solid rgba(0, 242, 254, 0.4)',
                          color: 'var(--accent-cyan)',
                          fontWeight: 800,
                          fontSize: '0.7rem',
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-full)',
                          backdropFilter: 'blur(8px)',
                          zIndex: 2
                        }}>
                          {poster.sizeBadge || (poster.availableSizes?.length === 1 ? '45 x 60 cm' : '6 Tamaños')}
                        </div>
                      </div>

                      {/* Card Bottom Details */}
                      <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{
                            fontSize: '0.72rem',
                            color: 'var(--accent-cyan)',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            marginBottom: '4px'
                          }}>
                            {poster.subtitle || category.name}
                          </div>
                          <h3 style={{
                            fontSize: '1.05rem',
                            fontWeight: 800,
                            color: '#ffffff',
                            marginBottom: '10px',
                            lineHeight: 1.25
                          }}>
                            {poster.title}
                          </h3>
                        </div>

                        {/* Price & Action */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: '10px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.06)'
                        }}>
                          <span style={{ fontSize: '0.98rem', fontWeight: 900, color: 'var(--accent-cyan)' }}>
                            {poster.priceDisplay || (poster.availableSizes?.length === 1 ? 'Q 125.00' : 'Desde Q 25.00')}
                          </span>
                          
                          <span style={{
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            Ver Detalle ➔
                          </span>
                        </div>
                      </div>

                    </div>
                  ))}

                  {/* End Card: Invites to visit the full collection */}
                  {catData.totalCount > 8 && (
                    <div
                      onClick={() => onSelectCategory && onSelectCategory(category.id)}
                      className="shelf-item glass-card"
                      style={{
                        padding: '24px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.08) 0%, rgba(6, 12, 22, 0.95) 100%)',
                        border: '2px dashed rgba(0, 242, 254, 0.35)',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        minWidth: '220px',
                        transition: 'all 0.25s ease'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#00f2fe';
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 242, 254, 0.16) 0%, rgba(6, 12, 22, 0.98) 100%)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.35)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 242, 254, 0.08) 0%, rgba(6, 12, 22, 0.95) 100%)';
                      }}
                      title={`Ver todos los ${catData.totalCount} diseños de ${category.name}`}
                    >
                      <div style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '50%',
                        background: 'rgba(0, 242, 254, 0.15)',
                        border: '1px solid rgba(0, 242, 254, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '14px'
                      }}>
                        <ArrowRight size={22} color="#00f2fe" />
                      </div>
                      <h4 style={{
                        color: '#fff',
                        fontSize: '1.25rem',
                        fontFamily: 'var(--font-bebas)',
                        letterSpacing: '0.04em',
                        margin: '0 0 6px 0',
                        lineHeight: 1.1
                      }}>
                        VER TODA LA COLECCIÓN
                      </h4>
                      <p style={{
                        color: 'var(--accent-cyan)',
                        fontSize: '0.8rem',
                        margin: 0,
                        fontWeight: 800
                      }}>
                        +{catData.totalCount - 8} obras más en {category.name} ➔
                      </p>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
