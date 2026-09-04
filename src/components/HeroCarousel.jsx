import React, { useMemo, useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CATALOG_POSTERS } from '../data/catalogData';
import { getStoredFranchises } from '../utils/catalogStorage';
import { getPosterSizeBadge, getPosterPriceDisplay } from '../utils/posterHelpers';
import OptimizedImage from './OptimizedImage';

// Fisher-Yates shuffle algorithm
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function HeroCarousel({
  onSelectPoster,
  onSelectCategory,
  onSelectFranchise,
  onNavigate,
  posters = [],
  franchises: propFranchises
}) {
  const bestSellersScrollRef = useRef(null);
  const franchiseScrollRef = useRef(null);
  const [internalFranchises, setInternalFranchises] = useState(() => getStoredFranchises());
  const franchises = (propFranchises && propFranchises.length > 0) ? propFranchises : internalFranchises;

  useEffect(() => {
    const handleUpdate = () => {
      setInternalFranchises(getStoredFranchises());
    };
    window.addEventListener('deco-catalog-updated', handleUpdate);
    return () => window.removeEventListener('deco-catalog-updated', handleUpdate);
  }, []);

  // Only display posters explicitly marked as isFeatured (Best Sellers) - max 8
  const featuredPosters = useMemo(() => {
    const featured = posters.filter(p => Boolean(p.isFeatured));
    return shuffleArray(featured).slice(0, 8);
  }, [posters]);

  const handleScrollFranchises = (direction) => {
    if (franchiseScrollRef.current) {
      const amount = direction === 'left' ? -220 : 220;
      franchiseScrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const handleScrollBestSellers = (direction) => {
    if (bestSellersScrollRef.current) {
      const amount = direction === 'left' ? -320 : 320;
      bestSellersScrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
    <section style={{
      paddingTop: '96px',
      position: 'relative',
      background: '#060910'
    }}>
      
      {/* 1. Hero Comic Banner Section (Exact User Fondo Hero Illustration) */}
      <div style={{
        position: 'relative',
        backgroundImage: 'url("/assets/fondo-hero.webp")',
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        padding: 'clamp(42px, 7vw, 75px) 0 clamp(32px, 5.5vw, 55px) 0',
        textAlign: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
      }}>
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          
          {/* Main Headline (Scaled cleanly on Mobile) */}
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.6rem, 5.8vw, 4.2rem)',
            fontWeight: 900,
            lineHeight: 1.12,
            marginBottom: '14px',
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            maxWidth: '960px',
            margin: '0 auto 14px auto',
            color: '#ffffff'
          }}>
            DESCUBRE POSTERS <br />
            ICÓNICOS DE <br />
            <span style={{ color: '#38bdf8' }}>
              AUTOS, ANIME, CINE Y MUCHO MAS
            </span>
          </h1>

          {/* User Button: Botón Categorías Disponibles */}
          <div style={{ margin: '24px 0 0 0', display: 'flex', justifyContent: 'center' }}>
            <a
              href="#catalogo"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigate) {
                  onNavigate('catalog');
                }
              }}
              style={{
                display: 'inline-block',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'transform 0.25s ease, filter 0.25s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
                e.currentTarget.style.filter = 'drop-shadow(0 8px 25px rgba(0, 242, 254, 0.5))';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.filter = 'none';
              }}
            >
              <img
                src="/assets/boton-categorias.png"
                alt="Explora las Categorías Disponibles"
                style={{
                  height: 'clamp(38px, 6vw, 48px)',
                  maxWidth: '85vw',
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
            </a>
          </div>

        </div>
      </div>

      {/* 2. Franchises and Catalog Content on Solid Dark Background */}
      <div style={{ padding: '36px 0 25px 0', background: '#060910' }}>
        <div className="container">
          
          {/* Franchise Buttons Row (Pure Original Style: Borderless, Floating Logos with Glow Effect) */}
          <div
            ref={franchiseScrollRef}
            className="franchise-track hide-scrollbar"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(14px, 2.5vw, 24px)',
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {franchises.map((franchise) => (
              <button
                key={franchise.id}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onSelectFranchise) {
                    onSelectFranchise(franchise);
                  } else if (onSelectCategory) {
                    onSelectCategory(franchise.category);
                  }
                }}
                style={{
                  width: 'clamp(72px, 8.5vw, 92px)',
                  height: 'clamp(72px, 8.5vw, 92px)',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  textDecoration: 'none',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-6px) scale(1.08)';
                  e.currentTarget.style.filter = 'drop-shadow(0 10px 20px rgba(0, 242, 254, 0.45))';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.filter = 'none';
                }}
                title={`Colección ${franchise.name}`}
              >
                <img
                  src={franchise.img}
                  alt={`Colección ${franchise.name}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    display: 'block'
                  }}
                />
              </button>
            ))}
          </div>

          {/* BEST SELLERS Horizontal Carousel (Only rendered if there are featured posters) */}
          {featuredPosters.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              
              {/* Header with Title and Nav Controls */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                paddingBottom: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                  <h2 style={{
                    fontFamily: 'var(--font-bebas)',
                    fontSize: '2.6rem',
                    letterSpacing: '0.05em',
                    color: '#ffffff',
                    textTransform: 'uppercase',
                    lineHeight: 1,
                    margin: 0
                  }}>
                    BEST SELLERS
                  </h2>
                </div>

                {/* Navigation Arrows for Best Sellers */}
                <div className="carousel-nav-arrows" style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleScrollBestSellers('left')}
                    style={{
                      width: '38px',
                      height: '38px',
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
                    <ChevronLeft size={20} />
                  </button>

                  <button
                    onClick={() => handleScrollBestSellers('right')}
                    style={{
                      width: '38px',
                      height: '38px',
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
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              {/* Horizontal Scroll Track for Best Sellers */}
              <div
                ref={bestSellersScrollRef}
                className="shelf-track"
                style={{ paddingBottom: '14px' }}
              >
                {featuredPosters.map((poster, index) => (
                  <div
                    key={poster.id}
                    className="shelf-item glass-card"
                    style={{
                      padding: '0',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: '1px solid rgba(0, 242, 254, 0.25)',
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
                        priority={index < 8}
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
                        {getPosterSizeBadge(poster)}
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
                          {poster.subtitle || 'Edición Especial'}
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
                          {getPosterPriceDisplay(poster)}
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
              </div>

            </div>
          )}

        </div>
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .franchise-track {
          justify-content: center;
          flex-wrap: nowrap;
          overflow: visible !important;
          padding: 24px 10px 40px 10px;
          margin-bottom: 20px;
        }
        @media (max-width: 768px) {
          .franchise-track {
            justify-content: flex-start;
            overflow-x: auto !important;
            overflow-y: visible !important;
            padding: 24px 16px 40px 16px;
            margin-bottom: 20px;
          }
        }
      `}</style>
    </section>
  );
}
