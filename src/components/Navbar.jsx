import React, { useState } from 'react';
import { Search, ShoppingBag, Bot, X } from 'lucide-react';

export default function Navbar({
  cartCount,
  onOpenCart,
  onOpenJarvis,
  onSearch,
  searchQuery
}) {
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  return (
    <>
      {/* Top Banner with Brand Header Title (Exact Requirement) */}
      <div style={{
        background: '#040609',
        textAlign: 'center',
        padding: '12px 0 6px 0',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 102
      }}>
        <a href="#" style={{ textDecoration: 'none' }}>
          <span style={{
            fontFamily: 'var(--font-bebas)',
            fontSize: '2.4rem',
            letterSpacing: '0.08em',
            color: '#ffffff',
            display: 'inline-block',
            lineHeight: 1
          }}>
            DECO VINTAGE
          </span>
        </a>
      </div>

      {/* Main Navigation Bar */}
      <header style={{
        position: 'fixed',
        top: '48px',
        left: 0,
        right: 0,
        zIndex: 101,
        background: 'rgba(5, 7, 12, 0.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '10px 0'
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* 1. Left: Circular Deco Vintage Guate Logo */}
          <a
            href="#"
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              position: 'relative'
            }}
          >
            <img
              src="/logos/logo 1.png"
              alt="Deco Vintage Guate"
              style={{
                height: '56px',
                width: '56px',
                borderRadius: '50%',
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 10px rgba(0, 242, 254, 0.25))'
              }}
              onError={e => {
                e.target.src = '/logos/logo Deco Vintage 30.png';
              }}
            />
          </a>

          {/* 2. Center Links (Exact: CATALOGO | MÁS SOBRE NUESTROS POSTERS | PERSONALIZADOS) */}
          <nav style={{ display: 'none', alignItems: 'center', gap: '32px' }} className="desktop-menu">
            <a
              href="#catalogo"
              style={{
                color: '#ffffff',
                textDecoration: 'none',
                fontSize: '0.95rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-display)',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={e => e.target.style.color = '#00f2fe'}
              onMouseLeave={e => e.target.style.color = '#ffffff'}
            >
              CATALOGO
            </a>

            <a
              href="#productos"
              style={{
                color: '#ffffff',
                textDecoration: 'none',
                fontSize: '0.95rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-display)',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={e => e.target.style.color = '#00f2fe'}
              onMouseLeave={e => e.target.style.color = '#ffffff'}
            >
              MÁS SOBRE NUESTROS POSTERS
            </a>

            <a
              href="https://wa.me/?text=Hola%20Deco%20Vintage,%20quiero%20cotizar%20un%20p%C3%B3ster%20personalizado"
              target="_blank"
              rel="noreferrer"
              style={{
                color: '#ffffff',
                textDecoration: 'none',
                fontSize: '0.95rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-display)',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={e => e.target.style.color = '#00f2fe'}
              onMouseLeave={e => e.target.style.color = '#ffffff'}
            >
              PERSONALIZADOS
            </a>
          </nav>

          {/* 3. Right: Jarvis Pill + Search + Cart */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            
            {/* Jarvis Pill (Exact Style from Requirement) */}
            <button
              onClick={onOpenJarvis}
              style={{
                background: 'rgba(0, 40, 55, 0.8)',
                border: '1px solid rgba(0, 242, 254, 0.35)',
                color: '#38bdf8',
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              title="Asistente de IA Jarvis"
            >
              <span>ASISTENTE DE IA JARVIS</span>
            </button>

            {/* Search Icon */}
            <button
              onClick={() => setSearchModalOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Buscar póster"
            >
              <Search size={24} strokeWidth={2.2} />
            </button>

            {/* Shopping Cart Icon */}
            <button
              onClick={onOpenCart}
              style={{
                background: 'none',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                position: 'relative'
              }}
              title="Ver Carrito"
            >
              <ShoppingBag size={24} strokeWidth={2.2} />
              {cartCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-4px',
                  background: 'var(--grad-cyan)',
                  color: '#06080e',
                  fontSize: '0.7rem',
                  fontWeight: 900,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 10px rgba(0, 242, 254, 0.6)'
                }}>
                  {cartCount}
                </span>
              )}
            </button>

          </div>

        </div>
      </header>

      {/* Pop-up Search Modal */}
      {searchModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setSearchModalOpen(false)}
          style={{ zIndex: 200 }}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '650px',
              padding: '24px 32px',
              background: '#090d16',
              border: '2px solid rgba(0, 242, 254, 0.45)',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px', marginBottom: '16px' }}>
              <Search size={24} color="var(--accent-cyan)" />
              <input
                type="text"
                autoFocus
                placeholder="Buscar póster (ej. Porsche, Spider-Man, Skyline, Batman...)"
                value={searchQuery}
                onChange={e => onSearch(e.target.value)}
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: '1.2rem',
                  outline: 'none',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600
                }}
              />
              <button
                onClick={() => setSearchModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={22} />
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span>Presiona <strong>ESC</strong> o haz clic afuera para cerrar</span>
              {searchQuery && (
                <a
                  href="#catalogo"
                  onClick={() => setSearchModalOpen(false)}
                  style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontWeight: 700 }}
                >
                  Ver resultados en catálogo ➔
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Responsive Inline CSS */}
      <style>{`
        @media (min-width: 860px) {
          .desktop-menu { display: flex !important; }
        }
      `}</style>
    </>
  );
}
