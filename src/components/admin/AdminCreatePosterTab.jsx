import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Edit3, Check, Upload, Trash2, Eye, 
  Image as ImageIcon, Sparkles, AlertCircle 
} from 'lucide-react';
import { OFFICIAL_SIZES } from '../../data/catalogData';
import { optimizeImageFile } from '../../utils/imageOptimizer';
import { apiUploadPosterImage } from '../../utils/apiClient';

export default function AdminCreatePosterTab({
  editingPoster = null,
  categories = [],
  franchises = [],
  onSavePoster,
  onCancel,
  onShowToast
}) {
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState('AUTOS');
  const [franchiseId, setFranchiseId] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [rating, setRating] = useState(5.0);
  const [reviewsCount, setReviewsCount] = useState(30);

  // Size selection (Default 5 standard rectangular sizes)
  const STANDARD_5_SIZES = ['MINI', 'PEQUENO', 'MEDIANO', 'GRANDE', 'GIGANTE'];
  const [selectedSizeIds, setSelectedSizeIds] = useState(STANDARD_5_SIZES);

  // Image State
  const [imageFull, setImageFull] = useState('');
  const [imageThumb, setImageThumb] = useState('');
  const [imageMeta, setImageMeta] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef(null);

  // Populate form if editing
  useEffect(() => {
    if (editingPoster) {
      setEditingId(editingPoster.id);
      setTitle(editingPoster.title || '');
      setSubtitle(editingPoster.subtitle || '');
      setCategory(editingPoster.category || 'AUTOS');
      setFranchiseId(editingPoster.franchise || '');
      setDescription(editingPoster.description || '');
      setTagsInput((editingPoster.tags || []).join(', '));
      setIsFeatured(!!editingPoster.isFeatured);
      setRating(editingPoster.rating || 5.0);
      setReviewsCount(editingPoster.reviewsCount || 25);
      setImageFull(editingPoster.image || '');
      setImageThumb(editingPoster.thumb || editingPoster.image || '');
      if (Array.isArray(editingPoster.sizes) && editingPoster.sizes.length > 0) {
        setSelectedSizeIds(editingPoster.sizes.map(s => s.id));
      } else {
        setSelectedSizeIds(STANDARD_5_SIZES);
      }
    } else {
      resetForm();
    }
  }, [editingPoster]);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setSubtitle('');
    setCategory('AUTOS');
    setFranchiseId('');
    setDescription('');
    setTagsInput('');
    setIsFeatured(false);
    setImageFull('');
    setImageThumb('');
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

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsOptimizing(true);
      const result = await optimizeImageFile(file);
      
      setImageFull(result.fullDataUrl);
      setImageThumb(result.thumbDataUrl);
      setImageMeta({
        originalSize: result.originalSizeKB,
        dimensions: `${result.optimizedWidth}x${result.optimizedHeight}px`,
        name: result.fileName
      });

      // Upload to VPS Express Backend with Sharp processing
      try {
        const cleanPosterId = (title || 'obra-' + Date.now()).toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const uploadRes = await apiUploadPosterImage(result.fullDataUrl, cleanPosterId);
        if (uploadRes && uploadRes.image) {
          setImageFull(uploadRes.image);
          setImageThumb(uploadRes.thumb);
          onShowToast('¡Imagen optimizada y guardada en el disco SSD del VPS!', 'success');
        } else {
          onShowToast('¡Imagen optimizada a WebP!', 'success');
        }
      } catch (uploadErr) {
        console.warn('[Admin Create Poster] VPS upload deferred:', uploadErr.message);
        onShowToast('¡Imagen optimizada en memoria local!', 'info');
      }
    } catch (err) {
      console.error(err);
      onShowToast('Error al optimizar imagen: ' + err.message, 'error');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      onShowToast('Ingresa un título para la obra.', 'error');
      return;
    }
    if (!imageFull) {
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

    const posterData = {
      id: editingId || ('deco-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 4)),
      title: title.trim(),
      subtitle: subtitle.trim(),
      category,
      franchise: franchiseId || null,
      description: description.trim(),
      tags: tagsArray,
      isFeatured,
      rating: Number(rating) || 5.0,
      reviewsCount: Number(reviewsCount) || 30,
      image: imageFull,
      thumb: imageThumb || imageFull,
      priceDisplay: sizesArray.length === 1 ? `Q${minPrice.toFixed(0)}` : `Desde Q${minPrice.toFixed(0)}`,
      priceRange: `Q${minPrice.toFixed(0)} - Q${maxPrice.toFixed(0)}`,
      minPrice,
      sizes: sizesArray
    };

    try {
      await onSavePoster(posterData);
      onShowToast(editingId ? `¡Obra "${title}" actualizada!` : `¡Obra "${title}" publicada!`, 'success');
      resetForm();
    } catch (err) {
      onShowToast('Error al guardar obra: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
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
            <Plus size={24} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 800, color: '#fff', margin: 0 }}>
              {editingId ? 'Editar Obra en el Catálogo' : 'Agregar Nueva Obra al Catálogo'}
            </h2>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
              style={{ padding: '6px 14px', fontSize: '0.78rem' }}
            >
              Cancelar Edición
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          
          {/* 1. Image Upload Drop Zone */}
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

            {imageFull ? (
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
                  src={imageThumb || imageFull}
                  alt="Preview"
                  style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--accent-cyan)' }}
                />
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                    {imageMeta?.name || 'Imagen Seleccionada'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {imageMeta ? `${imageMeta.dimensions} • ${imageMeta.originalSize} KB` : 'Formato WebP HD en Disco SSD'}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    >
                      Cambiar Imagen
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImageFull('');
                        setImageThumb('');
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
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed rgba(0, 242, 254, 0.35)',
                  borderRadius: '12px',
                  padding: '30px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'rgba(255, 255, 255, 0.02)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Upload size={32} color="var(--accent-cyan)" style={{ marginBottom: '10px' }} />
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                  {isOptimizing ? 'Optimizando Imagen con Motor WebP...' : 'Haz clic para seleccionar la imagen'}
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
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: '#0a0e18',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.92rem',
                  outline: 'none'
                }}
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
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: '#0a0e18',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.92rem',
                  outline: 'none'
                }}
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
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: '#0a0e18',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.92rem',
                  outline: 'none'
                }}
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
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: '#0a0e18',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.92rem',
                  outline: 'none'
                }}
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
                <button
                  type="button"
                  onClick={() => setSelectedSizeIds(['MINI', 'PEQUENO', 'MEDIANO', 'GRANDE', 'GIGANTE'])}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: selectedSizeIds.length === 5 && !selectedSizeIds.includes('PORTADA_ALBUM') ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: selectedSizeIds.length === 5 && !selectedSizeIds.includes('PORTADA_ALBUM') ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                    color: selectedSizeIds.length === 5 && !selectedSizeIds.includes('PORTADA_ALBUM') ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  ✓ Marcar los 5 Tamaños Estándar
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSizeIds(['MINI', 'PEQUENO', 'PORTADA_ALBUM', 'MEDIANO', 'GRANDE', 'GIGANTE'])}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: selectedSizeIds.length === 6 ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: selectedSizeIds.length === 6 ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                    color: selectedSizeIds.length === 6 ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Marcar Todos (6)
                </button>
              </div>
            </div>

            {/* Group 1: 5 Standard Rectangular Sizes */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '10px',
              marginBottom: '16px'
            }}>
              {OFFICIAL_SIZES.filter(s => s.id !== 'PORTADA_ALBUM').map(s => {
                const isChecked = selectedSizeIds.includes(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => toggleSizeId(s.id)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: isChecked ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                      border: isChecked ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.84rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
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

            {/* Group 2: Special Square 30x30 Album Cover Size */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px dashed rgba(0, 242, 254, 0.25)',
              borderRadius: '12px',
              padding: '14px 16px'
            }}>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🎵</span>
                <strong>Formato Cuadrado (Exclusivo para Portadas de Álbum / Vinilos Musicales):</strong>
              </div>
              {OFFICIAL_SIZES.filter(s => s.id === 'PORTADA_ALBUM').map(s => {
                const isChecked = selectedSizeIds.includes(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => toggleSizeId(s.id)}
                    style={{
                      maxWidth: '320px',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: isChecked ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      border: isChecked ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.84rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
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

          {/* 7. Tags & Best Seller Check */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              7. Etiquetas / Tags de Búsqueda (separadas por coma)
            </label>
            <input
              type="text"
              placeholder="Ej. Porsche, GT3, Motorsport, Blueprint, Alemania"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#0a0e18',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.92rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
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

          {/* Submit / Cancel Buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="submit"
              className="btn-cyan"
              disabled={isSaving}
              style={{
                flex: '1 1 200px',
                justifyContent: 'center',
                padding: '14px',
                opacity: isSaving ? 0.7 : 1,
                cursor: isSaving ? 'wait' : 'pointer'
              }}
            >
              <Check size={18} />
              <span>{isSaving ? 'Guardando en Disco...' : (editingId ? 'Guardar Cambios' : 'Publicar en el Catálogo')}</span>
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
