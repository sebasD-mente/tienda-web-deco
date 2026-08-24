import React from 'react';
import { ShieldCheck, Cpu, Layers, Hammer, Sparkles, CheckCircle2, Ruler, MessageSquare } from 'lucide-react';
import { OFFICIAL_SIZES } from '../data/catalogData';

export default function QualitySection() {
  return (
    <section id="productos" style={{ padding: '90px 0', position: 'relative', background: 'rgba(9, 13, 20, 0.7)' }}>
      <div className="container">
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <div className="badge-cyan">
            <ShieldCheck size={14} />
            <span>ESTÁNDARES DE FABRICACIÓN</span>
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 900, marginBottom: '16px' }}>
            Más Sobre <span className="text-gradient-cyan">Nuestros Productos</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '720px', margin: '0 auto', fontSize: '1.05rem' }}>
            La calidad de Deco Vintage Guate se fundamenta en procesos técnicos especializados. Combinamos impresión de alta gama con soportes rígidos duraderos y fijación limpia sin herramientas.
          </p>
        </div>

        {/* Official 6 Sizes & Prices Table Card */}
        <div className="glass-card" style={{
          padding: '36px',
          marginBottom: '50px',
          border: '1px solid rgba(0, 242, 254, 0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <Ruler size={24} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
              Los 6 Tamaños Oficiales & Precios en Quetzales
            </h3>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px'
          }}>
            {OFFICIAL_SIZES.map((s) => (
              <div
                key={s.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 'var(--radius-md)',
                  padding: '18px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>
                    {s.name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {s.dimensions}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', marginTop: '4px', fontWeight: 600 }}>
                    {s.badge}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--accent-cyan)' }}>
                    Q {s.price.toFixed(2)}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>MDF 5.5mm</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3 Pillars Grid (Materials & Tech) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '28px',
          marginBottom: '50px'
        }}>
          
          {/* Pillar 1: HP Latex */}
          <div className="glass-card" style={{ padding: '36px', border: '1px solid rgba(0, 242, 254, 0.2)' }}>
            <div style={{
              width: '56px',
              height: '56px',
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

            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>
              Impresión HP Línea Látex
            </h3>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '16px' }}>
              Utilizamos maquinaria profesional de gran formato con tintas látex ecológicas. Garantiza colores hiper-saturados, negros profundos y alta resistencia a la luz solar sin decolorarse.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00f2fe', fontSize: '0.85rem', fontWeight: 700 }}>
              <CheckCircle2 size={16} />
              <span>Colores Inalterables con el Tiempo</span>
            </div>
          </div>

          {/* Pillar 2: Soporte MDF 5.5mm */}
          <div className="glass-card" style={{ padding: '36px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
            <div style={{
              width: '56px',
              height: '56px',
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

            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>
              Soporte Rígido MDF 5.5 mm
            </h3>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '16px' }}>
              La impresión sobre vinil de alta densidad se monta manualmente sobre bases sólidas de madera MDF de 5.5 mm (o PVC de 5 mm para exteriores). Olvídate de los pósters arrugados o marcos de vidrio pesados.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00f2fe', fontSize: '0.85rem', fontWeight: 700 }}>
              <CheckCircle2 size={16} />
              <span>Rigidez y Estética Minimalista</span>
            </div>
          </div>

          {/* Pillar 3: Cinta Tessa Industrial */}
          <div className="glass-card" style={{ padding: '36px', border: '1px solid rgba(0, 242, 254, 0.2)' }}>
            <div style={{
              width: '56px',
              height: '56px',
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

            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>
              Fijación Cinta Tessa Industrial
            </h3>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '16px' }}>
              Cada pieza incluye cinta de doble cara de grado industrial marca Tessa. Te permite instalar tu póster en segundos sobre cualquier pared lisa, azulejo o madera sin usar taladro ni martillo.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00f2fe', fontSize: '0.85rem', fontWeight: 700 }}>
              <CheckCircle2 size={16} />
              <span>Instalación Limpia en 30 Segundos</span>
            </div>
          </div>

        </div>

        {/* Custom Orders Banner */}
        <div className="glass-card" style={{
          padding: '32px',
          background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.1) 0%, rgba(9, 13, 20, 0.95) 100%)',
          border: '1px solid rgba(0, 242, 254, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px'
        }}>
          <div>
            <div className="badge-cyan" style={{ marginBottom: '8px' }}>
              <Sparkles size={14} />
              <span>¿BUSCAS ALGO ÚNICO?</span>
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
              Fabricamos Pedidos Personalizados con tu Propia Foto o Diseño
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '650px' }}>
              Envíos en 3 días hábiles sobre madera MDF 5.5mm o PVC 5mm impermeable. Modalidad 50% de anticipo y 50% contra entrega.
            </p>
          </div>

          <a
            href="https://wa.me/?text=Hola%20Deco%20Vintage,%20quiero%20cotizar%20un%20p%C3%B3ster%20personalizado"
            target="_blank"
            rel="noreferrer"
            className="btn-cyan"
            style={{ padding: '14px 26px', fontSize: '0.95rem' }}
          >
            <MessageSquare size={18} />
            <span>Cotizar en WhatsApp</span>
          </a>
        </div>

      </div>
    </section>
  );
}
