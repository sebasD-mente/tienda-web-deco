import React, { useState } from 'react';
import { Lock, X, KeyRound, User, ArrowRight, AlertCircle } from 'lucide-react';

const ADMIN_USER = 'SebasDmente';
const ADMIN_PASS = '4214294880101';

export default function AdminLoginModal({ isOpen, onClose, onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Por favor complete ambos campos.');
      return;
    }

    if (username.trim() === ADMIN_USER && password.trim() === ADMIN_PASS) {
      setError('');
      setUsername('');
      setPassword('');
      onSuccess();
    } else {
      setError('Usuario o clave incorrectos.');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '32px 28px',
          background: '#070b12',
          border: '2px solid rgba(0, 242, 254, 0.45)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 35px rgba(0, 242, 254, 0.25)',
          borderRadius: '20px',
          position: 'relative',
          animation: 'fadeIn 0.2s ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px'
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
            <Lock size={24} color="var(--accent-cyan)" />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', margin: '0 0 4px 0' }}>
            Acceso Administrador
          </h2>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
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
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Username Field */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
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
              <User size={18} color="var(--accent-cyan)" />
              <input
                type="text"
                autoFocus
                placeholder="Nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
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
              <KeyRound size={18} color="var(--accent-cyan)" />
              <input
                type="password"
                placeholder="Clave de acceso"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '12px',
              marginTop: '8px',
              fontSize: '0.95rem'
            }}
          >
            <span>Ingresar</span>
            <ArrowRight size={16} />
          </button>
        </form>

      </div>
    </div>
  );
}
