import React, { useState, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';

export default function OptimizedImage({
  src,
  alt = 'Póster Deco Vintage',
  className = '',
  style = {},
  objectFit = 'contain',
  priority = false,
  fallbackSrc = '/posters/wallpaper.jpg'
}) {
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc);
    setHasError(false);
  }, [src, fallbackSrc]);

  // Auto-correct truncated .web extension if passed
  const normalizedSrc = (currentSrc && currentSrc.endsWith('.web')) ? `${currentSrc}p` : currentSrc;

  const handleImageError = () => {
    if (normalizedSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
    } else {
      setHasError(true);
      setLoaded(true);
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#04060a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
      className={className}
    >
      {/* Skeleton Shimmer Placeholder while loading */}
      {!loaded && !hasError && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, rgba(10,14,22,0.8) 0%, rgba(20,28,44,0.8) 50%, rgba(10,14,22,0.8) 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite linear',
            zIndex: 1
          }}
        />
      )}

      {/* Error Fallback Box if both primary and fallback fail */}
      {hasError && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          color: 'var(--text-muted)',
          padding: '12px',
          textAlign: 'center'
        }}>
          <ImageIcon size={28} color="var(--accent-cyan)" />
          <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>{alt}</span>
        </div>
      )}

      {/* The Actual Optimized WebP Image */}
      {!hasError && (
        <img
          src={normalizedSrc}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={handleImageError}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            width: 'auto',
            height: 'auto',
            objectFit: objectFit,
            display: 'block',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.35s ease, transform 0.3s ease',
            borderRadius: '4px',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.7)'
          }}
        />
      )}

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
