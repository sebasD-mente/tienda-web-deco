import React, { useEffect, useRef } from 'react';
import { AlertTriangle, AlertCircle, X, Loader2 } from 'lucide-react';

/**
 * Accessible <ConfirmDialog> component for destructive and critical administrative actions.
 * Complies with WCAG 2.1 AA (role="alertdialog", aria-modal="true", Focus Trap, Escape listener,
 * initial focus on Cancel button to avoid accidental execution).
 */
export default function ConfirmDialog({
  isOpen,
  title = '¿Estás seguro?',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger',
  isLoading = false,
  onConfirm,
  onClose
}) {
  const dialogRef = useRef(null);
  const cancelBtnRef = useRef(null);
  const prevActiveElementRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Cache previously focused element to restore on dismissal
    prevActiveElementRef.current = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Set initial focus on Cancel button for safety in destructive dialogs
    const focusTimer = setTimeout(() => {
      cancelBtnRef.current?.focus();
    }, 40);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (!isLoading && onClose) {
          onClose();
        }
        return;
      }

      if (e.key === 'Tab') {
        if (!dialogRef.current) return;
        const focusable = dialogRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      // Restore focus to trigger element if it still exists in DOM
      if (prevActiveElementRef.current && typeof prevActiveElementRef.current.focus === 'function') {
        try {
          prevActiveElementRef.current.focus();
        } catch {
          // Element may have been deleted/unmounted
        }
      }
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const isDanger = type === 'danger';
  const borderColor = isDanger ? 'rgba(239, 68, 68, 0.45)' : 'rgba(0, 242, 254, 0.45)';
  const shadowColor = isDanger ? 'rgba(239, 68, 68, 0.25)' : 'rgba(0, 242, 254, 0.25)';
  const iconColor = isDanger ? '#ef4444' : 'var(--accent-cyan)';
  const iconBg = isDanger ? 'rgba(239, 68, 68, 0.12)' : 'rgba(0, 242, 254, 0.1)';

  return (
    <div className="modal-backdrop" onClick={isLoading ? undefined : onClose}>
      <div
        ref={dialogRef}
        className="glass-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '28px 24px',
          background: '#070b12',
          border: `2px solid ${borderColor}`,
          boxShadow: `0 25px 60px rgba(0, 0, 0, 0.95), 0 0 35px ${shadowColor}`,
          borderRadius: '20px',
          position: 'relative',
          animation: 'fadeIn 0.2s ease',
          outline: 'none'
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          aria-label="Cerrar diálogo de confirmación"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            padding: '4px',
            borderRadius: '6px'
          }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: iconBg,
              border: `1px solid ${borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto',
              boxShadow: `0 0 20px ${shadowColor}`
            }}
          >
            {isDanger ? (
              <AlertTriangle size={26} color={iconColor} aria-hidden="true" />
            ) : (
              <AlertCircle size={26} color={iconColor} aria-hidden="true" />
            )}
          </div>

          <h3
            id="confirm-dialog-title"
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: '#ffffff',
              margin: '0 0 8px 0'
            }}
          >
            {title}
          </h3>

          <p
            id="confirm-dialog-desc"
            style={{
              fontSize: '0.88rem',
              color: 'var(--text-secondary)',
              margin: 0,
              lineHeight: 1.5,
              whiteSpace: 'pre-line'
            }}
          >
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end',
            marginTop: '24px'
          }}
        >
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="btn-secondary"
            style={{
              flex: '1 1 110px',
              justifyContent: 'center',
              padding: '10px 16px',
              fontSize: '0.88rem'
            }}
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              flex: '1 1 130px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: isLoading ? 'wait' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              color: '#ffffff',
              border: isDanger
                ? '1px solid rgba(239, 68, 68, 0.6)'
                : '1px solid rgba(0, 242, 254, 0.6)',
              background: isDanger
                ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)'
                : 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
              boxShadow: isDanger
                ? '0 0 20px rgba(239, 68, 68, 0.3)'
                : '0 0 20px rgba(0, 242, 254, 0.3)'
            }}
          >
            {isLoading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
