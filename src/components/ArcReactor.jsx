import React from 'react';

export default function ArcReactor({ size = 68, className = '', style = {}, pulsing = true }) {
  // Generate 10 transformer coils around the perimeter
  const coils = Array.from({ length: 10 }).map((_, i) => {
    const angle = (i * 36) * (Math.PI / 180);
    const r = 36;
    const cx = 50 + r * Math.cos(angle);
    const cy = 50 + r * Math.sin(angle);
    const rot = i * 36;
    return { cx, cy, rot };
  });

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter: pulsing ? 'drop-shadow(0 0 14px rgba(0, 242, 254, 0.8)) drop-shadow(0 0 30px rgba(0, 119, 255, 0.5))' : 'drop-shadow(0 0 8px rgba(0, 242, 254, 0.5))',
        ...style
      }}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        style={{ width: '100%', height: '100%', overflow: 'visible' }}
      >
        <defs>
          {/* Radial Plasma Core Glow */}
          <radialGradient id="plasmaCoreGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="35%" stopColor="#00f2fe" stopOpacity="0.95" />
            <stop offset="70%" stopColor="#0284c7" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#031528" stopOpacity="0" />
          </radialGradient>

          {/* Cyan Energy Glow */}
          <linearGradient id="cyanEnergyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#00f2fe" />
            <stop offset="100%" stopColor="#0077ff" />
          </linearGradient>

          {/* Glow Filter */}
          <filter id="arcGlowFilter" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Base Housing Background */}
        <circle cx="50" cy="50" r="48" fill="#040812" stroke="rgba(0, 242, 254, 0.3)" strokeWidth="1.5" />

        {/* 2. Outer Rotating Telemetry Segmented Ring */}
        <g style={{ transformOrigin: '50px 50px', animation: 'arcSpin 14s linear infinite' }}>
          <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(0, 242, 254, 0.6)" strokeWidth="1.5" strokeDasharray="6 4 2 4" />
          <circle cx="50" cy="50" r="43" fill="none" stroke="rgba(0, 242, 254, 0.35)" strokeWidth="1" strokeDasharray="18 8" />
        </g>

        {/* 3. 10 Arc Reactor Transformer Coils */}
        <g>
          {coils.map((coil, i) => (
            <rect
              key={i}
              x={coil.cx - 2.5}
              y={coil.cy - 4}
              width="5"
              height="8"
              rx="1.5"
              fill="#06182c"
              stroke="#00f2fe"
              strokeWidth="0.8"
              transform={`rotate(${coil.rot + 90} ${coil.cx} ${coil.cy})`}
              filter="url(#arcGlowFilter)"
              opacity="0.9"
            />
          ))}
        </g>

        {/* 4. Counter-Rotating Inner Teeth Ring */}
        <g style={{ transformOrigin: '50px 50px', animation: 'arcSpinReverse 9s linear infinite' }}>
          <circle cx="50" cy="50" r="30" fill="none" stroke="#00f2fe" strokeWidth="2.5" strokeDasharray="3 3" />
          <circle cx="50" cy="50" r="27" fill="none" stroke="rgba(0, 242, 254, 0.5)" strokeWidth="1" />
        </g>

        {/* 5. Inverted Glowing Triangular Plasma Core (Perfect Mathematical Centering at 50, 50) */}
        <g filter="url(#arcGlowFilter)" style={{ transformOrigin: '50px 50px', animation: pulsing ? 'arcPulse 2.5s ease-in-out infinite' : 'none' }}>
          
          {/* Triangular Outer Glow Frame with Flattened / Chamfered Tips */}
          <polygon
            points="68,37 32,37 28.5,41 47,71 53,71 71.5,41"
            fill="rgba(0, 242, 254, 0.18)"
            stroke="#00f2fe"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />

          {/* Inner High-Intensity White-Cyan Triangle with Flattened Tips */}
          <polygon
            points="65.5,39 34.5,39 31.5,42.5 47.5,68 52.5,68 68.5,42.5"
            fill="url(#plasmaCoreGrad)"
            stroke="#ffffff"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Central Circular Micro-Core Node (Exact Center at 50, 50) */}
          <circle
            cx="50"
            cy="50"
            r="8.5"
            fill="#030814"
            stroke="#00f2fe"
            strokeWidth="2"
          />

          <circle
            cx="50"
            cy="50"
            r="4.5"
            fill="#ffffff"
            filter="drop-shadow(0 0 6px #00f2fe)"
          />
        </g>

        {/* 6. Cardinal Crosshair Ticks */}
        <line x1="50" y1="2" x2="50" y2="7" stroke="#00f2fe" strokeWidth="1.5" />
        <line x1="50" y1="93" x2="50" y2="98" stroke="#00f2fe" strokeWidth="1.5" />
        <line x1="2" y1="50" x2="7" y2="50" stroke="#00f2fe" strokeWidth="1.5" />
        <line x1="93" y1="50" x2="98" y2="50" stroke="#00f2fe" strokeWidth="1.5" />

      </svg>
    </div>
  );
}
