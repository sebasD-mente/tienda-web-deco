import React, { useState, useMemo } from 'react';
import { ArrowLeft, Search, Sparkles, Layers, ShieldCheck, ChevronRight, X } from 'lucide-react';
import { getPosterSizeBadge, getPosterPriceDisplay } from '../utils/posterHelpers';
import OptimizedImage from '../components/OptimizedImage';

export default function CategoryGalleryPage({
  categoryId,
  categories = [],
  posters = [],
  onSelectPoster,
  onNavigate,
  onSelectCategory
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // Find the active category object
  const currentCategory = useMemo(() => {
    return categories.find(c => c.id === categoryId) || {
      id: categoryId || 'SUPERHEROES',
      name: categoryId || 'Colección Especial',
      description: 'Explora todas las obras exclusivas impresas en madera MDF rígida de 5.5mm con tecnología HP Látex.'
    };
  }, [categories, categoryId]);

  // Filter posters belonging to this category
  const categoryPosters = useMemo(() => {
    return posters.filter(p => p.category === currentCategory.id);
  }, [posters, currentCategory.id]);

  // Apply in-page search
  const filteredPosters = useMemo(() => {
    return categoryPosters.filter(poster => {
      const matchesSearch = !searchQuery || 
        poster.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (poster.subtitle && poster.subtitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (poster.franchise && poster.franchise.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (poster.tags && poster.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

      return matchesSearch;
    });
  }, [categoryPosters, searchQuery]);

  // Other categories for quick jump
  const otherCategories = useMemo(() => {
    return categories.filter(c => c.id !== 'TODAS' && c.id !== currentCategory.id);
  }, [categories, currentCategory.id]);

  return (
    <div style={{
      paddingTop: '115px',
      paddingBottom: '80px',
      minHeight: '100vh',
      background: '#060910',
      color: '#ffffff'
    }}>
      <div className="container">

        {/* 1. Header Banner of the Category */}
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

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', position: 'relative', zIndex: 2 }}>
            <div style={{ maxWidth: '750px' }}>
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
                <span>Colección Oficial • {categoryPosters.length} Diseños Disponibles</span>
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
                {currentCategory.name}
              </h1>

              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.95rem',
                lineHeight: 1.6,
                margin: 0
              }}>
                {currentCategory.description || 'Pósters de colección fabricados en madera MDF rígida de 5.5mm con tintas ecológicas HP Látex de máxima resolución.'}
              </p>
            </div>

            {/* Back Button */}
            <button
              onClick={() => onNavigate('catalog')}
              className="btn-glass"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                fontSize: '0.85rem',
                cursor: 'pointer',
                borderRadius: '10px'
              }}
            >
              <ArrowLeft size={16} />
              <span>Ver todas las colecciones</span>
            </button>
          </div>

          {/* Quick specs pill row */}
          <div style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            fontSize: '0.8rem',
            color: 'var(--text-muted)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={15} color="var(--accent-cyan)" />
              <span>Madera MDF 5.5mm Rígida</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={15} color="var(--accent-cyan)" />
              <span>Tintas HP Látex Resistentes</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 800 }}>⚡</span>
              <span>Incluye Cinta Tesa de Montaje</span>
            </div>
          </div>
        </div>

        {/* 3. Search Toolbar */}
        <div style={{
          marginBottom: '28px',
          padding: '14px 20px',
          background: 'rgba(11, 17, 28, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.07)',
          borderRadius: '14px'
        }}>
          {/* Search within category */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(5, 7, 12, 0.9)',
            border: '1px solid rgba(0, 242, 254, 0.25)',
            borderRadius: '10px',
            padding: '8px 12px',
            width: '100%',
            maxWidth: '560px',
            boxSizing: 'border-box'
          }}>
            <Search size={18} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
            <input
              type="text"
              placeholder={`Buscar póster en ${currentCategory.name}...`}
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

        {/* 4. Posters Gallery Grid */}
        {filteredPosters.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '22px',
            marginBottom: '60px'
          }}>
            {filteredPosters.map((poster, index) => (
              <div
                key={poster.id}
                className="glass-card"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  background: '#070b12',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '16px',
                  transition: 'all 0.25s ease'
                }}
                onClick={() => onSelectPoster(poster)}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.5)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 25px rgba(0, 242, 254, 0.2)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Poster Frame */}
                <div style={{
                  width: '100%',
                  height: '270px',
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

                {/* Details */}
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
                      {poster.subtitle || currentCategory.name}
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

                  {/* Price & CTA */}
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
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'rgba(11, 17, 28, 0.4)',
            borderRadius: '16px',
            border: '1px dashed rgba(255, 255, 255, 0.1)',
            marginBottom: '60px'
          }}>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              {categoryPosters.length === 0
                ? 'Esta colección no contiene obras disponibles actualmente.'
                : 'No se encontraron pósters para tu búsqueda dentro de esta colección.'}
            </p>
            {categoryPosters.length > 0 ? (
              <button
                onClick={() => setSearchQuery('')}
                className="btn-cyan"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                Restablecer Filtros
              </button>
            ) : (
              <button
                onClick={() => onNavigate && onNavigate('catalog')}
                className="btn-cyan"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                Ver Catálogo Completo
              </button>
            )}
          </div>
        )}

        {/* 5. Explore other categories section */}
        {otherCategories.length > 0 && (
          <div style={{
            padding: '36px 0',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <h3 style={{
              fontFamily: 'var(--font-bebas)',
              fontSize: '2rem',
              letterSpacing: '0.04em',
              marginBottom: '16px',
              color: '#ffffff'
            }}>
              EXPLORA OTRAS COLECCIONES
            </h3>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {otherCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    if (onSelectCategory) {
                      onSelectCategory(cat.id);
                    }
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    padding: '10px 18px',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(0, 242, 254, 0.15)';
                    e.currentTarget.style.borderColor = 'var(--accent-cyan)';
                    e.currentTarget.style.color = 'var(--accent-cyan)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                >
                  <span>{cat.name}</span>
                  <ChevronRight size={14} />
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
