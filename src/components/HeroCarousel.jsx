import React, { useState } from 'react';
import { CATALOG_POSTERS } from '../data/catalogData';
import OptimizedImage from './OptimizedImage';

const FRANCHISES = [
  { id: 'avengers', name: 'Avengers', img: '/franchises/avengers.webp', category: 'SUPERHEROES' },
  { id: 'dragon-ball', name: 'Dragon Ball', img: '/franchises/dragon-ball.webp', category: 'ANIME' },
  { id: 'disney', name: 'Walt Disney', img: '/franchises/disney.webp', category: 'CINE' },
  { id: 'nba', name: 'NBA', img: '/franchises/nba.webp', category: 'AUTOS' },
  { id: 'back-to-future', name: 'Back to the Future', img: '/franchises/back-to-future.webp', category: 'AUTOS' },
  { id: 'dc', name: 'DC Comics', img: '/franchises/dc.webp', category: 'SUPERHEROES' },
  { id: 'star-wars', name: 'Star Wars', img: '/franchises/star-wars.webp', category: 'CINE' }
];

export default function HeroCarousel({ onSelectPoster }) {
  const featuredPosters = CATALOG_POSTERS.filter(p => p.isFeatured).slice(0, 4);
  const [hoveredCard, setHoveredCard] = useState('toyota-supra'); // Supra highlighted as in mockup

  return (
    <section style={{
      paddingTop: '160px',
      paddingBottom: '80px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Background Comic / Manga Collage Texture */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '680px',
        backgroundImage: 'radial-gradient(circle at center, rgba(6, 9, 15, 0.75) 0%, rgba(4, 6, 10, 0.98) 100%), url("/franchises/comic-bg.webp")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.35,
        filter: 'grayscale(70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Subtle Cyan Ambient Glow */}
      <div style={{
        position: 'absolute',
        top: '22%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '850px',
        height: '420px',
        background: 'radial-gradient(ellipse at center, rgba(0, 242, 254, 0.14) 0%, transparent 70%)',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        
        {/* Main Central Giant Headline (Exact from Illustrator Mockup) */}
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.5rem, 5.8vw, 4.8rem)',
          fontWeight: 900,
          lineHeight: 1.08,
          marginBottom: '16px',
          letterSpacing: '-0.02em',
          textTransform: 'uppercase',
          maxWidth: '1050px',
          margin: '0 auto 16px auto'
        }}>
          DESCUBRE POSTERS <br />
          ICÓNICOS DE <br />
          <span style={{ color: '#38bdf8', textShadow: '0 0 35px rgba(56, 189, 248, 0.45)' }}>
            AUTOS, ANIME, CINE Y MUCHO MAS
          </span>
        </h1>

        {/* White Pill Button (Exact from Illustrator Mockup) */}
        <div style={{ margin: '30px 0 50px 0' }}>
          <a
            href="#catalogo"
            style={{
              display: 'inline-block',
              background: '#ffffff',
              color: '#07090e',
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              fontSize: '0.95rem',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              padding: '16px 38px',
              borderRadius: 'var(--radius-full)',
              textDecoration: 'none',
              boxShadow: '0 6px 30px rgba(255, 255, 255, 0.25)',
              transition: 'all 0.25s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 10px 40px rgba(0, 242, 254, 0.5)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 6px 30px rgba(255, 255, 255, 0.25)';
            }}
          >
            EXPLORA LAS CATEGORIAS DISPONIBLES
          </a>
        </div>

        {/* Franchise Category Icons Grid (7 Exact Logos from Illustrator) */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '18px',
          flexWrap: 'wrap',
          marginBottom: '75px'
        }}>
          {FRANCHISES.map((franchise) => (
            <a
              key={franchise.id}
              href="#catalogo"
              style={{
                width: '92px',
                height: '92px',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: '#090d16'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-6px) scale(1.06)';
                e.currentTarget.style.boxShadow = '0 15px 35px rgba(0, 242, 254, 0.45)';
                e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.6)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.6)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              }}
            >
              <img
                src={franchise.img}
                alt={franchise.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
            </a>
          ))}
        </div>

        {/* BEST SELLERS Header (Exact from Illustrator Mockup) */}
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

        {/* 4 Standout Featured Cards Grid with Cyan Active Glow (Exact from Illustrator) */}
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

                  {/* MDF 5.5mm Pill Badge */}
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
                    MDF 5.5mm
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
                      Desde Q 25.00
                    </span>
                    
                    <span style={{
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      Ver Tamaños ➔
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
