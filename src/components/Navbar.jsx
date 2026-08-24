import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, Bot, X, Menu, Sparkles, ChevronDown } from 'lucide-react';

export default function Navbar({
  cartCount,
  onOpenCart,
  onOpenJarvis,
  onSearch,
  searchQuery
}) {
  const [scrolled, setScrolled] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Top Utility Announcement Bar (Vice Press Style) */}
      <div style={{
        background: '#040609',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        padding: '6px 0',
        fontSize: '0.75rem',
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--accent-gold)',
        textAlign: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 102
      }}>
        ✨ ENVÍOS A TODA GUATEMALA • PÓSTERS RÍGIDOS MDF 5.5MM • TECNOLOGÍA HP LÁTEX
      </div>

      {/* Main Navbar */}
      <header style={{
        position: 'fixed',
        top: '31px',
        left: 0,
        right: 0,
        zIndex: 101,
        transition: 'all 0.3s ease',
        background: scrolled ? 'rgba(7, 9, 14, 0.92)' : 'rgba(7, 9, 14, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '14px 0'
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* 1. Left: Typographical Brand Logo (Clean & Protagonist) */}
          <a
            href="#"
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              lineHeight: 1
            }}
          >
            <span style={{
              fontFamily: 'var(--font-bebas)',
              fontSize: '2.3rem',
              letterSpacing: '0.06em',
              color: '#ffffff',
              display: 'inline-block'
            }}>
              DECO <span style={{ color: 'var(--accent-gold)' }}>VINTAGE</span>
            </span>
          </a>

          {/* 2. Center: Minimalist Vice Press Style Navigation */}
          <nav style={{ display: 'none', alignItems: 'center', gap: '32px' }} className="desktop-menu">
            <a
              href="#catalogo"
              style={{
                color: '#e2e8f0',
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-display)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={e => e.target.style.color = '#f59e0b'}
              onMouseLeave={e => e.target.style.color = '#e2e8f0'}
            >
              <span style={{ color: 'var(--accent-gold)', fontWeight: 800 }}>+</span> CATÁLOGO
            </a>

            <a
              href="#productos"
              style={{
                color: '#e2e8f0',
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-display)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={e => e.target.style.color = '#f59e0b'}
              onMouseLeave={e => e.target.style.color = '#e2e8f0'}
            >
              <span style={{ color: 'var(--accent-gold)', fontWeight: 800 }}>+</span> MÁS SOBRE NUESTROS PRODUCTOS
            </a>

            <a
              href="https://wa.me/?text=Hola%20Deco%20Vintage,%20quiero%20cotizar%20un%20p%C3%B3ster%20personalizado"
              target="_blank"
              rel="noreferrer"
              style={{
                color: '#e2e8f0',
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-display)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={e => e.target.style.color = '#f59e0b'}
              onMouseLeave={e => e.target.style.color = '#e2e8f0'}
            >
              <span style={{ color: 'var(--accent-gold)', fontWeight: 800 }}>+</span> PERSONALIZADOS
            </a>
          </nav>

          {/* 3. Right: Clean Icon Tools */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            
            {/* Search Trigger Icon */}
            <button
              onClick={() => setSearchModalOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#f0f6fc',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#f59e0b'}
              onMouseLeave={e => e.currentTarget.style.color = '#f0f6fc'}
              title="Buscar póster"
            >
              <Search size={22} strokeWidth={2} />
            </button>

            {/* Jarvis AI Icon Button (Single Line / Icon Style) */}
            <button
              onClick={onOpenJarvis}
              style={{
                background: 'rgba(0, 242, 254, 0.08)',
                border: '1px solid rgba(0, 242, 254, 0.25)',
                color: 'var(--accent-cyan)',
                padding: '8px 14px',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.82rem',
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                transition: 'all 0.25s ease'
              }}
              title="Asistente Jarvis IA"
            >
              <Bot size={16} />
              <span>Jarvis IA</span>
            </button>

            {/* Cart Icon */}
            <button
              onClick={onOpenCart}
              style={{
                background: 'none',
                border: 'none',
                color: '#f0f6fc',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                position: 'relative',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#f59e0b'}
              onMouseLeave={e => e.currentTarget.style.color = '#f0f6fc'}
              title="Ver Carrito de Compras"
            >
              <ShoppingBag size={22} strokeWidth={2} />
              {cartCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-4px',
                  background: 'var(--grad-gold)',
                  color: '#07090e',
                  fontSize: '0.7rem',
                  fontWeight: 900,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 10px rgba(245, 158, 11, 0.5)'
                }}>
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                padding: '6px'
              }}
              className="mobile-toggle-btn"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

          </div>

        </div>
      </header>

      {/* Pop-up Search Modal (Minimalist) */}
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
              background: '#0a0d14',
              border: '2px solid rgba(245, 158, 11, 0.4)',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px', marginBottom: '16px' }}>
              <Search size={24} color="var(--accent-gold)" />
              <input
                type="text"
                autoFocus
                placeholder="Buscar póster (ej. Porsche, Skyline, Batman, Star Wars...)"
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
                  style={{ color: 'var(--accent-gold)', textDecoration: 'none', fontWeight: 700 }}
                >
                  Ver resultados en catálogo ➔
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: '85px',
          left: 0,
          right: 0,
          background: 'rgba(7, 9, 14, 0.98)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '24px',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}>
          <a
            href="#catalogo"
            onClick={() => setMobileMenuOpen(false)}
            style={{ color: '#fff', textDecoration: 'none', fontSize: '1.1rem', fontWeight: 700 }}
          >
            + CATÁLOGO
          </a>
          <a
            href="#productos"
            onClick={() => setMobileMenuOpen(false)}
            style={{ color: '#fff', textDecoration: 'none', fontSize: '1.1rem', fontWeight: 700 }}
          >
            + MÁS SOBRE NUESTROS PRODUCTOS
          </a>
          <a
            href="https://wa.me/?text=Hola%20Deco%20Vintage,%20quiero%20cotizar%20un%20p%C3%B3ster%20personalizado"
            target="_blank"
            rel="noreferrer"
            onClick={() => setMobileMenuOpen(false)}
            style={{ color: 'var(--accent-gold)', textDecoration: 'none', fontSize: '1.1rem', fontWeight: 700 }}
          >
            + PEDIDOS PERSONALIZADOS
          </a>
        </div>
      )}

      {/* Responsive Inline CSS */}
      <style>{`
        @media (min-width: 860px) {
          .desktop-menu { display: flex !important; }
        }
        @media (max-width: 859px) {
          .mobile-toggle-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}
