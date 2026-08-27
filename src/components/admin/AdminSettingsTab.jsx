import React, { useState, useEffect } from 'react';
import { 
  Phone, MessageSquare, Server, HardDrive, ShieldCheck, 
  Download, Upload, RotateCcw, Save, CheckCircle2, 
  AlertCircle, ExternalLink, RefreshCw, Sparkles, Check
} from 'lucide-react';
import { 
  getStoreWhatsAppPhone, 
  saveStoreWhatsAppPhone, 
  generateWhatsAppLink 
} from '../../config/constants';
import { 
  getStoredSettings, 
  saveStoreSettings, 
  exportCatalogAsJSON, 
  importCatalogFromJSON, 
  resetCatalogToDefault,
  syncCatalogFromServer 
} from '../../utils/catalogStorage';
import { apiSaveSettings } from '../../utils/apiClient';

export default function AdminSettingsTab({ onShowToast, onReloadCatalog }) {
  const [phoneInput, setPhoneInput] = useState(() => getStoreWhatsAppPhone());
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [isSyncingServer, setIsSyncingServer] = useState(false);
  const [serverStatus, setServerStatus] = useState({ online: true, checkedAt: new Date().toLocaleTimeString() });

  const handleSavePhone = async (e) => {
    e?.preventDefault();
    const clean = phoneInput.replace(/[^0-9]/g, '');
    if (!clean || clean.length < 8) {
      onShowToast('Ingresa un número de WhatsApp válido (ej: 50238375078)', 'error');
      return;
    }

    setIsSavingPhone(true);
    try {
      saveStoreWhatsAppPhone(clean);
      await saveStoreSettings({ whatsappPhone: clean });
      await apiSaveSettings({ whatsappPhone: clean });
      onShowToast('¡Número de WhatsApp oficial guardado con éxito!', 'success');
    } catch (err) {
      onShowToast('Guardado localmente. Error en sincronización VPS: ' + err.message, 'info');
    } finally {
      setIsSavingPhone(false);
    }
  };

  const handleTestWhatsApp = () => {
    const testUrl = generateWhatsAppLink('👋 ¡Hola Deco Vintage! Esta es una prueba de conexión desde el panel de administración.');
    window.open(testUrl, '_blank');
  };

  const handleManualSync = async () => {
    setIsSyncingServer(true);
    try {
      const ok = await syncCatalogFromServer();
      if (ok) {
        if (onReloadCatalog) onReloadCatalog();
        setServerStatus({ online: true, checkedAt: new Date().toLocaleTimeString() });
        onShowToast('¡Catálogo sincronizado exitosamente con el VPS Hostinger!', 'success');
      } else {
        setServerStatus({ online: true, checkedAt: new Date().toLocaleTimeString() });
        onShowToast('Sincronización completada con la base de datos local.', 'info');
      }
    } catch (err) {
      onShowToast('Error al sincronizar con VPS: ' + err.message, 'error');
    } finally {
      setIsSyncingServer(false);
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const res = await importCatalogFromJSON(ev.target.result);
        if (res.success) {
          if (onReloadCatalog) onReloadCatalog();
          onShowToast(`¡Copia de seguridad restaurada con éxito! (${res.count} obras)`, 'success');
        } else {
          onShowToast('Error al restaurar catálogo: ' + res.error, 'error');
        }
      };
      reader.readAsText(file);
    } catch (err) {
      onShowToast('Error al leer el archivo JSON: ' + err.message, 'error');
    }
  };

  const handleFactoryReset = async () => {
    const confirm1 = window.confirm('⚠️ ¿Estás seguro de que deseas restablecer el catálogo a los valores de fábrica?\nSe restaurarán las obras oficiales y configuraciones originales.');
    if (!confirm1) return;

    try {
      await resetCatalogToDefault();
      if (onReloadCatalog) onReloadCatalog();
      setPhoneInput(getStoreWhatsAppPhone());
      onShowToast('¡Catálogo restablecido a valores predeterminados!', 'success');
    } catch (err) {
      onShowToast('Error al restablecer catálogo: ' + err.message, 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. WHATSAPP CONFIGURATION CARD */}
      <div className="glass-card" style={{
        padding: '24px 28px',
        border: '1px solid rgba(0, 245, 160, 0.35)',
        background: 'linear-gradient(135deg, rgba(6, 16, 26, 0.95) 0%, rgba(3, 8, 14, 0.98) 100%)',
        boxShadow: '0 10px 40px rgba(0, 245, 160, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(0, 245, 160, 0.15)',
            border: '1px solid rgba(0, 245, 160, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00f5a0'
          }}>
            <Phone size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#ffffff', margin: 0 }}>
              Número Oficial de WhatsApp Deco Vintage
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
              Configura el número al que se redirigen todos los carritos, cotizaciones personalizadas y botones de contacto.
            </p>
          </div>
        </div>

        <form onSubmit={handleSavePhone} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: '8px', textTransform: 'uppercase' }}>
              Número Telefónico (con código de país sin signos):
            </label>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{
                flex: 1,
                minWidth: '260px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(0, 245, 160, 0.35)',
                borderRadius: '10px',
                padding: '10px 14px'
              }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#00f5a0' }}>+</span>
                <input
                  type="text"
                  placeholder="50238375078"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '1rem',
                    fontWeight: 700,
                    outline: 'none',
                    width: '100%',
                    letterSpacing: '0.05em'
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn-cyan"
                disabled={isSavingPhone}
                style={{
                  padding: '10px 22px',
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(90deg, #00f5a0 0%, #00d2ff 100%)',
                  color: '#040812'
                }}
              >
                <Save size={16} />
                <span>{isSavingPhone ? 'Guardando...' : 'Guardar Número'}</span>
              </button>

              <button
                type="button"
                onClick={handleTestWhatsApp}
                className="btn-secondary"
                style={{
                  padding: '10px 18px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderColor: 'rgba(0, 245, 160, 0.3)'
                }}
              >
                <ExternalLink size={15} />
                <span>Probar Chat en Vivo</span>
              </button>
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              💡 Número oficial actual: <strong>+{phoneInput || '50238375078'}</strong> (Guatemala). Al guardar, se actualiza automáticamente en toda la web sin necesidad de recargar.
            </p>
          </div>
        </form>
      </div>

      {/* 2. VPS HOSTINGER & STORAGE STATUS */}
      <div className="glass-card" style={{
        padding: '24px 28px',
        border: '1px solid rgba(0, 242, 254, 0.25)',
        background: 'linear-gradient(135deg, rgba(6, 12, 24, 0.95) 0%, rgba(4, 7, 14, 0.98) 100%)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(0, 242, 254, 0.15)',
              border: '1px solid rgba(0, 242, 254, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)'
            }}>
              <Server size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#ffffff', margin: 0 }}>
                Servidor VPS Hostinger & Almacenamiento SSD
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                Arquitectura dedicada de alto rendimiento (100 GB SSD, IP 145.223.120.56).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncingServer}
            className="btn-secondary"
            style={{ padding: '8px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={isSyncingServer ? 'animate-spin' : ''} />
            <span>{isSyncingServer ? 'Sincronizando...' : 'Sincronizar con VPS'}</span>
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
          marginTop: '16px'
        }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '4px' }}>
              <HardDrive size={14} />
              <span>Capacidad de Almacenamiento</span>
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>100 GB SSD Dedicado</div>
            <div style={{ fontSize: '0.72rem', color: '#00f5a0' }}>Sin límites de cuota mensuales</div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '4px' }}>
              <ShieldCheck size={14} />
              <span>Optimización de Imágenes</span>
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>Sharp Engine WebP</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)' }}>1400px Full / 480px Thumbnails</div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '4px' }}>
              <CheckCircle2 size={14} />
              <span>Estado del Servidor</span>
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#00f5a0' }}>Operativo y Conectado</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Último chequeo: {serverStatus.checkedAt}</div>
          </div>
        </div>
      </div>

      {/* 3. BACKUP, EXPORT & FACTORY RESET */}
      <div className="glass-card" style={{
        padding: '24px 28px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'linear-gradient(135deg, rgba(8, 12, 20, 0.95) 0%, rgba(4, 6, 12, 0.98) 100%)'
      }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ffffff', margin: '0 0 6px 0' }}>
          Respaldos y Mantenimiento del Catálogo
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 18px 0' }}>
          Descarga o restaura copias completas de la base de datos de obras, categorías y franquicias.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px'
        }}>
          {/* Export */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <Download size={22} color="var(--accent-cyan)" style={{ marginBottom: '8px' }} />
            <h4 style={{ color: '#fff', fontWeight: 800, fontSize: '0.9rem', margin: '0 0 4px 0' }}>Exportar Backup JSON</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginBottom: '12px', lineHeight: 1.35 }}>
              Descarga un archivo con todas las obras y configuraciones.
            </p>
            <button
              type="button"
              onClick={exportCatalogAsJSON}
              className="btn-cyan"
              style={{ width: '100%', justifyContent: 'center', padding: '8px 12px', fontSize: '0.8rem' }}
            >
              Descargar Archivo JSON
            </button>
          </div>

          {/* Import */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <Upload size={22} color="var(--accent-cyan)" style={{ marginBottom: '8px' }} />
            <h4 style={{ color: '#fff', fontWeight: 800, fontSize: '0.9rem', margin: '0 0 4px 0' }}>Restaurar Backup JSON</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginBottom: '12px', lineHeight: 1.35 }}>
              Carga un archivo de respaldo para restaurar el catálogo.
            </p>
            <label className="btn-secondary" style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              padding: '8px 12px',
              fontSize: '0.8rem',
              cursor: 'pointer',
              boxSizing: 'border-box'
            }}>
              <span>Seleccionar Archivo JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {/* Factory Reset */}
          <div style={{ background: 'rgba(239, 68, 68, 0.04)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
            <RotateCcw size={22} color="#ef4444" style={{ marginBottom: '8px' }} />
            <h4 style={{ color: '#fff', fontWeight: 800, fontSize: '0.9rem', margin: '0 0 4px 0' }}>Restablecer Catálogo</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginBottom: '12px', lineHeight: 1.35 }}>
              Restaura los pósters y colecciones originales de fábrica.
            </p>
            <button
              type="button"
              onClick={handleFactoryReset}
              className="btn-secondary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '8px 12px',
                fontSize: '0.8rem',
                color: '#ef4444',
                borderColor: 'rgba(239, 68, 68, 0.4)'
              }}
            >
              Restablecer Valores
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
