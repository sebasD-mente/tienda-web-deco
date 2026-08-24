import React, { useState } from 'react';

export default function OptimizedImage({
  src,
  alt = 'Póster Deco Vintage',
  className = '',
  style = {},
  objectFit = 'contain',
  priority = false
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

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
      {!loaded && !error && (
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

      {/* The Actual Optimized WebP Image (Preserves Exact Proportions without Cropping) */}
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setError(true);
          setLoaded(true);
        }}
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

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
