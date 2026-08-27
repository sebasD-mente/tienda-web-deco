import React, { useState } from 'react';
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
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Filtered posters calculation
  const filteredPosters = posters.filter(poster => {
    const matchesSearch = searchFilter.trim() === '' || 
      (poster.title || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
      (poster.subtitle || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
      (poster.tags || []).some(t => (t || '').toLowerCase().includes(searchFilter.toLowerCase()));

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
                    <OptimizedImage
                      src={poster.thumb || poster.image}
                      alt={poster.title}
                      fallbackSrc="/posters/wallpaper.jpg"
                      objectFit="cover"
                      style={{ width: '100%', height: '100%' }}
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
                          onClick={() => onEditPoster(poster)}
                          className="btn-cyan"
                          style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Editar póster"
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

          {/* DESKTOP TABLE VIEW: For screens > 768px */}
          <div className="admin-desktop-table">
            <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Miniatura</th>
                    <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Título y Detalles</th>
                    <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Categoría</th>
                    <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Colección</th>
                    <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Destacado</th>
                    <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPosters.map((poster) => {
                    const franchiseObj = franchises.find(f => f.id === poster.franchise);
                    return (
                      <tr
                        key={poster.id}
                        style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)', transition: 'background 0.2s ease' }}
                        className="admin-table-row"
                      >
                        {/* Thumbnail */}
                        <td style={{ padding: '12px 18px' }}>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: '1px solid rgba(0, 242, 254, 0.25)',
                            background: '#05070f'
                          }}>
                            <OptimizedImage
                              src={poster.thumb || poster.image}
                              alt={poster.title}
                              fallbackSrc="/posters/wallpaper.jpg"
                              objectFit="cover"
                              style={{ width: '100%', height: '100%' }}
                            />
                          </div>
                        </td>

                        {/* Title & Subtitle */}
                        <td style={{ padding: '12px 18px' }}>
                          <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.9rem' }}>
                            {poster.title}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
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
                            onClick={() => onToggleFeatured(poster.id, poster.title)}
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
                              onClick={() => onEditPoster(poster)}
                              className="btn-cyan"
                              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                              title="Editar"
                            >
                              <Edit3 size={14} />
                              <span>Editar</span>
                            </button>
                            <button
                              onClick={() => onDeletePoster(poster.id, poster.title)}
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
  );
}
