import React, { useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { CATEGORIES as DEFAULT_CATEGORIES, CATALOG_POSTERS as DEFAULT_POSTERS } from '../data/catalogData';
import OptimizedImage from './OptimizedImage';

// Fisher-Yates shuffle algorithm for fair distribution
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function CategoryShelf({
  onSelectPoster,
  onSelectCategory,
  onNavigate,
  searchQuery,
  posters = DEFAULT_POSTERS,
  categories = DEFAULT_CATEGORIES
}) {
  const scrollRefs = useRef({});

  // 1. Pick 4 distinct categories that actually have posters (Total 5 with Best Sellers)
  const spotlightCategories = useMemo(() => {
    const populated = categories.filter(
      c => c.id !== 'TODAS' && c.id !== 'TODOS' && posters.some(p => p.category === c.id)
    );
    const shuffled = shuffleArray(populated);
    return shuffled.slice(0, 4);
  }, [categories, posters]);

  // 2. Randomize posters for each category (max 8 preview images to optimize performance)
  const shuffledPostersByCategory = useMemo(() => {
    const map = {};
    categories.forEach(cat => {
      const catItems = posters.filter(p => p.category === cat.id);
      map[cat.id] = shuffleArray(catItems).slice(0, 8);
    });
    return map;
  }, [posters, categories]);

  const handleScroll = (catId, direction) => {
    const container = scrollRefs.current[catId];
    if (container) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const filterPosters = (catId) => {
    const pool = shuffledPostersByCategory[catId] || [];
    if (!searchQuery) return pool;
    return pool.filter(p => 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.subtitle && p.subtitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())))
    );
  };

  return (
    <section id="catalogo" style={{ padding: '0 0 70px 0', position: 'relative', background: '#060910' }}>
      <div className="container">

        {/* 3 Random Spotlight Categories Shelves */}
        {spotlightCategories.map((category) => {
          const catPosters = filterPosters(category.id);
          if (catPosters.length === 0) return null;

          return (
            <div key={category.id} style={{ marginBottom: '55px' }}>
              
              {/* Shelf Category Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '18px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                paddingBottom: '14px',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <h2 style={{
                    fontFamily: 'var(--font-bebas)',
                    fontSize: '2.5rem',
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
                      fontWeight: 400,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: '#00f2fe',
                      textAlign: 'center',
                      width: '100%',
                      display: 'block'
                    }}>
                      {catPosters.length} DISEÑOS
                    </span>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 500,
                      color: '#00f2fe',
                      letterSpacing: '0.02em',
                      textAlign: 'center',
                      width: '100%',
                      display: 'block'
                    }}>
                      Ver todos
                    </span>
                  </button>
                </div>

                {/* Carousel Controls (Only navigation arrows) */}
                <div className="carousel-nav-arrows" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                {catPosters.map((poster, index) => (
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

                      {/* Available Size Pill Badge */}
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
                        <h4 style={{
                          fontSize: '0.98rem',
                          fontWeight: 800,
                          color: '#ffffff',
                          marginBottom: '12px',
                          lineHeight: '1.3'
                        }}>
                          {poster.title}
                        </h4>
                      </div>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '10px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.05)'
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
                  {posters.filter(p => p.category === category.id).length > 8 && (
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
                      title={`Ver todos los diseños de ${category.name}`}
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
                        +{posters.filter(p => p.category === category.id).length - 8} obras más en {category.name} ➔
                      </p>
                    </div>
                  )}
                </div>

              </div>
            );
          })}

        {/* High-Impact Bottom Call to Action: Go to Full Catalog */}
        <div style={{
          marginTop: '20px',
          background: 'linear-gradient(135deg, rgba(9, 21, 38, 0.8) 0%, rgba(6, 12, 22, 0.95) 100%)',
          border: '1px solid rgba(0, 242, 254, 0.3)',
          borderRadius: '20px',
          padding: 'clamp(28px, 6vw, 45px)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.6)'
        }}>
          <h3 style={{
            fontFamily: 'var(--font-bebas)',
            fontSize: 'clamp(2rem, 5vw, 3.2rem)',
            letterSpacing: '0.04em',
            margin: '0 0 10px 0',
            color: '#ffffff',
            textTransform: 'uppercase'
          }}>
            ¿BUSCAS MÁS COLECCIONES Y DISEÑOS?
          </h3>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '0.95rem',
            maxWidth: '650px',
            margin: '0 auto 22px auto',
            lineHeight: 1.6
          }}>
            Descubre nuestro catálogo maestro con más de 32 obras exclusivas divididas en todas las categorías: Anime, Super Héroes, Autos Clásicos, Cine, Series y Música.
          </p>
          <button
            onClick={() => {
              if (onNavigate) onNavigate('catalog');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="btn-cyan"
            style={{
              padding: '14px 32px',
              fontSize: '1rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              borderRadius: '12px',
              cursor: 'pointer'
            }}
          >
            <span>EXPLORAR EL CATÁLOGO COMPLETO</span>
            <ArrowRight size={18} />
          </button>
        </div>

      </div>
    </section>
  );
}
