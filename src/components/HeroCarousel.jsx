import React, { useState } from 'react';
import { CATALOG_POSTERS } from '../data/catalogData';
import OptimizedImage from './OptimizedImage';

const FRANCHISES = [
  { id: 'avengers', name: 'Avengers', img: '/franchises/avengers.png', category: 'SUPERHEROES' },
  { id: 'dragon-ball', name: 'Dragon Ball', img: '/franchises/dragon-ball.png', category: 'ANIME' },
  { id: 'disney', name: 'Walt Disney', img: '/franchises/disney.png', category: 'CINE' },
  { id: 'nba', name: 'NBA', img: '/franchises/nba.png', category: 'AUTOS' },
  { id: 'back-to-future', name: 'Back to the Future', img: '/franchises/back-to-future.png', category: 'AUTOS' },
  { id: 'dc', name: 'DC Comics', img: '/franchises/dc.png', category: 'SUPERHEROES' },
  { id: 'star-wars', name: 'Star Wars', img: '/franchises/star-wars.png', category: 'CINE' }
];

export default function HeroCarousel({ onSelectPoster }) {
  const featuredPosters = CATALOG_POSTERS.filter(p => p.isFeatured).slice(0, 4);
  const [hoveredCard, setHoveredCard] = useState('toyota-supra');

  return (
    <section style={{
      paddingTop: '108px',
      position: 'relative',
      background: '#060910'
    }}>
      
      {/* 1. Hero Comic Banner Section (Exact User Fondo Hero Illustration) */}
      <div style={{
        position: 'relative',
        backgroundImage: 'url("/assets/fondo-hero.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        paddingTop: '80px',
        paddingBottom: '60px',
        textAlign: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
      }}>
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          
          {/* Main Headline (Exact from Illustrator) */}
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.5rem, 5.8vw, 4.8rem)',
            fontWeight: 900,
            lineHeight: 1.08,
            marginBottom: '16px',
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            maxWidth: '1050px',
            margin: '0 auto 16px auto',
            color: '#ffffff'
          }}>
            DESCUBRE POSTERS <br />
            ICÓNICOS DE <br />
            <span style={{ color: '#38bdf8' }}>
              AUTOS, ANIME, CINE Y MUCHO MAS
            </span>
          </h1>

          {/* User Button: Botón Categorías Disponibles */}
          <div style={{ margin: '32px 0 0 0', display: 'flex', justifyContent: 'center' }}>
            <a
              href="#catalogo"
              style={{
                display: 'inline-block',
                textDecoration: 'none',
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
                  height: '52px',
                  width: 'auto',
                  display: 'block'
                }}
              />
            </a>
          </div>

        </div>
      </div>

      {/* 2. Franchises and Catalog Content on Solid Dark Background */}
      <div style={{ padding: '45px 0 80px 0', background: '#060910' }}>
        <div className="container">
          
          {/* 7 Franchise Buttons Row (Exact User Exported PNGs) */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
            marginBottom: '65px'
          }}>
            {FRANCHISES.map((franchise) => (
              <a
                key={franchise.id}
                href="#catalogo"
                style={{
                  width: '92px',
                  height: '92px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-6px) scale(1.08)';
                  e.currentTarget.style.filter = 'drop-shadow(0 10px 20px rgba(0, 242, 254, 0.4))';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.filter = 'none';
                }}
              >
                <img
                  src={franchise.img}
                  alt={franchise.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    display: 'block'
                  }}
                />
              </a>
            ))}
          </div>

          {/* BEST SELLERS Header (Exact from Illustrator) */}
          <div style={{ textAlign: 'left', marginBottom: '22px' }}>
            <h2 style={{
              fontFamily: 'var(--font-bebas)',
              fontSize: '2.8rem',
              letterSpacing: '0.05em',
              color: '#ffffff',
              textTransform: 'uppercase',
              lineHeight: 1
            }}>
              BEST SELLERS
            </h2>
          </div>

          {/* 4 Standout Featured Cards Grid (Exact from Illustrator) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px',
            maxWidth: '1280px',
            margin: '0 auto',
            textAlign: 'left'
          }}>
            {featuredPosters.map((poster, index) => {
              const isHighlighted = hoveredCard === poster.id;
              return (
                <div
                  key={poster.id}
                  className="glass-card"
                  style={{
                    padding: '0',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: isHighlighted ? '2px solid rgba(0, 242, 254, 0.8)' : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: isHighlighted ? '0 0 35px rgba(0, 242, 254, 0.4), 0 20px 40px rgba(0,0,0,0.8)' : '0 15px 35px rgba(0,0,0,0.7)',
                    background: '#070b12',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '16px',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  onMouseEnter={() => setHoveredCard(poster.id)}
                  onClick={() => onSelectPoster(poster)}
                >
                  {/* Poster Frame (100% Horizontal & Vertical Proportion without Cropping) */}
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
              );
            })}
          </div>

        </div>
      </div>

    </section>
  );
}
