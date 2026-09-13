import React from 'react';
import { useStore } from '../context/StoreContext';

interface OvenglowLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
  onClick?: () => void;
}

export const OvenglowLogo: React.FC<OvenglowLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
  onClick
}) => {
  const sizeMap = {
    sm: { dimension: 38, textSize: 'text-sm sm:text-base', subSize: 'text-[9px]' },
    md: { dimension: 50, textSize: 'text-xl', subSize: 'text-[11px]' },
    lg: { dimension: 76, textSize: 'text-2xl', subSize: 'text-xs' },
    xl: { dimension: 110, textSize: 'text-4xl', subSize: 'text-sm' },
  };

  const current = sizeMap[size];
  const { storeSettings } = useStore();

  return (
    <div 
      id="ovenglow-brand-logo"
      onClick={onClick}
      className={`flex min-w-0 items-center gap-3 select-none cursor-pointer group ${className}`}
    >
      <div 
        className="relative flex items-center justify-center shrink-0 rounded-full p-1 bg-gradient-to-br from-[#FF9933] via-[#e68524] to-[#4A2C2A] border-2 border-[#4A2C2A] shadow-md group-hover:scale-105 transition-all duration-300"
        style={{ width: current.dimension, height: current.dimension }}
      >
        {/* Outer Circular Ring with Metallic Sheen */}
        <svg 
          viewBox="0 0 200 200" 
          className="w-full h-full drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)]"
        >
          <defs>
            <linearGradient id="saffronGoldGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="30%" stopColor="#FFDAB9" />
              <stop offset="70%" stopColor="#FF9933" />
              <stop offset="100%" stopColor="#4A2C2A" />
            </linearGradient>
            
            <linearGradient id="boldWhite" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#FFF9F2" />
            </linearGradient>

            <path
              id="textArcTop"
              d="M 30,100 A 70,70 0 1,1 170,100"
              fill="none"
            />
          </defs>

          {/* Outer Ring */}
          <circle 
            cx="100" 
            cy="100" 
            r="92" 
            fill="none" 
            stroke="url(#boldWhite)" 
            strokeWidth="4" 
            strokeDasharray="450 80"
            strokeDashoffset="12"
          />

          {/* Subtle Inner Ring */}
          <circle 
            cx="100" 
            cy="100" 
            r="84" 
            fill="none" 
            stroke="rgba(255,255,255,0.4)" 
            strokeWidth="1.5" 
          />

          {/* OVENGLOW curved text arc */}
          <text 
            fontSize="18" 
            fontWeight="900" 
            letterSpacing="6" 
            fill="#FFFFFF"
            fontFamily="'Plus Jakarta Sans', sans-serif"
          >
            <textPath href="#textArcTop" startOffset="50%" textAnchor="middle">
              OVENGLOW
            </textPath>
          </text>

          {/* Center Monogram O & G Intertwined */}
          <g transform="translate(100, 114) scale(0.72)">
            {/* O Shape with Cupcake */}
            <circle cx="-32" cy="-14" r="42" fill="none" stroke="#FFFFFF" strokeWidth="6.5" />
            
            {/* Cupcake inside O */}
            <g transform="translate(-32, -14) scale(0.68)">
              {/* Cupcake Base Liner */}
              <path 
                d="M -20,10 L -14,35 L 14,35 L 20,10 Z" 
                fill="none" 
                stroke="#FFFFFF" 
                strokeWidth="3.5" 
              />
              <line x1="-8" y1="12" x2="-6" y2="33" stroke="#FFFFFF" strokeWidth="2.5" />
              <line x1="0" y1="12" x2="0" y2="33" stroke="#FFFFFF" strokeWidth="2.5" />
              <line x1="8" y1="12" x2="6" y2="33" stroke="#FFFFFF" strokeWidth="2.5" />
              
              {/* Swirled Frosting */}
              <path 
                d="M -24,8 C -24,-2 -10,-10 0,-10 C 10,-10 24,-2 24,8 C 22,12 -22,12 -24,8 Z" 
                fill="none" 
                stroke="#FFFFFF" 
                strokeWidth="3.5" 
              />
              <path 
                d="M -16,-6 C -16,-18 -4,-22 0,-22 C 4,-22 16,-18 16,-6" 
                fill="none" 
                stroke="#FFFFFF" 
                strokeWidth="3.5" 
              />
              {/* Cherry / Glow bead */}
              <circle cx="0" cy="-28" r="4.5" fill="#FFD700" />
            </g>

            {/* G Shape with Leaf flourish */}
            <path 
              d="M 45,-30 C 20,-50 -10,-35 -15,-5 C -20,30 15,50 45,35 C 55,30 60,15 60,0 L 22,0" 
              fill="none" 
              stroke="#FFFFFF" 
              strokeWidth="6.5" 
              strokeLinecap="round"
            />

            {/* Leaf on G top */}
            <path 
              d="M 22,-52 C 28,-64 45,-64 48,-52 C 45,-42 30,-42 22,-52 Z" 
              fill="#FFD700" 
            />
          </g>

          {/* DELIGHTS bottom curved text */}
          <text 
            x="100" 
            y="156" 
            fontSize="10" 
            fontWeight="800" 
            letterSpacing="5" 
            fill="#FFFFFF" 
            textAnchor="middle"
            fontFamily="'Plus Jakarta Sans', sans-serif"
          >
            • DELIGHTS •
          </text>

          {/* CRAFTED TO CRAVE flourish and heart */}
          <text 
            x="100" 
            y="172" 
            fontSize="8" 
            fontWeight="700" 
            letterSpacing="3" 
            fill="#FFD700" 
            textAnchor="middle"
            fontFamily="'Plus Jakarta Sans', sans-serif"
          >
            CRAFTED TO CRAVE
          </text>
          {/* Miniature heart */}
          <path 
            d="M 100,185 C 98,181 94,181 94,183 C 94,186 100,189 100,189 C 100,189 106,186 106,183 C 106,181 102,181 100,185 Z" 
            fill="#FFD700" 
          />
        </svg>
      </div>

      {showSubtitle && (
        <div className="flex min-w-0 flex-col">
          <span
            className={`whitespace-nowrap font-black uppercase tracking-tighter text-[#4A2C2A] group-hover:text-[#FF9933] transition-colors ${current.textSize}`}
          >
            {storeSettings.storeName}
          </span>
          <span
            className={`hidden min-w-0 items-center gap-1.5 font-black uppercase tracking-[0.2em] text-[#A68A78] sm:flex ${current.subSize}`}
          >
            <span className="truncate">{storeSettings.tagline}</span>
            <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#25D366]" />
          </span>
        </div>
      )}
    </div>
  );
};
