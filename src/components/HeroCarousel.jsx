import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Zap, Sliders, Layers, Star, CheckCircle } from 'lucide-react';
import { CATALOG_POSTERS } from '../data/catalogData';

export default function HeroCarousel({ onOpenSimulator, onSelectPoster }) {
  const featuredPosters = CATALOG_POSTERS.filter(p => p.isFeatured).slice(0, 4);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % featuredPosters.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [featuredPosters.length]);

  const currentPoster = featuredPosters[activeIndex] || featuredPosters[0];

  return (
    <section style={{
      paddingTop: '150px',
      paddingBottom: '90px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Dynamic Glow Spotlight */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '45%',
        transform: 'translate(-50%, -50%)',
        width: '650px',
        height: '650px',
        background: 'radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, rgba(225, 29, 72, 0.06) 45%, transparent 70%)',
        filter: 'blur(70px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '48px',
          alignItems: 'center'
        }}>
          
          {/* Left Column: Headlines & Call to Actions */}
          <div>
            {/* Top Badge */}
            <div style={{ display: 'inline-flex', marginBottom: '20px' }}>
              <div className="badge-gold pulse-gold">
                <Sparkles size={14} />
                <span>NUEVA COLECCIÓN DECO VINTAGE 2026</span>
              </div>
            </div>

            {/* Main Title */}
            <h1 style={{
              fontSize: 'clamp(2.6rem, 5.2vw, 4.4rem)',
              fontWeight: 900,
              lineHeight: 1.05,
              marginBottom: '22px',
              letterSpacing: '-0.03em'
            }}>
              ARTE & PÓSTERS <br />
              <span className="text-gradient-gold">PREMIUM RÍGIDOS</span> <br />
              EN MADERA MDF
            </h1>

            {/* Subtitle */}
            <p style={{
              fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)',
              color: 'var(--text-secondary)',
              marginBottom: '32px',
              lineHeight: 1.6,
              maxWidth: '560px'
            }}>
              Olvídate de los pósters arrugados y la marquetería costosa. Impresión profesional <strong>HP Línea Látex</strong> sobre base de madera de 5.5mm lista para colocar con cinta industrial Tessa.
            </p>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '40px' }}>
              <a href="#catalogo" className="btn-gold" style={{ padding: '16px 32px', fontSize: '1rem' }}>
                <Layers size={18} />
                <span>Explorar Catálogo</span>
                <ArrowRight size={18} />
              </a>

              <a href="#simulador" className="btn-secondary" style={{ padding: '16px 28px', fontSize: '1rem' }}>
                <Sliders size={18} color="#f59e0b" />
                <span>Simulador de Pared</span>
              </a>
            </div>

            {/* Feature Pills */}
            <div style={{
              display: 'flex',
              gap: '20px',
              flexWrap: 'wrap',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} color="#f59e0b" />
                <span>HP Látex Inalterable</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} color="#f59e0b" />
                <span>MDF Rígido 5.5 mm</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} color="#f59e0b" />
                <span>Cinta Tessa (Sin Clavos)</span>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Floating Poster Showcase (Marvel Unlimited Style) */}
          <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
            <div style={{
              position: 'relative',
              width: '100%',
              maxWidth: '440px',
              aspectRatio: '3/4',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(245, 158, 11, 0.25)',
              border: '2px solid rgba(245, 158, 11, 0.4)',
              background: '#0a0d14',
              transition: 'all 0.5s ease',
              cursor: 'pointer'
            }}
            onClick={() => onSelectPoster(currentPoster)}
            >
              {/* Poster Image */}
              <img
                src={currentPoster.image}
                alt={currentPoster.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  transition: 'transform 0.6s ease'
                }}
                onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.target.style.transform = 'scale(1.0)'}
              />

              {/* Bottom Info Gradient Overlay */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '24px 20px',
                background: 'linear-gradient(to top, rgba(7, 9, 14, 0.95) 0%, rgba(7, 9, 14, 0.7) 60%, transparent 100%)',
                backdropFilter: 'blur(4px)'
              }}>
                <div style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--grad-gold)',
                  color: '#07090e',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  marginBottom: '8px'
                }}>
                  DESTACADO DE LA SEMANA
                </div>

                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                  {currentPoster.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {currentPoster.subtitle}
                </p>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '12px',
                  paddingTop: '10px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--accent-gold)', fontWeight: 700 }}>
                    Desde Q 25.00
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Sliders size={14} color="#f59e0b" />
                    Probar en Simulador
                  </span>
                </div>
              </div>

              {/* Carousel Indicators */}
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                display: 'flex',
                gap: '6px',
                background: 'rgba(0, 0, 0, 0.6)',
                padding: '6px 10px',
                borderRadius: 'var(--radius-full)',
                backdropFilter: 'blur(8px)'
              }}>
                {featuredPosters.map((_, i) => (
                  <div
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveIndex(i);
                    }}
                    style={{
                      width: i === activeIndex ? '20px' : '8px',
                      height: '8px',
                      borderRadius: '4px',
                      background: i === activeIndex ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.3)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
