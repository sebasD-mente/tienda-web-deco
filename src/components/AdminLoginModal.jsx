import React, { useState, useEffect } from 'react';
import { Lock, X, KeyRound, User, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { apiAdminLogin } from '../utils/apiClient';

export default function AdminLoginModal({ isOpen, onClose, onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Por favor complete ambos campos.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await apiAdminLogin(username.trim(), password.trim());
      if (res && res.success) {
        setUsername('');
        setPassword('');
        setError('');
        onSuccess();
      } else {
        setError(res.error || 'Usuario o clave incorrectos.');
      }
    } catch (err) {
      setError('Error al comunicarse con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="glass-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-login-title"
        aria-describedby="admin-login-desc"
        tabIndex={-1}
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '32px 28px',
          background: '#070b12',
          border: '2px solid rgba(0, 242, 254, 0.45)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 35px rgba(0, 242, 254, 0.25)',
          borderRadius: '20px',
          position: 'relative',
          animation: 'fadeIn 0.2s ease',
          outline: 'none'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Cerrar modal de acceso"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px'
          }}
          title="Cerrar"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'rgba(0, 242, 254, 0.1)',
            border: '1px solid rgba(0, 242, 254, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto',
            boxShadow: '0 0 20px rgba(0, 242, 254, 0.2)'
          }}>
            <Lock size={24} color="var(--accent-cyan)" aria-hidden="true" />
          </div>

          <h2 id="admin-login-title" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', margin: '0 0 4px 0' }}>
            Acceso Administrador
          </h2>
          <p id="admin-login-desc" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
            Panel de Control Central Deco Vintage
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            role="alert"
            aria-live="assertive"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#ef4444',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginBottom: '18px'
            }}
          >
            <AlertCircle size={16} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Username Field */}
          <div>
            <label
              htmlFor="admin-username"
              style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}
            >
              Usuario
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '10px 14px'
            }}>
              <User size={18} color="var(--accent-cyan)" aria-hidden="true" />
              <input
                id="admin-username"
                name="username"
                type="text"
                autoComplete="username"
                autoFocus
                placeholder="Nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  outline: 'none',
                  width: '100%'
                }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="admin-password"
              style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}
            >
              Clave
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '10px 14px'
            }}>
              <KeyRound size={18} color="var(--accent-cyan)" aria-hidden="true" />
              <input
                id="admin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Clave de acceso"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  outline: 'none',
                  width: '100%'
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-cyan"
            disabled={isLoading}
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '12px',
              marginTop: '8px',
              fontSize: '0.95rem',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Verificando...</span>
              </>
            ) : (
              <>
                <span>Ingresar</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
