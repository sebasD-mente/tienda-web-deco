import React from 'react';
import { MapPin, Phone, MessageSquare, Instagram, ShieldCheck, Heart, Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      background: 'rgba(5, 7, 12, 0.98)',
      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <img src="/logos/logo Deco Vintage 30.png" alt="Deco Vintage" style={{ height: '36px' }} onError={e => e.target.src = '/logos/logo 1.png'} />
              <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff' }}>
                DECO <span className="text-gradient-gold">VINTAGE</span>
              </span>
            </div>
            <p style={{ fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '20px' }}>
              Fabricación y distribución de cuadros y pósters rígidos de alta calidad en madera MDF de 5.5mm. Presencia activa en las mejores convenciones de Guatemala.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-gold)', fontSize: '0.85rem', fontWeight: 700 }}>
              <MapPin size={16} />
              <span>Guatemala, C.A.</span>
            </div>
          </div>

          {/* Col 2: Official Sizes */}
          <div>
            <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 800, marginBottom: '16px' }}>
              Tamaños Oficiales (MDF 5.5mm)
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
              <li>• Mini (14 x 21 cm) ➔ <strong style={{ color: '#00f5a0' }}>Q25.00</strong></li>
              <li>• Pequeño (21 x 27 cm) ➔ <strong style={{ color: '#00f5a0' }}>Q35.00</strong></li>
              <li>• Portada de Álbum (30 x 30 cm) ➔ <strong style={{ color: '#00f5a0' }}>Q55.00</strong></li>
              <li>• Mediano (30 x 45 cm) ➔ <strong style={{ color: '#00f5a0' }}>Q65.00</strong></li>
              <li>• Grande (45 x 60 cm) ➔ <strong style={{ color: '#00f5a0' }}>Q125.00</strong></li>
              <li>• Gigante (60 x 100 cm) ➔ <strong style={{ color: '#00f5a0' }}>Q210.00</strong></li>
            </ul>
          </div>

          {/* Col 3: Quick Navigation */}
          <div>
            <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 800, marginBottom: '16px' }}>
              Navegación Rápida
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
              <li><a href="#simulador" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Simulador de Pared 3D</a></li>
              <li><a href="#catalogo" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Catálogo por Colecciones</a></li>
              <li><a href="#calidad" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Materiales HP Látex & Tessa</a></li>
            </ul>
          </div>

          {/* Col 4: Contact & Custom Orders */}
          <div>
            <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 800, marginBottom: '16px' }}>
              Pedidos Personalizados
            </h4>
            <p style={{ fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '16px' }}>
              ¿Tienes una imagen propia o medida especial? Fabricamos en PVC 5mm o MDF en 3 días hábiles.
            </p>
            <a
              href="https://wa.me/?text=Hola%20Deco%20Vintage,%20quiero%20cotizar%20un%20p%C3%B3ster%20personalizado"
              target="_blank"
              rel="noreferrer"
              className="btn-gold"
              style={{ padding: '10px 18px', fontSize: '0.85rem' }}
            >
              <MessageSquare size={16} />
              <span>Cotizar por WhatsApp</span>
            </a>
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
            Tecnología HP Látex • Madera Rígida MDF • Cinta Tessa Industrial
          </div>
        </div>

      </div>
    </footer>
  );
}
