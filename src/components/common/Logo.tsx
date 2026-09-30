import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark';
  showSubtitle?: boolean;
  subtitleText?: string;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'light',
  showSubtitle = true,
  subtitleText = 'MAROC · 100% AUTHENTIQUE',
  className = ''
}) => {
  // Dimension configurations
  const dimensions = {
    sm: { icon: 'w-7 h-7', text: 'text-lg', sub: 'text-[8px]', bag: 18 },
    md: { icon: 'w-9 h-9', text: 'text-xl', sub: 'text-[9px]', bag: 22 },
    lg: { icon: 'w-11 h-11', text: 'text-2xl', sub: 'text-[10px]', bag: 26 },
    xl: { icon: 'w-14 h-14', text: 'text-3xl', sub: 'text-xs', bag: 32 }
  }[size];

  const isDark = variant === 'dark';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Visual Icon Mark */}
      <div 
        className={`${dimensions.icon} rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-emerald-400 p-0.5 shadow-md shadow-indigo-500/20 flex items-center justify-center shrink-0 transition-transform hover:scale-105`}
      >
        <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center relative overflow-hidden">
          {/* Subtle Glow */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400/40 rounded-full blur-xs"></div>
          
          {/* Custom Stylized Shopping Bag & Arrow SVG */}
          <svg 
            width={dimensions.bag} 
            height={dimensions.bag} 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="text-white drop-shadow"
          >
            {/* Bag Handle */}
            <path 
              d="M8.5 7.5V6C8.5 4.067 10.067 2.5 12 2.5C13.933 2.5 15.5 4.067 15.5 6V7.5" 
              stroke="url(#shopme-grad)" 
              strokeWidth="2.2" 
              strokeLinecap="round" 
            />
            {/* Bag Body */}
            <path 
              d="M4.5 7.5H19.5L18.2 20.2C18.1 21.2 17.2 22 16.2 22H7.8C6.8 22 5.9 21.2 5.8 20.2L4.5 7.5Z" 
              fill="currentColor"
              fillOpacity="0.15"
              stroke="white" 
              strokeWidth="1.8" 
              strokeLinejoin="round" 
            />
            {/* Express Flash / Smile */}
            <path 
              d="M9 13C10 14.5 14 14.5 15 13" 
              stroke="#34D399" 
              strokeWidth="2" 
              strokeLinecap="round" 
            />
            {/* Dot Accent */}
            <circle cx="12" cy="10" r="1.2" fill="#60A5FA" />

            <defs>
              <linearGradient id="shopme-grad" x1="8.5" y1="2.5" x2="15.5" y2="7.5" gradientUnits="userSpaceOnUse">
                <stop stopColor="#60A5FA" />
                <stop offset="1" stopColor="#34D399" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col leading-none">
        <div className={`font-black tracking-tight flex items-baseline ${dimensions.text}`}>
          <span className={isDark ? 'text-white' : 'text-slate-950'}>
            Shop
          </span>
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 bg-clip-text text-transparent ml-0.5">
            Me
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1 inline-block animate-pulse"></span>
        </div>
        
        {showSubtitle && (
          <span className={`font-bold tracking-widest uppercase mt-0.5 ${dimensions.sub} ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {subtitleText}
          </span>
        )}
      </div>
    </div>
  );
};
