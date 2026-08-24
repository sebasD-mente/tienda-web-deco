import React from 'react';
import { Sparkles, ArrowRight, Layers, CheckCircle2 } from 'lucide-react';
import { CATALOG_POSTERS } from '../data/catalogData';
import OptimizedImage from './OptimizedImage';

export default function HeroCarousel({ onSelectPoster }) {
  const featuredPosters = CATALOG_POSTERS.filter(p => p.isFeatured).slice(0, 4);

  return (
    <section style={{
      paddingTop: '160px',
      paddingBottom: '80px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Cyan Ambient Spotlight Glows */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '750px',
        height: '450px',
        background: 'radial-gradient(ellipse at center, rgba(0, 242, 254, 0.14) 0%, rgba(2, 132, 199, 0.05) 50%, transparent 75%)',
        filter: 'blur(75px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        
        {/* Top Badge */}
        <div style={{ display: 'inline-flex', marginBottom: '20px' }}>
          <div className="badge-cyan pulse-cyan">
            <Sparkles size={14} />
            <span>RETRO REVIVAL | DECO VINTAGE 2026</span>
          </div>
        </div>

        {/* Central Impactful Headline */}
        <h1 style={{
          fontSize: 'clamp(2.4rem, 4.8vw, 4.2rem)',
          fontWeight: 900,
          lineHeight: 1.1,
          marginBottom: '20px',
          letterSpacing: '-0.02em',
          maxWidth: '950px',
          margin: '0 auto 20px auto'
        }}>
          DESCUBRE PÓSTERS ICÓNICOS DE <br />
          <span className="text-gradient-cyan">AUTOS, ANIME, CINE & GAMING</span>
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 'clamp(1rem, 1.8vw, 1.2rem)',
          color: 'var(--text-secondary)',
          marginBottom: '36px',
          lineHeight: 1.6,
          maxWidth: '720px',
          margin: '0 auto 36px auto'
        }}>
          Pósters rígidos premium impresos con tecnología <strong>HP Línea Látex</strong> sobre madera sólida MDF de 5.5mm. Incluyen cinta industrial Tessa para instalar en segundos sin clavos ni marcos costosos.
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '60px' }}>
          <a href="#catalogo" className="btn-cyan" style={{ padding: '16px 36px', fontSize: '1rem' }}>
            <Layers size={18} />
            <span>Explorar Colecciones</span>
            <ArrowRight size={18} />
          </a>

          <a href="#productos" className="btn-secondary" style={{ padding: '16px 30px', fontSize: '1rem' }}>
            <span>Más sobre nuestros productos</span>
          </a>
        </div>

        {/* 4 Standout Featured Cards Grid with Optimized WebP & Shimmer */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '24px',
          maxWidth: '1200px',
          margin: '0 auto',
          textAlign: 'left'
        }}>
          {featuredPosters.map((poster, index) => (
            <div
              key={poster.id}
              className="glass-card"
              style={{
                padding: '0',
                overflow: 'hidden',
                cursor: 'pointer',
                border: '1px solid rgba(0, 242, 254, 0.25)',
                background: '#090d16',
                position: 'relative'
              }}
              onClick={() => onSelectPoster(poster)}
            >
              {/* Poster Image with Optimized Progressive Loading */}
              <div style={{ width: '100%', height: '320px', overflow: 'hidden', position: 'relative' }}>
                <OptimizedImage
                  src={poster.thumb || poster.image}
                  alt={poster.title}
                  priority={index < 2}
                />

                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(6, 8, 14, 0.85)',
                  border: '1px solid rgba(0, 242, 254, 0.4)',
                  color: 'var(--accent-cyan)',
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  backdropFilter: 'blur(8px)',
                  zIndex: 2
                }}>
                  MDF 5.5mm
                </div>
              </div>

              {/* Card Bottom Details */}
              <div style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                  {poster.category}
                </div>
                <h4 style={{
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: '#fff',
                  marginBottom: '12px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {poster.title}
                </h4>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--accent-cyan)' }}>
                    Desde Q 25.00
                  </span>
                  
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    Ver Tamaños ➔
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* Feature Checkpoints */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '32px',
          flexWrap: 'wrap',
          fontSize: '0.9rem',
          color: 'var(--text-secondary)',
          marginTop: '45px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} color="#00f2fe" />
            <span>Impresión HP Látex Inalterable</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} color="#00f2fe" />
            <span>Madera Rígida MDF 5.5mm</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} color="#00f2fe" />
            <span>Cinta Doble Cara Tessa Incluida</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} color="#00f2fe" />
            <span>6 Tamaños Oficiales en Quetzales</span>
          </div>
        </div>

      </div>
    </section>
  );
}
