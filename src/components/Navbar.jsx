import React, { useState } from 'react';
import { Search, ShoppingBag, X, Sliders } from 'lucide-react';

export default function Navbar({
  cartCount,
  onOpenCart,
  onOpenJarvis,
  onSearch,
  searchQuery,
  activePage = 'home',
  onNavigate
}) {
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  const handleNavClick = (e, page) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(page);
    }
  };

  return (
    <>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100
      }}>
        {/* 1. Top Header (Outside the black bar, on dark canvas background) */}
        <div style={{
          background: '#060910',
          textAlign: 'center',
          padding: '8px 0 4px 0',
          lineHeight: 1
        }}>
          <a
            href="#"
            onClick={(e) => handleNavClick(e, 'home')}
            style={{ textDecoration: 'none' }}
          >
            <span style={{
              fontFamily: 'var(--font-bebas)',
              fontSize: '2.1rem',
              letterSpacing: '0.08em',
              color: '#ffffff',
              display: 'inline-block',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={e => e.target.style.color = '#00f2fe'}
            onMouseLeave={e => e.target.style.color = '#ffffff'}
            >
              DECO VINTAGE
            </span>
          </a>
        </div>

        {/* 2. Solid Black Navigation Bar */}
        <header style={{
          background: '#000000',
          height: '68px',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div className="container" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            position: 'relative'
          }}>
            
            {/* 3. Vertically Centered Overlapping Circular Logo */}
            <a
              href="#"
              onClick={(e) => handleNavClick(e, 'home')}
              style={{
                position: 'absolute',
                left: '0px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 20,
                textDecoration: 'none',
                display: 'block'
              }}
            >
              <img
                src="/assets/logo-navbar.png"
                alt="Deco Vintage Guate"
                style={{
                  height: '115px',
                  width: '115px',
                  objectFit: 'contain',
                  display: 'block',
                  filter: 'drop-shadow(0 6px 16px rgba(0, 0, 0, 0.95))',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              />
            </a>

            {/* 4. Center Links (Page Navigation) */}
            <nav style={{
              display: 'none',
              alignItems: 'center',
              gap: '36px',
              marginLeft: '135px'
            }} className="desktop-menu">
              
              <a
                href="#catalogo"
                onClick={(e) => handleNavClick(e, 'home')}
                style={{
                  color: activePage === 'home' ? '#00f2fe' : '#ffffff',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-display)',
                  transition: 'color 0.2s ease',
                  borderBottom: activePage === 'home' ? '2px solid #00f2fe' : '2px solid transparent',
                  paddingBottom: '4px'
                }}
                onMouseEnter={e => e.target.style.color = '#00f2fe'}
                onMouseLeave={e => e.target.style.color = activePage === 'home' ? '#00f2fe' : '#ffffff'}
              >
                CATALOGO
              </a>

              <a
                href="#sobre-nosotros"
                onClick={(e) => handleNavClick(e, 'about')}
                style={{
                  color: activePage === 'about' ? '#00f2fe' : '#ffffff',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-display)',
                  transition: 'color 0.2s ease',
                  borderBottom: activePage === 'about' ? '2px solid #00f2fe' : '2px solid transparent',
                  paddingBottom: '4px'
                }}
                onMouseEnter={e => e.target.style.color = '#00f2fe'}
                onMouseLeave={e => e.target.style.color = activePage === 'about' ? '#00f2fe' : '#ffffff'}
              >
                MÁS SOBRE NUESTROS POSTERS
              </a>

              <a
                href="#personalizados"
                onClick={(e) => handleNavClick(e, 'custom')}
                style={{
                  color: activePage === 'custom' ? '#00f2fe' : '#ffffff',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-display)',
                  transition: 'color 0.2s ease',
                  borderBottom: activePage === 'custom' ? '2px solid #00f2fe' : '2px solid transparent',
                  paddingBottom: '4px'
                }}
                onMouseEnter={e => e.target.style.color = '#00f2fe'}
                onMouseLeave={e => e.target.style.color = activePage === 'custom' ? '#00f2fe' : '#ffffff'}
              >
                PERSONALIZADOS
              </a>
            </nav>

            {/* 5. Right Items: Jarvis Pill + Search + Cart */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: 'auto' }}>
              
              {/* Jarvis Pill */}
              <button
                onClick={onOpenJarvis}
                style={{
                  background: 'rgba(0, 32, 44, 0.95)',
                  border: '1px solid rgba(0, 242, 254, 0.35)',
                  color: '#5eead4',
                  padding: '8px 18px',
                  borderRadius: 'var(--radius-full)',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#00f2fe'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.35)'}
                title="Asistente de IA Jarvis"
              >
                <span>ASISTENTE DE IA JARVIS</span>
              </button>

              {/* Admin Panel Button */}
              <button
                onClick={(e) => handleNavClick(e, 'admin')}
                style={{
                  background: activePage === 'admin' ? 'rgba(0, 242, 254, 0.2)' : 'none',
                  border: activePage === 'admin' ? '1px solid var(--accent-cyan)' : 'none',
                  borderRadius: '8px',
                  color: activePage === 'admin' ? 'var(--accent-cyan)' : '#ffffff',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.2s ease'
                }}
                title="Panel de Administración"
              >
                <Sliders size={20} strokeWidth={2.2} />
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
                <Search size={22} strokeWidth={2.4} />
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
                <ShoppingBag size={22} strokeWidth={2.4} />
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
      </div>

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
                placeholder="Buscar póster (ej. Porsche, Spider-Man, Skyline, DeLorean...)"
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
                <button
                  onClick={() => {
                    setSearchModalOpen(false);
                    if (onNavigate) onNavigate('home');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-cyan)',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.85rem'
                  }}
                >
                  Ver resultados en catálogo ➔
                </button>
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
