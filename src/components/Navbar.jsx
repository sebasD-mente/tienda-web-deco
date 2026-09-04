import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, ShoppingBag, X, Menu, ArrowRight, Sparkles, Tag, Layers, ExternalLink, Home, LayoutGrid, Sliders, ChevronRight, MessageSquare } from 'lucide-react';
import { searchPosters } from '../utils/searchEngine';
import { getPosterSizeBadge, getPosterPriceDisplay } from '../utils/posterHelpers';
import ArcReactor from './ArcReactor';

const POPULAR_SEARCHES = [
  'Ferrari', 'Spider-Man', 'Red Bull', 'Avengers', 
  'Dragon Ball', 'Star Wars', 'Cristiano Ronaldo', 'Batman', 'Fórmula 1', 'Messi'
];

export default function Navbar({
  cartCount,
  onOpenCart,
  onOpenJarvis,
  onSearch,
  searchQuery = '',
  activePage = 'home',
  onNavigate,
  posters = [],
  categories = [],
  onSelectPoster
}) {
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const searchInputRef = useRef(null);

  // Sync search input when opened
  useEffect(() => {
    if (searchModalOpen) {
      setLocalSearch(searchQuery || '');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [searchModalOpen]);

  // Handle ESC key & native back button to close search modal and mobile menu
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (searchModalOpen) handleCloseSearchModal();
        if (mobileMenuOpen) setMobileMenuOpen(false);
      }
    };

    const handlePopState = () => {
      setSearchModalOpen(false);
      setMobileMenuOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [searchModalOpen, mobileMenuOpen]);

  const handleOpenSearchModal = () => {
    window.history.pushState({ modalType: 'navbarSearch' }, '');
    setSearchModalOpen(true);
  };

  const handleCloseSearchModal = () => {
    setSearchModalOpen(false);
    if (window.history.state?.modalType === 'navbarSearch') {
      window.history.back();
    }
  };

  const toggleMobileMenu = () => {
    if (!mobileMenuOpen) {
      window.history.pushState({ modalType: 'mobileMenu' }, '');
      setMobileMenuOpen(true);
    } else {
      setMobileMenuOpen(false);
      if (window.history.state?.modalType === 'mobileMenu') {
        window.history.back();
      }
    }
  };

  // Intelligent Fuzzy Search Matching Posters
  const searchResults = useMemo(() => {
    return searchPosters(localSearch, posters);
  }, [localSearch, posters]);

  const handleNavClick = (e, page) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }
    e.preventDefault();
    setMobileMenuOpen(false);
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
        {/* Top Canvas Headroom (Maintains exact vertical placement so the overlapping circular logo is not clipped) */}
        <div style={{
          background: '#060910',
          height: '36px'
        }} />

        {/* Solid Black Navigation Bar */}
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
              href="/"
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
                className="navbar-logo-img"
                style={{
                  objectFit: 'contain',
                  display: 'block',
                  filter: 'drop-shadow(0 6px 16px rgba(0, 0, 0, 0.95))',
                  transition: 'transform 0.2s ease'
                }}
              />
            </a>

            {/* 4. Desktop Navigation Links */}
            <nav className="desktop-nav" style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(14px, 2.2vw, 30px)',
              marginLeft: 'auto',
              marginRight: '30px'
            }}>
              <a
                href="/"
                onClick={(e) => handleNavClick(e, 'home')}
                style={{
                  color: activePage === 'home' ? '#00f2fe' : '#ffffff',
                  textDecoration: 'none',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-display)',
                  transition: 'color 0.2s ease',
                  borderBottom: activePage === 'home' ? '2px solid #00f2fe' : '2px solid transparent',
                  paddingBottom: '4px'
                }}
                onMouseEnter={e => e.target.style.color = '#00f2fe'}
                onMouseLeave={e => e.target.style.color = activePage === 'home' ? '#00f2fe' : '#ffffff'}
              >
                INICIO
              </a>

              <a
                href="/catalogo"
                onClick={(e) => handleNavClick(e, 'catalog')}
                style={{
                  color: (activePage === 'catalog' || activePage === 'category') ? '#00f2fe' : '#ffffff',
                  textDecoration: 'none',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-display)',
                  transition: 'color 0.2s ease',
                  borderBottom: (activePage === 'catalog' || activePage === 'category') ? '2px solid #00f2fe' : '2px solid transparent',
                  paddingBottom: '4px'
                }}
                onMouseEnter={e => e.target.style.color = '#00f2fe'}
                onMouseLeave={e => e.target.style.color = (activePage === 'catalog' || activePage === 'category') ? '#00f2fe' : '#ffffff'}
              >
                CATÁLOGO
              </a>

              <a
                href="/sobre-posters"
                onClick={(e) => handleNavClick(e, 'about')}
                style={{
                  color: activePage === 'about' ? '#00f2fe' : '#ffffff',
                  textDecoration: 'none',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-display)',
                  transition: 'color 0.2s ease',
                  borderBottom: activePage === 'about' ? '2px solid #00f2fe' : '2px solid transparent',
                  paddingBottom: '4px'
                }}
                onMouseEnter={e => e.target.style.color = '#00f2fe'}
                onMouseLeave={e => e.target.style.color = activePage === 'about' ? '#00f2fe' : '#ffffff'}
              >
                NUESTROS PÓSTERS
              </a>

              <a
                href="/personalizados"
                onClick={(e) => handleNavClick(e, 'custom')}
                style={{
                  color: activePage === 'custom' ? '#00f2fe' : '#ffffff',
                  textDecoration: 'none',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
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

            {/* 5. Right Items: Jarvis Pill (desktop only) + Search + Cart + Mobile Hamburger */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginLeft: 'auto' }}>
              
              {/* Asistente de IA Pill (Desktop Only) */}
              <button
                onClick={onOpenJarvis}
                className="jarvis-nav-pill"
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
                title="Asistente de IA"
              >
                <span>ASISTENTE DE IA</span>
              </button>

              {/* Search Icon */}
              <button
                onClick={handleOpenSearchModal}
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

              {/* Mobile Hamburger Button */}
              <button
                onClick={toggleMobileMenu}
                className="mobile-menu-btn"
                style={{
                  background: mobileMenuOpen ? 'rgba(0, 242, 254, 0.15)' : 'none',
                  border: mobileMenuOpen ? '1px solid var(--accent-cyan)' : 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'none',
                  alignItems: 'center'
                }}
                title={mobileMenuOpen ? 'Cerrar Menú' : 'Abrir Menú'}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

            </div>

          </div>
        </header>

        {/* Mobile Navigation Drawer / Dropdown */}
        {mobileMenuOpen && (
          <div
            style={{
              position: 'fixed',
              top: '104px',
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(3, 6, 12, 0.75)',
              backdropFilter: 'blur(10px)',
              zIndex: 99,
              display: 'flex',
              flexDirection: 'column',
              animation: 'fadeIn 0.2s ease'
            }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              style={{
                background: 'linear-gradient(180deg, #070b14 0%, #04060b 100%)',
                borderBottom: '2px solid rgba(0, 242, 254, 0.4)',
                boxShadow: '0 25px 50px rgba(0,0,0,0.9), 0 0 30px rgba(0, 242, 254, 0.15)',
                padding: '20px 20px 28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                maxHeight: 'calc(100vh - 110px)',
                overflowY: 'auto'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{
                fontSize: '0.72rem',
                fontWeight: 900,
                color: 'var(--accent-cyan)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: '4px',
                paddingLeft: '6px'
              }}>
                Navegación Principal
              </div>

              {/* 1. INICIO */}
              <button
                onClick={(e) => handleNavClick(e, 'home')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: activePage === 'home' ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  border: activePage === 'home' ? '1px solid rgba(0, 242, 254, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: activePage === 'home' ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: activePage === 'home' ? 'var(--accent-cyan)' : '#ffffff'
                  }}>
                    <Home size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: activePage === 'home' ? 'var(--accent-cyan)' : '#ffffff' }}>
                      INICIO
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Destacados y Colecciones Especiales
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} color="var(--text-muted)" />
              </button>

              {/* 2. CATÁLOGO */}
              <button
                onClick={(e) => handleNavClick(e, 'catalog')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: (activePage === 'catalog' || activePage === 'category') ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  border: (activePage === 'catalog' || activePage === 'category') ? '1px solid rgba(0, 242, 254, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: (activePage === 'catalog' || activePage === 'category') ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: (activePage === 'catalog' || activePage === 'category') ? 'var(--accent-cyan)' : '#ffffff'
                  }}>
                    <LayoutGrid size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: (activePage === 'catalog' || activePage === 'category') ? 'var(--accent-cyan)' : '#ffffff' }}>
                      CATÁLOGO
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Explora todas las obras y categorías
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} color="var(--text-muted)" />
              </button>

              {/* 3. PÓSTERS PERSONALIZADOS */}
              <button
                onClick={(e) => handleNavClick(e, 'custom')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: activePage === 'custom' ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  border: activePage === 'custom' ? '1px solid rgba(0, 242, 254, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: activePage === 'custom' ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: activePage === 'custom' ? 'var(--accent-cyan)' : '#ffffff'
                  }}>
                    <Sliders size={18} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: activePage === 'custom' ? 'var(--accent-cyan)' : '#ffffff' }}>
                        PERSONALIZADOS
                      </span>
                      <span className="badge-cyan" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>COTIZADOR</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Sube tu imagen o cotiza por medidas
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} color="var(--text-muted)" />
              </button>

              {/* 4. NUESTROS PÓSTERS */}
              <button
                onClick={(e) => handleNavClick(e, 'about')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: activePage === 'about' ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  border: activePage === 'about' ? '1px solid rgba(0, 242, 254, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: activePage === 'about' ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: activePage === 'about' ? 'var(--accent-cyan)' : '#ffffff'
                  }}>
                    <Layers size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: activePage === 'about' ? 'var(--accent-cyan)' : '#ffffff' }}>
                      NUESTROS PÓSTERS
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Madera MDF 5.5mm, Tintas Látex y Acabados
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} color="var(--text-muted)" />
              </button>

              {/* 5. ASISTENTE DE IA (J.A.R.V.I.S.) Button */}
              <div style={{ marginTop: '6px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onOpenJarvis) onOpenJarvis();
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, rgba(0, 40, 56, 0.95) 0%, rgba(0, 20, 32, 0.95) 100%)',
                    border: '1px solid rgba(0, 242, 254, 0.45)',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    color: '#5eead4',
                    cursor: 'pointer',
                    boxShadow: '0 0 20px rgba(0, 242, 254, 0.2)',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: 'rgba(0, 242, 254, 0.18)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#00f2fe',
                      padding: 0
                    }}>
                      <ArcReactor size={28} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: '0.92rem', color: '#00f2fe', letterSpacing: '0.04em' }}>
                        ASISTENTE DE IA (J.A.R.V.I.S.)
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#99f6e4' }}>
                        Asesoría instantánea y cotizaciones 24/7
                      </div>
                    </div>
                  </div>
                  <Sparkles size={18} color="#00f2fe" />
                </button>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Pop-up Live Interactive Search Modal */}
      {searchModalOpen && (
        <div
          className="modal-backdrop"
          onClick={handleCloseSearchModal}
          style={{ zIndex: 1000, padding: '16px' }}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              padding: '24px',
              background: '#070b14',
              border: '2px solid rgba(0, 242, 254, 0.45)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 35px rgba(0, 242, 254, 0.2)',
              borderRadius: '20px',
              position: 'relative',
              animation: 'fadeIn 0.2s ease'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(0, 242, 254, 0.3)',
              borderRadius: '12px',
              padding: '10px 14px',
              marginBottom: '16px',
              boxSizing: 'border-box'
            }}>
              <Search size={20} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar póster (ej. Porsche, Spider-Man, Anime...)"
                value={localSearch}
                onChange={e => {
                  setLocalSearch(e.target.value);
                  if (onSearch) onSearch(e.target.value);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && localSearch.trim()) {
                    handleCloseSearchModal();
                    if (onSearch) onSearch(localSearch.trim());
                    if (onNavigate) onNavigate('catalog');
                  }
                }}
                style={{
                  flex: 1,
                  minWidth: 0,
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.98rem',
                  outline: 'none',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  padding: '2px 0'
                }}
              />
              {localSearch && (
                <button
                  onClick={() => {
                    setLocalSearch('');
                    if (onSearch) onSearch('');
                    searchInputRef.current?.focus();
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    cursor: 'pointer',
                    flexShrink: 0,
                    padding: 0
                  }}
                  title="Limpiar búsqueda"
                >
                  <X size={14} />
                </button>
              )}
              <button
                onClick={handleCloseSearchModal}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0
                }}
                title="Cerrar (Esc)"
              >
                <X size={20} />
              </button>
            </div>

            {/* Results / Suggestions Container */}
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '420px', paddingRight: '4px' }}>
              
              {/* STATE 1: Empty Query -> Popular Suggestions & Categories */}
              {!localSearch.trim() && (
                <div>
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <Sparkles size={14} />
                      <span>Búsquedas Populares</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {POPULAR_SEARCHES.map((tag, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setLocalSearch(tag);
                            if (onSearch) onSearch(tag);
                          }}
                          style={{
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '20px',
                            padding: '6px 14px',
                            color: 'var(--text-secondary)',
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.borderColor = 'var(--accent-cyan)';
                            e.currentTarget.style.color = '#fff';
                            e.currentTarget.style.background = 'rgba(0, 242, 254, 0.1)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                          }}
                        >
                          <Tag size={12} color="var(--accent-cyan)" />
                          <span>{tag}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {categories.length > 0 && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <Layers size={14} />
                        <span>Explorar por Colección</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {categories.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => {
                              setSearchModalOpen(false);
                              if (onNavigate) onNavigate('category', cat.id);
                            }}
                            style={{
                              background: 'rgba(255, 255, 255, 0.03)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: '8px',
                              padding: '8px 12px',
                              color: '#fff',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.borderColor = 'var(--accent-cyan)';
                              e.currentTarget.style.color = 'var(--accent-cyan)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                              e.currentTarget.style.color = '#fff';
                            }}
                          >
                            <span>{cat.name}</span>
                            <ArrowRight size={12} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STATE 2: Query Typed & Results Found */}
              {localSearch.trim() && searchResults.length > 0 && (
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
                  }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                      {searchResults.length} {searchResults.length === 1 ? 'obra encontrada' : 'obras encontradas'}
                    </span>

                    <button
                      onClick={() => {
                        handleCloseSearchModal();
                        if (onSearch) onSearch(localSearch.trim());
                        if (onNavigate) onNavigate('catalog');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-cyan)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>Ver todo en Catálogo</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {searchResults.map((poster) => (
                      <div
                        key={poster.id}
                        onClick={() => {
                          handleCloseSearchModal();
                          if (onSelectPoster) onSelectPoster(poster);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(0, 242, 254, 0.08)';
                          e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.4)';
                          e.currentTarget.style.transform = 'translateX(4px)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        <img
                          src={poster.image}
                          alt={poster.title}
                          style={{
                            width: '48px',
                            height: '62px',
                            objectFit: 'cover',
                            borderRadius: '6px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            flexShrink: 0
                          }}
                        />

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{
                            fontSize: '0.95rem',
                            fontWeight: 800,
                            color: '#ffffff',
                            margin: '0 0 4px 0',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {poster.title}
                          </h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: 'rgba(0, 242, 254, 0.12)',
                              color: 'var(--accent-cyan)',
                              border: '1px solid rgba(0, 242, 254, 0.25)'
                            }}>
                              {poster.category}
                            </span>
                            {poster.franchise && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                • {poster.franchise}
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                            {getPosterPriceDisplay(poster)}
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {getPosterSizeBadge(poster)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STATE 3: Query Typed & No Results */}
              {localSearch.trim() && searchResults.length === 0 && (
                <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                  <Search size={38} style={{ opacity: 0.3, marginBottom: '12px' }} />
                  <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>
                    No se encontraron obras para "{localSearch}"
                  </h4>
                  <p style={{ fontSize: '0.85rem', maxWidth: '380px', margin: '0 auto 18px auto' }}>
                    Intenta con palabras más generales como "Porsche", "Anime", "Marvel", o explora directamente nuestro catálogo.
                  </p>
                  <button
                    onClick={() => {
                      setSearchModalOpen(false);
                      if (onNavigate) onNavigate('catalog');
                    }}
                    className="btn-cyan"
                    style={{ padding: '8px 18px', fontSize: '0.85rem', margin: '0 auto' }}
                  >
                    <span>Ver Catálogo Completo</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}

            </div>

            {/* Modal Bottom Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              paddingTop: '12px',
              marginTop: '12px'
            }}>
              <span>Presiona <strong>ESC</strong> para cerrar • <strong>ENTER</strong> para buscar en catálogo</span>
              <span style={{ color: 'var(--accent-cyan)' }}>Deco Vintage Guate</span>
            </div>
          </div>
        </div>
      )}

      {/* Responsive Inline CSS */}
      <style>{`
        .navbar-logo-img {
          width: 115px;
          height: 115px;
        }
        @media (min-width: 900px) {
          .desktop-nav { display: flex !important; }
          .mobile-menu-btn { display: none !important; }
          .jarvis-nav-pill { display: flex !important; }
        }
        @media (max-width: 899px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .jarvis-nav-pill { display: none !important; }
          .navbar-logo-img {
            width: 74px;
            height: 74px;
          }
        }
        @media (max-width: 480px) {
          .navbar-logo-img {
            width: 62px;
            height: 62px;
          }
        }
      `}</style>
    </>
  );
}
