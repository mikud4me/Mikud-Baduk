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
  
  // 4 עותקים להבטחת לולאה חלקה ללא רווח
  const allBanks = [...banks, ...banks, ...banks, ...banks];

  const getHeight = (bankName) => {
    switch(bankName) {
      case 'לאומי': return '28px';
      case 'הפועלים': return '110px';
      case 'דיסקונט': return '38px';
      case 'מזרחי טפחות': return '110px';
      case 'ירושלים': return '55px';
      case 'מרכנתיל': return '38px';
      default: return '38px';
    }
  };

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
        
        <div className="carousel-track">
          {allBanks.map((bank, index) => (
            <div 
              key={`${bank.name}-${index}`}
              className="carousel-item"
            >
              <img 
                src={bank.img} 
                alt={`בנק ${bank.name}`}
                style={{ height: getHeight(bank.name), width: 'auto' }}
                className="object-contain opacity-90 hover:opacity-100 transition-opacity duration-300"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="48"%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="14" fill="%23666"%3E' + bank.name + '%3C/text%3E%3C/svg%3E';
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .carousel-track {
          display: flex;
          align-items: center;
          width: max-content;
          animation: carousel-scroll 30s linear infinite;
          will-change: transform;
        }

        .carousel-item {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 40px;
        }

        @keyframes carousel-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-25%); }
        }

        .carousel-track:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}