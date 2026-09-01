import React, { useState, useMemo } from 'react';
import { ArrowLeft, Search, Sparkles, Layers, Shield, ChevronRight, X } from 'lucide-react';
import OptimizedImage from '../components/OptimizedImage';

export default function FranchiseGalleryPage({
  franchiseId,
  franchises = [],
  categories = [],
  posters = [],
  onSelectPoster,
  onNavigate,
  onSelectFranchise,
  onSelectCategory
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // Find the active franchise object
  const currentFranchise = useMemo(() => {
    return franchises.find(f => f.id === franchiseId) || {
      id: franchiseId || 'general',
      name: franchiseId || 'Colección Especial',
      img: '/franchises/avengers.webp',
      category: 'SUPERHEROES'
    };
  }, [franchises, franchiseId]);

  // Filter posters belonging strictly to this franchise (exact match by franchise id, slug or dbId)
  const franchisePosters = useMemo(() => {
    const fId = (currentFranchise.id || '').toLowerCase();
    const fSlug = (currentFranchise.slug || '').toLowerCase();
    const fDbId = (currentFranchise.dbId || '').toLowerCase();
    return posters.filter(p => {
      if (!p.franchise && !p.franchiseId) return false;
      const pF = String(p.franchise || '').toLowerCase();
      const pFId = String(p.franchiseId || '').toLowerCase();
      return (
        (fId && pF === fId) ||
        (fSlug && pF === fSlug) ||
        (fDbId && (pFId === fDbId || pF === fDbId)) ||
        (fId && pFId === fId)
      );
    });
  }, [posters, currentFranchise]);

  // Apply in-page search
  const filteredPosters = useMemo(() => {
    return franchisePosters.filter(poster => {
      const matchesSearch = !searchQuery || 
        poster.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (poster.subtitle && poster.subtitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (poster.tags && poster.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

      return matchesSearch;
    });
  }, [franchisePosters, searchQuery]);

  // Other franchises for quick jump
  const otherFranchises = useMemo(() => {
    return franchises.filter(f => f.id !== currentFranchise.id);
  }, [franchises, currentFranchise.id]);

  return (
    <div style={{
      paddingTop: '115px',
      paddingBottom: '80px',
      minHeight: '100vh',
      background: '#060910',
      color: '#ffffff'
    }}>
      <div className="container">

        {/* 1. Header Banner of the Franchise */}
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
          {/* Subtle Cyber Glow background */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-10%',
            width: '350px',
            height: '350px',
            background: 'radial-gradient(circle, rgba(0, 242, 254, 0.12) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px', position: 'relative', zIndex: 2 }}>
            <div style={{ maxWidth: '720px' }}>
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
                <Shield size={13} />
                <span>Colección Oficial • {franchisePosters.length} {franchisePosters.length === 1 ? 'Diseño Disponible' : 'Diseños Disponibles'}</span>
              </div>

              <h1 style={{
                fontFamily: 'var(--font-bebas)',
                fontSize: 'clamp(2.4rem, 6vw, 3.8rem)',
                letterSpacing: '0.04em',
                lineHeight: 1.05,
                margin: '0 0 12px 0',
                color: '#ffffff',
                textTransform: 'uppercase'
              }}>
                COLECCIÓN {currentFranchise.name}
              </h1>

              <p style={{
                color: 'var(--text-secondary)',
                fontSize: 'clamp(0.9rem, 2vw, 1.02rem)',
                lineHeight: '1.6',
                margin: 0
              }}>
                Explora todas las obras exclusivas inspiradas en el universo de {currentFranchise.name}. Impresas sobre madera MDF rígida de 5.5 mm con acabado mate antirreflejo y montaje fácil.
              </p>
            </div>

            {/* Franchise Large Floating Logo */}
            {currentFranchise.img && (
              <div style={{
                width: 'clamp(90px, 12vw, 130px)',
                height: 'clamp(90px, 12vw, 130px)',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                filter: 'drop-shadow(0 10px 25px rgba(0, 242, 254, 0.35))'
              }}>
                <img
                  src={currentFranchise.img}
                  alt={currentFranchise.name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* 3. Search & Filter Bar */}
        {/* 3. Search Toolbar */}
        <div style={{
          marginBottom: '32px',
          background: 'rgba(255, 255, 255, 0.02)',
          padding: '14px 20px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          {/* Search within franchise/collection */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            padding: '8px 12px',
            width: '100%',
            maxWidth: '560px',
            boxSizing: 'border-box'
          }}>
            <Search size={18} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
            <input
              type="text"
              placeholder={`Buscar en ${currentFranchise.name}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                minWidth: 0,
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '0.92rem',
                outline: 'none',
                padding: '2px 0'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  cursor: 'pointer',
                  flexShrink: 0,
                  padding: 0,
                  transition: 'all 0.2s ease'
                }}
                title="Limpiar búsqueda"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* 4. Posters Grid View */}
        {filteredPosters.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '24px',
            marginBottom: '60px'
          }}>
            {filteredPosters.map((poster) => (
              <div
                key={poster.id}
                onClick={() => onSelectPoster && onSelectPoster(poster)}
                className="poster-card"
                style={{
                  background: '#070b12',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: '0 10px 24px rgba(0, 0, 0, 0.5)'
                }}
              >
                {/* Poster Frame */}
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: '320px',
                  background: '#040609',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  <OptimizedImage
                    src={poster.image}
                    thumbSrc={poster.thumb}
                    alt={poster.title}
                    className="poster-card-img"
                    style={{
                      maxHeight: '100%',
                      maxWidth: '100%',
                      objectFit: 'contain',
                      transition: 'transform 0.35s ease',
                      filter: 'drop-shadow(0 6px 14px rgba(0, 0, 0, 0.8))'
                    }}
                  />

                  {/* Size Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(4, 6, 9, 0.85)',
                    border: '1px solid rgba(0, 242, 254, 0.35)',
                    color: 'var(--accent-cyan)',
                    padding: '3px 9px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    backdropFilter: 'blur(8px)',
                    letterSpacing: '0.04em'
                  }}>
                    {poster.sizeBadge || `${poster.availableSizes?.length || 6} Tamaños`}
                  </div>
                </div>

                {/* Details Footer */}
                <div style={{
                  padding: '16px 18px',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  background: '#070b12',
                  borderTop: '1px solid rgba(255, 255, 255, 0.04)'
                }}>
                  <div>
                    {poster.subtitle && (
                      <p style={{
                        fontSize: '0.72rem',
                        color: 'var(--accent-cyan)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        fontWeight: 800,
                        margin: '0 0 4px 0'
                      }}>
                        {poster.subtitle}
                      </p>
                    )}

                    <h3 style={{
                      fontSize: '1rem',
                      fontWeight: 800,
                      color: '#ffffff',
                      margin: '0 0 12px 0',
                      lineHeight: '1.3'
                    }}>
                      {poster.title}
                    </h3>
                  </div>

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
                      Personalizar ➔
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Exact clean empty state specified by the user */
          <div style={{
            textAlign: 'center',
            padding: '70px 24px',
            background: 'rgba(11, 17, 28, 0.4)',
            borderRadius: '20px',
            border: '1px dashed rgba(0, 242, 254, 0.25)',
            marginBottom: '60px',
            maxWidth: '650px',
            margin: '0 auto 60px auto'
          }}>
            {currentFranchise.img && (
              <img
                src={currentFranchise.img}
                alt={currentFranchise.name}
                style={{
                  width: '70px',
                  height: '70px',
                  objectFit: 'contain',
                  margin: '0 auto 16px auto',
                  opacity: 0.6,
                  filter: 'grayscale(0.3)'
                }}
              />
            )}
            
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: '#ffffff',
              marginBottom: '8px'
            }}>
              Aún no se agregaron obras a esta colección.
            </h3>
            
            <p style={{
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
              marginBottom: '24px',
              maxWidth: '450px',
              margin: '0 auto 24px auto',
              lineHeight: '1.5'
            }}>
              Puedes agregar nuevos diseños vinculados a esta colección en cualquier momento desde el panel de administración.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => onNavigate('catalog')}
                className="btn-cyan"
                style={{ padding: '10px 20px', fontSize: '0.85rem' }}
              >
                Ver Catálogo Completo
              </button>

              <button
                onClick={() => onNavigate('home')}
                className="btn-secondary"
                style={{ padding: '10px 20px', fontSize: '0.85rem' }}
              >
                Volver al Inicio
              </button>
            </div>
          </div>
        )}

        {/* 5. Explore other franchises section */}
        {otherFranchises.length > 0 && (
          <div style={{
            padding: '36px 0',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <h3 style={{
              fontFamily: 'var(--font-bebas)',
              fontSize: '2rem',
              letterSpacing: '0.04em',
              marginBottom: '20px',
              color: '#ffffff'
            }}>
              EXPLORA OTRAS COLECCIONES
            </h3>

            <div style={{
              display: 'flex',
              gap: '16px',
              overflowX: 'auto',
              paddingBottom: '16px',
              scrollbarWidth: 'none'
            }}>
              {otherFranchises.map(f => {
                const count = posters.filter(p => p.franchise === f.id).length;
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      if (onSelectFranchise) onSelectFranchise(f.id);
                      window.scrollTo(0, 0);
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '12px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'all 0.2s ease',
                      textAlign: 'left'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = '#00f2fe';
                      e.currentTarget.style.background = 'rgba(0, 242, 254, 0.06)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <img
                      src={f.img}
                      alt={f.name}
                      style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                    />
                    <div>
                      <div style={{ color: '#ffffff', fontWeight: 800, fontSize: '0.88rem' }}>
                        {f.name}
                      </div>
                      <div style={{ color: 'var(--accent-cyan)', fontSize: '0.74rem' }}>
                        {count} {count === 1 ? 'diseño' : 'diseños'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Ver Catálogo Completo button */}
            <div style={{ textAlign: 'center', marginTop: '32px' }}>
              <button
                onClick={() => onNavigate('catalog')}
                className="btn-cyan"
                style={{
                  padding: '13px 36px',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 0 20px rgba(0, 242, 254, 0.3)'
                }}
              >
                <span>Ver Catálogo Completo</span>
                <span>➔</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
