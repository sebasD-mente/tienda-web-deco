import React, { useState } from 'react';
import { Sparkles, MessageSquare, Image, CheckCircle2, Clock, Truck, Shield, ArrowRight, HelpCircle } from 'lucide-react';
import { OFFICIAL_SIZES } from '../data/catalogData';

export default function CustomPostersPage({ onNavigate }) {
  const [selectedSize, setSelectedSize] = useState(OFFICIAL_SIZES[3]); // Mediano default
  const [material, setMaterial] = useState('MDF'); // 'MDF' (5.5mm) | 'PVC' (5mm impermeable)
  const [quantity, setQuantity] = useState(1);
  const [customNote, setCustomNote] = useState('');

  // Material price surcharge for PVC (e.g. +Q15 per unit for water-proof outdoor PVC)
  const materialSurcharge = material === 'PVC' ? 15.00 : 0.00;
  const unitPrice = selectedSize.price + materialSurcharge;
  const totalPrice = unitPrice * quantity;

  const handleWhatsAppQuote = () => {
    const message = `👋 *¡Hola Deco Vintage! Quiero cotizar un PÓSTER PERSONALIZADO:*\n\n` +
      `📐 *Tamaño:* ${selectedSize.name} (${selectedSize.dimensions})\n` +
      `🪵 *Material:* ${material === 'MDF' ? 'Madera Rígida MDF 5.5 mm' : 'PVC Espumado 5 mm (Impermeable)'}\n` +
      `🔢 *Cantidad:* ${quantity} unidad(es)\n` +
      `💰 *Precio Estimado:* Q${totalPrice.toFixed(2)}\n` +
      (customNote ? `📝 *Detalle/Idea:* ${customNote}\n\n` : `\n`) +
      `Adjunto mi imagen a continuación para revisión de resolución y confirmación de pedido. ¿Me pueden asesorar?`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div style={{ paddingTop: '110px', background: '#060910', minHeight: '100vh', color: 'var(--text-primary)' }}>
      
      {/* 1. Hero Header */}
      <section style={{
        padding: '70px 0 50px 0',
        textAlign: 'center',
        position: 'relative',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        background: 'radial-gradient(ellipse at top center, rgba(0, 242, 254, 0.1) 0%, transparent 70%)'
      }}>
        <div className="container">
          <div className="badge-cyan" style={{ marginBottom: '16px' }}>
            <Sparkles size={14} />
            <span>TUS RECUERDOS & DISEÑOS EN ALTA DEFINICIÓN</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.4rem, 5vw, 4.2rem)',
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: '18px',
            color: '#fff'
          }}>
            Pósters & Cuadros <span className="text-gradient-cyan">Personalizados</span>
          </h1>

          <p style={{
            color: 'var(--text-secondary)',
            maxWidth: '780px',
            margin: '0 auto 28px auto',
            fontSize: '1.1rem',
            lineHeight: '1.6'
          }}>
            Convierte tus fotografías familiares, ilustraciones digitales, arte de anime, pósters de cine, bandas o logotipos corporativos en <strong>cuadros rígidos de calidad museo</strong> sobre madera MDF o PVC impermeable.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <a
              href="#cotizador"
              className="btn-cyan"
              style={{ padding: '13px 28px', fontSize: '0.95rem' }}
            >
              <span>Calcular Precio & Cotizar</span>
              <ArrowRight size={16} />
            </a>

            <button
              onClick={() => onNavigate('home')}
              className="btn-secondary"
              style={{ padding: '13px 24px', fontSize: '0.95rem' }}
            >
              <span>Ver Diseños del Catálogo</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Simple 3-Step Process */}
      <section style={{ padding: '70px 0', position: 'relative' }}>
        <div className="container">
          
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '12px', color: '#ffffff' }}>
              ¿Cómo Funciona tu Pedido Personalizado?
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', fontSize: '0.98rem' }}>
              Un proceso rápido, asistido por diseñadores y con garantía total de satisfacción.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            marginBottom: '60px'
          }}>
            
            {/* Step 1 */}
            <div className="glass-card" style={{ padding: '32px', position: 'relative' }}>
              <div style={{
                position: 'absolute',
                top: '24px',
                right: '24px',
                fontSize: '2.8rem',
                fontWeight: 900,
                fontFamily: 'var(--font-bebas)',
                color: 'rgba(0, 242, 254, 0.15)',
                lineHeight: 1
              }}>
                01
              </div>

              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'rgba(0, 242, 254, 0.12)',
                color: 'var(--accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px'
              }}>
                <Image size={28} />
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '10px' }}>
                1. Envíanos tu Imagen
              </h3>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                Mándanos tu foto o arte por WhatsApp en la mejor calidad disponible (JPG, PNG, PDF o TIFF). No importa si es vertical, horizontal o cuadrada.
              </p>
            </div>

            {/* Step 2 */}
            <div className="glass-card" style={{ padding: '32px', position: 'relative' }}>
              <div style={{
                position: 'absolute',
                top: '24px',
                right: '24px',
                fontSize: '2.8rem',
                fontWeight: 900,
                fontFamily: 'var(--font-bebas)',
                color: 'rgba(0, 242, 254, 0.15)',
                lineHeight: 1
              }}>
                02
              </div>

              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'rgba(56, 189, 248, 0.12)',
                color: 'var(--accent-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px'
              }}>
                <Sparkles size={28} />
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '10px' }}>
                2. Asesoría & Muestra Digital
              </h3>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                Revisamos la resolución y proporciones sin costo. Te sugerimos el tamaño ideal y te enviamos una previsualización de cómo se verá antes de imprimir.
              </p>
            </div>

            {/* Step 3 */}
            <div className="glass-card" style={{ padding: '32px', position: 'relative' }}>
              <div style={{
                position: 'absolute',
                top: '24px',
                right: '24px',
                fontSize: '2.8rem',
                fontWeight: 900,
                fontFamily: 'var(--font-bebas)',
                color: 'rgba(0, 242, 254, 0.15)',
                lineHeight: 1
              }}>
                03
              </div>

              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'rgba(0, 245, 160, 0.12)',
                color: '#00f5a0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px'
              }}>
                <Clock size={28} />
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '10px' }}>
                3. Entrega en 3 Días Hábiles
              </h3>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                Fabricamos tu cuadro en un máximo de 3 días hábiles. Modalidad <strong>50% de anticipo y 50% contra entrega</strong> con envíos a toda Guatemala.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 3. Interactive Quote Calculator */}
      <section id="cotizador" style={{
        padding: '80px 0',
        background: '#040609',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <div className="container">
          
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div className="badge-cyan" style={{ marginBottom: '12px' }}>
              <Sparkles size={14} />
              <span>COTIZADOR INTERACTIVO AL INSTANTE</span>
            </div>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 900, color: '#ffffff' }}>
              Configura tu Cuadro Personalizado
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', fontSize: '0.98rem' }}>
              Elige el tamaño, material y cantidad para ver el costo estimado y solicitarlo directo por WhatsApp.
            </p>
          </div>

          <div style={{
            maxWidth: '850px',
            margin: '0 auto',
            background: 'rgba(9, 13, 22, 0.95)',
            border: '2px solid rgba(0, 242, 254, 0.35)',
            borderRadius: '24px',
            padding: '36px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(0, 242, 254, 0.15)'
          }}>
            
            {/* Step 1: Select Size */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 800,
                color: 'var(--accent-cyan)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '12px'
              }}>
                1. Selecciona el Tamaño de Impresión:
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                {OFFICIAL_SIZES.map((size) => {
                  const isSelected = selectedSize.id === size.id;
                  return (
                    <div
                      key={size.id}
                      onClick={() => setSelectedSize(size)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-sm)',
                        background: isSelected ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected ? '2px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.9rem', marginBottom: '2px' }}>
                        <span style={{ color: isSelected ? 'var(--accent-cyan)' : '#fff' }}>{size.name}</span>
                        <span style={{ color: '#00f2fe' }}>Q {size.price.toFixed(2)}</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {size.dimensions}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Select Material */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 800,
                color: 'var(--accent-cyan)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '12px'
              }}>
                2. Selecciona el Tipo de Soporte Rígido:
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                
                {/* MDF 5.5mm Option */}
                <div
                  onClick={() => setMaterial('MDF')}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: material === 'MDF' ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    border: material === 'MDF' ? '2px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 800, color: material === 'MDF' ? 'var(--accent-cyan)' : '#fff' }}>
                      Madera MDF 5.5 mm (Estándar)
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#00f5a0', fontWeight: 700 }}>Incluido</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                    Ideal para interiores, habitaciones, oficinas y salas. Sólido y ultra resistente.
                  </p>
                </div>

                {/* PVC 5mm Option */}
                <div
                  onClick={() => setMaterial('PVC')}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: material === 'PVC' ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    border: material === 'PVC' ? '2px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 800, color: material === 'PVC' ? 'var(--accent-cyan)' : '#fff' }}>
                      PVC Espumado 5 mm (Impermeable)
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>+Q 15.00</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                    100% resistente a la humedad y agua. Recomendado para exteriores techados, cocinas o baños.
                  </p>
                </div>

              </div>
            </div>

            {/* Step 3: Quantity & Notes */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '20px',
              marginBottom: '28px'
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  3. Cantidad de Cuadros:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid var(--border-subtle)',
                      color: '#fff',
                      fontSize: '1.2rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    -
                  </button>
                  <span style={{ fontWeight: 900, fontSize: '1.2rem', minWidth: '30px', textAlign: 'center', color: '#fff' }}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid var(--border-subtle)',
                      color: '#fff',
                      fontSize: '1.2rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  Nota Opcional / Idea:
                </label>
                <input
                  type="text"
                  placeholder="Ej. Foto familiar de graduación, póster vertical..."
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: '#fff',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Total Price Box & WhatsApp Button */}
            <div style={{
              background: 'rgba(5, 7, 12, 0.95)',
              border: '1px solid rgba(0, 242, 254, 0.25)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '20px'
            }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>
                  Total Estimado ({quantity} {quantity === 1 ? 'cuadro' : 'cuadros'} en {material}):
                </span>
                <span style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--accent-cyan)', fontFamily: 'var(--font-display)' }}>
                  Q {totalPrice.toFixed(2)}
                </span>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  *Incluye cinta Tessa para montaje inmediato
                </div>
              </div>

              <button
                onClick={handleWhatsAppQuote}
                className="btn-cyan"
                style={{
                  padding: '16px 28px',
                  fontSize: '1rem',
                  boxShadow: '0 8px 30px rgba(0, 242, 254, 0.4)'
                }}
              >
                <MessageSquare size={20} />
                <span>Pedir este Personalizado por WhatsApp</span>
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* 4. Quality Guarantees Row */}
      <section style={{ padding: '60px 0', position: 'relative' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px'
          }}>
            <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
              <Shield size={32} color="var(--accent-cyan)" style={{ margin: '0 auto 12px auto' }} />
              <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 800, marginBottom: '6px' }}>
                Sin Pedido Mínimo
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0 }}>
                Fabricamos desde 1 sola pieza hasta colecciones completas y pedidos corporativos.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
              <Clock size={32} color="var(--accent-cyan)" style={{ margin: '0 auto 12px auto' }} />
              <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 800, marginBottom: '6px' }}>
                Entrega Rápida
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0 }}>
                Fabricación garantizada en un máximo de 3 días hábiles tras confirmar tu diseño.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
              <Truck size={32} color="var(--accent-cyan)" style={{ margin: '0 auto 12px auto' }} />
              <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 800, marginBottom: '6px' }}>
                Pago Contra Entrega
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0 }}>
                Facilidad y seguridad: 50% de anticipo para iniciar y 50% al recibir tu paquete.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
              <CheckCircle2 size={32} color="var(--accent-cyan)" style={{ margin: '0 auto 12px auto' }} />
              <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 800, marginBottom: '6px' }}>
                Cinta Tessa Incluida
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0 }}>
                Recibes tu cuadro listo para colocar de inmediato en tu pared sin herramientas.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
