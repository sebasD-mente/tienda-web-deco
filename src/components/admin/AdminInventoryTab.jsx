import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, X, Package, Star, Edit3, Trash2, Eye 
} from 'lucide-react';
import OptimizedImage from '../OptimizedImage';

export default function AdminInventoryTab({
  posters = [],
  categories = [],
  franchises = [],
  onEditPoster,
  onDeletePoster,
  onToggleFeatured,
  onCreateNew
}) {
  // Asegurar que al entrar al inventario (p. ej. tras guardar obra o cambiar de pestaña), la vista esté situada arriba donde está el botón de crear obra
  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const [searchFilter, setSearchFilter] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Debounce search filter input by 300ms to avoid expensive filtering on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchFilter]);

  const handleClearSearch = () => {
    setSearchFilter('');
    setDebouncedSearch('');
  };

  // Filtered posters calculation using debouncedSearch
  const filteredPosters = posters.filter(poster => {
    const query = debouncedSearch.trim().toLowerCase();
    const matchesSearch = query === '' || 
      (poster.title || '').toLowerCase().includes(query) ||
      (poster.subtitle || '').toLowerCase().includes(query) ||
      (poster.tags || []).some(t => (t || '').toLowerCase().includes(query));

    const matchesCategory = categoryFilter === 'ALL' || poster.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
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
                onClick={handleClearSearch}
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
            onClick={onCreateNew}
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
            onClick={onCreateNew}
            className="btn-cyan"
            style={{ padding: '8px 18px', fontSize: '0.85rem' }}
          >
            <Plus size={16} />
            <span>Crear Obra</span>
          </button>
        </div>
      ) : (
        <div className="admin-inventory-list glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Cabecera para pantallas grandes (oculta automáticamente en móviles vía CSS) */}
          <div className="admin-inv-header">
            <div className="admin-inv-col-thumb">Miniatura</div>
            <div className="admin-inv-col-info">Título y Detalles</div>
            <div className="admin-inv-col-category">Categoría</div>
            <div className="admin-inv-col-franchise">Colección</div>
            <div className="admin-inv-col-featured">Destacado</div>
            <div className="admin-inv-col-actions">Acciones</div>
          </div>

          {/* Cuerpo con ÚNICO bucle de renderizado */}
          <div className="admin-inv-body">
            {filteredPosters.map((poster) => {
              const franchiseObj = franchises.find(f => f.id === poster.franchise);
              return (
                <div key={poster.id} className="admin-inv-row">
                  
                  {/* 1. Miniatura con OptimizedImage ÚNICA */}
                  <div className="admin-inv-col-thumb">
                    <div className="admin-inv-thumb-box">
                      <OptimizedImage
                        src={poster.thumb || poster.image}
                        alt={poster.title}
                        objectFit="cover"
                        style={{ width: '100%', height: '100%' }}
                      />
                    </div>
                  </div>

                  {/* 2. Título, Subtítulo y Metadatos */}
                  <div className="admin-inv-col-info">
                    <div className="admin-inv-mobile-meta">
                      <span className="badge-cyan" style={{ fontSize: '0.68rem', padding: '2px 8px', textTransform: 'uppercase' }}>
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
                    <div className="admin-inv-title" title={poster.title}>
                      {poster.title}
                    </div>
                    <div className="admin-inv-subtitle" title={poster.subtitle}>
                      {poster.subtitle || 'Sin subtítulo'}
                    </div>
                  </div>

                  {/* 3. Columna Categoría (Desktop) */}
                  <div className="admin-inv-col-category">
                    <span className="badge-cyan" style={{ fontSize: '0.72rem', padding: '3px 10px', textTransform: 'uppercase' }}>
                      {poster.category}
                    </span>
                  </div>

                  {/* 4. Columna Colección (Desktop) */}
                  <div className="admin-inv-col-franchise">
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
                  </div>

                  {/* 5 y 6. Acciones agrupadas con display: contents en Desktop */}
                  <div className="admin-inv-actions-wrapper">
                    <div className="admin-inv-col-featured">
                      <button
                        onClick={() => onToggleFeatured(poster.id, poster.title)}
                        style={{
                          background: poster.isFeatured ? 'rgba(234, 179, 8, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                          border: poster.isFeatured ? '1px solid #eab308' : '1px solid rgba(255, 255, 255, 0.1)',
                          color: poster.isFeatured ? '#eab308' : 'var(--text-muted)',
                          borderRadius: '6px',
                          padding: '5px 8px',
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="Alternar Destacado"
                      >
                        <Star size={13} fill={poster.isFeatured ? '#eab308' : 'none'} />
                        <span>{poster.isFeatured ? 'Destacado' : 'Normal'}</span>
                      </button>
                    </div>

                    <div className="admin-inv-col-actions">
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => onEditPoster(poster)}
                          className="btn-cyan"
                          style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Editar"
                        >
                          <Edit3 size={13} />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => onDeletePoster(poster.id, poster.title)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#ef4444',
                            borderRadius: '6px',
                            padding: '6px 8px',
                            cursor: 'pointer'
                          }}
                          title="Eliminar"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
