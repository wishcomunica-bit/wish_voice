import React from 'react';

interface WishLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const WishLogo: React.FC<WishLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
}) => {
  // Dimension presets for various UI placements
  const dimensions = {
    sm: { height: 26, markWidth: 32 },
    md: { height: 34, markWidth: 42 },
    lg: { height: 46, markWidth: 56 },
    xl: { height: 60, markWidth: 72 },
  }[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Compressed Vector Mark of Wish Brand: W + Arrow ↗ */}
      <div className="relative shrink-0 flex items-center justify-center">
        <svg
          width={dimensions.markWidth}
          height={dimensions.height}
          viewBox="0 0 140 110"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_2px_10px_rgba(147,51,234,0.35)] transition-transform hover:scale-105"
        >
          <defs>
            {/* Main W Gradient: Magenta to Electric Blue */}
            <linearGradient id="wishWMarkGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#b000b5" />
              <stop offset="25%" stop-color="#a21caf" />
              <stop offset="50%" stop-color="#7c3aed" />
              <stop offset="78%" stop-color="#3b82f6" />
              <stop offset="100%" stop-color="#1d4ed8" />
            </linearGradient>

            {/* Arrow Gradient: Electric Blue to Magenta */}
            <linearGradient id="wishArrowGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#2563eb" />
              <stop offset="50%" stop-color="#7c3aed" />
              <stop offset="100%" stop-color="#c026d3" />
            </linearGradient>
          </defs>

          {/* Stylized 'W' glyph */}
          <path
            d="M 4 2 
               H 26 
               L 41 82 
               C 42 86, 45 90, 50 90 
               C 55 90, 58 86, 60 81 
               L 78 2 
               H 98 
               L 81 83 
               C 77 98, 66 106, 52 106 
               C 38 106, 27 97, 23 83 
               L 13 18 
               H 4 
               Z"
            fill="url(#wishWMarkGrad)"
          />

          {/* Upper Right Arrow ↗ */}
          <g transform="translate(108, 2)">
            <path
              d="M 3 24 
                 L 19 8 
                 L 19 16 
                 C 19 18, 20.5 19.5, 22.5 19.5 
                 C 24.5 19.5, 26 18, 26 16 
                 L 26 3 
                 C 26 1.5, 24.5 0, 23 0 
                 L 10 0 
                 C 8 0, 6.5 1.5, 6.5 3.5 
                 C 6.5 5.5, 8 7, 10 7 
                 L 17 7 
                 L 1 22 
                 C -0.3 23.3, -0.3 25.3, 1 26.6 
                 C 2.3 27.9, 4.3 27.9, 5.6 26.6 
                 L 3 24 
                 Z"
              fill="url(#wishArrowGrad)"
            />
          </g>
        </svg>
      </div>

      {/* Typography: WISH VOICE AI */}
      {showText && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-extrabold tracking-tight text-white text-base md:text-lg">
              WISH
            </span>
            <span className="font-bold tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent text-base md:text-lg">
              VOICE
            </span>
            <span className="font-black text-xs px-1.5 py-0.5 rounded bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-purple-300 border border-purple-500/30 tracking-wider">
              AI
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium tracking-wide mt-0.5">
            Locução Profissional & Direção Vocal
          </span>
        </div>
      )}
    </div>
  );
};
