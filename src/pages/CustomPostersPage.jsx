import React, { useState, useRef } from 'react';
import {
  Sparkles,
  MessageSquare,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Truck,
  Shield,
  ArrowRight,
  Upload,
  Ruler,
  Layers,
  Trash2,
  Eye,
  Info,
  Check,
  Maximize2,
  FileCheck,
  Droplets,
  AlertCircle
} from 'lucide-react';
import { OFFICIAL_SIZES } from '../data/catalogData';

export default function CustomPostersPage({ onNavigate }) {
  // Mode: 'standard' | 'custom'
  const [sizeMode, setSizeMode] = useState('standard');
  
  // Clean initial state: Starts at null / 0 until user selects preferences
  const [selectedStandardSize, setSelectedStandardSize] = useState(null);
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [baseMaterial, setBaseMaterial] = useState(null);

  // Quantity and notes
  const [quantity, setQuantity] = useState(1);
  const [customNote, setCustomNote] = useState('');

  // Uploaded image state
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imageDetails, setImageDetails] = useState(null);
  const fileInputRef = useRef(null);

  // --- Validation & Price Calculations ---
  const hasSize = sizeMode === 'standard'
    ? Boolean(selectedStandardSize)
    : (Number(customWidth) > 0 && Number(customHeight) > 0);

  const hasBase = Boolean(baseMaterial);
  const isConfigured = hasSize && hasBase;

  // Custom Area calculation
  const numericWidth = Number(customWidth) || 0;
  const numericHeight = Number(customHeight) || 0;
  const customArea = numericWidth * numericHeight;
  const fullPriceForCustom = customArea * 0.05;

  // Surcharge for PVC (Impermeable 5mm): +Q15.00
  const pvcSurcharge = 15.00;

  // Calculate unit price only if user has selected size & base
  let unitPrice = 0;
  if (isConfigured) {
    const baseFullPrice = sizeMode === 'standard' ? selectedStandardSize.price : fullPriceForCustom;
    if (baseMaterial === 'mdf') {
      unitPrice = baseFullPrice;
    } else if (baseMaterial === 'pvc') {
      unitPrice = baseFullPrice + pvcSurcharge;
    } else if (baseMaterial === 'vinyl_only') {
      unitPrice = baseFullPrice * 0.5; // Exactly 50% (half price)
    }
  }

  const totalPrice = unitPrice * quantity;

  // Quick preset dimensions for custom mode
  const customPresets = [
    { label: '40 x 50 cm', w: 40, h: 50 },
    { label: '50 x 70 cm', w: 50, h: 70 },
    { label: '60 x 80 cm', w: 60, h: 80 },
    { label: '70 x 100 cm', w: 70, h: 100 },
    { label: '80 x 120 cm', w: 80, h: 120 },
    { label: '100 x 100 cm (Cuadrado)', w: 100, h: 100 },
    { label: '100 x 150 cm (Monumento)', w: 100, h: 150 }
  ];

  // Helper for size card price preview
  const getCardPriceForMaterial = (basePrice) => {
    if (!baseMaterial || baseMaterial === 'mdf') return basePrice;
    if (baseMaterial === 'pvc') return basePrice + pvcSurcharge;
    if (baseMaterial === 'vinyl_only') return basePrice * 0.5;
    return basePrice;
  };

  // Handle Image Upload
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target.result);
      setImageDetails({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        type: file.type || 'Imagen'
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setImageDetails(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // WhatsApp Quote Link
  const handleWhatsAppQuote = () => {
    if (!isConfigured) {
      alert('Por favor selecciona tu tipo de base y las medidas deseadas para cotizar.');
      return;
    }

    const sizeName = sizeMode === 'standard'
      ? `${selectedStandardSize.name} (${selectedStandardSize.dimensions})`
      : `Medida Especial: ${customWidth} x ${customHeight} cm (${customArea.toLocaleString()} cm²)`;

    let materialName = 'Madera MDF 5.5 mm (Cuadro Completo)';
    if (baseMaterial === 'pvc') {
      materialName = 'PVC Espumado 5 mm Impermeable (Cuadro Completo)';
    } else if (baseMaterial === 'vinyl_only') {
      materialName = 'Solo Impresión en Vinil Adhesivo HD (Sin Base - 50% Valor)';
    }

    const message = `👋 *¡Hola Deco Vintage! Quiero cotizar un PÓSTER PERSONALIZADO:*\n\n` +
      `📐 *Dimensiones:* ${sizeName}\n` +
      `🪵 *Base / Material:* ${materialName}\n` +
      `🖼️ *Imagen:* ${imageDetails ? `Archivo listo (${imageDetails.name})` : 'Tengo mi diseño listo para enviar por este chat'}\n` +
      `🔢 *Cantidad:* ${quantity} unidad(es)\n` +
      `💰 *Total Cotizado:* Q ${totalPrice.toFixed(2)}\n` +
      (customNote ? `📝 *Detalle/Idea:* ${customNote}\n\n` : `\n`) +
      `Adjunto mi imagen a continuación para validación de resolución y confirmación de pedido. ¿Me pueden asesorar?`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div style={{ paddingTop: '110px', background: '#060910', minHeight: '100vh', color: 'var(--text-primary)' }}>
      
      {/* 1. Hero Header */}
      <section style={{
        padding: '70px 0 45px 0',
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
            Transforma tus imágenes en cuadros sobre <strong>Madera MDF de 5.5 mm</strong>, <strong>PVC impermeable de 5 mm</strong> o solicita <strong>solo la impresión en vinil adhesivo</strong>. Usa nuestro <strong>cotizador de medida especial</strong> para fabricar cualquier tamaño que necesites.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <a
              href="#cotizador"
              className="btn-cyan"
              style={{ padding: '13px 28px', fontSize: '0.95rem' }}
            >
              <span>Configurar & Cotizar</span>
              <ArrowRight size={16} />
            </a>

            <button
              onClick={() => onNavigate && onNavigate('catalog')}
              className="btn-secondary"
              style={{ padding: '13px 24px', fontSize: '0.95rem' }}
            >
              <span>Ver Diseños del Catálogo</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Process Highlights */}
      <section style={{ padding: '60px 0 40px 0', position: 'relative' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            marginBottom: '40px'
          }}>
            
            {/* Step 1 */}
            <div className="glass-card" style={{ padding: '28px', position: 'relative' }}>
              <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                fontSize: '2.5rem',
                fontWeight: 900,
                fontFamily: 'var(--font-bebas)',
                color: 'rgba(0, 242, 254, 0.15)',
                lineHeight: 1
              }}>
                01
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(0, 242, 254, 0.12)',
                color: 'var(--accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '18px'
              }}>
                <Upload size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
                1. Carga tu Imagen o Idea
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.6', margin: 0 }}>
                Selecciona tu fotografía o diseño directamente aquí o envíala a nuestro WhatsApp en JPG, PNG, PDF o TIFF.
              </p>
            </div>

            {/* Step 2 */}
            <div className="glass-card" style={{ padding: '28px', position: 'relative' }}>
              <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                fontSize: '2.5rem',
                fontWeight: 900,
                fontFamily: 'var(--font-bebas)',
                color: 'rgba(0, 242, 254, 0.15)',
                lineHeight: 1
              }}>
                02
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(56, 189, 248, 0.12)',
                color: 'var(--accent-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '18px'
              }}>
                <Layers size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
                2. Elige Base & Medidas
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.6', margin: 0 }}>
                Escoge entre <strong>MDF 5.5mm</strong>, <strong>PVC 5mm</strong> o <strong>Solo Vinil (50%)</strong> con tamaños estándar o usa nuestro cotizador de medida especial.
              </p>
            </div>

            {/* Step 3 */}
            <div className="glass-card" style={{ padding: '28px', position: 'relative' }}>
              <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                fontSize: '2.5rem',
                fontWeight: 900,
                fontFamily: 'var(--font-bebas)',
                color: 'rgba(0, 242, 254, 0.15)',
                lineHeight: 1
              }}>
                03
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(0, 245, 160, 0.12)',
                color: '#00f5a0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '18px'
              }}>
                <Truck size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
                3. Entrega en 3 Días
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.6', margin: 0 }}>
                Fabricación garantizada y lista para colgar con cinta de montaje incluida. Envíos seguros a toda Guatemala.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Interactive Customizer & Formula Calculator */}
      <section id="cotizador" style={{
        padding: '70px 0 90px 0',
        background: '#040609',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <div className="container">
          
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div className="badge-cyan" style={{ marginBottom: '12px' }}>
              <Sparkles size={14} />
              <span>COTIZADOR INTERACTIVO & CARGA DE ARTE</span>
            </div>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 900, color: '#ffffff' }}>
              Configura tu Póster Personalizado
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto', fontSize: '0.98rem' }}>
              Selecciona tu base preferida y las dimensiones para calcular el precio exacto en tiempo real.
            </p>
          </div>

          <div style={{
            maxWidth: '1020px',
            margin: '0 auto',
            background: 'rgba(9, 13, 22, 0.95)',
            border: '2px solid rgba(0, 242, 254, 0.35)',
            borderRadius: '24px',
            padding: 'clamp(20px, 4vw, 40px)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(0, 242, 254, 0.15)'
          }}>

            {/* SECCIÓN 1: CARGA DE IMAGEN CON PREVISUALIZACIÓN */}
            <div style={{ marginBottom: '36px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <label style={{
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  color: 'var(--accent-cyan)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Upload size={18} />
                  <span>1. Carga tu Imagen o Diseño (Opcional):</span>
                </label>

                {uploadedImage && (
                  <button
                    onClick={handleRemoveImage}
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      color: '#f87171',
                      padding: '4px 12px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Trash2 size={14} />
                    <span>Quitar Imagen</span>
                  </button>
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*,.pdf,.tif,.tiff"
                style={{ display: 'none' }}
              />

              {!uploadedImage ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  style={{
                    border: '2px dashed rgba(0, 242, 254, 0.4)',
                    borderRadius: '16px',
                    padding: '36px 20px',
                    textAlign: 'center',
                    background: 'rgba(0, 242, 254, 0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#00f2fe';
                    e.currentTarget.style.background = 'rgba(0, 242, 254, 0.08)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.4)';
                    e.currentTarget.style.background = 'rgba(0, 242, 254, 0.03)';
                  }}
                >
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'rgba(0, 242, 254, 0.12)',
                    color: 'var(--accent-cyan)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px auto'
                  }}>
                    <Upload size={28} />
                  </div>
                  <h4 style={{ color: '#ffffff', fontSize: '1.15rem', fontWeight: 800, marginBottom: '6px' }}>
                    Haz clic aquí para seleccionar tu foto o arrástrala
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '500px', margin: '0 auto 12px auto' }}>
                    Aceptamos formatos JPG, PNG, WEBP, PDF o TIFF en cualquier orientación (vertical, horizontal o cuadrada).
                  </p>
                  <span style={{
                    display: 'inline-block',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    color: 'var(--accent-cyan)',
                    fontWeight: 700
                  }}>
                    ✨ Asesoría y revisión de resolución incluida
                  </span>
                </div>
              ) : (
                <div style={{
                  background: 'rgba(4, 6, 9, 0.9)',
                  border: '1px solid rgba(0, 242, 254, 0.4)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  flexWrap: 'wrap'
                }}>
                  {/* Image Preview Thumbnail */}
                  <div style={{
                    width: '120px',
                    height: '140px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: '#000',
                    border: '2px solid rgba(0, 242, 254, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <img
                      src={uploadedImage}
                      alt="Arte cargado"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>

                  {/* File Metadata */}
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <FileCheck size={18} color="#00f5a0" />
                      <span style={{ color: '#00f5a0', fontSize: '0.8rem', fontWeight: 800 }}>
                        IMAGEN CARGADA CORRECTAMENTE
                      </span>
                    </div>
                    <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 800, marginBottom: '4px', wordBreak: 'break-all' }}>
                      {imageDetails?.name}
                    </h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0 0 12px 0' }}>
                      Tamaño de archivo: <strong>{imageDetails?.size}</strong>
                    </p>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        background: 'rgba(0, 242, 254, 0.12)',
                        border: '1px solid rgba(0, 242, 254, 0.4)',
                        color: 'var(--accent-cyan)',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Cambiar por otra imagen
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* SECCIÓN 2: LAS 3 OPCIONES DE BASE / MATERIAL */}
            <div style={{ marginBottom: '36px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <label style={{
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  color: 'var(--accent-cyan)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Layers size={18} />
                  <span>2. Selecciona el Tipo de Base / Material:</span>
                </label>

                {!baseMaterial && (
                  <span style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={14} />
                    Elige una opción
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                
                {/* Opción 1: Base MDF de 5.5 mm */}
                <div
                  onClick={() => setBaseMaterial('mdf')}
                  style={{
                    padding: '22px',
                    borderRadius: '16px',
                    background: baseMaterial === 'mdf' ? 'rgba(0, 242, 254, 0.14)' : 'rgba(255, 255, 255, 0.03)',
                    border: baseMaterial === 'mdf' ? '2px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: baseMaterial === 'mdf' ? '6px solid var(--accent-cyan)' : '2px solid rgba(255, 255, 255, 0.3)',
                        background: '#000'
                      }} />
                      <span style={{ fontWeight: 800, color: baseMaterial === 'mdf' ? '#fff' : 'var(--text-secondary)', fontSize: '1.05rem' }}>
                        Madera MDF de 5.5 mm
                      </span>
                    </div>
                    <span style={{
                      background: 'rgba(0, 242, 254, 0.2)',
                      color: 'var(--accent-cyan)',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}>
                      ESTÁNDAR
                    </span>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                    Cuadro rígido clásico y sólido montado sobre <strong>madera MDF de 5.5 mm</strong> con vinil laminado de alta protección. Ideal para interiores, habitaciones y salas.
                  </p>

                  <div style={{
                    fontSize: '0.78rem',
                    color: '#00f5a0',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Check size={14} />
                    <span>Incluye cinta de montaje & empaque</span>
                  </div>
                </div>

                {/* Opción 2: Base PVC de 5 mm (Impermeable) */}
                <div
                  onClick={() => setBaseMaterial('pvc')}
                  style={{
                    padding: '22px',
                    borderRadius: '16px',
                    background: baseMaterial === 'pvc' ? 'rgba(0, 242, 254, 0.14)' : 'rgba(255, 255, 255, 0.03)',
                    border: baseMaterial === 'pvc' ? '2px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: baseMaterial === 'pvc' ? '6px solid var(--accent-cyan)' : '2px solid rgba(255, 255, 255, 0.3)',
                        background: '#000'
                      }} />
                      <span style={{ fontWeight: 800, color: baseMaterial === 'pvc' ? '#fff' : 'var(--text-secondary)', fontSize: '1.05rem' }}>
                        PVC Espumado de 5 mm
                      </span>
                    </div>
                    <span style={{
                      background: 'rgba(56, 189, 248, 0.2)',
                      color: 'var(--accent-blue)',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}>
                      💧 IMPERMEABLE
                    </span>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                    Base de <strong>PVC espumado de 5 mm</strong> ultra ligera y 100% resistente al agua y a la humedad. Recomendada para exteriores techados, cocinas o baños.
                  </p>

                  <div style={{
                    fontSize: '0.78rem',
                    color: 'var(--accent-cyan)',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Droplets size={14} />
                    <span>+Q 15.00 • Resistente al agua</span>
                  </div>
                </div>

                {/* Opción 3: Solo Impresión en Vinil (50% de valor) */}
                <div
                  onClick={() => setBaseMaterial('vinyl_only')}
                  style={{
                    padding: '22px',
                    borderRadius: '16px',
                    background: baseMaterial === 'vinyl_only' ? 'rgba(0, 242, 254, 0.14)' : 'rgba(255, 255, 255, 0.03)',
                    border: baseMaterial === 'vinyl_only' ? '2px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: baseMaterial === 'vinyl_only' ? '6px solid var(--accent-cyan)' : '2px solid rgba(255, 255, 255, 0.3)',
                        background: '#000'
                      }} />
                      <span style={{ fontWeight: 800, color: baseMaterial === 'vinyl_only' ? '#fff' : 'var(--text-secondary)', fontSize: '1.05rem' }}>
                        Solo Impresión en Vinil
                      </span>
                    </div>
                    <span style={{
                      background: 'rgba(0, 245, 160, 0.2)',
                      color: '#00f5a0',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}>
                      50% DE VALOR
                    </span>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                    Impresión en <strong>vinil adhesivo HD sin base rígida</strong>. Ideal si ya tienes tus propios marcos de cuadro o deseas adherirlo sobre paredes lisas, vidrio o madera.
                  </p>

                  <div style={{
                    fontSize: '0.78rem',
                    color: '#00f5a0',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Check size={14} />
                    <span>Exactamente la mitad del precio regular</span>
                  </div>
                </div>

              </div>
            </div>

            {/* SECCIÓN 3: SELECCIÓN DE DIMENSIONES (ESTÁNDAR VS MEDIDAS ESPECIALES) */}
            <div style={{ marginBottom: '36px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    color: 'var(--accent-cyan)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Ruler size={18} />
                    <span>3. Dimensiones & Medidas:</span>
                  </label>
                  {!hasSize && (
                    <span style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 700 }}>
                      (Elige un tamaño)
                    </span>
                  )}
                </div>

                {/* Tabs Switch */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '4px',
                  display: 'flex',
                  gap: '4px'
                }}>
                  <button
                    onClick={() => setSizeMode('standard')}
                    style={{
                      background: sizeMode === 'standard' ? 'var(--accent-cyan)' : 'transparent',
                      color: sizeMode === 'standard' ? '#000' : '#fff',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '7px',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Tamaños Estándar
                  </button>

                  <button
                    onClick={() => setSizeMode('custom')}
                    style={{
                      background: sizeMode === 'custom' ? 'var(--accent-cyan)' : 'transparent',
                      color: sizeMode === 'custom' ? '#000' : '#fff',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '7px',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    📐 Cotizador de Medida Especial
                  </button>
                </div>
              </div>

              {/* MODO A: TAMAÑOS ESTÁNDAR */}
              {sizeMode === 'standard' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  {OFFICIAL_SIZES.map((size) => {
                    const isSelected = selectedStandardSize?.id === size.id;
                    const calculatedCardPrice = getCardPriceForMaterial(size.price);

                    return (
                      <div
                        key={size.id}
                        onClick={() => setSelectedStandardSize(size)}
                        style={{
                          padding: '14px 16px',
                          borderRadius: '12px',
                          background: isSelected ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                          border: isSelected ? '2px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.08)',
                          cursor: 'pointer',
                          transition: 'all 0.25s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.95rem', marginBottom: '4px' }}>
                          <span style={{ color: isSelected ? 'var(--accent-cyan)' : '#fff' }}>{size.name}</span>
                          <span style={{ color: isSelected ? '#00f2fe' : 'var(--text-secondary)' }}>
                            Q {calculatedCardPrice.toFixed(2)}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {size.dimensions}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: isSelected ? 'rgba(0, 242, 254, 0.9)' : 'rgba(255, 255, 255, 0.4)', marginTop: '4px' }}>
                          {size.badge}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* MODO B: COTIZADOR DE MEDIDAS ESPECIALES */}
              {sizeMode === 'custom' && (
                <div style={{
                  background: 'rgba(4, 6, 9, 0.8)',
                  border: '1px solid rgba(0, 242, 254, 0.3)',
                  borderRadius: '16px',
                  padding: '24px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '16px',
                    color: 'var(--accent-cyan)',
                    fontSize: '0.85rem',
                    fontWeight: 700
                  }}>
                    <Info size={16} />
                    <span>Usa nuestro <strong>cotizador de medida especial</strong>: ingresa el ancho y alto en centímetros para calcular tu precio al instante.</span>
                  </div>

                  {/* Inputs de Ancho y Alto */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '20px',
                    marginBottom: '20px'
                  }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
                        Ancho (Centímetros):
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="number"
                          min="10"
                          max="300"
                          placeholder="Ej. 50"
                          value={customWidth}
                          onChange={(e) => setCustomWidth(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '12px 40px 12px 14px',
                            borderRadius: '10px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(0, 242, 254, 0.4)',
                            color: '#fff',
                            fontSize: '1.1rem',
                            fontWeight: 800,
                            outline: 'none'
                          }}
                        />
                        <span style={{ position: 'absolute', right: '14px', top: '13px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 700 }}>
                          cm
                        </span>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
                        Alto (Centímetros):
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="number"
                          min="10"
                          max="300"
                          placeholder="Ej. 70"
                          value={customHeight}
                          onChange={(e) => setCustomHeight(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '12px 40px 12px 14px',
                            borderRadius: '10px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(0, 242, 254, 0.4)',
                            color: '#fff',
                            fontSize: '1.1rem',
                            fontWeight: 800,
                            outline: 'none'
                          }}
                        />
                        <span style={{ position: 'absolute', right: '14px', top: '13px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 700 }}>
                          cm
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dimension Presets */}
                  <div style={{ marginBottom: '18px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                      O selecciona una medida personalizada popular:
                    </span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {customPresets.map((preset, idx) => {
                        const isPresetActive = Number(customWidth) === preset.w && Number(customHeight) === preset.h;
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              setCustomWidth(preset.w);
                              setCustomHeight(preset.h);
                            }}
                            style={{
                              background: isPresetActive ? 'rgba(0, 242, 254, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                              border: isPresetActive ? '1px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                              color: isPresetActive ? 'var(--accent-cyan)' : '#fff',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Formula Breakdown Banner */}
                  <div style={{
                    background: 'rgba(0, 242, 254, 0.06)',
                    border: '1px solid rgba(0, 242, 254, 0.2)',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>
                        Área de Impresión:
                      </span>
                      <strong style={{ color: '#fff', fontSize: '1.1rem' }}>
                        {customArea > 0 ? `${customWidth} x ${customHeight} cm = ${customArea.toLocaleString()} cm²` : 'Introduce las medidas en cm'}
                      </strong>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>
                        {customArea > 0 ? `Precio Medida Especial (${customArea.toLocaleString()} cm²):` : 'Precio Estimado:'}
                      </span>
                      <strong style={{ color: 'var(--accent-cyan)', fontSize: '1.1rem' }}>
                        {unitPrice > 0 ? `Q ${unitPrice.toFixed(2)} unitario` : 'Q 0.00'}
                      </strong>
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* SECCIÓN 4: CANTIDAD & NOTAS */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '20px',
              marginBottom: '32px'
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  4. Cantidad de Unidades:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#fff',
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    -
                  </button>
                  <span style={{ fontWeight: 900, fontSize: '1.25rem', minWidth: '36px', textAlign: 'center', color: '#fff' }}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#fff',
                      fontSize: '1.2rem',
                      fontWeight: 800,
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
                  Nota Opcional / Indicación:
                </label>
                <input
                  type="text"
                  placeholder="Ej. Orientación vertical, foto familiar, póster de película..."
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* SECCIÓN 5: RESUMEN FINAL & BOTÓN DE WHATSAPP */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(4, 8, 14, 0.98) 0%, rgba(9, 18, 30, 0.95) 100%)',
              border: '2px solid rgba(0, 242, 254, 0.4)',
              borderRadius: '20px',
              padding: '28px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '24px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7)'
            }}>
              <div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Resumen de tu Cotización ({quantity} {quantity === 1 ? 'unidad' : 'unidades'}):
                </div>
                
                <div style={{ fontSize: '0.95rem', color: isConfigured ? '#ffffff' : '#f59e0b', fontWeight: 700, marginBottom: '6px' }}>
                  {!isConfigured ? (
                    !hasBase && !hasSize ? '👉 Selecciona una base y un tamaño arriba para calcular el total' :
                    hasBase && !hasSize ? '👉 Selecciona el tamaño o ingresa las medidas' :
                    '👉 Selecciona una de las 3 opciones de base'
                  ) : (
                    `${sizeMode === 'standard' ? selectedStandardSize.name : `${customWidth} x ${customHeight} cm`} • ${
                      baseMaterial === 'mdf' ? 'Madera MDF 5.5 mm' :
                      baseMaterial === 'pvc' ? 'PVC Espumado 5 mm Impermeable' :
                      'Solo Impresión en Vinil Adhesivo (50% Valor)'
                    }`
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 900, color: isConfigured ? 'var(--accent-cyan)' : 'var(--text-muted)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                    Q {totalPrice.toFixed(2)}
                  </span>
                  {isConfigured && baseMaterial !== 'vinyl_only' && (
                    <span style={{ fontSize: '0.75rem', color: '#00f5a0', fontWeight: 700 }}>
                      ✓ Cinta Tesa de montaje incluida
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={handleWhatsAppQuote}
                className="btn-cyan"
                style={{
                  padding: '16px 32px',
                  fontSize: '1rem',
                  fontWeight: 800,
                  boxShadow: isConfigured ? '0 8px 30px rgba(0, 242, 254, 0.45)' : 'none',
                  borderRadius: '12px',
                  opacity: isConfigured ? 1 : 0.65,
                  cursor: 'pointer'
                }}
              >
                <MessageSquare size={20} />
                <span>{isConfigured ? 'Pedir este Personalizado por WhatsApp' : 'Selecciona tus opciones para cotizar'}</span>
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
                Cinta Tesa Incluida
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0 }}>
                En cuadros completos (MDF o PVC) recibes tu cuadro listo para colocar sin clavos.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
