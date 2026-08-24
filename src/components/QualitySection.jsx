import React from 'react';
import { ShieldCheck, Cpu, Layers, Hammer, Sparkles, CheckCircle2, Clock } from 'lucide-react';

export default function QualitySection() {
  return (
    <section id="calidad" style={{ padding: '90px 0', position: 'relative', background: 'rgba(11, 15, 23, 0.6)' }}>
      <div className="container">
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div className="badge-gold">
            <ShieldCheck size={14} />
            <span>ESTÁNDARES DE FABRICACIÓN</span>
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 900, marginBottom: '16px' }}>
            Proceso de Producción & <span className="text-gradient-gold">Materiales de Élite</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '700px', margin: '0 auto', fontSize: '1.05rem' }}>
            La calidad de Deco Vintage se fundamenta en procesos técnicos especializados. Diseñados para durar años con la máxima vivacidad de color.
          </p>
        </div>

        {/* 3 Pillars Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '28px',
          maxWidth: '1150px',
          margin: '0 auto'
        }}>
          
          {/* Pillar 1: HP Latex */}
          <div className="glass-card" style={{ padding: '36px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'rgba(245, 158, 11, 0.12)',
              color: 'var(--accent-gold)',
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00f5a0', fontSize: '0.85rem', fontWeight: 700 }}>
              <CheckCircle2 size={16} />
              <span>Colores Inalterables con el Tiempo</span>
            </div>
          </div>

          {/* Pillar 2: Soporte MDF 5.5mm */}
          <div className="glass-card" style={{ padding: '36px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'rgba(225, 29, 72, 0.12)',
              color: '#e11d48',
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00f5a0', fontSize: '0.85rem', fontWeight: 700 }}>
              <CheckCircle2 size={16} />
              <span>Rigidez y Estética Minimalista</span>
            </div>
          </div>

          {/* Pillar 3: Cinta Tessa Industrial */}
          <div className="glass-card" style={{ padding: '36px' }}>
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00f5a0', fontSize: '0.85rem', fontWeight: 700 }}>
              <CheckCircle2 size={16} />
              <span>Instalación Limpia en 30 Segundos</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
