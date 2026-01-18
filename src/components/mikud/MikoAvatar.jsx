import React from 'react';

export default function MikoAvatar({ className = "w-12 h-12" }) {
  return (
    <div className={`relative ${className} rounded-full overflow-hidden border-2 border-[#d4af37] bg-[#EAD9B5] shrink-0 shadow-xl`}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="50" fill="#f8fafc" />
        <path d="M20 100 C20 70 30 55 50 55 C70 55 80 70 80 100" fill="#001a33" />
        <path d="M50 55 L40 100 M50 55 L60 100" stroke="#d4af37" strokeWidth="2" />
        <circle cx="50" cy="38" r="22" fill="#EAD9B5" />
        <path d="M28 38 C28 15 72 15 72 38" fill="#94a3b8" />
        <circle cx="42" cy="40" r="5" stroke="#001a33" fill="none" strokeWidth="1.5" />
        <circle cx="58" cy="40" r="5" stroke="#001a33" fill="none" strokeWidth="1.5" />
        <path d="M47 40 L53 40" stroke="#001a33" strokeWidth="1.5" />
        <path d="M42 50 C45 54 55 54 58 50" stroke="#001a33" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
}