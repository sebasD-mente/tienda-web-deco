import React, { useState, useRef } from 'react';
import {
  Sparkles,
  MessageSquare,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  Truck,
  Shield,
  ArrowRight,
  Upload,
  Ruler,
  Layers,
  Trash2,
  Plus,
  Eye,
  Info,
  Check,
  Maximize2,
  FileCheck,
  Droplets,
  HelpCircle
} from 'lucide-react';
import { generateWhatsAppLink } from '../config/constants';
import { OFFICIAL_SIZES } from '../data/catalogData';
import { getStoredSettings } from '../utils/catalogStorage';

const createNewCustomPoster = (index = 1) => ({
  id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  sizeMode: 'standard', // 'standard' | 'custom'
  selectedStandardSize: null,
  customWidth: '',
  customHeight: '',
  baseMaterial: null, // 'mdf' | 'pvc' | 'vinyl_only'
  uploadedImage: null,
  imageFile: null,
  imageDetails: null,
  quantity: 1,
  customNote: ''
});

export default function CustomPostersPage({ onNavigate, settings }) {
  // Store Settings (Dynamic cm2 rate)
  const storeSettings = settings || getStoredSettings() || {};
  const cm2Rate = Number(storeSettings.customCm2Price) || 0.048;
  const pvcSurcharge = 15.00;

  // List of Custom Posters configured by the customer
  const [postersList, setPostersList] = useState([createNewCustomPoster(1)]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRefs = useRef({});

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

  // Helper: Calculate price details for a single poster item
  const getPosterPrice = (poster) => {
    const hasSize = poster.sizeMode === 'standard'
      ? Boolean(poster.selectedStandardSize)
      : (Number(poster.customWidth) > 0 && Number(poster.customHeight) > 0);

    const hasBase = Boolean(poster.baseMaterial);
    const isConfigured = hasSize && hasBase;

    const numericWidth = Number(poster.customWidth) || 0;
    const numericHeight = Number(poster.customHeight) || 0;
    const customArea = numericWidth * numericHeight;
    const fullPriceForCustom = customArea * cm2Rate;

    let unitPrice = 0;
    if (isConfigured) {
      const baseFullPrice = poster.sizeMode === 'standard'
        ? poster.selectedStandardSize.price
        : fullPriceForCustom;

      if (poster.baseMaterial === 'mdf') {
        unitPrice = baseFullPrice;
      } else if (poster.baseMaterial === 'pvc') {
        unitPrice = baseFullPrice + pvcSurcharge;
      } else if (poster.baseMaterial === 'vinyl_only') {
        unitPrice = baseFullPrice * 0.5; // Exactamente el 50%
      }
    }

    const totalPrice = isConfigured ? unitPrice * (poster.quantity || 1) : 0;

    return {
      hasSize,
      hasBase,
      isConfigured,
      customArea,
      unitPrice,
      totalPrice
    };
  };

  // Helper: Card price display based on material
  const getCardPriceForMaterial = (basePrice, material) => {
    if (!material || material === 'mdf') return basePrice;
    if (material === 'pvc') return basePrice + pvcSurcharge;
    if (material === 'vinyl_only') return basePrice * 0.5;
    return basePrice;
  };

  // Mutators for Posters List
  const handleAddPoster = () => {
    const nextIndex = postersList.length + 1;
    const newPoster = createNewCustomPoster(nextIndex);
    setPostersList(prev => [...prev, newPoster]);
  };

  const handleRemovePoster = (id) => {
    if (postersList.length <= 1) return;
    setPostersList(prev => prev.filter(p => p.id !== id));
  };

  const handleUpdatePoster = (id, updates) => {
    setPostersList(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
  };

  // Image upload handling
  const handleImageFile = (id, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      handleUpdatePoster(id, {
        uploadedImage: event.target.result,
        imageFile: file,
        imageDetails: {
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
          type: file.type || 'Imagen'
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (id) => {
    handleUpdatePoster(id, {
      uploadedImage: null,
      imageFile: null,
      imageDetails: null
    });
    if (fileInputRefs.current[id]) {
      fileInputRefs.current[id].value = '';
    }
  };

  // Order Totals
  const allConfigured = postersList.every(p => getPosterPrice(p).isConfigured);
  const totalOrderPrice = postersList.reduce((acc, p) => acc + getPosterPrice(p).totalPrice, 0);
  const totalUnits = postersList.reduce((acc, p) => acc + (p.quantity || 1), 0);

  // WhatsApp Quote Link con Registro Blindado en Base de Datos y Fallback Seguro
  const handleWhatsAppQuote = async () => {
    const unconfiguredIdx = postersList.findIndex(p => !getPosterPrice(p).isConfigured);
    if (unconfiguredIdx !== -1) {
      alert(`Por favor selecciona el tipo de base y las medidas para el Póster #${unconfiguredIdx + 1}.`);
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    let registeredOrderNumber = null;

    try {
      // Intentar registrar la cotización en el servidor con sus imágenes
      const formData = new FormData();
      formData.append('totalPrice', totalOrderPrice);
      formData.append('totalUnits', totalUnits);

      const itemsPayload = postersList.map((p, idx) => {
        const calc = getPosterPrice(p);
        const itemData = {
          id: p.id,
          sizeMode: p.sizeMode,
          selectedStandardSize: p.selectedStandardSize,
          customWidth: p.customWidth,
          customHeight: p.customHeight,
          customArea: calc.customArea,
          baseMaterial: p.baseMaterial,
          unitPrice: calc.unitPrice,
          totalPrice: calc.totalPrice,
          quantity: p.quantity || 1,
          customNote: p.customNote || '',
          originalFileName: p.imageDetails?.name || null
        };

        if (p.imageFile) {
          formData.append(`image_${idx}`, p.imageFile);
        } else if (p.uploadedImage && p.uploadedImage.startsWith('data:image/')) {
          itemData.uploadedImage = p.uploadedImage;
        }

        return itemData;
      });

      formData.append('items', JSON.stringify(itemsPayload));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000); // 7s timeout

      const res = await fetch('/api/custom-orders', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.orderNumber) {
          registeredOrderNumber = data.orderNumber;
        }
      }
    } catch (err) {
      console.warn('[CustomPostersPage] Error registrando cotización en servidor (activando fallback WhatsApp):', err);
    } finally {
      setIsSubmitting(false);
    }

    // Generación del mensaje para WhatsApp con el código #CP-XXXX si fue registrado
    let message = '';
    const codeTag = registeredOrderNumber ? ` #${registeredOrderNumber}` : '';

    if (postersList.length === 1) {
      const p = postersList[0];
      const calc = getPosterPrice(p);
      const sizeName = p.sizeMode === 'standard'
        ? `${p.selectedStandardSize.name} (${p.selectedStandardSize.dimensions})`
        : `Medida Especial: ${p.customWidth} x ${p.customHeight} cm (${calc.customArea.toLocaleString()} cm²)`;

      let materialName = 'Madera MDF 5.5 mm (Cuadro Completo)';
      if (p.baseMaterial === 'pvc') {
        materialName = 'PVC Espumado 5 mm Impermeable (Cuadro Completo)';
      } else if (p.baseMaterial === 'vinyl_only') {
        materialName = 'Solo Impresión en Vinil Adhesivo HD (Sin Base - 50% Valor)';
      }

      message = `👋 *¡Hola Deco Vintage! Quiero cotizar un PÓSTER PERSONALIZADO${codeTag}:*\n\n` +
        `📐 *Dimensiones:* ${sizeName}\n` +
        `🪵 *Base / Material:* ${materialName}\n` +
        `🖼️ *Imagen:* ${p.imageDetails ? `Cargada en sistema (${p.imageDetails.name})` : 'Lista para enviar por WhatsApp'}\n` +
        `🔢 *Cantidad:* ${p.quantity} unidad(es)\n` +
        `💰 *Total Cotizado:* Q ${calc.totalPrice.toFixed(2)}\n` +
        (p.customNote ? `📝 *Detalle/Idea:* ${p.customNote}\n\n` : `\n`) +
        (registeredOrderNumber 
          ? `✅ *Mi cotización quedó registrada con el código #${registeredOrderNumber} en su sistema.* ¿Me pueden confirmar para iniciar?` 
          : `Adjunto mi imagen a continuación para validación de resolución y confirmación de pedido. ¿Me pueden asesorar?`);
    } else {
      message = `👋 *¡Hola Deco Vintage! Quiero cotizar ${postersList.length} PÓSTERS PERSONALIZADOS${codeTag}:*\n\n`;

      postersList.forEach((p, idx) => {
        const calc = getPosterPrice(p);
        const sizeName = p.sizeMode === 'standard'
          ? `${p.selectedStandardSize.name} (${p.selectedStandardSize.dimensions})`
          : `Medida Especial: ${p.customWidth} x ${p.customHeight} cm (${calc.customArea.toLocaleString()} cm²)`;

        let materialName = 'Madera MDF 5.5 mm';
        if (p.baseMaterial === 'pvc') materialName = 'PVC Espumado 5 mm Impermeable';
        if (p.baseMaterial === 'vinyl_only') materialName = 'Solo Impresión en Vinil Adhesivo HD (50%)';

        message += `🖼️ *PÓSTER #${idx + 1}:*\n` +
          `• *Dimensiones:* ${sizeName}\n` +
          `• *Base / Material:* ${materialName}\n` +
          `• *Imagen:* ${p.imageDetails ? p.imageDetails.name : 'Lista para enviar por WhatsApp'}\n` +
          `• *Cantidad:* ${p.quantity} ud(s) — Q ${calc.totalPrice.toFixed(2)}\n` +
          (p.customNote ? `• *Nota:* ${p.customNote}\n\n` : `\n`);
      });

      message += `💰 *TOTAL GENERAL COTIZADO (${totalUnits} unidades en ${postersList.length} diseños):* Q ${totalOrderPrice.toFixed(2)}\n\n` +
        (registeredOrderNumber 
          ? `✅ *Cotización registrada con código #${registeredOrderNumber} en el sistema.* ¿Me pueden confirmar para iniciar?` 
          : `Adjunto mis imágenes a continuación para validación de resolución y confirmación de pedido. ¿Me pueden asesorar?`);
    }

    const waUrl = generateWhatsAppLink(message);
    window.open(waUrl, '_blank');
  };

  return (
    <div style={{ paddingTop: '110px', background: '#060910', minHeight: '100vh', color: 'var(--text-primary)' }}>
      
      {/* 1. Hero Header */}
      <section style={{
        padding: '60px 0 40px 0',
        textAlign: 'center',
        position: 'relative',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        background: 'radial-gradient(ellipse at top center, rgba(0, 242, 254, 0.08) 0%, transparent 70%)'
      }}>
        <div className="container">
          <h1 style={{
            fontSize: 'clamp(2.4rem, 5vw, 4rem)',
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: '16px',
            color: '#ffffff'
          }}>
            Posters Personalizados
          </h1>

          <p style={{
            color: 'var(--text-secondary)',
            maxWidth: '780px',
            margin: '0 auto 26px auto',
            fontSize: '1.05rem',
            lineHeight: '1.6'
          }}>
            Transforma tus imágenes en cuadros sobre <strong>Madera MDF de 5.5 mm</strong>, <strong>PVC impermeable de 5 mm</strong> o solicita <strong>solo la impresión en vinil adhesivo</strong>. Usa nuestro <strong>cotizador de medida especial</strong> para fabricar cualquier tamaño que necesites.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('cotizador');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn-cyan"
              style={{ padding: '12px 26px', fontSize: '0.92rem', cursor: 'pointer' }}
            >
              <span>Configurar & Cotizar</span>
              <ArrowRight size={16} />
            </button>

            <button
              onClick={() => onNavigate && onNavigate('catalog')}
              className="btn-secondary"
              style={{ padding: '12px 22px', fontSize: '0.92rem' }}
            >
              <span>Ver Diseños del Catálogo</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Process Highlights */}
      <section style={{ padding: '45px 0 30px 0', position: 'relative' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px',
            marginBottom: '20px'
          }}>
            
            {/* Step 1: Carga tu Imagen */}
            <div
              onClick={() => {
                const el = document.getElementById('cotizador');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                const firstId = postersList[0]?.id;
                if (firstId && fileInputRefs.current[firstId]) {
                  setTimeout(() => fileInputRefs.current[firstId].click(), 350);
                }
              }}
              className="glass-card"
              style={{
                padding: '22px',
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                border: '1px solid rgba(0, 242, 254, 0.2)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#00f2fe';
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 242, 254, 0.15)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              title="Haz clic para cargar tu foto"
            >
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '18px',
                fontSize: '2.2rem',
                fontWeight: 900,
                fontFamily: 'var(--font-bebas)',
                color: 'rgba(0, 242, 254, 0.15)',
                lineHeight: 1
              }}>
                01
              </div>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(0, 242, 254, 0.12)',
                color: 'var(--accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px'
              }}>
                <Upload size={22} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
                1. Carga tu Imagen o Idea
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: '1.5', margin: '0 0 10px 0' }}>
                Selecciona tu foto o diseño aquí o envíala a nuestro WhatsApp en JPG, PNG, PDF o TIFF.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)', fontSize: '0.78rem', fontWeight: 700 }}>
                <span>Subir imagen ahora</span>
                <ArrowRight size={13} />
              </div>
            </div>

            {/* Step 2: Elige Base & Medidas */}
            <div
              onClick={() => {
                const el = document.getElementById('cotizador');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="glass-card"
              style={{
                padding: '22px',
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                border: '1px solid rgba(56, 189, 248, 0.2)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#38bdf8';
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(56, 189, 248, 0.15)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              title="Haz clic para configurar medidas y material"
            >
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '18px',
                fontSize: '2.2rem',
                fontWeight: 900,
                fontFamily: 'var(--font-bebas)',
                color: 'rgba(0, 242, 254, 0.15)',
                lineHeight: 1
              }}>
                02
              </div>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.12)',
                color: 'var(--accent-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px'
              }}>
                <Layers size={22} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
                2. Elige Base & Medidas
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: '1.5', margin: '0 0 10px 0' }}>
                Escoge entre <strong>MDF 5.5mm</strong>, <strong>PVC 5mm</strong> o <strong>Solo Vinil (50%)</strong> con tamaños estándar o cotizador especial.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-blue)', fontSize: '0.78rem', fontWeight: 700 }}>
                <span>Cotizar medidas</span>
                <ArrowRight size={13} />
              </div>
            </div>

            {/* Step 3: Entrega en 3 Días */}
            <div
              onClick={() => {
                const el = document.getElementById('cotizador');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="glass-card"
              style={{
                padding: '22px',
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                border: '1px solid rgba(0, 245, 160, 0.2)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#00f5a0';
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 245, 160, 0.15)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(0, 245, 160, 0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              title="Haz clic para ordenar tu cuadro personalizado"
            >
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '18px',
                fontSize: '2.2rem',
                fontWeight: 900,
                fontFamily: 'var(--font-bebas)',
                color: 'rgba(0, 242, 254, 0.15)',
                lineHeight: 1
              }}>
                03
              </div>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(0, 245, 160, 0.12)',
                color: '#00f5a0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px'
              }}>
                <Truck size={22} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
                3. Entrega en 3 Días
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: '1.5', margin: '0 0 10px 0' }}>
                Fabricación garantizada y lista para colgar con cinta de montaje incluida. Envíos seguros a toda Guatemala.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00f5a0', fontSize: '0.78rem', fontWeight: 700 }}>
                <span>Ver opciones de envío</span>
                <ArrowRight size={13} />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Interactive Customizer & Formula Calculator */}
      <section id="cotizador" style={{
        padding: '50px 0 70px 0',
        background: '#040609',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <div className="container">
          
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '2.1rem', fontWeight: 900, color: '#ffffff', marginBottom: '6px' }}>
              Configura tus Pósters Personalizados
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto', fontSize: '0.94rem' }}>
              Carga tus imágenes, selecciona la base y dimensiones deseadas para calcular tu cotización en tiempo real.
            </p>
          </div>

          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

            {/* LIST OF CUSTOM POSTER BLOCKS */}
            {postersList.map((poster, index) => {
              const posterCalc = getPosterPrice(poster);

              return (
                <div
                  key={poster.id}
                  style={{
                    background: 'rgba(9, 13, 22, 0.95)',
                    border: '1px solid rgba(0, 242, 254, 0.3)',
                    borderRadius: '20px',
                    padding: 'clamp(18px, 3.5vw, 30px)',
                    boxShadow: '0 18px 45px rgba(0, 0, 0, 0.7), 0 0 25px rgba(0, 242, 254, 0.08)',
                    marginBottom: '26px',
                    position: 'relative'
                  }}
                >
                  {/* Poster Item Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    paddingBottom: '14px',
                    marginBottom: '22px',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="badge-cyan" style={{ fontSize: '0.78rem', padding: '4px 10px', fontWeight: 800 }}>
                        PÓSTER #{index + 1}
                      </span>
                      {poster.imageDetails && (
                        <span style={{ fontSize: '0.82rem', color: '#00f5a0', fontWeight: 700 }}>
                          ✓ {poster.imageDetails.name}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {posterCalc.isConfigured && (
                        <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                          Subtotal: Q {posterCalc.totalPrice.toFixed(2)}
                        </span>
                      )}

                      {postersList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePoster(poster.id)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.35)',
                            color: '#f87171',
                            padding: '5px 12px',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                          title="Eliminar este póster"
                        >
                          <Trash2 size={13} />
                          <span>Quitar Póster</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* SECCIÓN 1: CARGA DE IMAGEN */}
                  <div style={{ marginBottom: '26px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                      <label style={{
                        fontSize: '0.84rem',
                        fontWeight: 800,
                        color: 'var(--accent-cyan)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Upload size={16} />
                        <span>1. Carga tu Imagen o Diseño (Opcional):</span>
                      </label>

                      {poster.uploadedImage && (
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(poster.id)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#f87171',
                            padding: '3px 10px',
                            borderRadius: '6px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Trash2 size={12} />
                          <span>Quitar Imagen</span>
                        </button>
                      )}
                    </div>

                    <input
                      type="file"
                      ref={el => { fileInputRefs.current[poster.id] = el; }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageFile(poster.id, file);
                      }}
                      accept="image/*,.pdf,.tif,.tiff"
                      style={{ display: 'none' }}
                    />

                    {!poster.uploadedImage ? (
                      <div
                        onClick={() => fileInputRefs.current[poster.id]?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleImageFile(poster.id, file);
                        }}
                        style={{
                          border: '2px dashed rgba(0, 242, 254, 0.35)',
                          borderRadius: '14px',
                          padding: '24px 16px',
                          textAlign: 'center',
                          background: 'rgba(0, 242, 254, 0.02)',
                          cursor: 'pointer',
                          transition: 'all 0.25s ease'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = '#00f2fe';
                          e.currentTarget.style.background = 'rgba(0, 242, 254, 0.06)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.35)';
                          e.currentTarget.style.background = 'rgba(0, 242, 254, 0.02)';
                        }}
                      >
                        <div style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '50%',
                          background: 'rgba(0, 242, 254, 0.1)',
                          color: 'var(--accent-cyan)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 10px auto'
                        }}>
                          <Upload size={22} />
                        </div>
                        <h4 style={{ color: '#ffffff', fontSize: '1.02rem', fontWeight: 800, marginBottom: '4px' }}>
                          Haz clic para seleccionar tu foto o arrástrala
                        </h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', maxWidth: '480px', margin: '0 auto 8px auto' }}>
                          Formatos JPG, PNG, WEBP, PDF o TIFF en orientación vertical, horizontal o cuadrada.
                        </p>
                        <span style={{
                          display: 'inline-block',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          padding: '3px 10px',
                          borderRadius: '16px',
                          fontSize: '0.72rem',
                          color: 'var(--accent-cyan)',
                          fontWeight: 700
                        }}>
                          ✨ Asesoría y revisión de resolución incluida
                        </span>
                      </div>
                    ) : (
                      <div style={{
                        background: 'rgba(4, 6, 9, 0.9)',
                        border: '1px solid rgba(0, 242, 254, 0.35)',
                        borderRadius: '14px',
                        padding: '14px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        flexWrap: 'wrap'
                      }}>
                        <div style={{
                          width: '90px',
                          height: '110px',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          background: '#000',
                          border: '1px solid rgba(0, 242, 254, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <img
                            src={poster.uploadedImage}
                            alt="Arte cargado"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        </div>

                        <div style={{ flex: 1, minWidth: '200px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <FileCheck size={16} color="#00f5a0" />
                            <span style={{ color: '#00f5a0', fontSize: '0.76rem', fontWeight: 800 }}>
                              IMAGEN CARGADA CORRECTAMENTE
                            </span>
                          </div>
                          <h4 style={{ color: '#fff', fontSize: '0.92rem', fontWeight: 800, marginBottom: '2px', wordBreak: 'break-all' }}>
                            {poster.imageDetails?.name}
                          </h4>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.76rem', margin: '0 0 8px 0' }}>
                            Tamaño: <strong>{poster.imageDetails?.size}</strong>
                          </p>

                          <button
                            type="button"
                            onClick={() => fileInputRefs.current[poster.id]?.click()}
                            style={{
                              background: 'rgba(0, 242, 254, 0.1)',
                              border: '1px solid rgba(0, 242, 254, 0.35)',
                              color: 'var(--accent-cyan)',
                              padding: '5px 12px',
                              borderRadius: '7px',
                              fontSize: '0.76rem',
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

                  {/* SECCIÓN 2: BASE / MATERIAL */}
                  <div style={{ marginBottom: '26px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                      <label style={{
                        fontSize: '0.84rem',
                        fontWeight: 800,
                        color: 'var(--accent-cyan)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Layers size={16} />
                        <span>2. Selecciona el Tipo de Base / Material:</span>
                      </label>

                      {!poster.baseMaterial && (
                        <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertCircle size={13} />
                          Elige una opción
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                      
                      {/* Opción 1: MDF 5.5 mm */}
                      <div
                        onClick={() => handleUpdatePoster(poster.id, { baseMaterial: 'mdf' })}
                        style={{
                          padding: '16px 18px',
                          borderRadius: '14px',
                          background: poster.baseMaterial === 'mdf' ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                          border: poster.baseMaterial === 'mdf' ? '2px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.08)',
                          cursor: 'pointer',
                          transition: 'all 0.25s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              border: poster.baseMaterial === 'mdf' ? '5px solid var(--accent-cyan)' : '2px solid rgba(255, 255, 255, 0.3)',
                              background: '#000'
                            }} />
                            <span style={{ fontWeight: 800, color: poster.baseMaterial === 'mdf' ? '#fff' : 'var(--text-secondary)', fontSize: '0.98rem' }}>
                              Madera MDF de 5.5 mm
                            </span>
                          </div>
                          <span style={{
                            background: 'rgba(0, 242, 254, 0.18)',
                            color: 'var(--accent-cyan)',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: '5px'
                          }}>
                            ESTÁNDAR
                          </span>
                        </div>

                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                          Cuadro rígido clásico sobre <strong>madera MDF de 5.5 mm</strong> con vinil laminado de alta protección.
                        </p>

                        <div style={{ fontSize: '0.74rem', color: '#00f5a0', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Check size={13} />
                          <span>Incluye cinta de montaje & empaque</span>
                        </div>
                      </div>

                      {/* Opción 2: PVC 5 mm */}
                      <div
                        onClick={() => handleUpdatePoster(poster.id, { baseMaterial: 'pvc' })}
                        style={{
                          padding: '16px 18px',
                          borderRadius: '14px',
                          background: poster.baseMaterial === 'pvc' ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                          border: poster.baseMaterial === 'pvc' ? '2px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.08)',
                          cursor: 'pointer',
                          transition: 'all 0.25s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              border: poster.baseMaterial === 'pvc' ? '5px solid var(--accent-cyan)' : '2px solid rgba(255, 255, 255, 0.3)',
                              background: '#000'
                            }} />
                            <span style={{ fontWeight: 800, color: poster.baseMaterial === 'pvc' ? '#fff' : 'var(--text-secondary)', fontSize: '0.98rem' }}>
                              PVC Espumado 5 mm
                            </span>
                          </div>
                          <span style={{
                            background: 'rgba(56, 189, 248, 0.18)',
                            color: 'var(--accent-blue)',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: '5px'
                          }}>
                            💧 IMPERMEABLE
                          </span>
                        </div>

                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                          Base de <strong>PVC espumado de 5 mm</strong> ultra ligera y 100% resistente al agua y a la humedad.
                        </p>

                        <div style={{ fontSize: '0.74rem', color: 'var(--accent-cyan)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Droplets size={13} />
                          <span>+Q 15.00 • Resistente al agua</span>
                        </div>
                      </div>

                      {/* Opción 3: Solo Vinil */}
                      <div
                        onClick={() => handleUpdatePoster(poster.id, { baseMaterial: 'vinyl_only' })}
                        style={{
                          padding: '16px 18px',
                          borderRadius: '14px',
                          background: poster.baseMaterial === 'vinyl_only' ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                          border: poster.baseMaterial === 'vinyl_only' ? '2px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.08)',
                          cursor: 'pointer',
                          transition: 'all 0.25s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              border: poster.baseMaterial === 'vinyl_only' ? '5px solid var(--accent-cyan)' : '2px solid rgba(255, 255, 255, 0.3)',
                              background: '#000'
                            }} />
                            <span style={{ fontWeight: 800, color: poster.baseMaterial === 'vinyl_only' ? '#fff' : 'var(--text-secondary)', fontSize: '0.98rem' }}>
                              Solo Impresión en Vinil
                            </span>
                          </div>
                          <span style={{
                            background: 'rgba(0, 245, 160, 0.18)',
                            color: '#00f5a0',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: '5px'
                          }}>
                            50% DE VALOR
                          </span>
                        </div>

                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                          Impresión en <strong>vinil adhesivo HD sin base rígida</strong>. Ideal para enmarcar por tu cuenta.
                        </p>

                        <div style={{ fontSize: '0.74rem', color: '#00f5a0', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Check size={13} />
                          <span>Exactamente la mitad del precio regular</span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* SECCIÓN 3: DIMENSIONES & MEDIDAS */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <label style={{
                          fontSize: '0.84rem',
                          fontWeight: 800,
                          color: 'var(--accent-cyan)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <Ruler size={16} />
                          <span>3. Dimensiones & Medidas:</span>
                        </label>
                        {!posterCalc.hasSize && (
                          <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700 }}>
                            (Elige un tamaño)
                          </span>
                        )}
                      </div>

                      {/* Tabs Switch */}
                      <div style={{
                        background: 'rgba(0, 0, 0, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        padding: '3px',
                        display: 'flex',
                        gap: '3px'
                      }}>
                        <button
                          type="button"
                          onClick={() => handleUpdatePoster(poster.id, { sizeMode: 'standard' })}
                          style={{
                            background: poster.sizeMode === 'standard' ? 'var(--accent-cyan)' : 'transparent',
                            color: poster.sizeMode === 'standard' ? '#000' : '#fff',
                            border: 'none',
                            padding: '5px 12px',
                            borderRadius: '6px',
                            fontSize: '0.76rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          Tamaños Estándar
                        </button>

                        <button
                          type="button"
                          onClick={() => handleUpdatePoster(poster.id, { sizeMode: 'custom' })}
                          style={{
                            background: poster.sizeMode === 'custom' ? 'var(--accent-cyan)' : 'transparent',
                            color: poster.sizeMode === 'custom' ? '#000' : '#fff',
                            border: 'none',
                            padding: '5px 12px',
                            borderRadius: '6px',
                            fontSize: '0.76rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          📐 Medida Especial
                        </button>
                      </div>
                    </div>

                    {/* MODO A: TAMAÑOS ESTÁNDAR */}
                    {poster.sizeMode === 'standard' && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                        {OFFICIAL_SIZES.map((size) => {
                          const isSelected = poster.selectedStandardSize?.id === size.id;
                          const calculatedCardPrice = getCardPriceForMaterial(size.price, poster.baseMaterial);

                          return (
                            <div
                              key={size.id}
                              onClick={() => handleUpdatePoster(poster.id, { selectedStandardSize: size })}
                              style={{
                                padding: '12px 14px',
                                borderRadius: '10px',
                                background: isSelected ? 'rgba(0, 242, 254, 0.14)' : 'rgba(255, 255, 255, 0.02)',
                                border: isSelected ? '2px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.07)',
                                cursor: 'pointer',
                                transition: 'all 0.25s ease'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.9rem', marginBottom: '2px' }}>
                                <span style={{ color: isSelected ? 'var(--accent-cyan)' : '#fff' }}>{size.name}</span>
                                <span style={{ color: isSelected ? '#00f2fe' : 'var(--text-secondary)' }}>
                                  Q {calculatedCardPrice.toFixed(2)}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                {size.dimensions}
                              </div>
                              <div style={{ fontSize: '0.68rem', color: isSelected ? 'rgba(0, 242, 254, 0.9)' : 'rgba(255, 255, 255, 0.35)', marginTop: '2px' }}>
                                {size.badge}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* MODO B: COTIZADOR DE MEDIDAS ESPECIALES */}
                    {poster.sizeMode === 'custom' && (
                      <div style={{
                        background: 'rgba(4, 6, 9, 0.8)',
                        border: '1px solid rgba(0, 242, 254, 0.25)',
                        borderRadius: '14px',
                        padding: '18px'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '14px',
                          color: 'var(--accent-cyan)',
                          fontSize: '0.8rem',
                          fontWeight: 700
                        }}>
                          <Info size={15} />
                          <span>Ingresa el ancho y alto en centímetros para calcular tu precio al instante:</span>
                        </div>

                        {/* Inputs de Ancho y Alto */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                          gap: '14px',
                          marginBottom: '14px'
                        }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#ffffff', marginBottom: '6px' }}>
                              Ancho (Centímetros):
                            </label>
                            <div style={{ position: 'relative' }}>
                              <input
                                type="number"
                                min="10"
                                max="300"
                                placeholder="Ej. 50"
                                value={poster.customWidth}
                                onChange={(e) => handleUpdatePoster(poster.id, { customWidth: e.target.value })}
                                style={{
                                  width: '100%',
                                  padding: '10px 36px 10px 12px',
                                  borderRadius: '8px',
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  border: '1px solid rgba(0, 242, 254, 0.35)',
                                  color: '#fff',
                                  fontSize: '1rem',
                                  fontWeight: 800,
                                  outline: 'none'
                                }}
                              />
                              <span style={{ position: 'absolute', right: '12px', top: '10px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700 }}>
                                cm
                              </span>
                            </div>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#ffffff', marginBottom: '6px' }}>
                              Alto (Centímetros):
                            </label>
                            <div style={{ position: 'relative' }}>
                              <input
                                type="number"
                                min="10"
                                max="300"
                                placeholder="Ej. 70"
                                value={poster.customHeight}
                                onChange={(e) => handleUpdatePoster(poster.id, { customHeight: e.target.value })}
                                style={{
                                  width: '100%',
                                  padding: '10px 36px 10px 12px',
                                  borderRadius: '8px',
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  border: '1px solid rgba(0, 242, 254, 0.35)',
                                  color: '#fff',
                                  fontSize: '1rem',
                                  fontWeight: 800,
                                  outline: 'none'
                                }}
                              />
                              <span style={{ position: 'absolute', right: '12px', top: '10px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700 }}>
                                cm
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Presets */}
                        <div style={{ marginBottom: '14px' }}>
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                            Medidas personalizadas populares:
                          </span>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {customPresets.map((preset, idx) => {
                              const isPresetActive = Number(poster.customWidth) === preset.w && Number(poster.customHeight) === preset.h;
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleUpdatePoster(poster.id, { customWidth: preset.w, customHeight: preset.h })}
                                  style={{
                                    background: isPresetActive ? 'rgba(0, 242, 254, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                                    border: isPresetActive ? '1px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.08)',
                                    color: isPresetActive ? 'var(--accent-cyan)' : '#fff',
                                    padding: '5px 10px',
                                    borderRadius: '6px',
                                    fontSize: '0.74rem',
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

                        {/* Breakdown Banner */}
                        <div style={{
                          background: 'rgba(0, 242, 254, 0.05)',
                          border: '1px solid rgba(0, 242, 254, 0.18)',
                          borderRadius: '10px',
                          padding: '10px 14px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '10px'
                        }}>
                          <div>
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'block' }}>
                              Área de Impresión:
                            </span>
                            <strong style={{ color: '#fff', fontSize: '0.95rem' }}>
                              {posterCalc.customArea > 0 ? `${poster.customWidth} x ${poster.customHeight} cm = ${posterCalc.customArea.toLocaleString()} cm²` : 'Ingresa ancho y alto'}
                            </strong>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'block' }}>
                              {posterCalc.customArea > 0 ? `Precio (${posterCalc.customArea.toLocaleString()} cm²):` : 'Precio Estimado:'}
                            </span>
                            <strong style={{ color: 'var(--accent-cyan)', fontSize: '0.98rem' }}>
                              {posterCalc.unitPrice > 0 ? `Q ${posterCalc.unitPrice.toFixed(2)} unitario` : 'Q 0.00'}
                            </strong>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>

                  {/* SECCIÓN 4: CANTIDAD & NOTAS */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '14px'
                  }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                        4. Cantidad de Unidades:
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => handleUpdatePoster(poster.id, { quantity: Math.max(1, (poster.quantity || 1) - 1) })}
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#fff',
                            fontSize: '1.1rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          -
                        </button>
                        <span style={{ fontWeight: 900, fontSize: '1.15rem', minWidth: '30px', textAlign: 'center', color: '#fff' }}>
                          {poster.quantity || 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdatePoster(poster.id, { quantity: (poster.quantity || 1) + 1 })}
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#fff',
                            fontSize: '1.1rem',
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
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                        Nota Opcional / Indicación:
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Vertical, foto familiar, marco específico..."
                        value={poster.customNote || ''}
                        onChange={(e) => handleUpdatePoster(poster.id, { customNote: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          color: '#fff',
                          fontSize: '0.84rem',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                </div>
              );
            })}

            {/* BOTÓN: AGREGAR OTRA IMAGEN / PÓSTER PERSONALIZADO */}
            <div style={{ textAlign: 'center', margin: '24px 0 32px 0' }}>
              <button
                type="button"
                onClick={handleAddPoster}
                style={{
                  background: 'rgba(0, 242, 254, 0.06)',
                  border: '2px dashed var(--accent-cyan)',
                  color: 'var(--accent-cyan)',
                  padding: '13px 26px',
                  borderRadius: '12px',
                  fontSize: '0.94rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.25s ease',
                  boxShadow: '0 4px 18px rgba(0, 242, 254, 0.08)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(0, 242, 254, 0.14)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(0, 242, 254, 0.06)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Plus size={18} />
                <span>Agregar Otra Imagen / Póster</span>
              </button>
            </div>

            {/* SECCIÓN FINAL: RESUMEN TOTAL DE LA COTIZACIÓN & BOTÓN DE WHATSAPP */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(4, 8, 14, 0.98) 0%, rgba(9, 18, 30, 0.95) 100%)',
              border: '2px solid rgba(0, 242, 254, 0.4)',
              borderRadius: '18px',
              padding: '24px 28px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '20px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7)'
            }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Resumen de tu Cotización ({totalUnits} {totalUnits === 1 ? 'cuadro' : 'cuadros'} en {postersList.length} {postersList.length === 1 ? 'diseño' : 'diseños'}):
                </div>
                
                <div style={{ fontSize: '0.92rem', color: allConfigured ? '#ffffff' : '#f59e0b', fontWeight: 700, marginBottom: '6px' }}>
                  {!allConfigured ? (
                    '👉 Configura la base y tamaño de todos los pósters arriba para calcular el total'
                  ) : (
                    postersList.map((p, i) => {
                      const matLabel = p.baseMaterial === 'mdf' ? 'MDF 5.5mm' : p.baseMaterial === 'pvc' ? 'PVC 5mm' : 'Solo Vinil';
                      const sizeLabel = p.sizeMode === 'standard' ? p.selectedStandardSize?.name : `${p.customWidth}x${p.customHeight}cm`;
                      return `#${i + 1}: ${sizeLabel} (${matLabel})`;
                    }).join('  •  ')
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '2.4rem', fontWeight: 900, color: allConfigured ? 'var(--accent-cyan)' : 'var(--text-muted)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                    Q {totalOrderPrice.toFixed(2)}
                  </span>
                  {allConfigured && (
                    <span style={{ fontSize: '0.74rem', color: '#00f5a0', fontWeight: 700 }}>
                      ✓ Cinta Tesa de montaje incluida en cuadros rígidos
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleWhatsAppQuote}
                disabled={!allConfigured || isSubmitting}
                className="btn-cyan"
                style={{
                  padding: '14px 28px',
                  fontSize: '0.98rem',
                  fontWeight: 800,
                  boxShadow: allConfigured && !isSubmitting ? '0 8px 25px rgba(0, 242, 254, 0.4)' : 'none',
                  borderRadius: '12px',
                  opacity: allConfigured && !isSubmitting ? 1 : 0.65,
                  cursor: allConfigured && !isSubmitting ? 'pointer' : 'not-allowed',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <MessageSquare size={19} />
                <span>
                  {isSubmitting 
                    ? '⏳ Registrando cotización...' 
                    : allConfigured 
                      ? 'Pedir por WhatsApp' 
                      : 'Selecciona tus opciones para cotizar'}
                </span>
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* 4. Quality Guarantees Row */}
      <section style={{ padding: '50px 0', position: 'relative' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '18px'
          }}>
            <div className="glass-card" style={{ padding: '22px', textAlign: 'center' }}>
              <Shield size={28} color="var(--accent-cyan)" style={{ margin: '0 auto 10px auto' }} />
              <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 800, marginBottom: '4px' }}>
                Sin Pedido Mínimo
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
                Fabricamos desde 1 sola pieza hasta colecciones completas y pedidos corporativos.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '22px', textAlign: 'center' }}>
              <Clock size={28} color="var(--accent-cyan)" style={{ margin: '0 auto 10px auto' }} />
              <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 800, marginBottom: '4px' }}>
                Entrega Rápida
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
                Fabricación garantizada en un máximo de 3 días hábiles tras confirmar tu diseño.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '22px', textAlign: 'center' }}>
              <Truck size={28} color="var(--accent-cyan)" style={{ margin: '0 auto 10px auto' }} />
              <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 800, marginBottom: '4px' }}>
                Pago Contra Entrega
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
                Facilidad y seguridad: 50% de anticipo para iniciar y 50% al recibir tu paquete.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '22px', textAlign: 'center' }}>
              <CheckCircle2 size={28} color="var(--accent-cyan)" style={{ margin: '0 auto 10px auto' }} />
              <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 800, marginBottom: '4px' }}>
                Cinta Tesa Incluida
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
                En cuadros completos (MDF o PVC) recibes tu cuadro listo para colocar sin clavos.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
