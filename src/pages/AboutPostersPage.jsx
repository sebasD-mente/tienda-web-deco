import React from 'react';
import { ShieldCheck, Cpu, Layers, Hammer, CheckCircle2, ArrowRight, Ruler, Award } from 'lucide-react';
import { OFFICIAL_SIZES } from '../data/catalogData';

export default function AboutPostersPage({ onNavigate }) {
  return (
    <div style={{ paddingTop: '110px', background: '#060910', minHeight: '100vh', color: 'var(--text-primary)' }}>
      
      {/* 1. Hero Header */}
      <section style={{
        padding: '70px 0 50px 0',
        textAlign: 'center',
        position: 'relative',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        background: 'radial-gradient(ellipse at top center, rgba(0, 242, 254, 0.08) 0%, transparent 70%)'
      }}>
        <div className="container">
          <div className="badge-cyan" style={{ marginBottom: '16px' }}>
            <ShieldCheck size={14} />
            <span>ESTÁNDARES DE FABRICACIÓN & CALIDAD</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.4rem, 5vw, 4rem)',
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: '18px',
            color: '#fff'
          }}>
            Más Sobre <span className="text-gradient-cyan">Nuestros Pósters</span>
          </h1>

          <p style={{
            color: 'var(--text-secondary)',
            maxWidth: '780px',
            margin: '0 auto 28px auto',
            fontSize: '1.1rem',
            lineHeight: '1.6'
          }}>
            En <strong>Deco Vintage Guate</strong> transformamos tus artes y pasiones favoritas en piezas rígidas coleccionables de alta gama. Conoce los materiales profesionales, la tecnología de impresión y los acabados que hacen única a cada pieza.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              onClick={() => onNavigate && onNavigate('catalog')}
              className="btn-cyan"
              style={{ padding: '13px 26px', fontSize: '0.92rem' }}
            >
              <span>Explorar el Catálogo</span>
              <ArrowRight size={16} />
            </button>

            <button
              onClick={() => onNavigate('custom')}
              className="btn-secondary"
              style={{ padding: '13px 24px', fontSize: '0.92rem' }}
            >
              <span>Ver Pósters Personalizados</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. The 3 Technical Pillars */}
      <section style={{ padding: '80px 0', position: 'relative' }}>
        <div className="container">
          
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '12px', color: '#ffffff' }}>
              Los 3 Pilares Técnicos de Nuestra Fabricación
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto', fontSize: '0.98rem' }}>
              Cada cuadro se elabora bajo estrictos controles artesanales y maquinaria de vanguardia.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '28px',
            marginBottom: '70px'
          }}>
            
            {/* Pillar 1: HP Latex */}
            <div className="glass-card" style={{
              padding: '36px',
              border: '1px solid rgba(0, 242, 254, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '16px',
                  background: 'rgba(0, 242, 254, 0.12)',
                  color: 'var(--accent-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '24px'
                }}>
                  <Cpu size={32} />
                </div>

                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>
                  1. Impresión HP Línea Látex
                </h3>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.65', marginBottom: '20px' }}>
                  Utilizamos impresoras de gran formato HP con tecnología látex ecológica base agua. No desprende solventes tóxicos ni olores y entrega una nitidez fotográfica microscópica con colores vibrantes y negros puros.
                </p>
              </div>

              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00f2fe', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                  <CheckCircle2 size={16} />
                  <span>Resistencia UV (No se decolora con el sol)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00f2fe', fontSize: '0.85rem', fontWeight: 700 }}>
                  <CheckCircle2 size={16} />
                  <span>Tintas ecológicas sin olor químico</span>
                </div>
              </div>
            </div>

            {/* Pillar 2: Soporte Rígido MDF & PVC */}
            <div className="glass-card" style={{
              padding: '36px',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '16px',
                  background: 'rgba(56, 189, 248, 0.12)',
                  color: 'var(--accent-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '24px'
                }}>
                  <Layers size={32} />
                </div>

                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>
                  2. Soporte Rígido MDF 5.5mm / PVC
                </h3>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.65', marginBottom: '20px' }}>
                  El vinil de alta resolución se monta manualmente sobre bases de madera <strong>MDF sólida de 5.5 mm</strong> de grosor o sobre <strong>PVC de 5 mm impermeable</strong>. Tu póster mantiene su planitud perfecta por años, sin doblarse en las esquinas ni ondularse como el papel.
                </p>
              </div>

              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00f2fe', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                  <CheckCircle2 size={16} />
                  <span>Estructura 100% plana y duradera</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00f2fe', fontSize: '0.85rem', fontWeight: 700 }}>
                  <CheckCircle2 size={16} />
                  <span>Sin necesidad de marcos de vidrio pesados</span>
                </div>
              </div>
            </div>

            {/* Pillar 3: Fijación con Cinta Tessa */}
            <div className="glass-card" style={{
              padding: '36px',
              border: '1px solid rgba(0, 242, 254, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '16px',
                  background: 'rgba(0, 242, 254, 0.12)',
                  color: 'var(--accent-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '24px'
                }}>
                  <Hammer size={32} />
                </div>

                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>
                  3. Fijación Limpia Cinta Tessa
                </h3>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.65', marginBottom: '20px' }}>
                  Cada cuadro incluye tiras de cinta adhesiva industrial de doble cara marca <strong>Tessa</strong>. Se adhiere fuertemente a paredes lisas, concreto sellado, madera, melamina o azulejo. Lo instalas en 30 segundos sin taladrar ni hacer agujeros.
                </p>
              </div>

              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00f2fe', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                  <CheckCircle2 size={16} />
                  <span>Sin taladros, clavos ni polvo</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00f2fe', fontSize: '0.85rem', fontWeight: 700 }}>
                  <CheckCircle2 size={16} />
                  <span>Fijación firme y segura lista para colgar</span>
                </div>
              </div>
            </div>

          </div>

          {/* 3. Guía Completa de Tamaños Oficiales */}
          <div style={{
            background: 'rgba(10, 15, 26, 0.95)',
            border: '1px solid rgba(0, 242, 254, 0.25)',
            borderRadius: '20px',
            padding: '40px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <Ruler size={20} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', margin: 0 }}>
                Guía de Medidas Oficiales Deco Vintage
              </h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '30px' }}>
              Elige el tamaño que mejor se adapte a tu pared, escritorio o colección:
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '16px'
            }}>
              {OFFICIAL_SIZES.map((size) => (
                <div
                  key={size.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '12px',
                    padding: '18px 20px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                    <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 800 }}>
                      {size.name}
                    </h4>
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: 900, fontSize: '1.1rem' }}>
                      Q {size.price.toFixed(2)}
                    </span>
                  </div>

                  <div style={{ color: '#38bdf8', fontSize: '0.88rem', fontWeight: 700, marginBottom: '6px' }}>
                    {size.dimensions}
                  </div>

                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.4' }}>
                    {size.badge}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* 4. Bottom Banner CTA */}
      <section style={{
        padding: '60px 0 90px 0',
        background: '#040609',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <div className="container">
          <div style={{
            background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.12) 0%, rgba(6, 9, 16, 0.95) 100%)',
            border: '2px solid rgba(0, 242, 254, 0.4)',
            borderRadius: '20px',
            padding: '40px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '24px'
          }}>
            <div>
              <div className="badge-cyan" style={{ marginBottom: '8px' }}>
                <Award size={14} />
                <span>EXPERIENCIA DECO VINTAGE</span>
              </div>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', marginBottom: '6px' }}>
                ¿Listo para transformar tu espacio?
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '620px' }}>
                Explora cientos de diseños listos en nuestro catálogo o envíanos tu foto para crear una pieza personalizada.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => onNavigate && onNavigate('catalog')}
                className="btn-cyan"
                style={{ padding: '14px 28px' }}
              >
                <span>Ver Catálogo</span>
                <ArrowRight size={18} />
              </button>

              <button
                onClick={() => onNavigate('custom')}
                className="btn-secondary"
                style={{ padding: '14px 24px' }}
              >
                <span>Crear Personalizado</span>
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
