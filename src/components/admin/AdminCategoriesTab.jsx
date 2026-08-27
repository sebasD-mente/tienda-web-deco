import React, { useState } from 'react';
import { Tag, Plus, Trash2 } from 'lucide-react';

export default function AdminCategoriesTab({
  categories = [],
  posters = [],
  onCreateCategory,
  onDeleteCategory,
  onShowToast
}) {
  const [newCatName, setNewCatName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) {
      onShowToast('Ingresa un nombre para la categoría.', 'error');
      return;
    }

    const catId = trimmed.toUpperCase().replace(/\s+/g, '_');
    if (categories.some(c => c.id === catId)) {
      onShowToast('Ya existe una categoría con ese nombre.', 'error');
      return;
    }

    try {
      await onCreateCategory({ id: catId, name: trimmed.toUpperCase() });
      setNewCatName('');
      onShowToast(`¡Categoría "${trimmed.toUpperCase()}" agregada!`, 'success');
    } catch (err) {
      onShowToast('Error al crear categoría: ' + err.message, 'error');
    }
  };

  const handleDelete = async (catId, catName) => {
    const count = posters.filter(p => p.category === catId).length;
    if (count > 0) {
      onShowToast(`No se puede eliminar "${catName}" porque contiene ${count} obra(s).`, 'error');
      return;
    }

    const confirm1 = window.confirm(`¿Estás seguro de eliminar la categoría "${catName}"?`);
    if (!confirm1) return;

    try {
      await onDeleteCategory(catId);
      onShowToast(`Categoría "${catName}" eliminada.`, 'info');
    } catch (err) {
      onShowToast('Error al eliminar categoría: ' + err.message, 'error');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Create Category Form */}
      <div className="glass-card" style={{ padding: 'clamp(18px, 4vw, 28px)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Tag size={20} color="var(--accent-cyan)" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Crear Nueva Categoría
          </h3>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
                      onClick={() => handleDelete(cat.id, cat.name)}
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
  );
}
