import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
    <section id="catalogo" style={{ padding: '0 0 80px 0', position: 'relative', background: '#060910' }}>
      <div className="container">
        
        {/* Categories Shelves Loop */}
        {displayedCategories.map((category) => {
          const posters = filterPosters(category.id);
          if (posters.length === 0) return null;

          return (
            <div key={category.id} style={{ marginBottom: '65px' }}>
              
              {/* Shelf Category Header (Same Typography as BEST SELLERS + Design Count) */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginBottom: '20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                paddingBottom: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', flexWrap: 'wrap' }}>
                  <h2 style={{
                    fontFamily: 'var(--font-bebas)',
                    fontSize: '2.8rem',
                    letterSpacing: '0.05em',
                    color: '#ffffff',
                    textTransform: 'uppercase',
                    lineHeight: 1,
                    margin: 0
                  }}>
                    {category.name}
                  </h2>
                  <span style={{
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase'
                  }}>
                    ({posters.length} DISEÑOS)
                  </span>
                </div>

                {/* Left/Right Carousel Nav Arrows */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleScroll(category.id, 'left')}
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
                    onClick={() => handleScroll(category.id, 'right')}
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

              {/* Horizontal Scrollable Shelf Track */}
              <div
                ref={el => scrollRefs.current[category.id] = el}
                className="shelf-track"
                style={{ paddingBottom: '16px' }}
              >
                {posters.map((poster, index) => (
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
                    {/* Poster Frame (100% Complete Proportion Contain without Cropping) */}
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
                        priority={index < 3}
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
                          {poster.category}
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
                        <span style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--accent-cyan)' }}>
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
              </div>

            </div>
          );
        })}

      </div>
    </section>
  );
}
