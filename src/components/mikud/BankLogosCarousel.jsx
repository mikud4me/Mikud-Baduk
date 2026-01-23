import React from 'react';

export default function BankLogosCarousel() {
  const banks = [
    { name: 'לאומי', img: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696ca6d05493d178c33e26fd/1b54bc0c4_logo.png' },
    { name: 'הפועלים', img: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696ca6d05493d178c33e26fd/971225b2a_--.jpg' },
    { name: 'דיסקונט', img: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696ca6d05493d178c33e26fd/074d60b37_--600x416.jpg' },
    { name: 'מזרחי טפחות', img: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696ca6d05493d178c33e26fd/e0ed091a8_mizrachi.png' },
    { name: 'ירושלים', img: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696ca6d05493d178c33e26fd/ad9176516_ye.png' },
    { name: 'מרכנתיל', img: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696ca6d05493d178c33e26fd/ff1e5dfd3_GetImg.jpg' },
  ];
  
  // כפול את המערך פעמיים בדיוק ליצירת לולאה אינסופית מושלמת
  const allBanks = [...banks, ...banks];

  return (
    <div className="bg-white border-y border-gray-100 py-4 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <p className="text-center text-lg font-extrabold text-[#1e3a5f] tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '0.02em' }}>
          בשיתוף פעולה עם כל הבנקים המובילים במשק
        </p>
      </div>
      
      <div className="relative">
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        
        <div className="flex animate-scroll-rtl gap-6 sm:gap-12">
          {allBanks.map((bank, index) => {
            const getHeight = (bankName) => {
              switch(bankName) {
                case 'לאומי': return '28px';
                case 'הפועלים': return '84px';
                case 'דיסקונט': return '38px';
                case 'מזרחי טפחות': return '84px';
                case 'ירושלים': return '84px';
                case 'מרכנתיל': return '38px';
                default: return '38px';
              }
            };
            
            return (
              <div 
                key={`${bank.name}-${index}`}
                className="flex-shrink-0 flex items-center justify-center px-4 sm:px-8"
              >
                <img 
                  src={bank.img} 
                  alt={`בנק ${bank.name}`}
                  style={{ height: getHeight(bank.name), width: 'auto' }}
                  className="object-contain opacity-90 hover:opacity-100 transition-all duration-300"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="48"%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="14" fill="%23666"%3E' + bank.name + '%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes scroll-rtl {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll-rtl {
          animation: scroll-rtl 25s linear infinite;
          will-change: transform;
        }

        .animate-scroll-rtl:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}