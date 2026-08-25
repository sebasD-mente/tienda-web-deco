import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Edit3, Trash2, Upload, Download, RotateCcw, Check, 
  Search, ArrowLeft, Star, Tag, Layers, Sliders, Image as ImageIcon,
  Sparkles, CheckCircle2, AlertCircle, Eye
} from 'lucide-react';
import { OFFICIAL_SIZES } from '../data/catalogData';
import { 
  getStoredPosters, 
  getStoredCategories, 
  saveOrUpdatePoster, 
  deletePosterById, 
  addNewCategory, 
  deleteCategoryById, 
  resetCatalogToDefault,
  exportCatalogAsJSON,
  importCatalogFromJSON 
} from '../utils/catalogStorage';
import { optimizeImageFile } from '../utils/imageOptimizer';

export default function AdminDashboard({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'create' | 'categories' | 'backup'
  const [posters, setPosters] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  
  // Notification toast
  const [toast, setToast] = useState(null);

  // Form State
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState('AUTOS');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [rating, setRating] = useState(5.0);
  const [reviewsCount, setReviewsCount] = useState(30);
  
  // Size selection mode: 'ALL_SIZES' (all 6) | 'CUSTOM'
  const [sizeMode, setSizeMode] = useState('ALL_SIZES');
  const [selectedSizeIds, setSelectedSizeIds] = useState(['MINI', 'PEQUENO', 'PORTADA_ALBUM', 'MEDIANO', 'GRANDE', 'GIGANTE']);

  // Image State
  const [imageFull, setImageFull] = useState('');
  const [imageThumb, setImageThumb] = useState('');
  const [imageMeta, setImageMeta] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // New category inline modal
  const [newCatName, setNewCatName] = useState('');
  const [showCatModal, setShowCatModal] = useState(false);

  const fileInputRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = () => {
    setPosters(getStoredPosters());
    setCategories(getStoredCategories());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update selected sizes when sizeMode changes
  const handleSizeModeChange = (mode) => {
    setSizeMode(mode);
    if (mode === 'PATENTE') {
      setSelectedSizeIds(['GRANDE']);
    } else if (mode === 'ALL_SIZES') {
      setSelectedSizeIds(['MINI', 'PEQUENO', 'PORTADA_ALBUM', 'MEDIANO', 'GRANDE', 'GIGANTE']);
    }
  };

  const toggleSizeId = (id) => {
    setSizeMode('CUSTOM');
    if (selectedSizeIds.includes(id)) {
      if (selectedSizeIds.length > 1) {
        setSelectedSizeIds(selectedSizeIds.filter(s => s !== id));
      }
    } else {
      setSelectedSizeIds([...selectedSizeIds, id]);
    }
  };

  // Image upload and automatic WebP optimization
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
      showToast('¡Imagen optimizada a WebP automáticamente!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error al optimizar imagen: ' + err.message, 'error');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Populate form for editing
  const startEdit = (poster) => {
    setEditingId(poster.id);
    setTitle(poster.title);
    setSubtitle(poster.subtitle || '');
    setCategory(poster.category);
    setDescription(poster.description || '');
    setTagsInput((poster.tags || []).join(', '));
    setIsFeatured(!!poster.isFeatured);
    setRating(poster.rating || 5.0);
    setReviewsCount(poster.reviewsCount || 25);
    setImageFull(poster.image || '');
    setImageThumb(poster.thumb || poster.image || '');
    setImageMeta(null);

    const sizes = poster.availableSizes || ['MINI', 'PEQUENO', 'PORTADA_ALBUM', 'MEDIANO', 'GRANDE', 'GIGANTE'];
    setSelectedSizeIds(sizes);
    if (sizes.length === 6) {
      setSizeMode('ALL_SIZES');
    } else {
      setSizeMode('CUSTOM');
    }

    setActiveTab('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setSubtitle('');
    setCategory(categories[0]?.id || 'AUTOS');
    setDescription('');
    setTagsInput('');
    setIsFeatured(false);
    setRating(5.0);
    setReviewsCount(25);
    setImageFull('');
    setImageThumb('');
    setImageMeta(null);
    setSizeMode('ALL_SIZES');
    setSelectedSizeIds(['MINI', 'PEQUENO', 'PORTADA_ALBUM', 'MEDIANO', 'GRANDE', 'GIGANTE']);
  };

  // Submit Poster (Create / Update)
  const handleSubmitPoster = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Por favor escribe un título para el póster', 'error');
      return;
    }
    if (!imageFull) {
      showToast('Por favor sube o selecciona una imagen para el póster', 'error');
      return;
    }

    const posterId = editingId || (title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4));
    
    // Parse tags
    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    // Compute badges and pricing
    const sizeBadge = selectedSizeIds.length === 1 && selectedSizeIds[0] === 'GRANDE' 
      ? '45 x 60 cm' 
      : (selectedSizeIds.length === 6 ? '6 Tamaños' : `${selectedSizeIds.length} Tamaños`);

    const priceDisplay = selectedSizeIds.length === 1 && selectedSizeIds[0] === 'GRANDE'
      ? 'Q 125.00'
      : 'Desde Q 25.00';

    const posterData = {
      id: posterId,
      title: title.trim(),
      subtitle: subtitle.trim() || 'Edición Especial Deco Vintage',
      category,
      image: imageFull,
      thumb: imageThumb || imageFull,
      tags: tags.length > 0 ? tags : [category],
      isFeatured,
      rating: parseFloat(rating) || 5.0,
      reviewsCount: parseInt(reviewsCount) || 25,
      sizeBadge,
      availableSizes: selectedSizeIds,
      priceDisplay,
      description: description.trim() || `Impresión fotográfica de alta definición sobre base sólida de ${category === 'AUTOS' ? 'MDF 5.5mm (45x60 cm)' : 'MDF 5.5mm'}. Incluye cinta Tessa de montaje rápido.`
    };

    saveOrUpdatePoster(posterData);
    loadData();
    showToast(editingId ? '¡Póster actualizado con éxito!' : '¡Nueva obra agregada al catálogo!', 'success');
    resetForm();
    setActiveTab('inventory');
  };

  // Delete Poster
  const handleDeletePoster = (id, posterTitle) => {
    if (window.confirm(`¿Estás seguro de eliminar el póster "${posterTitle}" del catálogo?`)) {
      deletePosterById(id);
      loadData();
      showToast('Póster eliminado correctamente.', 'info');
    }
  };

  // Create Category
  const handleCreateCategory = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const catId = newCatName.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '');
    const newCat = {
      id: catId,
      name: newCatName.trim().toUpperCase()
    };

    addNewCategory(newCat);
    loadData();
    setCategory(catId);
    setNewCatName('');
    setShowCatModal(false);
    showToast(`Categoría "${newCat.name}" creada con éxito.`);
  };

  // Filtered posters for inventory
  const filteredPosters = posters.filter(p => {
    const matchesCat = categoryFilter === 'ALL' || p.category === categoryFilter;
    const matchesSearch = !searchFilter || 
      p.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (p.subtitle && p.subtitle.toLowerCase().includes(searchFilter.toLowerCase())) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(searchFilter.toLowerCase())));
    return matchesCat && matchesSearch;
  });

  return (
    <div style={{ paddingTop: '105px', background: '#05070d', minHeight: '100vh', color: '#f0f6fc' }}>
      
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          background: toast.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(0, 242, 254, 0.95)',
          color: '#06080e',
          padding: '14px 22px',
          borderRadius: '12px',
          fontWeight: 800,
          boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'fadeIn 0.2s ease'
        }}>
          {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <section style={{
        padding: '30px 0',
        background: '#070a12',
        borderBottom: '1px solid rgba(0, 242, 254, 0.2)'
      }}>
        <div className="container">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <Sliders size={20} color="var(--accent-cyan)" />
                <span className="badge-cyan" style={{ fontSize: '0.72rem', padding: '2px 10px' }}>
                  ADMINISTRADOR LOCAL PRO
                </span>
              </div>
              <h1 style={{ fontSize: '1.9rem', fontWeight: 900, color: '#fff', margin: 0 }}>
                Panel de Administración <span className="text-gradient-cyan">Deco Vintage</span>
              </h1>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={() => onNavigate('home')}
                className="btn-secondary"
                style={{ padding: '10px 18px', fontSize: '0.85rem' }}
              >
                <ArrowLeft size={16} />
                <span>Volver a la Tienda</span>
              </button>

              <button
                onClick={exportCatalogAsJSON}
                className="btn-cyan"
                style={{ padding: '10px 18px', fontSize: '0.85rem' }}
                title="Descargar copia de seguridad en JSON"
              >
                <Download size={16} />
                <span>Exportar Copia (JSON)</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Tabs Bar */}
      <section style={{ background: '#090d16', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <div className="container">
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '10px 0' }}>
            <button
              onClick={() => setActiveTab('inventory')}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                background: activeTab === 'inventory' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                border: activeTab === 'inventory' ? '1px solid var(--accent-cyan)' : '1px solid transparent',
                color: activeTab === 'inventory' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Layers size={16} />
              <span>Inventario de Obras ({posters.length})</span>
            </button>

            <button
              onClick={() => {
                if (activeTab !== 'create') resetForm();
                setActiveTab('create');
              }}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                background: activeTab === 'create' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                border: activeTab === 'create' ? '1px solid var(--accent-cyan)' : '1px solid transparent',
                color: activeTab === 'create' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Plus size={16} />
              <span>{editingId ? 'Editar Obra Activa' : 'Nueva Obra / Subir Imagen'}</span>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                background: activeTab === 'categories' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                border: activeTab === 'categories' ? '1px solid var(--accent-cyan)' : '1px solid transparent',
                color: activeTab === 'categories' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Tag size={16} />
              <span>Categorías ({categories.filter(c => c.id !== 'TODOS').length})</span>
            </button>

            <button
              onClick={() => setActiveTab('backup')}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                background: activeTab === 'backup' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                border: activeTab === 'backup' ? '1px solid var(--accent-cyan)' : '1px solid transparent',
                color: activeTab === 'backup' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <RotateCcw size={16} />
              <span>Respaldo & Sincronización</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section style={{ padding: '40px 0 80px 0' }}>
        <div className="container">
          
          {/* TAB 1: INVENTORY */}
          {activeTab === 'inventory' && (
            <div>
              {/* Filter & Search Bar */}
              <div className="glass-card" style={{ padding: '20px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                
                {/* Search */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255, 255, 255, 0.04)', padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)', minWidth: '280px', flex: 1 }}>
                  <Search size={18} color="var(--accent-cyan)" />
                  <input
                    type="text"
                    placeholder="Filtrar por nombre o etiqueta..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    style={{ background: 'none', border: 'none', color: '#fff', fontSize: '0.9rem', outline: 'none', width: '100%' }}
                  />
                  {searchFilter && (
                    <button onClick={() => setSearchFilter('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>×</button>
                  )}
                </div>

                {/* Category Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Categoría:</span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    style={{
                      background: '#0a0e18',
                      color: '#fff',
                      border: '1px solid var(--border-subtle)',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="ALL">Todas las Categorías ({posters.length})</option>
                    {categories.filter(c => c.id !== 'TODOS').map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({posters.filter(p => p.category === c.id).length})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      resetForm();
                      setActiveTab('create');
                    }}
                    className="btn-cyan"
                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                  >
                    <Plus size={16} />
                    <span>Nueva Obra</span>
                  </button>
                </div>

              </div>

              {/* Posters Table / List */}
              <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ background: 'rgba(0, 0, 0, 0.4)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <th style={{ padding: '14px 18px', color: 'var(--accent-cyan)', fontWeight: 800 }}>VISTA PREVIA</th>
                        <th style={{ padding: '14px 18px', color: 'var(--accent-cyan)', fontWeight: 800 }}>TÍTULO / SUBTÍTULO</th>
                        <th style={{ padding: '14px 18px', color: 'var(--accent-cyan)', fontWeight: 800 }}>CATEGORÍA</th>
                        <th style={{ padding: '14px 18px', color: 'var(--accent-cyan)', fontWeight: 800 }}>TAMAÑOS</th>
                        <th style={{ padding: '14px 18px', color: 'var(--accent-cyan)', fontWeight: 800 }}>PRECIO</th>
                        <th style={{ padding: '14px 18px', color: 'var(--accent-cyan)', fontWeight: 800 }}>DESTACADO</th>
                        <th style={{ padding: '14px 18px', color: 'var(--accent-cyan)', fontWeight: 800, textAlign: 'right' }}>ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPosters.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No se encontraron obras con los filtros actuales.
                          </td>
                        </tr>
                      ) : (
                        filteredPosters.map((poster) => (
                          <tr
                            key={poster.id}
                            style={{
                              borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                              transition: 'background 0.15s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0, 242, 254, 0.04)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={{ padding: '12px 18px', width: '90px' }}>
                              <div style={{
                                width: '70px',
                                height: '52px',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                background: '#040609',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <img
                                  src={poster.thumb || poster.image}
                                  alt={poster.title}
                                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                />
                              </div>
                            </td>

                            <td style={{ padding: '12px 18px' }}>
                              <div style={{ fontWeight: 800, color: '#fff' }}>{poster.title}</div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{poster.subtitle}</div>
                            </td>

                            <td style={{ padding: '12px 18px' }}>
                              <span className="badge-cyan" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                                {poster.category}
                              </span>
                            </td>

                            <td style={{ padding: '12px 18px', fontSize: '0.82rem' }}>
                              <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>
                                {poster.sizeBadge || '45 x 60 cm'}
                              </span>
                            </td>

                            <td style={{ padding: '12px 18px', fontWeight: 800, color: '#00f5a0' }}>
                              {poster.priceDisplay || 'Q 125.00'}
                            </td>

                            <td style={{ padding: '12px 18px' }}>
                              {poster.isFeatured ? (
                                <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 800 }}>
                                  <Star size={14} fill="#f59e0b" />
                                  <span>Best Seller</span>
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Estándar</span>
                              )}
                            </td>

                            <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                <button
                                  onClick={() => startEdit(poster)}
                                  style={{
                                    background: 'rgba(0, 242, 254, 0.12)',
                                    border: '1px solid rgba(0, 242, 254, 0.3)',
                                    color: 'var(--accent-cyan)',
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '0.8rem',
                                    fontWeight: 700
                                  }}
                                  title="Editar Obra"
                                >
                                  <Edit3 size={14} />
                                  <span>Editar</span>
                                </button>

                                <button
                                  onClick={() => handleDeletePoster(poster.id, poster.title)}
                                  style={{
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    color: '#ef4444',
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '0.8rem',
                                    fontWeight: 700
                                  }}
                                  title="Eliminar Obra"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CREATE / EDIT POSTER */}
          {activeTab === 'create' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '30px',
              alignItems: 'start'
            }}>
              
              {/* Left Form: Fields & Image Upload */}
              <form onSubmit={handleSubmitPoster} className="glass-card" style={{ padding: '32px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {editingId ? <Edit3 size={20} color="var(--accent-cyan)" /> : <Plus size={20} color="var(--accent-cyan)" />}
                  <span>{editingId ? 'Editar Datos de la Obra' : 'Agregar Nueva Obra al Catálogo'}</span>
                </h2>

                {/* 1. Image Upload Dropzone */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    1. Fotografía / Imagen de la Obra (Auto-Optimizada a WebP):
                  </label>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageFileChange}
                    accept="image/png, image/jpeg, image/webp, image/jpg"
                    style={{ display: 'none' }}
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '2px dashed rgba(0, 242, 254, 0.4)',
                      borderRadius: '12px',
                      padding: '24px',
                      textAlign: 'center',
                      background: 'rgba(0, 242, 254, 0.03)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#00f2fe'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.4)'}
                  >
                    {isOptimizing ? (
                      <div style={{ color: 'var(--accent-cyan)', fontWeight: 800 }}>
                        ⏳ Optimizando y comprimiendo imagen a WebP...
                      </div>
                    ) : imageFull ? (
                      <div>
                        <CheckCircle2 size={32} color="#00f5a0" style={{ margin: '0 auto 8px auto' }} />
                        <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>
                          ¡Imagen cargada y optimizada!
                        </div>
                        {imageMeta && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            Original: {imageMeta.originalSize} ➔ Resolución WebP: {imageMeta.dimensions}
                          </div>
                        )}
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', textDecoration: 'underline', marginTop: '6px', display: 'inline-block' }}>
                          Haz clic para cambiar la imagen
                        </span>
                      </div>
                    ) : (
                      <div>
                        <Upload size={32} color="var(--accent-cyan)" style={{ margin: '0 auto 10px auto' }} />
                        <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem', marginBottom: '4px' }}>
                          Haz clic o arrastra aquí tu imagen (JPG / PNG)
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          El sistema la escalará y optimizará a WebP automáticamente para máxima velocidad.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Title & Subtitle */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '18px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                      2. Título de la Obra *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Porsche 911 GT3 RS Patente Técnica"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
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
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                      Subtítulo / Tagline
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Blueprint Automotriz Motorsport"
                      value={subtitle}
                      onChange={e => setSubtitle(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
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

                {/* 3. Description directly below Title & Subtitle */}
                <div style={{ marginBottom: '22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      3. Descripción & Detalles de la Obra:
                    </label>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      (Aparece debajo del póster al abrirlo)
                    </span>
                  </div>

                  <textarea
                    rows={4}
                    placeholder="Escribe la descripción de la obra, detalles técnicos, materiales, historia del diseño o especificaciones..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: '#0a0e18',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.88rem',
                      lineHeight: '1.5',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* 4. Prominent Category Field with Visual Selectable Pills & Inline Creator */}
                <div style={{
                  marginBottom: '24px',
                  background: 'rgba(0, 242, 254, 0.04)',
                  padding: '18px 20px',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 242, 254, 0.25)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      4. Categoría del Producto *:
                    </label>
                    <span style={{ fontSize: '0.78rem', color: '#5eead4', fontWeight: 700 }}>
                      Seleccionada: <strong style={{ color: '#fff', textDecoration: 'underline' }}>{category}</strong>
                    </span>
                  </div>

                  {/* Visual Category Clickable Pills */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                    {categories.filter(c => c.id !== 'TODOS').map(cat => {
                      const isSelected = category === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategory(cat.id)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: 'var(--radius-full)',
                            background: isSelected ? 'var(--grad-cyan)' : 'rgba(255, 255, 255, 0.05)',
                            border: isSelected ? '1px solid #00f2fe' : '1px solid var(--border-subtle)',
                            color: isSelected ? '#040609' : '#ffffff',
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            letterSpacing: '0.04em',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease',
                            boxShadow: isSelected ? '0 0 15px rgba(0, 242, 254, 0.4)' : 'none'
                          }}
                        >
                          {isSelected && <Check size={14} strokeWidth={3} />}
                          <span>{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Inline Instant New Category Creator */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="+ O escribe una NUEVA categoría (ej. RETRO, ANIME, ARQUITECTURA)..."
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateCategory(e);
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '9px 14px',
                        background: '#04070e',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '0.85rem',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      className="btn-cyan"
                      style={{ padding: '9px 16px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                    >
                      <Plus size={15} />
                      <span>Crear & Asignar</span>
                    </button>
                  </div>
                </div>

                {/* 5. Sizes Selection Mode */}
                <div style={{ marginBottom: '22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      5. Tamaños Disponibles para esta Obra:
                    </label>
                    <button
                      type="button"
                      onClick={() => handleSizeModeChange('ALL_SIZES')}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '6px',
                        background: selectedSizeIds.length === 6 ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        border: selectedSizeIds.length === 6 ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                        color: selectedSizeIds.length === 6 ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      ✓ Marcar los 6 Tamaños
                    </button>
                  </div>

                  {/* Individual Size Checkboxes */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {OFFICIAL_SIZES.map(s => {
                      const isChecked = selectedSizeIds.includes(s.id);
                      return (
                        <div
                          key={s.id}
                          onClick={() => toggleSizeId(s.id)}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
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
                </div>

                {/* 6. Tags & Featured */}
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    6. Etiquetas / Estilos (separadas por coma)
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
                      fontSize: '0.88rem',
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
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="submit"
                    className="btn-cyan"
                    style={{ flex: 1, justifyContent: 'center', padding: '14px' }}
                  >
                    <Check size={18} />
                    <span>{editingId ? 'Guardar Cambios' : 'Publicar en el Catálogo'}</span>
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="btn-secondary"
                      style={{ padding: '14px 20px' }}
                    >
                      Cancelar
                    </button>
                  )}
                </div>

              </form>

              {/* Right Live Preview: How it looks in the Catalog */}
              <div>
                <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Eye size={18} color="var(--accent-cyan)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', textTransform: 'uppercase' }}>
                    Previsualización en Vivo de la Tarjeta:
                  </span>
                </div>

                <div className="glass-card" style={{
                  maxWidth: '320px',
                  margin: '0 auto',
                  padding: 0,
                  overflow: 'hidden',
                  borderRadius: '16px',
                  background: '#070b12',
                  border: '1px solid rgba(0, 242, 254, 0.45)',
                  boxShadow: '0 15px 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(0, 242, 254, 0.2)'
                }}>
                  {/* Poster Image Frame */}
                  <div style={{
                    width: '100%',
                    height: '240px',
                    position: 'relative',
                    background: '#040609',
                    padding: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    {imageFull ? (
                      <img
                        src={imageThumb || imageFull}
                        alt="Preview"
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
                        <ImageIcon size={36} style={{ margin: '0 auto 6px auto', opacity: 0.4 }} />
                        <div>Sube una imagen para ver la vista previa</div>
                      </div>
                    )}

                    {/* Size Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'rgba(4, 6, 9, 0.85)',
                      border: '1px solid rgba(0, 242, 254, 0.4)',
                      color: 'var(--accent-cyan)',
                      fontWeight: 800,
                      fontSize: '0.7rem',
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-full)',
                      backdropFilter: 'blur(8px)',
                      zIndex: 2
                    }}>
                      {selectedSizeIds.length === 1 && selectedSizeIds[0] === 'GRANDE' ? '45 x 60 cm' : `${selectedSizeIds.length} Tamaños`}
                    </div>
                  </div>

                  {/* Bottom Details */}
                  <div style={{ padding: '16px 18px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>
                      {category}
                    </div>
                    <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#ffffff', marginBottom: '12px', lineHeight: '1.3' }}>
                      {title || 'Título de Ejemplo'}
                    </h4>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--accent-cyan)' }}>
                        {selectedSizeIds.length === 1 && selectedSizeIds[0] === 'GRANDE' ? 'Q 125.00' : 'Desde Q 25.00'}
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ffffff' }}>
                        Ver Detalle ➔
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live Preview of Description (Modal View) */}
                {description && (
                  <div className="glass-card" style={{ maxWidth: '320px', margin: '16px auto 0 auto', padding: '16px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Vista en Detalle de Producto:
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                      {description}
                    </p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: CATEGORIES MANAGEMENT */}
          {activeTab === 'categories' && (
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              
              {/* Create Category Form */}
              <div className="glass-card" style={{ padding: '28px', marginBottom: '30px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>
                  Crear Nueva Categoría
                </h3>
                <form onSubmit={handleCreateCategory} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="Ej. STAR WARS, GAMING, RETRO..."
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    style={{
                      flex: 1,
                      minWidth: '240px',
                      padding: '11px 16px',
                      background: '#0a0e18',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.92rem',
                      outline: 'none'
                    }}
                  />
                  <button type="submit" className="btn-cyan" style={{ padding: '11px 22px' }}>
                    <Plus size={18} />
                    <span>Agregar Categoría</span>
                  </button>
                </form>
              </div>

              {/* Categories List */}
              <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                  CATEGORÍAS ACTIVAS EN EL SITIO
                </div>
                <div>
                  {categories.filter(c => c.id !== 'TODOS').map(cat => {
                    const count = posters.filter(p => p.category === cat.id).length;
                    return (
                      <div
                        key={cat.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '16px 24px',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 800, color: '#fff', fontSize: '1rem', marginRight: '10px' }}>
                            {cat.name}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            ID: <code>{cat.id}</code>
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <span className="badge-cyan" style={{ fontSize: '0.75rem', padding: '3px 10px' }}>
                            {count} {count === 1 ? 'diseño' : 'diseños'}
                          </span>

                          {count === 0 && (
                            <button
                              onClick={() => {
                                deleteCategoryById(cat.id);
                                loadData();
                                showToast(`Categoría "${cat.name}" eliminada.`);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#ef4444',
                                cursor: 'pointer',
                                padding: '4px'
                              }}
                              title="Eliminar categoría vacía"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: BACKUP & SYNC */}
          {activeTab === 'backup' && (
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div className="glass-card" style={{ padding: '36px' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>
                  Copia de Seguridad & Gestión de Datos
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '28px', lineHeight: '1.6' }}>
                  Puedes exportar todo tu catálogo con imágenes y configuraciones en un archivo JSON para tener un respaldo seguro o transferirlo a otra computadora.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '36px' }}>
                  
                  {/* Export */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                    <Download size={28} color="var(--accent-cyan)" style={{ marginBottom: '10px' }} />
                    <h4 style={{ color: '#fff', fontWeight: 800, marginBottom: '6px' }}>Descargar Respaldo</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '16px' }}>
                      Genera un archivo <code>.json</code> con todas las obras y categorías actuales.
                    </p>
                    <button onClick={exportCatalogAsJSON} className="btn-cyan" style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
                      Descargar JSON
                    </button>
                  </div>

                  {/* Reset */}
                  <div style={{ background: 'rgba(239, 68, 68, 0.03)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <RotateCcw size={28} color="#ef4444" style={{ marginBottom: '10px' }} />
                    <h4 style={{ color: '#fff', fontWeight: 800, marginBottom: '6px' }}>Restablecer Inicial</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '16px' }}>
                      Restaura el catálogo a los datos originales de fábrica (11 autos + 7 cómics).
                    </p>
                    <button
                      onClick={() => {
                        if (window.confirm('¿Seguro que deseas restablecer el catálogo a los valores iniciales de fábrica?')) {
                          resetCatalogToDefault();
                          loadData();
                          showToast('Catálogo restablecido a valores iniciales.', 'info');
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid #ef4444',
                        color: '#ef4444',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      Restablecer
                    </button>
                  </div>

                </div>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* Inline Quick Modal for Category Creation */}
      {showCatModal && (
        <div className="modal-backdrop" onClick={() => setShowCatModal(false)}>
          <div
            className="glass-card"
            style={{ width: '100%', maxWidth: '420px', padding: '28px', background: '#090d16', border: '2px solid var(--accent-cyan)' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ color: '#fff', fontWeight: 800, marginBottom: '12px' }}>Nueva Categoría</h3>
            <form onSubmit={handleCreateCategory}>
              <input
                type="text"
                autoFocus
                placeholder="Nombre de categoría (ej. ANIME, CINE...)"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  background: '#040609',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: '#fff',
                  marginBottom: '16px',
                  outline: 'none'
                }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn-cyan" style={{ flex: 1, justifyContent: 'center' }}>Crear</button>
                <button type="button" onClick={() => setShowCatModal(false)} className="btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
