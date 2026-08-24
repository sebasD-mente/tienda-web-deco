import React, { useState } from 'react';

export default function OptimizedImage({
  src,
  alt = 'Póster Deco Vintage',
  className = '',
  style = {},
  aspectRatio = '3/4',
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
        backgroundColor: '#090d16',
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
            background: 'linear-gradient(90deg, rgba(13,18,28,0.8) 0%, rgba(26,36,56,0.8) 50%, rgba(13,18,28,0.8) 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite linear',
            zIndex: 1
          }}
        />
      )}

      {/* The Actual Optimized WebP Image */}
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
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.35s ease, transform 0.4s ease',
          transform: 'translateZ(0)'
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
