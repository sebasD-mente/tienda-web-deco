import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, Bot, Sparkles, Layers, Sliders, Menu, X, Heart } from 'lucide-react';
import { CATEGORIES } from '../data/catalogData';

export default function Navbar({
  cartCount,
  onOpenCart,
  onOpenJarvis,
  onSelectCategory,
  selectedCategory,
  onSearch,
  searchQuery
}) {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 25);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      transition: 'all 0.35s ease',
      background: scrolled ? 'rgba(7, 9, 14, 0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
      padding: scrolled ? '12px 0' : '18px 0'
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
        
        {/* Brand Logo */}
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none' }}>
          <img
            src="/logos/logo Deco Vintage 30.png"
            alt="Deco Vintage Logo"
            style={{
              height: '42px',
              width: 'auto',
              filter: 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.3))'
            }}
            onError={(e) => {
              e.target.src = '/logos/logo 1.png';
            }}
          />
          <div>
            <span style={{
              fontSize: '1.4rem',
              fontWeight: 900,
              fontFamily: 'var(--font-display)',
              color: '#fff',
              letterSpacing: '-0.02em',
              display: 'block',
              lineHeight: 1
            }}>
              DECO <span className="text-gradient-gold">VINTAGE</span>
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--accent-gold)', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 800 }}>
              POSTERS PREMIUM GUATEMALA
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav style={{ display: 'none', alignItems: 'center', gap: '24px' }} className="desktop-nav">
          <a
            href="#simulador"
            style={{
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontSize: '0.95rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'color 0.2s'
            }}
            onMouseEnter={e => e.target.style.color = '#f59e0b'}
            onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
          >
            <Sliders size={16} color="#f59e0b" />
            <span>Simulador de Pared</span>
          </a>

          <a
            href="#catalogo"
            style={{
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontSize: '0.95rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'color 0.2s'
            }}
            onMouseEnter={e => e.target.style.color = '#f59e0b'}
            onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
          >
            <Layers size={16} color="#f59e0b" />
            <span>Catálogo por Colecciones</span>
          </a>

          <a
            href="#calidad"
            style={{
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontSize: '0.95rem',
              fontWeight: 600,
              transition: 'color 0.2s'
            }}
            onMouseEnter={e => e.target.style.color = '#f59e0b'}
            onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
          >
            Materiales & Calidad
          </a>
        </nav>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          {/* Search Bar / Trigger */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-full)',
            padding: '6px 14px',
            transition: 'all 0.3s ease'
          }}>
            <Search size={16} color="var(--text-secondary)" />
            <input
              type="text"
              placeholder="Buscar (ej. Porsche, Batman, Skyline...)"
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                padding: '4px 10px',
                fontSize: '0.85rem',
                outline: 'none',
                width: '160px',
                fontFamily: 'var(--font-body)'
              }}
              className="search-input-field"
            />
            {searchQuery && (
              <button
                onClick={() => onSearch('')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Jarvis AI Assistant Button */}
          <button
            onClick={onOpenJarvis}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(0, 242, 254, 0.1)',
              border: '1px solid rgba(0, 242, 254, 0.3)',
              color: 'var(--accent-cyan)',
              padding: '8px 14px',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.85rem',
              fontFamily: 'var(--font-display)',
              transition: 'all 0.25s'
            }}
            title="Abrir Asistente Jarvis IA"
          >
            <Bot size={16} />
            <span className="jarvis-btn-text">Jarvis IA</span>
          </button>

          {/* Shopping Cart Button */}
          <button
            onClick={onOpenCart}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--grad-gold)',
              color: '#07090e',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '0.9rem',
              fontFamily: 'var(--font-display)',
              boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
              position: 'relative'
            }}
          >
            <ShoppingBag size={18} />
            <span>Carrito</span>
            {cartCount > 0 && (
              <span style={{
                background: '#e11d48',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 900,
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: '2px'
              }}>
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer'
            }}
            className="mobile-nav-toggle"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

      </div>

      {/* Responsive Inline CSS */}
      <style>{`
        @media (min-width: 900px) {
          .desktop-nav { display: flex !important; }
        }
        @media (max-width: 899px) {
          .mobile-nav-toggle { display: block !important; }
          .search-input-field { width: 100px !important; }
          .jarvis-btn-text { display: none; }
        }
      `}</style>
    </header>
  );
}
