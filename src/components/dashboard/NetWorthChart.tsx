import React from 'react';

export const NetWorthChart: React.FC = () => {
    return (
        <div className="w-full h-[300px] mt-4 relative">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                <div className="w-full h-px bg-white/5 border-t border-dashed border-white/10"></div>
                <div className="w-full h-px bg-white/5 border-t border-dashed border-white/10"></div>
                <div className="w-full h-px bg-white/5 border-t border-dashed border-white/10"></div>
                <div className="w-full h-px bg-white/5 border-t border-dashed border-white/10"></div>
                <div className="w-full h-px bg-white/5 border-t border-dashed border-white/10"></div>
            </div>
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 800 300">
                <defs>
                    <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.3"></stop>
                        <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0"></stop>
                    </linearGradient>
                    <linearGradient id="strokeGradient" x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0%" stopColor="#195de6"></stop>
                        <stop offset="50%" stopColor="#2dd4bf"></stop>
                        <stop offset="100%" stopColor="#a855f7"></stop>
                    </linearGradient>
                    <filter height="140%" id="glow" width="140%" x="-20%" y="-20%">
                        <feGaussianBlur result="blur" stdDeviation="4"></feGaussianBlur>
                        <feComposite in="SourceGraphic" in2="blur" operator="over"></feComposite>
                    </filter>
                </defs>
                {/* Area fill */}
                <path d="M0,250 C100,240 150,200 200,180 C250,160 300,190 350,150 C400,110 450,130 500,100 C550,70 600,90 650,60 C700,30 750,50 800,20 V300 H0 Z" fill="url(#chartGradient)"></path>
                {/* Line stroke with glow */}
                <path className="drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]" d="M0,250 C100,240 150,200 200,180 C250,160 300,190 350,150 C400,110 450,130 500,100 C550,70 600,90 650,60 C700,30 750,50 800,20" fill="none" filter="url(#glow)" stroke="url(#strokeGradient)" strokeLinecap="round" strokeWidth="4"></path>
                {/* Data Point (interactive) */}
                <circle className="cursor-pointer hover:r-8 transition-all duration-300" cx="500" cy="100" fill="#111621" r="6" stroke="#2dd4bf" strokeWidth="3"></circle>
                {/* Tooltip for Data Point */}
                <g transform="translate(470, 60)">
                    <rect fill="#1c2230" height="28" rx="6" stroke="#2dd4bf" strokeWidth="1" width="60"></rect>
                    <text fill="white" fontSize="12" fontWeight="bold" textAnchor="middle" x="30" y="19">₱98k</text>
                </g>
            </svg>
        </div>
    );
};
