import React from 'react';
import { MapPin, MessageSquare, ArrowRight } from 'lucide-react';
import { OFFICIAL_SIZES } from '../data/catalogData';

export default function Footer({ onNavigate }) {
  const handleNav = (e, page) => {
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '40px',
          marginBottom: '50px'
        }}>
          
          {/* Col 1: Brand */}
          <div>
            <div style={{ marginBottom: '16px' }}>
              <a
                href="#"
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

          {/* Col 2: Official Sizes */}
          <div>
            <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 800, marginBottom: '16px' }}>
              Tamaños Oficiales
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
              {OFFICIAL_SIZES.map(s => (
                <li key={s.id}>
                  • {s.name} ({s.dimensions}) ➔ <strong style={{ color: 'var(--accent-cyan)' }}>Q{s.price.toFixed(2)}</strong>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Quick Navigation */}
          <div>
            <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 800, marginBottom: '16px' }}>
              Navegación del Sitio
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem' }}>
              <li>
                <a
                  href="#catalogo"
                  onClick={(e) => handleNav(e, 'home')}
                  style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s ease', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onMouseEnter={e => e.target.style.color = '#00f2fe'}
                  onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
                >
                  <ArrowRight size={14} color="var(--accent-cyan)" />
                  <span>Catálogo de Colecciones</span>
                </a>
              </li>
              <li>
                <a
                  href="#sobre-nosotros"
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
                  href="#personalizados"
                  onClick={(e) => handleNav(e, 'custom')}
                  style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s ease', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onMouseEnter={e => e.target.style.color = '#00f2fe'}
                  onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
                >
                  <ArrowRight size={14} color="var(--accent-cyan)" />
                  <span>Pósters Personalizados</span>
                </a>
              </li>
              <li>
                <a
                  href="#admin"
                  onClick={(e) => handleNav(e, 'admin')}
                  style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s ease', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onMouseEnter={e => e.target.style.color = '#00f2fe'}
                  onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
                >
                  <ArrowRight size={14} color="var(--accent-cyan)" />
                  <span>Panel de Administración</span>
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
          <div style={{ color: 'var(--text-muted)' }}>
            Tecnología HP Látex • Madera Rígida MDF 5.5mm • Cinta Tessa Industrial
          </div>
        </div>

      </div>
    </footer>
  );
}
