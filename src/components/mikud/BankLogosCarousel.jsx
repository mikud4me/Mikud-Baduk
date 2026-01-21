import React from 'react';

export default function BankLogosCarousel() {
  const banks = [
    { name: 'לאומי', img: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696ca6d05493d178c33e26fd/1b54bc0c4_logo.png' },
    { name: 'הפועלים', img: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696ca6d05493d178c33e26fd/971225b2a_--.jpg' },
    { name: 'דיסקונט', img: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696ca6d05493d178c33e26fd/074d60b37_--600x416.jpg' },
    { name: 'מזרחי טפחות', img: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696ca6d05493d178c33e26fd/e0ed091a8_mizrachi.png' },
    { name: 'ירושלים', img: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696ca6d05493d178c33e26fd/ad9176516_ye.png' },
    { name: 'בינלאומי', img: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696ca6d05493d178c33e26fd/074d60b37_--600x416.jpg' },
    { name: 'מרכנתיל', img: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696ca6d05493d178c33e26fd/ff1e5dfd3_GetImg.jpg' },
  ];

  return (
    <div className="bg-white border-y border-gray-100 py-6 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-4">
        <p className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
          עובדים עם כל הבנקים המובילים
        </p>
      </div>
      
      <div className="relative">
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        
        <div className="flex animate-scroll-rtl">
          {banks.map((bank, index) => (
            <div 
              key={`${bank.name}-${index}`}
              className="flex-shrink-0 px-8 flex items-center justify-center"
            >
              <img 
                src={bank.img} 
                alt={`בנק ${bank.name}`}
                className="h-16 w-auto object-contain opacity-90 hover:opacity-100 transition-all duration-300 hover:scale-105"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="48"%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="14" fill="%23666"%3E' + bank.name + '%3C/text%3E%3C/svg%3E';
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes scroll-rtl {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(calc(-100% / 3));
          }
        }
        
        .animate-scroll-rtl {
          animation: scroll-rtl 30s linear infinite;
        }
        
        .animate-scroll-rtl:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}