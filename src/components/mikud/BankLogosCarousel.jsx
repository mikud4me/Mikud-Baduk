import React from 'react';

const banks = [
  { name: 'לאומי', img: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696ca6d05493d178c33e26fd/1e6e34e3d_.png', scale: 1 },
  { name: 'הפועלים', img: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696ca6d05493d178c33e26fd/6f82f9fcf_bankhapoalim.png', scale: 2.2 },
  { name: 'דיסקונט', img: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696ca6d05493d178c33e26fd/552ec864d_image.png', scale: 1 },
  { name: 'מזרחי טפחות', img: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696ca6d05493d178c33e26fd/e0ed091a8_mizrachi.png', scale: 2.2 },
  { name: 'ירושלים', img: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696ca6d05493d178c33e26fd/ad9176516_ye.png', scale: 1 },
  { name: 'הבינלאומי', img: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696ca6d05493d178c33e26fd/22943f9c3_.jpg', scale: 2.0 },
];

export default function BankLogosCarousel() {
  return (
    <div className="bg-white border-y border-gray-100 py-10">
      {/* Styled Title */}
      <div className="max-w-7xl mx-auto px-4 mb-10 text-center">
        <div className="inline-flex flex-col items-center gap-2">
          <h2 className="text-2xl sm:text-3xl font-black text-[#1e3a5f]" style={{ letterSpacing: '-0.01em' }}>
            בשיתוף פעולה עם כל הבנקים המובילים במשק
          </h2>
          <div className="h-1 w-24 rounded-full bg-gradient-to-r from-[#1e3a5f] via-[#c9a961] to-[#1e3a5f] mt-1" />
        </div>
      </div>

      {/* Logos */}
      <div className="flex flex-wrap items-center justify-center gap-16 px-12">
        {banks.map((bank) => (
          <div
            key={bank.name}
            className="flex items-center justify-center p-3 rounded-xl hover:bg-gray-50 transition-all duration-300 group"
          >
            <img
              src={bank.img}
              alt={`בנק ${bank.name}`}
              style={{ width: '130px', height: '60px', transform: `scale(${bank.scale || 1})` }}
              className="object-contain opacity-75 group-hover:opacity-100 transition-opacity duration-300"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}