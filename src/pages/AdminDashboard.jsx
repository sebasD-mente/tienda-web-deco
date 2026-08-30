import React, { useState, useEffect } from 'react';
import {
  Plus, Edit3, Trash2, ArrowLeft, Star, Tag, Sliders, Shield,
  CheckCircle2, AlertCircle, LogOut, Package, Database
} from 'lucide-react';
import ArcReactor from '../components/ArcReactor';
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
  syncCatalogFromServer
} from '../utils/catalogStorage';

// Modular Subcomponents
import AdminInventoryTab    from '../components/admin/AdminInventoryTab';
import AdminCreatePosterTab from '../components/admin/AdminCreatePosterTab';
import AdminFranchisesTab   from '../components/admin/AdminFranchisesTab';
import AdminCategoriesTab   from '../components/admin/AdminCategoriesTab';
import AdminJarvisTab       from '../components/admin/AdminJarvisTab';
import AdminSettingsTab     from '../components/admin/AdminSettingsTab';

export default function AdminDashboard({ onNavigate, onLogout }) {
  const [activeTab,     setActiveTab]     = useState('inventory');
  const [posters,       setPosters]       = useState([]);
  const [categories,    setCategories]    = useState([]);
  const [franchises,    setFranchises]    = useState([]);
  const [editingPoster, setEditingPoster] = useState(null);
  const [toast,         setToast]         = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Lee la cache en memoria (ya sincronizada con el servidor por catalogStorage)
  const loadData = () => {
    setPosters(getStoredPosters());
    setCategories(getStoredCategories());
    setFranchises(getStoredFranchises());
  };

  // Re-sincroniza con el servidor y luego refresca la UI
  const reloadFromServer = async () => {
    await syncCatalogFromServer();
    loadData();
  };

  useEffect(() => {
    loadData();
    // Escuchar actualizaciones del catálogo (emitidas por catalogStorage tras mutaciones)
    const handleCatalogUpdate = () => loadData();
    window.addEventListener('deco-catalog-updated', handleCatalogUpdate);
    return () => window.removeEventListener('deco-catalog-updated', handleCatalogUpdate);
  }, []);

  // ── Poster Actions ────────────────────────────────────────────────────────────
  const handleSavePoster = async (posterData) => {
    try {
      const savedPoster = await saveOrUpdatePoster(posterData);
      // loadData() ya fue llamado por el evento 'deco-catalog-updated' en catalogStorage
      setEditingPoster(null);
      setActiveTab('inventory');
      const displayTitle = savedPoster?.titulo || savedPoster?.title || posterData.title;
      showToast(`¡Obra "${displayTitle}" guardada en PostgreSQL!`, 'success');
    } catch (err) {
      showToast(`Error al guardar en el servidor: ${err.message}`, 'error');
    }
  };

  const handleDeletePoster = async (posterId, posterTitle) => {
    const confirm1 = window.confirm(`¿Estás seguro de que deseas eliminar la obra "${posterTitle}"?`);
    if (!confirm1) return;
    try {
      await deletePosterById(posterId);
      showToast(`Obra "${posterTitle}" eliminada del servidor.`, 'info');
    } catch (err) {
      showToast(`Error al eliminar de servidor: ${err.message}`, 'error');
    }
  };

  const handleToggleFeatured = async (posterId, posterTitle) => {
    try {
      await togglePosterFeatured(posterId);
      showToast(`Estado Best Seller de "${posterTitle}" actualizado.`, 'success');
    } catch (err) {
      showToast(`Error al actualizar estado: ${err.message}`, 'error');
    }
  };


  const handleEditPoster = (poster) => {
    setEditingPoster(poster);
    setActiveTab('create');
  };

  // Category Actions
  const handleCreateCategory = async (catObj) => {
    try {
      await addNewCategory(catObj);
      loadData();
      showToast(`Categoría "${catObj.name}" creada.`, 'success');
    } catch (err) {
      showToast(`Error al crear categoría: ${err.message}`, 'error');
    }
  };

  const handleDeleteCategory = async (catId) => {
    try {
      await deleteCategoryById(catId);
      loadData();
      showToast('Categoría eliminada.', 'info');
    } catch (err) {
      showToast(`Error al eliminar categoría: ${err.message}`, 'error');
    }
  };

  // Franchise Actions
  const handleCreateFranchise = async (franchiseObj) => {
    try {
      const current = getStoredFranchises();
      const updated = [...current, franchiseObj];
      await saveAllFranchises(updated);
      loadData();
      showToast(`Franquicia "${franchiseObj.name}" creada.`, 'success');
    } catch (err) {
      showToast(`Error al crear franquicia: ${err.message}`, 'error');
    }
  };

  const handleDeleteFranchise = async (franchiseId) => {
    try {
      const current = getStoredFranchises();
      const updated = current.filter(f => f.id !== franchiseId);
      await saveAllFranchises(updated);
      loadData();
      showToast('Franquicia eliminada.', 'info');
    } catch (err) {
      showToast(`Error al eliminar franquicia: ${err.message}`, 'error');
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
                <span>Panel de Control Seguro • VPS SSD</span>
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

          {/* Responsive Segmented Navigation Bar */}
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

            {/* 2. Crear / Editar */}
            <button
              type="button"
              onClick={() => {
                setEditingPoster(null);
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
              {editingPoster ? <Edit3 size={15} /> : <Plus size={15} />}
              <span>{editingPoster ? 'Editando Obra' : 'Nueva Obra'}</span>
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

            {/* 5. J.A.R.V.I.S. IA */}
            <button
              type="button"
              onClick={() => setActiveTab('jarvis')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '10px',
                background: activeTab === 'jarvis' ? 'var(--grad-cyan)' : 'rgba(255, 255, 255, 0.04)',
                border: activeTab === 'jarvis' ? '1px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.08)',
                color: activeTab === 'jarvis' ? '#040609' : '#ffffff',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.2s ease',
                boxShadow: activeTab === 'jarvis' ? '0 0 16px rgba(0, 242, 254, 0.4)' : 'none'
              }}
            >
              <ArcReactor size={18} />
              <span>IA J.A.R.V.I.S.</span>
            </button>

            {/* 6. Ajustes & WhatsApp */}
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '10px',
                background: activeTab === 'settings' ? 'var(--grad-cyan)' : 'rgba(255, 255, 255, 0.04)',
                border: activeTab === 'settings' ? '1px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.08)',
                color: activeTab === 'settings' ? '#040609' : '#ffffff',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.2s ease',
                boxShadow: activeTab === 'settings' ? '0 0 16px rgba(0, 242, 254, 0.4)' : 'none'
              }}
            >
              <Sliders size={15} />
              <span>Ajustes & WhatsApp</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Body with Modular Subcomponents */}
      <section style={{ padding: '28px 0 80px 0' }}>
        <div className="container">
          
          {/* TAB 1: INVENTORY */}
          {activeTab === 'inventory' && (
            <AdminInventoryTab
              posters={posters}
              categories={categories}
              franchises={franchises}
              onEditPoster={handleEditPoster}
              onDeletePoster={handleDeletePoster}
              onToggleFeatured={handleToggleFeatured}
              onCreateNew={() => {
                setEditingPoster(null);
                setActiveTab('create');
              }}
            />
          )}

          {/* TAB 2: CREATE / EDIT POSTER */}
          {activeTab === 'create' && (
            <AdminCreatePosterTab
              editingPoster={editingPoster}
              categories={categories}
              franchises={franchises}
              onSavePoster={handleSavePoster}
              onCancel={() => {
                setEditingPoster(null);
                setActiveTab('inventory');
              }}
              onShowToast={showToast}
            />
          )}

          {/* TAB 3: FRANCHISES */}
          {activeTab === 'franchises' && (
            <AdminFranchisesTab
              franchises={franchises}
              posters={posters}
              categories={categories}
              onCreateFranchise={handleCreateFranchise}
              onDeleteFranchise={handleDeleteFranchise}
              onShowToast={showToast}
            />
          )}

          {/* TAB 4: CATEGORIES */}
          {activeTab === 'categories' && (
            <AdminCategoriesTab
              categories={categories}
              posters={posters}
              onCreateCategory={handleCreateCategory}
              onDeleteCategory={handleDeleteCategory}
              onShowToast={showToast}
            />
          )}

          {/* TAB 5: J.A.R.V.I.S. */}
          {activeTab === 'jarvis' && (
            <AdminJarvisTab onShowToast={showToast} />
          )}

          {/* TAB 6: SETTINGS & WHATSAPP */}
          {activeTab === 'settings' && (
            <AdminSettingsTab
              onShowToast={showToast}
              onReloadCatalog={reloadFromServer}
            />
          )}

        </div>
      </section>

    </div>
  );
}
