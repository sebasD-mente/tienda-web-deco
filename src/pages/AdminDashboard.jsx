import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Edit3, Trash2, Upload, Download, RotateCcw, Check, 
  Search, ArrowLeft, Star, Tag, Layers, Sliders, Shield,
  CheckCircle2, AlertCircle, Eye, Image as ImageIcon, LogOut,
  Package, Database, X, Sparkles
} from 'lucide-react';
import { OFFICIAL_SIZES } from '../data/catalogData';
import { 
  getStoredPosters, 
  getStoredCategories, 
  getStoredFranchises,
  saveAllFranchises,
  saveOrUpdatePoster, 
  togglePosterFeatured,
  deletePosterById, 
  addNewCategory, 
  deleteCategoryById, 
  resetCatalogToDefault,
  exportCatalogAsJSON,
  importCatalogFromJSON 
} from '../utils/catalogStorage';
import { optimizeImageFile } from '../utils/imageOptimizer';

export default function AdminDashboard({ onNavigate, onLogout }) {
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'create' | 'categories' | 'franchises' | 'backup'
  const [posters, setPosters] = useState([]);
  const [categories, setCategories] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  
  // Notification toast
  const [toast, setToast] = useState(null);

  // Form State
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

  // Franchise Management State
  const [newFranchiseName, setNewFranchiseName] = useState('');
  const [newFranchiseImg, setNewFranchiseImg] = useState('');
  const [isUploadingFranchiseIcon, setIsUploadingFranchiseIcon] = useState(false);
  const franchiseIconRef = useRef(null);

  const fileInputRef = useRef(null);
  const importInputRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = () => {
    setPosters(getStoredPosters());
    setCategories(getStoredCategories());
    setFranchises(getStoredFranchises());
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
    setFranchiseId(poster.franchise || '');
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
    window.scrollTo(0, 0);
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setSubtitle('');
    setCategory(categories[0]?.id || 'AUTOS');
    setFranchiseId('');
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

  const [isSaving, setIsSaving] = useState(false);

  // Submit Poster (Create / Update)
  const handleSubmitPoster = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Por favor escribe un título para el póster', 'error');
      return;
    }
    if (!imageFull) {
      showToast('Por favor sube o selecciona una imagen para el póster', 'error');
      return;
    }

    setIsSaving(true);
    try {
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
        franchise: franchiseId || null,
        image: imageFull,
        thumb: imageThumb || imageFull,
        tags: tags.length > 0 ? tags : [category],
        isFeatured,
        rating: parseFloat(rating) || 5.0,
        reviewsCount: parseInt(reviewsCount) || 25,
        sizeBadge,
        availableSizes: selectedSizeIds,
        priceDisplay,
        description: description.trim() || `Impresión fotográfica de alta definición sobre base sólida de MDF 5.5mm. Incluye cinta Tessa de montaje rápido.`
      };

      await saveOrUpdatePoster(posterData);
      loadData();
      showToast(editingId ? '💾 ¡Póster guardado con éxito!' : '💾 ¡Nueva obra agregada con éxito!', 'success');
      resetForm();
      setActiveTab('inventory');
      window.scrollTo(0, 0);
    } catch (err) {
      console.error('Error saving poster:', err);
      showToast('Error al guardar la obra: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Upload and handle Franchise Icon
  const handleFranchiseIconChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingFranchiseIcon(true);
      const result = await optimizeImageFile(file);
      setNewFranchiseImg(result.fullDataUrl);
      showToast('¡Ícono de colección procesado!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error al procesar ícono: ' + err.message, 'error');
    } finally {
      setIsUploadingFranchiseIcon(false);
    }
  };

  // Create new Franchise
  const handleCreateFranchise = async (e) => {
    e.preventDefault();
    if (!newFranchiseName.trim()) {
      showToast('Por favor escribe el nombre de la colección', 'error');
      return;
    }
    if (!newFranchiseImg) {
      showToast('Por favor sube el ícono o logotipo de la colección', 'error');
      return;
    }

    const cleanId = newFranchiseName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newFranchise = {
      id: cleanId,
      name: newFranchiseName.trim(),
      img: newFranchiseImg
    };

    const updated = [...franchises.filter(f => f.id !== cleanId), newFranchise];
    await saveAllFranchises(updated);
    loadData();
    setNewFranchiseName('');
    setNewFranchiseImg('');
    showToast(`🛡️ ¡Colección "${newFranchise.name}" agregada con éxito!`, 'success');
  };

  // Delete Franchise
  const handleDeleteFranchise = async (fId) => {
    if (!window.confirm(`¿Estás seguro de eliminar esta colección del carrusel de inicio?`)) return;
    const updated = franchises.filter(f => f.id !== fId);
    await saveAllFranchises(updated);
    loadData();
    showToast('Colección eliminada con éxito', 'success');
  };

  // Toggle Featured (Best Seller) 1-click
  const handleToggleFeatured = async (posterId, posterTitle) => {
    const updated = await togglePosterFeatured(posterId);
    setPosters(updated);
    const item = updated.find(p => p.id === posterId);
    if (item?.isFeatured) {
      showToast(`⭐ "${posterTitle}" marcado como Best Seller`, 'success');
    } else {
      showToast(`"${posterTitle}" se quitó de Best Sellers`, 'info');
    }
  };

  // Delete Poster
  const handleDeletePoster = async (id, posterTitle) => {
    if (window.confirm(`¿Estás seguro de eliminar el póster "${posterTitle}" del catálogo?`)) {
      await deletePosterById(id);
      loadData();
      showToast('Póster eliminado correctamente.', 'info');
    }
  };

  // Create Category
  const handleCreateCategory = async (e) => {
    if (e) e.preventDefault();
    if (!newCatName.trim()) return;

    const catId = newCatName.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '');
    const newCat = {
      id: catId,
      name: newCatName.trim().toUpperCase()
    };

    await addNewCategory(newCat);
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

  // Handle JSON Import
  const handleImportJSON = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const json = JSON.parse(event.target.result);
          await importCatalogFromJSON(json);
          loadData();
          showToast('¡Copia de seguridad restaurada con éxito!', 'success');
        } catch (err) {
          showToast('El archivo JSON no es válido: ' + err.message, 'error');
        }
      };
      reader.readAsText(file);
    } catch (err) {
      showToast('Error al leer archivo: ' + err.message, 'error');
    }
  };

  return (
    <div style={{ paddingTop: '115px', background: '#05070d', minHeight: '100vh', color: '#f0f6fc' }}>
      
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: toast.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(0, 242, 254, 0.95)',
          color: '#06080e',
          padding: '12px 20px',
          borderRadius: '12px',
          fontWeight: 800,
          boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          maxWidth: '90vw',
          animation: 'fadeIn 0.2s ease'
        }}>
          {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span style={{ fontSize: '0.88rem' }}>{toast.message}</span>
        </div>
      )}

      {/* Top Header Banner */}
      <section style={{
        padding: '24px 0 16px 0',
        background: 'linear-gradient(180deg, #070c18 0%, #05070d 100%)',
        borderBottom: '1px solid rgba(0, 242, 254, 0.15)'
      }}>
        <div className="container">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px'
          }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(0, 242, 254, 0.1)',
                border: '1px solid rgba(0, 242, 254, 0.3)',
                color: 'var(--accent-cyan)',
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.7rem',
                fontWeight: 800,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginBottom: '6px'
              }}>
                <Shield size={12} />
                <span>Panel de Control Seguro</span>
              </div>

              <h1 style={{ fontSize: 'clamp(1.3rem, 3.5vw, 1.85rem)', fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.15 }}>
                Administración <span className="text-gradient-cyan">Deco Vintage</span>
              </h1>
            </div>

            {/* Quick Action Top Buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => onNavigate('home')}
                className="btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Volver a la Tienda Pública"
              >
                <ArrowLeft size={15} />
                <span>Tienda</span>
              </button>

              <button
                onClick={exportCatalogAsJSON}
                className="btn-cyan"
                style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Descargar copia de seguridad en JSON"
              >
                <Download size={15} />
                <span>Backup JSON</span>
              </button>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="btn-secondary"
                  style={{ padding: '8px 12px', fontSize: '0.8rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.35)', display: 'flex', alignItems: 'center', gap: '6px' }}
                  title="Cerrar sesión"
                >
                  <LogOut size={15} />
                  <span>Salir</span>
                </button>
              )}
            </div>
          </div>

          {/* Persistent Responsive Segmented Navigation Bar */}
          <div style={{
            marginTop: '20px',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch'
          }}>
            {/* 1. Inventario */}
            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '10px',
                background: activeTab === 'inventory' ? 'var(--grad-cyan)' : 'rgba(255, 255, 255, 0.04)',
                border: activeTab === 'inventory' ? '1px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.08)',
                color: activeTab === 'inventory' ? '#040609' : '#ffffff',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.2s ease',
                boxShadow: activeTab === 'inventory' ? '0 0 16px rgba(0, 242, 254, 0.4)' : 'none'
              }}
            >
              <Package size={15} />
              <span>Inventario</span>
              <span style={{
                background: activeTab === 'inventory' ? '#040609' : 'rgba(0, 242, 254, 0.2)',
                color: activeTab === 'inventory' ? '#00f2fe' : '#ffffff',
                padding: '1px 7px',
                borderRadius: '10px',
                fontSize: '0.72rem',
                fontWeight: 900
              }}>
                {posters.length}
              </span>
            </button>

            {/* 2. Nueva Obra / Editar */}
            <button
              type="button"
              onClick={() => {
                if (activeTab !== 'create') resetForm();
                setActiveTab('create');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '10px',
                background: activeTab === 'create' ? 'var(--grad-cyan)' : 'rgba(255, 255, 255, 0.04)',
                border: activeTab === 'create' ? '1px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.08)',
                color: activeTab === 'create' ? '#040609' : '#ffffff',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.2s ease',
                boxShadow: activeTab === 'create' ? '0 0 16px rgba(0, 242, 254, 0.4)' : 'none'
              }}
            >
              {editingId ? <Edit3 size={15} /> : <Plus size={15} />}
              <span>{editingId ? 'Editando Obra' : 'Nueva Obra'}</span>
            </button>

            {/* 3. Colecciones */}
            <button
              type="button"
              onClick={() => setActiveTab('franchises')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '10px',
                background: activeTab === 'franchises' ? 'var(--grad-cyan)' : 'rgba(255, 255, 255, 0.04)',
                border: activeTab === 'franchises' ? '1px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.08)',
                color: activeTab === 'franchises' ? '#040609' : '#ffffff',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.2s ease',
                boxShadow: activeTab === 'franchises' ? '0 0 16px rgba(0, 242, 254, 0.4)' : 'none'
              }}
            >
              <Shield size={15} />
              <span>Colecciones</span>
              <span style={{
                background: activeTab === 'franchises' ? '#040609' : 'rgba(0, 242, 254, 0.2)',
                color: activeTab === 'franchises' ? '#00f2fe' : '#ffffff',
                padding: '1px 7px',
                borderRadius: '10px',
                fontSize: '0.72rem',
                fontWeight: 900
              }}>
                {franchises.length}
              </span>
            </button>

            {/* 4. Categorías */}
            <button
              type="button"
              onClick={() => setActiveTab('categories')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '10px',
                background: activeTab === 'categories' ? 'var(--grad-cyan)' : 'rgba(255, 255, 255, 0.04)',
                border: activeTab === 'categories' ? '1px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.08)',
                color: activeTab === 'categories' ? '#040609' : '#ffffff',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.2s ease',
                boxShadow: activeTab === 'categories' ? '0 0 16px rgba(0, 242, 254, 0.4)' : 'none'
              }}
            >
              <Tag size={15} />
              <span>Categorías</span>
              <span style={{
                background: activeTab === 'categories' ? '#040609' : 'rgba(0, 242, 254, 0.2)',
                color: activeTab === 'categories' ? '#00f2fe' : '#ffffff',
                padding: '1px 7px',
                borderRadius: '10px',
                fontSize: '0.72rem',
                fontWeight: 900
              }}>
                {categories.filter(c => c.id !== 'TODOS').length}
              </span>
            </button>

            {/* 5. Copias / Backup */}
            <button
              type="button"
              onClick={() => setActiveTab('backup')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '10px',
                background: activeTab === 'backup' ? 'var(--grad-cyan)' : 'rgba(255, 255, 255, 0.04)',
                border: activeTab === 'backup' ? '1px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.08)',
                color: activeTab === 'backup' ? '#040609' : '#ffffff',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.2s ease',
                boxShadow: activeTab === 'backup' ? '0 0 16px rgba(0, 242, 254, 0.4)' : 'none'
              }}
            >
              <Database size={15} />
              <span>Copias / Backup</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Body */}
      <section style={{ padding: '28px 0 80px 0' }}>
        <div className="container">
          
          {/* ======================================================== */}
          {/* TAB 1: INVENTARIO (INVENTORY)                            */}
          {/* ======================================================== */}
          {activeTab === 'inventory' && (
            <div>
              {/* Search & Category Filter Toolbar */}
              <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}>
                  
                  {/* Search Input */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)',
                    flex: '1 1 240px',
                    boxSizing: 'border-box'
                  }}>
                    <Search size={18} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
                    <input
                      type="text"
                      placeholder="Buscar por título o etiqueta..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        background: 'none',
                        border: 'none',
                        color: '#fff',
                        fontSize: '0.9rem',
                        outline: 'none',
                        padding: '2px 0'
                      }}
                    />
                    {searchFilter && (
                      <button
                        type="button"
                        onClick={() => setSearchFilter('')}
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          cursor: 'pointer',
                          flexShrink: 0,
                          padding: 0,
                          transition: 'all 0.2s ease'
                        }}
                        title="Limpiar búsqueda"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Category Dropdown */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flex: '1 1 200px'
                  }}>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#090e18',
                        color: '#fff',
                        border: '1px solid rgba(0, 242, 254, 0.3)',
                        padding: '9px 14px',
                        borderRadius: '10px',
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
                  </div>

                </div>

                {/* Counter indicator */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '12px',
                  paddingTop: '10px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)'
                }}>
                  <span>Mostrando <strong>{filteredPosters.length}</strong> de {posters.length} obras</span>
                  <button
                    onClick={() => {
                      resetForm();
                      setActiveTab('create');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-cyan)',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Plus size={14} />
                    <span>Agregar Nueva</span>
                  </button>
                </div>
              </div>

              {/* Posters Listing: Desktop Table vs Mobile Cards */}
              {filteredPosters.length === 0 ? (
                <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <Package size={40} color="var(--accent-cyan)" style={{ opacity: 0.5, marginBottom: '12px' }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
                    No se encontraron obras con ese criterio
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    Prueba cambiando el filtro o agrega un nuevo diseño al catálogo.
                  </p>
                  <button
                    onClick={() => {
                      resetForm();
                      setActiveTab('create');
                    }}
                    className="btn-cyan"
                    style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                  >
                    <Plus size={16} />
                    <span>Crear Obra</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* MOBILE VIEW (CARDS): Clean card list for screens <= 768px */}
                  <div className="admin-mobile-cards" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredPosters.map((poster) => {
                      const franchiseObj = franchises.find(f => f.id === poster.franchise);
                      return (
                        <div
                          key={poster.id}
                          className="glass-card"
                          style={{
                            padding: '14px',
                            display: 'flex',
                            gap: '14px',
                            alignItems: 'flex-start',
                            position: 'relative'
                          }}
                        >
                          {/* Square Thumbnail */}
                          <div style={{
                            width: '68px',
                            height: '68px',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            flexShrink: 0,
                            border: '1px solid rgba(0, 242, 254, 0.3)',
                            background: '#04070e'
                          }}>
                            <img
                              src={poster.thumb || poster.image}
                              alt={poster.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>

                          {/* Details & Actions */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                              <span style={{
                                background: 'rgba(0, 242, 254, 0.12)',
                                color: 'var(--accent-cyan)',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                textTransform: 'uppercase'
                              }}>
                                {poster.category}
                              </span>

                              {franchiseObj && (
                                <span style={{
                                  background: 'rgba(255, 255, 255, 0.08)',
                                  color: '#ffffff',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.68rem',
                                  fontWeight: 700
                                }}>
                                  {franchiseObj.name}
                                </span>
                              )}
                            </div>

                            <h4 style={{
                              color: '#fff',
                              fontSize: '0.92rem',
                              fontWeight: 800,
                              margin: '0 0 2px 0',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {poster.title}
                            </h4>

                            <p style={{
                              color: 'var(--text-secondary)',
                              fontSize: '0.78rem',
                              margin: '0 0 10px 0',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {poster.subtitle || 'Sin subtítulo'}
                            </p>

                            {/* Action Buttons Row */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              paddingTop: '8px',
                              borderTop: '1px solid rgba(255, 255, 255, 0.06)'
                            }}>
                              {/* Best Seller Star Toggle */}
                              <button
                                onClick={() => handleToggleFeatured(poster.id, poster.title)}
                                style={{
                                  background: poster.isFeatured ? 'rgba(234, 179, 8, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                                  border: poster.isFeatured ? '1px solid #eab308' : '1px solid rgba(255, 255, 255, 0.1)',
                                  color: poster.isFeatured ? '#eab308' : 'var(--text-muted)',
                                  borderRadius: '6px',
                                  padding: '5px 8px',
                                  fontSize: '0.74rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                title="Alternar Best Seller"
                              >
                                <Star size={13} fill={poster.isFeatured ? '#eab308' : 'none'} />
                                <span>{poster.isFeatured ? 'Best Seller' : 'Normal'}</span>
                              </button>

                              {/* Edit & Delete */}
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={() => startEdit(poster)}
                                  className="btn-cyan"
                                  style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                  title="Editar póster"
                                >
                                  <Edit3 size={13} />
                                  <span>Editar</span>
                                </button>

                                <button
                                  onClick={() => handleDeletePoster(poster.id, poster.title)}
                                  style={{
                                    background: 'rgba(239, 68, 68, 0.12)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    color: '#ef4444',
                                    borderRadius: '8px',
                                    padding: '6px 10px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                  title="Eliminar póster"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* DESKTOP VIEW (TABLE): Clean table for screens > 768px */}
                  <div className="admin-desktop-table glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                        <thead>
                          <tr style={{ background: 'rgba(0, 0, 0, 0.4)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                            <th style={{ padding: '14px 18px', color: 'var(--accent-cyan)', fontWeight: 800 }}>VISTA PREVIA</th>
                            <th style={{ padding: '14px 18px', color: 'var(--accent-cyan)', fontWeight: 800 }}>TÍTULO / SUBTÍTULO</th>
                            <th style={{ padding: '14px 18px', color: 'var(--accent-cyan)', fontWeight: 800 }}>CATEGORÍA</th>
                            <th style={{ padding: '14px 18px', color: 'var(--accent-cyan)', fontWeight: 800 }}>COLECCIÓN</th>
                            <th style={{ padding: '14px 18px', color: 'var(--accent-cyan)', fontWeight: 800 }}>BEST SELLER</th>
                            <th style={{ padding: '14px 18px', color: 'var(--accent-cyan)', fontWeight: 800, textAlign: 'right' }}>ACCIONES</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPosters.map((poster) => {
                            const franchiseObj = franchises.find(f => f.id === poster.franchise);
                            return (
                              <tr
                                key={poster.id}
                                style={{
                                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                                  transition: 'background 0.2s ease'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0, 242, 254, 0.03)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              >
                                {/* Thumbnail */}
                                <td style={{ padding: '12px 18px' }}>
                                  <div style={{
                                    width: '52px',
                                    height: '52px',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    border: '1px solid rgba(0, 242, 254, 0.25)',
                                    background: '#04070e'
                                  }}>
                                    <img
                                      src={poster.thumb || poster.image}
                                      alt={poster.title}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                  </div>
                                </td>

                                {/* Title & Subtitle */}
                                <td style={{ padding: '12px 18px' }}>
                                  <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem', marginBottom: '2px' }}>
                                    {poster.title}
                                  </div>
                                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                                    {poster.subtitle || 'Sin subtítulo'}
                                  </div>
                                </td>

                                {/* Category */}
                                <td style={{ padding: '12px 18px' }}>
                                  <span className="badge-cyan" style={{ fontSize: '0.72rem', padding: '3px 10px' }}>
                                    {poster.category}
                                  </span>
                                </td>

                                {/* Collection */}
                                <td style={{ padding: '12px 18px' }}>
                                  {franchiseObj ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <img
                                        src={franchiseObj.img}
                                        alt={franchiseObj.name}
                                        style={{ width: '18px', height: '18px', objectFit: 'contain' }}
                                      />
                                      <span style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 700 }}>
                                        {franchiseObj.name}
                                      </span>
                                    </div>
                                  ) : (
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>
                                  )}
                                </td>

                                {/* Best Seller Toggle */}
                                <td style={{ padding: '12px 18px' }}>
                                  <button
                                    onClick={() => handleToggleFeatured(poster.id, poster.title)}
                                    style={{
                                      background: poster.isFeatured ? 'rgba(234, 179, 8, 0.15)' : 'transparent',
                                      border: poster.isFeatured ? '1px solid #eab308' : '1px solid rgba(255, 255, 255, 0.1)',
                                      color: poster.isFeatured ? '#eab308' : 'var(--text-muted)',
                                      borderRadius: '6px',
                                      padding: '5px 10px',
                                      fontSize: '0.78rem',
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '5px'
                                    }}
                                  >
                                    <Star size={14} fill={poster.isFeatured ? '#eab308' : 'none'} />
                                    <span>{poster.isFeatured ? 'Destacado' : 'Normal'}</span>
                                  </button>
                                </td>

                                {/* Actions */}
                                <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                                  <div style={{ display: 'inline-flex', gap: '8px' }}>
                                    <button
                                      onClick={() => startEdit(poster)}
                                      className="btn-cyan"
                                      style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                                      title="Editar"
                                    >
                                      <Edit3 size={14} />
                                      <span>Editar</span>
                                    </button>
                                    <button
                                      onClick={() => handleDeletePoster(poster.id, poster.title)}
                                      style={{
                                        background: 'rgba(239, 68, 68, 0.12)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        color: '#ef4444',
                                        borderRadius: '8px',
                                        padding: '6px 10px',
                                        cursor: 'pointer'
                                      }}
                                      title="Eliminar"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: CREAR / EDITAR OBRA                               */}
          {/* ======================================================== */}
          {activeTab === 'create' && (
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
                      onClick={resetForm}
                      className="btn-secondary"
                      style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                    >
                      Cancelar Edición
                    </button>
                  )}
                </div>

                <form onSubmit={handleSubmitPoster}>
                  
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
                        background: 'rgba(0, 242, 254, 0.04)',
                        border: '1px solid rgba(0, 242, 254, 0.3)',
                        borderRadius: '12px',
                        padding: '14px',
                        flexWrap: 'wrap'
                      }}>
                        <div style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '1px solid rgba(0, 242, 254, 0.4)',
                          background: '#04070e',
                          flexShrink: 0
                        }}>
                          <img src={imageThumb || imageFull} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>

                        <div style={{ flex: 1, minWidth: '180px' }}>
                          <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.9rem', marginBottom: '4px' }}>
                            ✓ Imagen lista para publicación
                          </div>
                          {imageMeta && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                              Original: {imageMeta.originalSize} KB • {imageMeta.dimensions}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="btn-secondary"
                          style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                        >
                          <Upload size={14} />
                          <span>Cambiar Imagen</span>
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          border: '2px dashed rgba(0, 242, 254, 0.4)',
                          borderRadius: '14px',
                          padding: '32px 20px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          background: 'rgba(0, 242, 254, 0.02)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Upload size={32} color="var(--accent-cyan)" style={{ marginBottom: '10px' }} />
                        <h4 style={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem', margin: '0 0 6px 0' }}>
                          Haz clic o arrastra aquí tu imagen (JPG / PNG)
                        </h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
                          El sistema la escalará y optimizará a WebP automáticamente para máxima velocidad.
                        </p>
                        {isOptimizing && (
                          <div style={{ marginTop: '10px', color: 'var(--accent-cyan)', fontWeight: 800, fontSize: '0.82rem' }}>
                            ⏳ Optimizando imagen...
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 2. Title & Subtitle */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 900, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                        2. Título de la Obra *:
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
                          fontSize: '1rem',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                        Subtítulo / Tagline:
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
                          fontSize: '1rem',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  {/* 3. Description */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 900, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                      3. Descripción & Detalles de la Obra:
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Escribe la descripción de la obra, detalles técnicos, materiales o historia..."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        background: '#0a0e18',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '0.92rem',
                        lineHeight: '1.5',
                        outline: 'none',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* 4. Category Selector & Inline Creator */}
                  <div style={{
                    marginBottom: '24px',
                    background: 'rgba(0, 242, 254, 0.04)',
                    padding: '16px 18px',
                    borderRadius: '12px',
                    border: '1px solid rgba(0, 242, 254, 0.25)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        4. Categoría del Producto *:
                      </label>
                      <span style={{ fontSize: '0.78rem', color: '#5eead4', fontWeight: 700 }}>
                        Seleccionada: <strong style={{ color: '#fff', textDecoration: 'underline' }}>{category}</strong>
                      </span>
                    </div>

                    {/* Category Clickable Pills */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                      {categories.filter(c => c.id !== 'TODOS').map(cat => {
                        const isSelected = category === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setCategory(cat.id)}
                            style={{
                              padding: '7px 14px',
                              borderRadius: 'var(--radius-full)',
                              background: isSelected ? 'var(--grad-cyan)' : 'rgba(255, 255, 255, 0.05)',
                              border: isSelected ? '1px solid #00f2fe' : '1px solid var(--border-subtle)',
                              color: isSelected ? '#040609' : '#ffffff',
                              fontWeight: 800,
                              fontSize: '0.8rem',
                              letterSpacing: '0.04em',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.2s ease',
                              boxShadow: isSelected ? '0 0 12px rgba(0, 242, 254, 0.4)' : 'none'
                            }}
                          >
                            {isSelected && <Check size={13} strokeWidth={3} />}
                            <span>{cat.name}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Inline Instant New Category Creator (Responsive) */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        placeholder="+ O escribe una NUEVA categoría..."
                        value={newCatName}
                        onChange={e => setNewCatName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateCategory(e);
                          }
                        }}
                        style={{
                          flex: '1 1 200px',
                          padding: '9px 12px',
                          background: '#04070e',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
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
                        style={{ padding: '9px 16px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                      >
                        <Plus size={14} />
                        <span>Crear & Asignar</span>
                      </button>
                    </div>
                  </div>

                  {/* 5. Collection Selector */}
                  <div style={{
                    marginBottom: '24px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    padding: '16px 18px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Shield size={16} color="var(--accent-cyan)" />
                        <label style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          5. Colección Asociada (Opcional):
                        </label>
                      </div>
                      <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                        {franchiseId ? `Asignada a: ${franchises.find(f => f.id === franchiseId)?.name || franchiseId}` : 'Sin colección específica (General)'}
                      </span>
                    </div>

                    {/* Collection Pills */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setFranchiseId('')}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-full)',
                          background: !franchiseId ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                          border: !franchiseId ? '1px solid #fff' : '1px solid rgba(255, 255, 255, 0.1)',
                          color: !franchiseId ? '#fff' : 'var(--text-secondary)',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {!franchiseId && <Check size={12} strokeWidth={3} />}
                        <span>⚪ General</span>
                      </button>

                      {franchises.map(f => {
                        const isSelected = franchiseId === f.id;
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setFranchiseId(f.id)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 'var(--radius-full)',
                              background: isSelected ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                              border: isSelected ? '1px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.1)',
                              color: isSelected ? '#00f2fe' : '#ffffff',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.2s ease',
                              boxShadow: isSelected ? '0 0 10px rgba(0, 242, 254, 0.3)' : 'none'
                            }}
                          >
                            <img
                              src={f.img}
                              alt={f.name}
                              style={{ width: '16px', height: '16px', objectFit: 'contain', display: 'block' }}
                            />
                            <span>{f.name}</span>
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 6. Sizes Selection */}
                  <div style={{ marginBottom: '22px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        6. Tamaños Disponibles:
                      </label>
                      <button
                        type="button"
                        onClick={() => handleSizeModeChange('ALL_SIZES')}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: selectedSizeIds.length === 6 ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          border: selectedSizeIds.length === 6 ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                          color: selectedSizeIds.length === 6 ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        ✓ Marcar los 6 Tamaños
                      </button>
                    </div>

                    {/* Responsive Grid of Sizes */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
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
                              fontSize: '0.82rem',
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

                  {/* Submit / Cancel Buttons (Responsive Stacking on Mobile) */}
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
                      onClick={() => {
                        resetForm();
                        setActiveTab('inventory');
                      }}
                      className="btn-secondary"
                      style={{ flex: '1 1 120px', justifyContent: 'center', padding: '14px' }}
                    >
                      <span>Volver</span>
                    </button>
                  </div>

                </form>
              </div>

              {/* Live Preview of Poster Card */}
              <div style={{ maxWidth: '340px', margin: '0 auto', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Eye size={15} />
                  <span>Previsualización en Vivo de la Tarjeta</span>
                </div>

                <div className="product-card" style={{ cursor: 'default', margin: '0 auto' }}>
                  <div style={{ position: 'relative', width: '100%', height: '280px', overflow: 'hidden', background: '#020408' }}>
                    {imageThumb || imageFull ? (
                      <img src={imageThumb || imageFull} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <ImageIcon size={36} style={{ marginBottom: '8px', opacity: 0.4 }} />
                        <span style={{ fontSize: '0.75rem' }}>Sube una imagen para ver la tarjeta</span>
                      </div>
                    )}
                    <span className="badge-cyan" style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 2 }}>
                      {selectedSizeIds.length === 6 ? '6 Tamaños' : `${selectedSizeIds.length} Tamaños`}
                    </span>
                  </div>

                  <div style={{ padding: '14px', textAlign: 'left' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '3px' }}>
                      {category}
                    </div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', marginBottom: '10px', lineHeight: '1.3' }}>
                      {title || 'Título de Ejemplo'}
                    </h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--accent-cyan)' }}>
                        {selectedSizeIds.length === 1 && selectedSizeIds[0] === 'GRANDE' ? 'Q 125.00' : 'Desde Q 25.00'}
                      </span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#ffffff' }}>
                        Ver Detalle ➔
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: CATEGORÍAS (CATEGORIES)                           */}
          {/* ======================================================== */}
          {activeTab === 'categories' && (
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              
              {/* Create Category Form */}
              <div className="glass-card" style={{ padding: 'clamp(18px, 4vw, 28px)', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <Tag size={20} color="var(--accent-cyan)" />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                    Crear Nueva Categoría
                  </h3>
                </div>

                <form onSubmit={handleCreateCategory} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    required
                    placeholder="Ej. STAR WARS, GAMING, RETRO..."
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    style={{
                      flex: '1 1 220px',
                      padding: '10px 14px',
                      background: '#0a0e18',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.92rem',
                      outline: 'none'
                    }}
                  />
                  <button type="submit" className="btn-cyan" style={{ padding: '10px 20px', flex: '0 0 auto' }}>
                    <Plus size={16} />
                    <span>Agregar Categoría</span>
                  </button>
                </form>
              </div>

              {/* Categories List */}
              <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', fontWeight: 800, color: 'var(--accent-cyan)', fontSize: '0.88rem' }}>
                  CATEGORÍAS ACTIVAS EN EL SITIO ({categories.filter(c => c.id !== 'TODOS').length})
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {categories.filter(c => c.id !== 'TODOS').map(cat => {
                    const count = posters.filter(p => p.category === cat.id).length;
                    return (
                      <div
                        key={cat.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '14px 20px',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                          gap: '12px'
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 800, color: '#fff', fontSize: '0.95rem', marginRight: '8px' }}>
                            {cat.name}
                          </span>
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                            ID: <code>{cat.id}</code>
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="badge-cyan" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
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
                                background: 'rgba(239, 68, 68, 0.12)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#ef4444',
                                cursor: 'pointer',
                                padding: '6px',
                                borderRadius: '6px'
                              }}
                              title="Eliminar categoría vacía"
                            >
                              <Trash2 size={14} />
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

          {/* ======================================================== */}
          {/* TAB 4: COLECCIONES (FRANCHISES)                          */}
          {/* ======================================================== */}
          {activeTab === 'franchises' && (
            <div style={{ maxWidth: '850px', margin: '0 auto' }}>
              
              {/* Create Collection Form */}
              <div className="glass-card" style={{ padding: 'clamp(18px, 4vw, 28px)', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <Shield size={20} color="var(--accent-cyan)" />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                    Agregar Nueva Colección al Inicio
                  </h3>
                </div>

                <form onSubmit={handleCreateFranchise} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Nombre de la Colección *:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Marvel Comics, Batman, Transformers..."
                      value={newFranchiseName}
                      onChange={e => setNewFranchiseName(e.target.value)}
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

                  {/* Icon Upload */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Ícono / Logotipo de la Colección (PNG Transparente / WebP) *:
                    </label>

                    <input
                      type="file"
                      ref={franchiseIconRef}
                      onChange={handleFranchiseIconChange}
                      accept="image/png, image/webp, image/jpeg"
                      style={{ display: 'none' }}
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => franchiseIconRef.current?.click()}
                        className="btn-secondary"
                        style={{ padding: '9px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Upload size={15} />
                        <span>{newFranchiseImg ? 'Cambiar Logotipo' : 'Subir Logotipo'}</span>
                      </button>

                      {isUploadingFranchiseIcon && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>⏳ Procesando logo...</span>
                      )}

                      {newFranchiseImg && (
                        <div style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '8px',
                          background: 'rgba(0, 242, 254, 0.08)',
                          border: '1px solid rgba(0, 242, 254, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '4px'
                        }}>
                          <img
                            src={newFranchiseImg}
                            alt="Logo preview"
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit button */}
                  <div>
                    <button type="submit" className="btn-cyan" style={{ padding: '11px 22px', fontSize: '0.85rem' }}>
                      <Plus size={16} />
                      <span>Guardar Colección en el Inicio</span>
                    </button>
                  </div>

                </form>
              </div>

              {/* Collections List */}
              <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', fontWeight: 800, color: 'var(--accent-cyan)', fontSize: '0.88rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                  <span>COLECCIONES ACTIVAS EN EL HERO ({franchises.length})</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Botones flotantes en el inicio</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {franchises.map(f => {
                    const count = posters.filter(p => p.franchise === f.id).length;
                    return (
                      <div
                        key={f.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '14px 20px',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                          gap: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '8px',
                            background: 'rgba(0, 0, 0, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4px',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            flexShrink: 0
                          }}>
                            <img
                              src={f.img}
                              alt={f.name}
                              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                            />
                          </div>

                          <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.95rem' }}>
                            {f.name}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="badge-cyan" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
                            {count} {count === 1 ? 'diseño' : 'diseños'}
                          </span>

                          <button
                            onClick={() => handleDeleteFranchise(f.id)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.12)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '6px',
                              borderRadius: '6px'
                            }}
                            title="Eliminar colección"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: COPIAS / BACKUP & RESTORE                         */}
          {/* ======================================================== */}
          {activeTab === 'backup' && (
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div className="glass-card" style={{ padding: 'clamp(20px, 5vw, 36px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <Database size={24} color="var(--accent-cyan)" />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff', margin: 0 }}>
                    Copia de Seguridad & Gestión de Datos
                  </h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '24px', lineHeight: '1.5' }}>
                  Exporta todo tu catálogo con imágenes y configuraciones en un archivo JSON para tener un respaldo seguro o restaurarlo.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  
                  {/* Export */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                    <Download size={26} color="var(--accent-cyan)" style={{ marginBottom: '8px' }} />
                    <h4 style={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem', margin: '0 0 6px 0' }}>Descargar Respaldo</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: '14px', lineHeight: '1.4' }}>
                      Genera un archivo <code>.json</code> con todas las obras, colecciones y categorías.
                    </p>
                    <button onClick={exportCatalogAsJSON} className="btn-cyan" style={{ width: '100%', justifyContent: 'center', padding: '9px', fontSize: '0.82rem' }}>
                      Descargar JSON
                    </button>
                  </div>

                  {/* Import */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                    <Upload size={26} color="var(--accent-cyan)" style={{ marginBottom: '8px' }} />
                    <h4 style={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem', margin: '0 0 6px 0' }}>Restaurar Respaldo</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: '14px', lineHeight: '1.4' }}>
                      Carga un archivo <code>.json</code> previamente exportado para recuperar el catálogo.
                    </p>
                    <input
                      type="file"
                      ref={importInputRef}
                      onChange={handleImportJSON}
                      accept=".json"
                      style={{ display: 'none' }}
                    />
                    <button
                      onClick={() => importInputRef.current?.click()}
                      className="btn-secondary"
                      style={{ width: '100%', justifyContent: 'center', padding: '9px', fontSize: '0.82rem' }}
                    >
                      Subir Archivo JSON
                    </button>
                  </div>

                  {/* Reset */}
                  <div style={{ background: 'rgba(239, 68, 68, 0.03)', padding: '18px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <RotateCcw size={26} color="#ef4444" style={{ marginBottom: '8px' }} />
                    <h4 style={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem', margin: '0 0 6px 0' }}>Restablecer Inicial</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: '14px', lineHeight: '1.4' }}>
                      Restaura el catálogo a los datos originales de fábrica.
                    </p>
                    <button
                      onClick={() => {
                        if (window.confirm('¿Seguro que deseas restablecer el catálogo a los valores iniciales de fábrica? Se perderán las modificaciones personalizadas.')) {
                          resetCatalogToDefault();
                          loadData();
                          showToast('Catálogo restablecido a valores iniciales.', 'info');
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '9px',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid #ef4444',
                        color: '#ef4444',
                        fontWeight: 800,
                        fontSize: '0.82rem',
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

    </div>
  );
}
