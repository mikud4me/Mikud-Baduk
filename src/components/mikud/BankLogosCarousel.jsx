import React from 'react';
import { Building2 } from 'lucide-react';

export default function BankLogosCarousel() {
  const banks = [
    'הפועלים',
    'לאומי', 
    'דיסקונט',
    'מזרחי טפחות',
    'ירושלים',
    'הבינלאומי',
    'מסד',
    'אוצר החייל',
    'יהב',
    'מרכנתיל',
  ];

  // כפול את המערך 3 פעמים לאנימציה חלקה
  const allBanks = [...banks, ...banks, ...banks];

  return (
    <div className="bg-gradient-to-b from-white via-slate-50 to-white border-y border-gray-200 py-4 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 mb-3">
        <p className="text-center text-xs font-bold text-gray-400 tracking-wide">
          שותפים עם כל הבנקים המובילים בישראל
        </p>
      </div>
      
      <div className="relative">
        {/* Gradient overlays */}
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white via-white to-transparent z-10 pointer-events-none" />
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white via-white to-transparent z-10 pointer-events-none" />
        
        {/* Scrolling container */}
        <div className="flex animate-scroll-infinite hover:pause-animation">
          {allBanks.map((bank, index) => (
            <div 
              key={`${bank}-${index}`}
              className="flex-shrink-0 px-4 flex items-center justify-center group"
            >
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 shadow-sm hover:shadow-md hover:border-[#c9a961] transition-all duration-300">
                <Building2 size={14} className="text-[#1e3a5f] group-hover:text-[#c9a961] transition-colors" />
                <span className="text-xs font-bold text-gray-700 whitespace-nowrap group-hover:text-[#1e3a5f]">
                  בנק {bank}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll-infinite {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-100% / 3));
          }
        }
        
        .animate-scroll-infinite {
          animation: scroll-infinite 25s linear infinite;
        }
        
        .animate-scroll-infinite:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}