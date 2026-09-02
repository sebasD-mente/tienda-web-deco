import React, { useState, useRef } from 'react';
import { Shield, Plus, Upload, Trash2 } from 'lucide-react';
import { optimizeImageFile } from '../../utils/imageOptimizer';

export default function AdminFranchisesTab({
  franchises = [],
  posters = [],
  categories = [],
  onCreateFranchise,
  onDeleteFranchise,
  onShowToast
}) {
  const [newFranchiseName, setNewFranchiseName] = useState('');
  const [newFranchiseImg, setNewFranchiseImg] = useState('');
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const franchiseIconRef = useRef(null);

  const handleIconChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingIcon(true);
      const result = await optimizeImageFile(file);
      setNewFranchiseImg(result.thumbDataUrl || result.fullDataUrl);
      onShowToast('¡Logotipo optimizado!', 'success');
    } catch (err) {
      onShowToast('Error al optimizar logo: ' + err.message, 'error');
    } finally {
      setIsUploadingIcon(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nameTrimmed = newFranchiseName.trim();
    if (!nameTrimmed) {
      onShowToast('Ingresa un nombre para la colección.', 'error');
      return;
    }
    if (!newFranchiseImg) {
      onShowToast('Debes seleccionar un logotipo para la colección.', 'error');
      return;
    }

    const cleanId = nameTrimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (franchises.some(f => f.id === cleanId || f.slug === cleanId)) {
      onShowToast('Ya existe una colección con ese nombre o identificador.', 'error');
      return;
    }

    try {
      await onCreateFranchise({
        id: cleanId,
        slug: cleanId,
        name: nameTrimmed,
        img: newFranchiseImg
      });
      setNewFranchiseName('');
      setNewFranchiseImg('');
      onShowToast(`¡Colección "${nameTrimmed}" agregada con éxito!`, 'success');
    } catch (err) {
      onShowToast('Error al crear colección: ' + err.message, 'error');
    }
  };

  const handleDelete = async (franchiseId, franchiseName) => {
    const confirm1 = window.confirm(`¿Estás seguro de eliminar la colección "${franchiseName}" del Inicio?`);
    if (!confirm1) return;

    try {
      await onDeleteFranchise(franchiseId);
      onShowToast(`Colección "${franchiseName}" eliminada.`, 'info');
    } catch (err) {
      onShowToast('Error al eliminar colección: ' + err.message, 'error');
    }
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      
      {/* Create Collection Form */}
      <div className="glass-card" style={{ padding: 'clamp(18px, 4vw, 28px)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Shield size={20} color="var(--accent-cyan)" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Agregar Nueva Colección al Inicio
          </h3>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '6px' }}>
              Nombre de la Colección *:
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Marvel Comics, Batman, Transformers, DeLorean, Fórmula 1..."
              value={newFranchiseName}
              onChange={e => setNewFranchiseName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: '#0a0e18',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.92rem',
                outline: 'none',
                boxSizing: 'border-box'
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
              onChange={handleIconChange}
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

              {isUploadingIcon && (
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
            const count = posters.filter(p => (
              p.franchise === f.id || 
              p.franchiseId === f.id || 
              (f.slug && (p.franchise === f.slug || p.franchiseId === f.slug)) ||
              (f.dbId && p.franchiseId === f.dbId)
            )).length;
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
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px'
                  }}>
                    <img
                      src={f.img}
                      alt={f.name}
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.92rem' }}>
                      {f.name}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      ID: <code>{f.id}</code>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="badge-cyan" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
                    {count} {count === 1 ? 'obra' : 'obras'}
                  </span>

                  <button
                    onClick={() => handleDelete(f.id, f.name)}
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
  );
}
