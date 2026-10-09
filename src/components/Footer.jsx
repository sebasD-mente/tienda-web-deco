import React from 'react';
import { MapPin, MessageSquare, ArrowRight } from 'lucide-react';
import { downloadVCard } from '../utils/vcard';

export default function Footer({ onNavigate }) {
  const handleNav = (e, page) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }
    e.preventDefault();
    if (onNavigate) {
      onNavigate(page);
    }
  };

  return (
    <footer style={{
      background: 'rgba(5, 7, 12, 0.98)',
      borderTop: '1px solid rgba(0, 242, 254, 0.15)',
      padding: '60px 0 30px 0',
      color: 'var(--text-secondary)'
    }}>
      <div className="container">
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '40px',
          marginBottom: '50px'
        }}>
          
          {/* Col 1: Brand */}
          <div>
            <div style={{ marginBottom: '16px' }}>
              <a
                href="/"
                onClick={(e) => handleNav(e, 'home')}
                style={{ textDecoration: 'none' }}
              >
                <span style={{
                  fontFamily: 'var(--font-bebas)',
                  fontSize: '2.2rem',
                  letterSpacing: '0.06em',
                  color: '#fff',
                  display: 'block'
                }}>
                  DECO <span style={{ color: 'var(--accent-cyan)' }}>VINTAGE</span>
                </span>
              </a>
            </div>
            <p style={{ fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '20px' }}>
              Fabricación y distribución de cuadros y pósters rígidos de alta calidad en madera MDF de 5.5mm y PVC impermeable. Presencia activa en las mejores convenciones de Guatemala.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)', fontSize: '0.85rem', fontWeight: 700 }}>
              <MapPin size={16} />
              <span>Guatemala, C.A.</span>
            </div>
          </div>

          {/* Col 2: Social Media & Smart Contact */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 800, marginBottom: '16px', textAlign: 'center' }}>
              Comunidad & Redes
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '260px' }}>
              {/* Instagram Card */}
              <a
                href="https://www.instagram.com/decovintage.guate/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  padding: '10px 14px',
                  minHeight: '44px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(214, 36, 159, 0.5)';
                  e.currentTarget.style.background = 'rgba(214, 36, 159, 0.08)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', left: '14px', flexShrink: 0 }}>
                  <defs>
                    <radialGradient id="ig-footer-grad" cx="20%" cy="110%" r="140%">
                      <stop offset="0%" stopColor="#fdf497" />
                      <stop offset="10%" stopColor="#fdf497" />
                      <stop offset="50%" stopColor="#fd5949" />
                      <stop offset="70%" stopColor="#d6249f" />
                      <stop offset="100%" stopColor="#285AEB" />
                    </radialGradient>
                  </defs>
                  <rect x="2" y="2" width="20" height="20" rx="5.5" fill="url(#ig-footer-grad)" />
                  <rect x="6" y="6" width="12" height="12" rx="3.5" stroke="#ffffff" strokeWidth="1.8" fill="none" />
                  <circle cx="12" cy="12" r="3" stroke="#ffffff" strokeWidth="1.8" fill="none" />
                  <circle cx="15.3" cy="8.7" r="0.9" fill="#ffffff" />
                </svg>
                <span>Seguir en Instagram</span>
              </a>

              {/* Facebook Card */}
              <a
                href="https://www.facebook.com/decovintage.guate.oficial/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  padding: '10px 14px',
                  minHeight: '44px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(24, 119, 242, 0.5)';
                  e.currentTarget.style.background = 'rgba(24, 119, 242, 0.08)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', left: '14px', flexShrink: 0 }}>
                  <rect x="2" y="2" width="20" height="20" rx="5.5" fill="#1877F2" />
                  <path d="M15 12.5h-2.2v7.5h-3.1v-7.5H8v-2.7h1.7V8.1c0-2.4 1.4-3.6 3.6-3.6 1 0 1.9.1 2.2.1v2.5h-1.3c-1.1 0-1.4.5-1.4 1.3v1.4H15l-.4 2.7z" fill="#ffffff" />
                </svg>
                <span>Seguir en Facebook</span>
              </a>

              {/* WhatsApp Chat Button */}
              <a
                href="https://wa.me/50238375078"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  padding: '10px 14px',
                  minHeight: '44px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(37, 211, 102, 0.6)';
                  e.currentTarget.style.background = 'rgba(37, 211, 102, 0.08)';
                  e.currentTarget.style.boxShadow = '0 0 15px rgba(37, 211, 102, 0.2)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', left: '14px', flexShrink: 0 }}>
                  <path fill="#25D366" d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2z"/>
                  <path fill="#ffffff" d="M17.47 14.38c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.21 5.09 4.5.71.31 1.27.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35z"/>
                </svg>
                <span>Chatear en WhatsApp</span>
              </a>

              {/* Save Contact vCard Button */}
              <button
                type="button"
                onClick={downloadVCard}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  padding: '10px 14px',
                  minHeight: '44px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  width: '100%'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.6)';
                  e.currentTarget.style.background = 'rgba(0, 242, 254, 0.08)';
                  e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 242, 254, 0.2)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', left: '14px', flexShrink: 0 }}>
                  <defs>
                    <linearGradient id="contact-footer-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00f2fe" />
                      <stop offset="100%" stopColor="#0284c7" />
                    </linearGradient>
                  </defs>
                  <rect x="2" y="2" width="20" height="20" rx="5.5" fill="url(#contact-footer-grad)" />
                  <circle cx="12" cy="9" r="3.2" fill="#ffffff" />
                  <path d="M6.5 17.5c0-2.3 2.5-3.8 5.5-3.8s5.5 1.5 5.5 3.8" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                </svg>
                <span>Guardar Contacto</span>
              </button>
            </div>
          </div>



          {/* Col 3: Quick Navigation */}
          <div>
            <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 800, marginBottom: '16px' }}>
              Navegación del Sitio
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem' }}>
              <li>
                <a
                  href="/"
                  onClick={(e) => handleNav(e, 'home')}
                  style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s ease', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onMouseEnter={e => e.target.style.color = '#00f2fe'}
                  onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
                >
                  <ArrowRight size={14} color="var(--accent-cyan)" />
                  <span>Inicio (Destacados)</span>
                </a>
              </li>
              <li>
                <a
                  href="/catalogo"
                  onClick={(e) => handleNav(e, 'catalog')}
                  style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s ease', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onMouseEnter={e => e.target.style.color = '#00f2fe'}
                  onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
                >
                  <ArrowRight size={14} color="var(--accent-cyan)" />
                  <span>Catálogo Completo</span>
                </a>
              </li>
              <li>
                <a
                  href="/sobre-posters"
                  onClick={(e) => handleNav(e, 'about')}
                  style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s ease', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onMouseEnter={e => e.target.style.color = '#00f2fe'}
                  onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
                >
                  <ArrowRight size={14} color="var(--accent-cyan)" />
                  <span>Más Sobre Nuestros Pósters</span>
                </a>
              </li>
              <li>
                <a
                  href="/personalizados"
                  onClick={(e) => handleNav(e, 'custom')}
                  style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s ease', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onMouseEnter={e => e.target.style.color = '#00f2fe'}
                  onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
                >
                  <ArrowRight size={14} color="var(--accent-cyan)" />
                  <span>Pósters Personalizados</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Custom Orders */}
          <div>
            <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 800, marginBottom: '16px' }}>
              ¿Tienes una Imagen Propia?
            </h4>
            <p style={{ fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '16px' }}>
              Fabricamos tus fotos en MDF 5.5mm o PVC en 3 días hábiles con 50% de anticipo y 50% contra entrega.
            </p>
            <button
              onClick={() => onNavigate && onNavigate('custom')}
              className="btn-cyan"
              style={{ padding: '10px 18px', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              <MessageSquare size={16} />
              <span>Cotizar Personalizado</span>
            </button>
          </div>

        </div>

        {/* Bottom copyright row */}
        <div style={{
          paddingTop: '24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '0.8rem'
        }}>
          <div>
            © {new Date().getFullYear()} Deco Vintage Guate. Todos los derechos reservados.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              Tecnología HP Látex • Madera Rígida MDF 5.5mm • Cinta Tesa Industrial
            </span>
            <button
              onClick={() => onNavigate && onNavigate('admin')}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'var(--text-muted)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#00f2fe';
                e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.4)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
              title="Panel de Administración"
            >
              <span>⚙️ Administración</span>
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}
