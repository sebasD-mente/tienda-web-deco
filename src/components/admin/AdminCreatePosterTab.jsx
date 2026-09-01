import React, { useState, useRef, useEffect } from 'react';
import {
  Plus, Edit3, Check, Upload, Trash2,
  Image as ImageIcon, AlertCircle
} from 'lucide-react';
import { OFFICIAL_SIZES } from '../../data/catalogData';
import { optimizeImageFile } from '../../utils/imageOptimizer';
import { apiUploadPosterImage, apiDeletePosterImage } from '../../utils/apiClient';

export default function AdminCreatePosterTab({
  editingPoster = null,
  categories    = [],
  franchises    = [],
  onSavePoster,
  onCancel,
  onShowToast
}) {
  // ── Identificadores ──────────────────────────────────────────────────────────
  // pgId  = UUID de PostgreSQL (solo existe cuando estamos EDITANDO un póster ya guardado)
  // legId = legacyId (ID antiguo tipo "deco-xxxx" — conservado para compatibilidad)
  const [pgId,  setPgId]  = useState(null);
  const [legId, setLegId] = useState(null);

  // ── Campos del formulario ────────────────────────────────────────────────────
  const [title,        setTitle]        = useState('');
  const [subtitle,     setSubtitle]     = useState('');
  const [category,     setCategory]     = useState('AUTOS');
  const [franchiseId,  setFranchiseId]  = useState('');
  const [description,  setDescription]  = useState('');
  const [tagsInput,    setTagsInput]    = useState('');
  const [isFeatured,   setIsFeatured]   = useState(false);
  const [rating,       setRating]       = useState(5.0);
  const [reviewsCount, setReviewsCount] = useState(30);

  // Tamaños
  const STANDARD_5_SIZES = ['MINI', 'PEQUENO', 'MEDIANO', 'GRANDE', 'GIGANTE'];
  const [selectedSizeIds, setSelectedSizeIds] = useState(STANDARD_5_SIZES);

  // ── Estado de imagen ─────────────────────────────────────────────────────────
  // imageUrl  = URL final persistida en el VPS SSD (/posters/uploads/full/...) o URL existente
  // thumbUrl  = URL final del thumbnail
  // imageMeta = Datos informativos del archivo original (para mostrar al usuario)
  // _base64   = Blob base64 temporal en memoria (solo mientras se sube al servidor)
  //             Se limpia en cuanto el servidor confirma la subida.
  const [imageUrl,    setImageUrl]    = useState('');
  const [thumbUrl,    setThumbUrl]    = useState('');
  const [imageMeta,   setImageMeta]   = useState(null);
  const [_base64Full, set_base64Full] = useState('');  // temporal, no se envía a PG

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isUploading,  setIsUploading]  = useState(false);
  const [isSaving,     setIsSaving]     = useState(false);

  const fileInputRef = useRef(null);

  // ── Populate form when editing ───────────────────────────────────────────────
  useEffect(() => {
    if (editingPoster) {
      // Capturar ambos identificadores del póster existente
      setPgId(editingPoster.id     || null);
      setLegId(editingPoster.legacyId || null);

      setTitle(editingPoster.titulo        || editingPoster.title    || '');
      setSubtitle(editingPoster.subtitulo  || editingPoster.subtitle || '');
      setCategory(editingPoster.categoria  || editingPoster.category || 'AUTOS');
      setFranchiseId(editingPoster.franchiseId || editingPoster.franchise || '');
      setDescription(editingPoster.descripcion || editingPoster.description || '');
      setTagsInput((editingPoster.tags || []).join(', '));
      setIsFeatured(!!editingPoster.isFeatured);
      setRating(editingPoster.rating        || 5.0);
      setReviewsCount(editingPoster.reviewsCount || 25);

      // Imagen existente (ya está en el VPS SSD — no hay base64)
      setImageUrl(editingPoster.imageUrl   || editingPoster.image || '');
      setThumbUrl(editingPoster.thumbUrl   || editingPoster.thumb || '');
      set_base64Full('');
      setImageMeta(null);

      if (Array.isArray(editingPoster.sizes) && editingPoster.sizes.length > 0) {
        setSelectedSizeIds(editingPoster.sizes.map(s => s.sizeId || s.id));
      } else if (Array.isArray(editingPoster.availableSizes) && editingPoster.availableSizes.length > 0) {
        setSelectedSizeIds(editingPoster.availableSizes);
      } else {
        setSelectedSizeIds(STANDARD_5_SIZES);
      }
    } else {
      resetForm();
    }
  }, [editingPoster]);

  const resetForm = () => {
    setPgId(null);
    setLegId(null);
    setTitle('');
    setSubtitle('');
    setCategory('AUTOS');
    setFranchiseId('');
    setDescription('');
    setTagsInput('');
    setIsFeatured(false);
    setRating(5.0);
    setReviewsCount(30);
    setImageUrl('');
    setThumbUrl('');
    set_base64Full('');
    setImageMeta(null);
    setSelectedSizeIds(STANDARD_5_SIZES);
  };

  const toggleSizeId = (id) => {
    if (selectedSizeIds.includes(id)) {
      if (selectedSizeIds.length > 1) {
        setSelectedSizeIds(selectedSizeIds.filter(sId => sId !== id));
      } else {
        onShowToast('Debes seleccionar al menos un tamaño.', 'error');
      }
    } else {
      setSelectedSizeIds([...selectedSizeIds, id]);
    }
  };

  // ── Flujo de imagen: 2 pasos ─────────────────────────────────────────────────
  //
  // PASO 1 — Selección y optimización local (Canvas API):
  //   El archivo se optimiza en el navegador a un tamaño manejable.
  //   El resultado queda en _base64Full para ser enviado al servidor en PASO 2.
  //
  // PASO 2 — Subida al servidor (Sharp → WebP):
  //   Se ejecuta inmediatamente después del PASO 1.
  //   Si hay un pgId (modo edición), usamos el UUID de PostgreSQL como nombre de archivo.
  //   Si es un póster nuevo, usamos un ID temporal basado en el título.
  //   El servidor devuelve { image, thumb } con las rutas finales en el SSD.
  //   En ese momento setImageUrl/setThumbUrl se actualizan y _base64Full se limpia.
  //
  // RESULTADO: En el submit, imageUrl/thumbUrl ya son URLs del VPS SSD — nunca base64.

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // PASO 1: Optimización local
      setIsOptimizing(true);
      const result = await optimizeImageFile(file);
      set_base64Full(result.fullDataUrl);
      setImageMeta({
        originalSize: result.originalSizeKB,
        dimensions:   `${result.optimizedWidth}x${result.optimizedHeight}px`,
        name:         result.fileName
      });
      setIsOptimizing(false);

      // PASO 2: Subida al VPS con Sharp
      setIsUploading(true);

      // Si ya se había subido una imagen temporal en esta sesión que no era la original, purgarla de GCS
      if (imageUrl && (!editingPoster || (imageUrl !== editingPoster.image && imageUrl !== editingPoster.imageUrl))) {
        apiDeletePosterImage(imageUrl, thumbUrl).catch(() => {});
      }

      // Usamos el UUID de PG si existe (modo edición), o generamos un ID temporal
      const uploadId = pgId
        ? pgId
        : (title || 'obra').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36);

      const uploadRes = await apiUploadPosterImage(result.fullDataUrl, uploadId);

      if (uploadRes?.success && uploadRes.image) {
        setImageUrl(uploadRes.image);
        setThumbUrl(uploadRes.thumb || uploadRes.image);
        set_base64Full('');  // Limpiar base64 — ya no es necesario
        const storageDestination = uploadRes.image.startsWith('http') ? 'Google Cloud Storage' : 'servidor';
        onShowToast(`¡Imagen optimizada a WebP y guardada en ${storageDestination}!`, 'success');
      } else {
        // El servidor no confirmó la subida — conservar base64 como fallback
        // El backend puede procesar base64 en el POST/PUT si llega así
        onShowToast('Imagen optimizada localmente. Se guardará al publicar.', 'info');
      }
    } catch (err) {
      // Error en la subida independiente — el base64 sigue disponible para el submit
      console.warn('[AdminCreatePosterTab] Subida de imagen falló:', err.message);
      onShowToast('Error al subir imagen: ' + err.message + '. Se intentará al guardar.', 'error');
    } finally {
      setIsOptimizing(false);
      setIsUploading(false);
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      onShowToast('Ingresa un título para la obra.', 'error');
      return;
    }
    const finalImage = imageUrl || _base64Full;
    if (!finalImage) {
      onShowToast('Debes seleccionar o subir una imagen.', 'error');
      return;
    }

    setIsSaving(true);

    const sizesArray = selectedSizeIds
      .map(id => OFFICIAL_SIZES.find(s => s.id === id))
      .filter(Boolean);

    const minPrice = sizesArray.reduce((min, s) => s.price < min ? s.price : min, sizesArray[0]?.price || 25);
    const maxPrice = sizesArray.reduce((max, s) => s.price > max ? s.price : max, sizesArray[0]?.price || 210);

    const tagsArray = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    // Construir el payload normalizado que espera el backend de Prisma.
    // El backend acepta tanto los campos en español (titulo, imageUrl) como
    // en inglés (title, image). Usamos los campos en inglés que es lo que
    // tenemos del formulario, y el servicio catalogService.js los normaliza.
    const posterData = {
      // Si hay pgId, lo incluimos para que el orquestador (catalogStorage) sepa
      // que debe hacer PUT en lugar de POST.
      ...(pgId  && { pgId }),
      ...(legId && { legacyId: legId }),

      title:       title.trim(),
      subtitle:    subtitle.trim(),
      description: description.trim(),
      category,
      franchise:   franchiseId || null,
      franchiseId: franchiseId || null,
      tags:        tagsArray,
      isFeatured,
      rating:      Number(rating) || 5.0,
      reviewsCount: Number(reviewsCount) || 30,

      // Imagen: preferimos URL del VPS SSD; como fallback enviamos base64
      // (el backend lo convertirá a WebP con Sharp)
      image: imageUrl || _base64Full,
      thumb: thumbUrl || imageUrl || _base64Full,

      // Datos de precio calculados en cliente (el backend puede recalcularlos)
      priceDisplay: sizesArray.length === 1
        ? `Q${minPrice.toFixed(0)}`
        : `Desde Q${minPrice.toFixed(0)}`,
      priceRange:   `Q${minPrice.toFixed(0)} - Q${maxPrice.toFixed(0)}`,
      minPrice,
      sizes:        sizesArray,
      availableSizes: selectedSizeIds,
    };

    try {
      await onSavePoster(posterData);
      resetForm();
    } catch (err) {
      onShowToast('Error al guardar obra: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  const isEditMode = !!pgId;
  const isImageReady = !!(imageUrl || _base64Full);
  const imagePreviewSrc = thumbUrl || imageUrl || _base64Full;

  const handleCancelForm = () => {
    if (imageUrl && (!editingPoster || (imageUrl !== editingPoster.image && imageUrl !== editingPoster.imageUrl))) {
      apiDeletePosterImage(imageUrl, thumbUrl).catch(() => {});
    }
    resetForm();
    if (onCancel) onCancel();
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div className="glass-card" style={{ padding: 'clamp(18px, 4vw, 32px)', marginBottom: '30px' }}>

        {/* Form Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid rgba(0, 242, 254, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isEditMode ? <Edit3 size={24} color="var(--accent-cyan)" /> : <Plus size={24} color="var(--accent-cyan)" />}
            <h2 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 800, color: '#fff', margin: 0 }}>
              {isEditMode ? 'Editar Obra en el Catálogo' : 'Agregar Nueva Obra al Catálogo'}
            </h2>
          </div>

          {isEditMode && (
            <button
              type="button"
              onClick={handleCancelForm}
              className="btn-secondary"
              style={{ padding: '6px 14px', fontSize: '0.78rem' }}
            >
              Cancelar Edición
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit}>

          {/* 1. Image Upload */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 900, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              1. Fotografía / Imagen de la Obra (Auto-Optimizada a WebP):
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageFileChange}
              accept="image/png, image/jpeg, image/webp"
              style={{ display: 'none' }}
            />

            {isImageReady ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                background: 'rgba(0, 242, 254, 0.05)',
                border: '1px solid rgba(0, 242, 254, 0.3)',
                borderRadius: '12px',
                padding: '12px',
                flexWrap: 'wrap'
              }}>
                <img
                  src={imagePreviewSrc}
                  alt="Preview"
                  style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--accent-cyan)' }}
                />
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                    {imageMeta?.name || (imageUrl?.startsWith('http') ? 'Google Cloud Storage (Cloud)' : (imageUrl ? 'Imagen en Servidor' : 'Imagen optimizada localmente'))}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                    {imageMeta
                      ? `${imageMeta.dimensions} • ${imageMeta.originalSize} KB`
                      : imageUrl
                        ? `📍 ${imageUrl}`
                        : 'Pendiente de guardado'}
                  </div>
                  {/* Indicador de estado de imagen */}
                  {imageUrl && (
                    <div style={{ fontSize: '0.7rem', color: '#00f2fe', marginTop: '4px', fontWeight: 700 }}>
                      {imageUrl.startsWith('http') ? '✓ Guardada en Google Cloud Storage' : '✓ Guardada en servidor'}
                    </div>
                  )}
                  {!imageUrl && _base64Full && (
                    <div style={{ fontSize: '0.7rem', color: '#f59e0b', marginTop: '4px', fontWeight: 700 }}>
                      ⚠ En memoria — se guardará al publicar
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      disabled={isOptimizing || isUploading}
                    >
                      {isOptimizing ? 'Optimizando…' : isUploading ? 'Subiendo…' : 'Cambiar Imagen'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl('');
                        setThumbUrl('');
                        set_base64Full('');
                        setImageMeta(null);
                      }}
                      style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Trash2 size={13} />
                      <span>Quitar</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => !isOptimizing && !isUploading && fileInputRef.current?.click()}
                style={{
                  border: '2px dashed rgba(0, 242, 254, 0.35)',
                  borderRadius: '12px',
                  padding: '30px 20px',
                  textAlign: 'center',
                  cursor: (isOptimizing || isUploading) ? 'wait' : 'pointer',
                  background: 'rgba(255, 255, 255, 0.02)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Upload size={32} color="var(--accent-cyan)" style={{ marginBottom: '10px' }} />
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                  {isOptimizing ? 'Optimizando imagen…'
                    : isUploading ? 'Subiendo al servidor VPS…'
                    : 'Haz clic para seleccionar la imagen'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Formatos soportados: JPG, PNG, WEBP • Se procesa a 1400px Full HD y miniatura 480px automáticamente
                </div>
              </div>
            )}
          </div>

          {/* 2. Title & Subtitle */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                2. Título de la Obra *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Porsche 911 GT3 RS Blueprint"
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: '#0a0e18', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff', fontSize: '0.92rem', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                3. Subtítulo / Descripción Corta
              </label>
              <input
                type="text"
                placeholder="Ej. Edición Técnica de Colección MotorSport"
                value={subtitle}
                onChange={e => setSubtitle(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: '#0a0e18', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff', fontSize: '0.92rem', outline: 'none' }}
              />
            </div>
          </div>

          {/* 4. Category & Franchise */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                4. Categoría Principal *
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: '#0a0e18', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff', fontSize: '0.92rem', outline: 'none' }}
              >
                {categories.filter(c => c.id !== 'TODOS').map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                5. Colección o Franquicia (Opcional)
              </label>
              <select
                value={franchiseId}
                onChange={e => setFranchiseId(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: '#0a0e18', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff', fontSize: '0.92rem', outline: 'none' }}
              >
                <option value="">Ninguna / Obra Independiente</option>
                {franchises.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 6. Sizes Matrix */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                6. Tamaños Disponibles ({selectedSizeIds.length} seleccionados):
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => setSelectedSizeIds(['MINI', 'PEQUENO', 'MEDIANO', 'GRANDE', 'GIGANTE'])}
                  style={{ padding: '6px 12px', borderRadius: '8px', background: selectedSizeIds.length === 5 && !selectedSizeIds.includes('PORTADA_ALBUM') ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255, 255, 255, 0.05)', border: selectedSizeIds.length === 5 && !selectedSizeIds.includes('PORTADA_ALBUM') ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)', color: selectedSizeIds.length === 5 && !selectedSizeIds.includes('PORTADA_ALBUM') ? 'var(--accent-cyan)' : 'var(--text-secondary)', fontSize: '0.76rem', fontWeight: 800, cursor: 'pointer' }}>
                  ✓ Marcar los 5 Tamaños Estándar
                </button>
                <button type="button" onClick={() => setSelectedSizeIds(['MINI', 'PEQUENO', 'PORTADA_ALBUM', 'MEDIANO', 'GRANDE', 'GIGANTE'])}
                  style={{ padding: '6px 12px', borderRadius: '8px', background: selectedSizeIds.length === 6 ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255, 255, 255, 0.05)', border: selectedSizeIds.length === 6 ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)', color: selectedSizeIds.length === 6 ? 'var(--accent-cyan)' : 'var(--text-secondary)', fontSize: '0.76rem', fontWeight: 800, cursor: 'pointer' }}>
                  Marcar Todos (6)
                </button>
              </div>
            </div>

            {/* Standard sizes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '16px' }}>
              {OFFICIAL_SIZES.filter(s => s.id !== 'PORTADA_ALBUM').map(s => {
                const isChecked = selectedSizeIds.includes(s.id);
                return (
                  <div key={s.id} onClick={() => toggleSizeId(s.id)} style={{ padding: '12px 14px', borderRadius: '10px', background: isChecked ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 255, 255, 0.02)', border: isChecked ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem', transition: 'all 0.15s ease' }}>
                    <span style={{ color: isChecked ? '#fff' : 'var(--text-muted)', fontWeight: isChecked ? 700 : 400 }}>
                      {isChecked ? '☑ ' : '☐ '} {s.name} ({s.dimensions})
                    </span>
                    <span style={{ color: isChecked ? '#00f2fe' : 'var(--text-muted)', fontWeight: 800 }}>
                      Q{s.price.toFixed(0)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Album cover size */}
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px dashed rgba(0, 242, 254, 0.25)', borderRadius: '12px', padding: '14px 16px' }}>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🎵</span>
                <strong>Formato Cuadrado (Exclusivo para Portadas de Álbum / Vinilos Musicales):</strong>
              </div>
              {OFFICIAL_SIZES.filter(s => s.id === 'PORTADA_ALBUM').map(s => {
                const isChecked = selectedSizeIds.includes(s.id);
                return (
                  <div key={s.id} onClick={() => toggleSizeId(s.id)} style={{ maxWidth: '320px', padding: '12px 14px', borderRadius: '10px', background: isChecked ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 255, 255, 0.03)', border: isChecked ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem', transition: 'all 0.15s ease' }}>
                    <span style={{ color: isChecked ? '#fff' : 'var(--text-muted)', fontWeight: isChecked ? 700 : 400 }}>
                      {isChecked ? '☑ ' : '☐ '} {s.name} ({s.dimensions})
                    </span>
                    <span style={{ color: isChecked ? '#00f2fe' : 'var(--text-muted)', fontWeight: 800 }}>
                      Q{s.price.toFixed(0)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 7. Tags */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              7. Etiquetas / Tags de Búsqueda (separadas por coma)
            </label>
            <input
              type="text"
              placeholder="Ej. Porsche, GT3, Motorsport, Blueprint, Alemania"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', background: '#0a0e18', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff', fontSize: '0.92rem', outline: 'none' }}
            />
          </div>

          {/* 8. Featured toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255, 255, 255, 0.03)', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px' }}>
            <input
              type="checkbox"
              id="featuredCheck"
              checked={isFeatured}
              onChange={e => setIsFeatured(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#00f2fe', cursor: 'pointer' }}
            />
            <label htmlFor="featuredCheck" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
              ⭐ Marcar como Destacado (Aparecerá en Best Sellers del Inicio)
            </label>
          </div>

          {/* Submit / Cancel */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="submit"
              className="btn-cyan"
              disabled={isSaving || isUploading || isOptimizing}
              style={{ flex: '1 1 200px', justifyContent: 'center', padding: '14px', opacity: (isSaving || isUploading) ? 0.7 : 1, cursor: (isSaving || isUploading) ? 'wait' : 'pointer' }}
            >
              <Check size={18} />
              <span>
                {isSaving   ? 'Guardando en PostgreSQL…'
                  : isUploading ? 'Subiendo imagen…'
                  : isEditMode  ? 'Guardar Cambios'
                  : 'Publicar en el Catálogo'}
              </span>
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
              style={{ flex: '1 1 120px', justifyContent: 'center', padding: '14px' }}
            >
              <span>Volver</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
