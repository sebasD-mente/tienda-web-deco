import React, { useState, useEffect, useRef, useId } from 'react';
import {
  X, ShoppingBag, MessageSquare, Check, Share2,
  User, Phone, MapPin, AlertCircle, ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { OFFICIAL_SIZES } from '../data/catalogData';
import { getPosterAvailableSizes, getPosterCategoryName } from '../utils/posterHelpers';
import { generateWhatsAppLink } from '../config/constants';

const GUATEMALA_DEPARTMENTS = [
  { value: 'Guatemala', label: 'Guatemala (Capital y Municipios)' },
  { value: 'Sacatepéquez', label: 'Sacatepéquez (Antigua)' },
  { value: 'Chimaltenango', label: 'Chimaltenango' },
  { value: 'Escuintla', label: 'Escuintla' },
  { value: 'Quetzaltenango', label: 'Quetzaltenango' },
  { value: 'Alta Verapaz', label: 'Alta Verapaz' },
  { value: 'Baja Verapaz', label: 'Baja Verapaz' },
  { value: 'Chiquimula', label: 'Chiquimula' },
  { value: 'El Progreso', label: 'El Progreso' },
  { value: 'Huehuetenango', label: 'Huehuetenango' },
  { value: 'Izabal', label: 'Izabal' },
  { value: 'Jalapa', label: 'Jalapa' },
  { value: 'Jutiapa', label: 'Jutiapa' },
  { value: 'Petén', label: 'Petén' },
  { value: 'Quiché', label: 'Quiché' },
  { value: 'Retalhuleu', label: 'Retalhuleu' },
  { value: 'San Marcos', label: 'San Marcos' },
  { value: 'Santa Rosa', label: 'Santa Rosa' },
  { value: 'Sololá', label: 'Sololá' },
  { value: 'Suchitepéquez', label: 'Suchitepéquez' },
  { value: 'Totonicapán', label: 'Totonicapán' },
  { value: 'Zacapa', label: 'Zacapa' }
];

function resolveAbsoluteAssetUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const origin = (typeof window !== 'undefined' && window.location?.origin)
    ? window.location.origin
    : 'https://decovintage.online';
  return `${origin}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}

export default function ProductModal({ poster, onClose, onAddToCart, onQuickWhatsApp, onOpenCart }) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Mini-formulario de compra rápida por WhatsApp (WEB_QUICK_POSTER)
  const [showQuickForm, setShowQuickForm] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerDept, setCustomerDept] = useState('Guatemala');
  const [quickErrors, setQuickErrors] = useState({ name: '', phone: '' });
  const [isSubmittingQuick, setIsSubmittingQuick] = useState(false);

  const quickNameRef = useRef(null);
  const quickPhoneRef = useRef(null);
  const fieldIdPrefix = useId();

  const availableSizes = getPosterAvailableSizes(poster);

  const [selectedSizeId, setSelectedSizeId] = useState(
    availableSizes.find(s => s.id === 'GRANDE')?.id || availableSizes[0]?.id || 'MEDIANO'
  );

  useEffect(() => {
    if (poster) {
      const valid = getPosterAvailableSizes(poster);
      if (!valid.some(s => s.id === selectedSizeId)) {
        setSelectedSizeId(valid.find(s => s.id === 'GRANDE')?.id || valid[0]?.id || 'MEDIANO');
      }
      setQuantity(1);
      setAdded(false);
      setCopiedLink(false);
      setShowQuickForm(false);
      setQuickErrors({ name: '', phone: '' });
      setIsSubmittingQuick(false);
    }
  }, [poster]);

  if (!poster) return null;

  const selectedSize = availableSizes.find(s => s.id === selectedSizeId) || availableSizes[0] || OFFICIAL_SIZES[0];
  const currentPrice = selectedSize.price * quantity;
  const deposit50 = currentPrice * 0.5;

  const handleSharePoster = async () => {
    const posterKey = poster.legacyId || poster.id;
    const shareUrl = `${window.location.origin}/poster/${encodeURIComponent(posterKey)}`;
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(shareUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
        return;
      }
    } catch (_) {}
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${poster.title} | Deco Vintage Guate`,
          text: `Mira este póster en madera MDF 5.5mm: ${poster.title}`,
          url: shareUrl
        });
      } catch (_) {}
    }
  };

  const handleAdd = () => {
    onAddToCart({
      poster,
      size: selectedSize,
      price: selectedSize.price,
      quantity
    });

    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#00f2fe', '#38bdf8', '#00f5a0']
    });

    setAdded(true);
  };

  const handleOpenQuickWhatsAppForm = () => {
    setShowQuickForm(true);
    setQuickErrors({ name: '', phone: '' });
    setTimeout(() => {
      quickNameRef.current?.focus();
    }, 0);
  };

  const handleConfirmQuickWhatsApp = async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    if (isSubmittingQuick) return;

    const cleanName = customerName.trim();
    const cleanPhone = customerPhone.trim();
    const phoneDigits = cleanPhone.replace(/\D/g, '');
    const cleanAddress = customerAddress.trim();
    const cleanDept = customerDept || 'Guatemala';

    const nameErr = cleanName.length < 2
      ? 'Ingresa tu nombre (mínimo 2 caracteres).'
      : '';
    const phoneErr = phoneDigits.length < 8
      ? 'Ingresa tu número de WhatsApp (mínimo 8 dígitos).'
      : '';

    if (nameErr || phoneErr) {
      setQuickErrors({ name: nameErr, phone: phoneErr });
      if (nameErr) {
        quickNameRef.current?.focus();
      } else {
        quickPhoneRef.current?.focus();
      }
      return;
    }

    setQuickErrors({ name: '', phone: '' });
    setIsSubmittingQuick(true);

    let registeredOrderNumber = null;
    const posterCode = poster.legacyId || poster.id;
    const rawImg = poster.image || poster.imageUrl || poster.thumb || poster.thumbUrl || '';
    const rawThumb = poster.thumb || poster.thumbUrl || poster.image || poster.imageUrl || '';
    const absImageUrl = resolveAbsoluteAssetUrl(rawImg);
    const absThumbUrl = resolveAbsoluteAssetUrl(rawThumb);

    try {
      const orderPayload = {
        orderSource: 'WEB_QUICK_POSTER',
        customerName: cleanName,
        customerPhone: cleanPhone,
        customerAddress: cleanAddress || null,
        customerDepartment: cleanDept,
        customerNotes: `Compra rápida web | Cliente: ${cleanName} | Entrega: ${cleanAddress || 'Por coordinar'} (${cleanDept})`,
        totalPrice: currentPrice,
        totalUnits: quantity,
        items: [
          {
            isCustom: false,
            posterId: poster.id || null,
            legacyId: poster.legacyId || null,
            sku: posterCode ? 'WEB-' + posterCode : null,
            title: poster.title || 'Obra Catálogo',
            sizeMode: 'standard',
            selectedStandardSize: {
              id: selectedSize.id || null,
              name: selectedSize.name || 'Estándar',
              dimensions: selectedSize.dimensions || '',
              price: Number(selectedSize.price) || 0
            },
            baseMaterial: 'mdf',
            quantity,
            unitPrice: Number(selectedSize.price) || 0,
            totalPrice: currentPrice,
            imageUrl: absImageUrl,
            thumbUrl: absThumbUrl
          }
        ]
      };

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch('/api/custom-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json().catch(() => null);
          if (data && data.orderNumber) {
            registeredOrderNumber = data.orderNumber;
          }
        }
      } catch (err) {
        console.warn('[ProductModal] Registro WEB_QUICK_POSTER en DB con fallback directo a WhatsApp:', err);
      }

      const orderHeaderTag = registeredOrderNumber ? ` (#${registeredOrderNumber})` : '';
      const orderIdLine = registeredOrderNumber ? `🔖 *Código de Orden:* #${registeredOrderNumber}\n` : '';

      const message = `👋 *¡Hola Deco Vintage! Quiero ordenar esta obra desde la web${orderHeaderTag}:*\n` +
        `──────────────────────────────────────\n` +
        orderIdLine +
        `👤 *Cliente:* ${cleanName}\n` +
        `📱 *Teléfono / WhatsApp:* ${cleanPhone}\n` +
        `📍 *Ubicación / Depto:* ${cleanAddress || 'Por coordinar'} (${cleanDept})\n` +
        `──────────────────────────────────────\n` +
        `🖼️ *Póster:* ${poster.title}\n` +
        `📐 *Tamaño:* ${selectedSize.name} (${selectedSize.dimensions}) — Madera MDF 5.5mm\n` +
        `🔢 *Cantidad:* ${quantity} unidad(es) (Q${(Number(selectedSize.price) || 0).toFixed(2)} c/u)\n` +
        `💰 *Total a Pagar:* Q${currentPrice.toFixed(2)}\n` +
        `💳 *Anticipo 50%:* Q${deposit50.toFixed(2)} | *Saldo contra entrega:* Q${deposit50.toFixed(2)}\n` +
        (absImageUrl ? `🔗 *Ver Diseño:* ${absImageUrl}\n` : '') +
        `──────────────────────────────────────\n` +
        `¿Me comparten los datos para confirmar mi pedido${orderHeaderTag} con el anticipo del 50%?`;

      if (typeof onQuickWhatsApp === 'function') {
        onQuickWhatsApp({
          poster,
          size: selectedSize,
          price: currentPrice,
          quantity,
          orderNumber: registeredOrderNumber,
          customer: {
            fullName: cleanName,
            phone: cleanPhone,
            address: cleanAddress || null,
            department: cleanDept
          },
          message
        });
      } else {
        const waUrl = generateWhatsAppLink(message);
        const newWindow = window.open(waUrl, '_blank');
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          window.location.href = waUrl;
        }
      }

      setShowQuickForm(false);
    } finally {
      setIsSubmittingQuick(false);
    }
  };

  const quickFormPanelId = `${fieldIdPrefix}-quick-order-panel`;
  const modalTitleId = `${fieldIdPrefix}-poster-modal-title`;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalTitleId}
        className="glass-card product-modal-card"
        style={{
          width: '100%',
          maxWidth: '960px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '0',
          position: 'relative',
          border: '2px solid rgba(0, 242, 254, 0.45)',
          background: '#090d16',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(0, 242, 254, 0.2)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar detalle de póster"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.7)',
            border: '1px solid var(--border-subtle)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-cyan)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
        >
          <X size={18} aria-hidden="true" />
        </button>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '0'
        }}>

          {/* Left Column: Image (Top-Justified, Uncropped Full Ratio) & Description Underneath */}
          <div style={{
            background: 'radial-gradient(circle at top, #0c121e 0%, #04060a 100%)',
            padding: '28px 24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'center',
            borderRight: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            {/* Poster Image Frame */}
            <div style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 15px 40px rgba(0, 0, 0, 0.85), 0 0 25px rgba(0, 242, 254, 0.2)',
              border: '2px solid rgba(0, 242, 254, 0.35)',
              padding: '8px',
              background: '#040609',
              marginBottom: '18px'
            }}>
              <img
                src={poster.image || poster.thumb}
                alt={poster.title}
                style={{
                  maxWidth: '100%',
                  maxHeight: '380px',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  display: 'block',
                  borderRadius: '6px'
                }}
              />
            </div>

            {/* Poster Description Box Underneath the Image */}
            {poster.description && (
              <div style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.025)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '10px',
                padding: '14px 16px',
                boxSizing: 'border-box'
              }}>
                <div style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: 'var(--accent-cyan)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '6px'
                }}>
                  Detalles de la Obra
                </div>
                <p style={{
                  fontSize: '0.84rem',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.55',
                  margin: 0
                }}>
                  {poster.description}
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Details, Size Picker & Purchase Controls */}
          <div style={{
            padding: '28px 30px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start'
          }}>

            {/* Category Badge & Share Direct Link Button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px', paddingRight: '34px' }}>
              <span className="badge-cyan" style={{ fontSize: '0.72rem', padding: '2px 10px', textTransform: 'uppercase' }}>
                {getPosterCategoryName(poster)}
              </span>
              <button
                type="button"
                onClick={handleSharePoster}
                title="Copiar enlace directo a esta obra"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 11px',
                  borderRadius: '999px',
                  background: copiedLink ? 'rgba(0, 245, 160, 0.14)' : 'rgba(0, 242, 254, 0.08)',
                  border: copiedLink ? '1px solid rgba(0, 245, 160, 0.45)' : '1px solid rgba(0, 242, 254, 0.28)',
                  color: copiedLink ? '#00f5a0' : 'var(--accent-cyan)',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {copiedLink ? <Check size={13} aria-hidden="true" /> : <Share2 size={13} aria-hidden="true" />}
                <span>{copiedLink ? '¡Enlace copiado!' : 'Compartir obra'}</span>
              </button>
            </div>

            {/* Main Title & Subtitle */}
            <h2 id={modalTitleId} style={{ fontSize: '1.55rem', fontWeight: 900, color: '#fff', marginBottom: '4px', lineHeight: 1.2 }}>
              {poster.title}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              {poster.subtitle}
            </p>

            {/* Official Sizes Section */}
            <div style={{ marginBottom: '18px' }}>
              {availableSizes.length === 1 ? (
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-cyan)', marginBottom: '8px' }}>
                    Tamaño Disponible:
                  </span>
                  <div style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(0, 242, 254, 0.12)',
                    border: '2px solid var(--accent-cyan)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--accent-cyan)' }}>
                        {availableSizes[0].name} ({availableSizes[0].dimensions})
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {availableSizes[0].badge || (availableSizes[0].dimensions?.includes('30 x 30') ? 'Formato Cuadrado Oficial' : 'Formato Oficial')}
                      </div>
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#00f2fe' }}>
                      Q {availableSizes[0].price.toFixed(2)}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-cyan)', marginBottom: '8px' }}>
                    Selecciona tu Tamaño Oficial ({availableSizes.length} disponibles):
                  </span>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {availableSizes.map((s) => {
                      const isSelected = selectedSize.id === s.id;
                      return (
                        <button
                          type="button"
                          key={s.id}
                          aria-pressed={isSelected}
                          onClick={() => setSelectedSizeId(s.id)}
                          style={{
                            padding: '9px 11px',
                            borderRadius: 'var(--radius-sm)',
                            background: isSelected ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                            border: isSelected ? '2px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            textAlign: 'left',
                            width: '100%'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.82rem' }}>
                            <span style={{ color: isSelected ? 'var(--accent-cyan)' : '#fff' }}>{s.name}</span>
                            <span style={{ color: '#00f2fe' }}>Q {s.price.toFixed(2)}</span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                            {s.dimensions}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Price & Quantity Box */}
            <div style={{
              background: 'rgba(6, 8, 14, 0.9)',
              padding: '15px 18px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block' }}>Total a Pagar:</span>
                  <span style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--accent-cyan)' }}>
                    Q {currentPrice.toFixed(2)}
                  </span>
                </div>

                {/* Quantity Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    aria-label="Disminuir cantidad"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: 'none',
                      color: '#fff',
                      fontSize: '1.1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    -
                  </button>
                  <span style={{ fontWeight: 800, fontSize: '1rem', minWidth: '20px', textAlign: 'center' }}>
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Aumentar cantidad"
                    onClick={() => setQuantity(quantity + 1)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: 'none',
                      color: '#fff',
                      fontSize: '1.1rem',
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
            </div>

            {/* Actions Buttons OR Inline Quick WhatsApp Form */}
            {added ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{
                  background: 'rgba(0, 245, 160, 0.12)',
                  border: '1px solid rgba(0, 245, 160, 0.4)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: '#00f5a0',
                  fontSize: '0.86rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  <Check size={18} aria-hidden="true" />
                  <span>¡Obra agregada al carrito con éxito!</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenCart) onOpenCart();
                      else onClose();
                    }}
                    className="btn-cyan"
                    style={{ justifyContent: 'center', padding: '13px 14px', fontSize: '0.88rem' }}
                  >
                    <ShoppingBag size={18} aria-hidden="true" />
                    <span>Ir al Carrito</span>
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-secondary"
                    style={{ justifyContent: 'center', padding: '13px 14px', fontSize: '0.88rem' }}
                  >
                    <span>Seguir Comprando</span>
                  </button>
                </div>
              </div>
            ) : showQuickForm ? (
              <form
                id={quickFormPanelId}
                onSubmit={handleConfirmQuickWhatsApp}
                noValidate
                style={{
                  background: 'rgba(6, 12, 22, 0.95)',
                  border: '1px solid rgba(37, 211, 102, 0.45)',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#25d366', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Datos Rápidos para tu Pedido por WhatsApp
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowQuickForm(false)}
                    disabled={isSubmittingQuick}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Volver
                  </button>
                </div>

                {/* Tu Nombre * */}
                <div>
                  <label
                    htmlFor={`${fieldIdPrefix}-quick-name`}
                    style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}
                  >
                    Tu Nombre <span style={{ color: '#25d366' }} aria-hidden="true">*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      ref={quickNameRef}
                      id={`${fieldIdPrefix}-quick-name`}
                      name="customerName"
                      type="text"
                      autoComplete="name"
                      enterKeyHint="next"
                      required
                      minLength={2}
                      aria-invalid={quickErrors.name ? 'true' : undefined}
                      aria-describedby={quickErrors.name ? `${fieldIdPrefix}-quick-name-err` : undefined}
                      placeholder="Ej. Andrea Morales"
                      value={customerName}
                      onChange={e => {
                        const val = e.target.value;
                        setCustomerName(val);
                        if (quickErrors.name && val.trim().length >= 2) {
                          setQuickErrors(prev => ({ ...prev, name: '' }));
                        }
                      }}
                      className="quick-order-input"
                      style={{
                        width: '100%',
                        padding: '9px 12px 9px 34px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: quickErrors.name ? '1px solid #f87171' : '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#fff',
                        fontSize: '1rem',
                        boxSizing: 'border-box'
                      }}
                    />
                    <User size={15} color={quickErrors.name ? '#f87171' : 'var(--text-muted)'} aria-hidden="true" style={{ position: 'absolute', left: '10px', top: '12px', pointerEvents: 'none' }} />
                  </div>
                  {quickErrors.name && (
                    <div
                      id={`${fieldIdPrefix}-quick-name-err`}
                      role="alert"
                      style={{ marginTop: '4px', color: '#fca5a5', fontSize: '0.73rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <AlertCircle size={12} aria-hidden="true" style={{ flexShrink: 0 }} />
                      <span>{quickErrors.name}</span>
                    </div>
                  )}
                </div>

                {/* Tu WhatsApp * */}
                <div>
                  <label
                    htmlFor={`${fieldIdPrefix}-quick-phone`}
                    style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}
                  >
                    Tu WhatsApp <span style={{ color: '#25d366' }} aria-hidden="true">*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      ref={quickPhoneRef}
                      id={`${fieldIdPrefix}-quick-phone`}
                      name="customerPhone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      enterKeyHint="next"
                      required
                      aria-invalid={quickErrors.phone ? 'true' : undefined}
                      aria-describedby={quickErrors.phone ? `${fieldIdPrefix}-quick-phone-err` : undefined}
                      placeholder="Ej. 5544 3322"
                      value={customerPhone}
                      onChange={e => {
                        const val = e.target.value;
                        setCustomerPhone(val);
                        if (quickErrors.phone && val.replace(/\D/g, '').length >= 8) {
                          setQuickErrors(prev => ({ ...prev, phone: '' }));
                        }
                      }}
                      className="quick-order-input"
                      style={{
                        width: '100%',
                        padding: '9px 12px 9px 34px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: quickErrors.phone ? '1px solid #f87171' : '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#fff',
                        fontSize: '1rem',
                        boxSizing: 'border-box'
                      }}
                    />
                    <Phone size={15} color={quickErrors.phone ? '#f87171' : 'var(--text-muted)'} aria-hidden="true" style={{ position: 'absolute', left: '10px', top: '12px', pointerEvents: 'none' }} />
                  </div>
                  {quickErrors.phone && (
                    <div
                      id={`${fieldIdPrefix}-quick-phone-err`}
                      role="alert"
                      style={{ marginTop: '4px', color: '#fca5a5', fontSize: '0.73rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <AlertCircle size={12} aria-hidden="true" style={{ flexShrink: 0 }} />
                      <span>{quickErrors.phone}</span>
                    </div>
                  )}
                </div>

                {/* Dirección y Departamento compactos */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                  <div>
                    <label
                      htmlFor={`${fieldIdPrefix}-quick-address`}
                      style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}
                    >
                      Dirección (Opcional)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id={`${fieldIdPrefix}-quick-address`}
                        name="customerAddress"
                        type="text"
                        autoComplete="street-address"
                        enterKeyHint="done"
                        placeholder="Zona / Municipio"
                        value={customerAddress}
                        onChange={e => setCustomerAddress(e.target.value)}
                        className="quick-order-input"
                        style={{
                          width: '100%',
                          padding: '9px 10px 9px 32px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.14)',
                          color: '#fff',
                          fontSize: '1rem',
                          boxSizing: 'border-box'
                        }}
                      />
                      <MapPin size={14} color="var(--text-muted)" aria-hidden="true" style={{ position: 'absolute', left: '10px', top: '12px', pointerEvents: 'none' }} />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor={`${fieldIdPrefix}-quick-dept`}
                      style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}
                    >
                      Departamento
                    </label>
                    <select
                      id={`${fieldIdPrefix}-quick-dept`}
                      name="customerDepartment"
                      autoComplete="address-level1"
                      value={customerDept}
                      onChange={e => setCustomerDept(e.target.value)}
                      className="quick-order-input"
                      style={{
                        width: '100%',
                        padding: '9px 10px',
                        borderRadius: '8px',
                        background: '#0a0f1d',
                        border: '1px solid rgba(255, 255, 255, 0.14)',
                        color: '#fff',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        cursor: 'pointer'
                      }}
                    >
                      {GUATEMALA_DEPARTMENTS.map(dept => (
                        <option key={dept.value} value={dept.value}>
                          {dept.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingQuick}
                  style={{
                    width: '100%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #25d366 0%, #16a34a 100%)',
                    color: '#04120a',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    fontFamily: 'var(--font-display)',
                    cursor: isSubmittingQuick ? 'not-allowed' : 'pointer',
                    opacity: isSubmittingQuick ? 0.75 : 1,
                    boxShadow: '0 4px 16px rgba(37, 211, 102, 0.3)',
                    marginTop: '2px'
                  }}
                >
                  <MessageSquare size={17} aria-hidden="true" />
                  <span>{isSubmittingQuick ? 'Registrando pedido...' : 'Confirmar y Abrir WhatsApp'}</span>
                  <ArrowRight size={15} aria-hidden="true" />
                </button>
              </form>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleAdd}
                  className="btn-cyan"
                  style={{ flex: 1, justifyContent: 'center', padding: '13px' }}
                >
                  <ShoppingBag size={18} aria-hidden="true" />
                  <span>Añadir al Carrito</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenQuickWhatsAppForm}
                  aria-expanded={showQuickForm}
                  aria-controls={quickFormPanelId}
                  className="btn-secondary"
                  style={{ padding: '13px 18px', borderColor: '#25d366', color: '#25d366' }}
                  title="Comprar por WhatsApp"
                >
                  <MessageSquare size={18} aria-hidden="true" />
                  <span>WhatsApp</span>
                </button>
              </div>
            )}

          </div>

        </div>

      </div>

      <style>{`
        .quick-order-input:focus-visible,
        .product-modal-card button:focus-visible {
          outline: 2px solid var(--accent-cyan);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
