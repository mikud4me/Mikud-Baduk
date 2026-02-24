import React from 'react';

const banks = [
  { name: 'לאומי', img: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696ca6d05493d178c33e26fd/1b54bc0c4_logo.png', h: '28px' },
  { name: 'הפועלים', img: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696ca6d05493d178c33e26fd/971225b2a_--.jpg', h: '80px' },
  { name: 'דיסקונט', img: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696ca6d05493d178c33e26fd/074d60b37_--600x416.jpg', h: '38px' },
  { name: 'מזרחי טפחות', img: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696ca6d05493d178c33e26fd/e0ed091a8_mizrachi.png', h: '80px' },
  { name: 'ירושלים', img: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696ca6d05493d178c33e26fd/ad9176516_ye.png', h: '55px' },
  { name: 'מרכנתיל', img: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696ca6d05493d178c33e26fd/ff1e5dfd3_GetImg.jpg', h: '38px' },
  { name: 'בנק ישראל', img: 'https://upload.wikimedia.org/wikipedia/he/a/a5/Bank_of_Israel_logo.svg', h: '80px' },
];

export default function BankLogosCarousel() {
  return (
    <div className="bg-white border-y border-gray-100 py-6">
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <p className="text-center text-lg font-extrabold text-[#1e3a5f] tracking-tight">
          בשיתוף פעולה עם כל הבנקים המובילים במשק
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-8 px-6">
        {banks.map((bank) => (
          <div key={bank.name} className="flex items-center justify-center">
            <img
              src={bank.img}
              alt={`בנק ${bank.name}`}
              style={{ height: bank.h, width: 'auto' }}
              className="object-contain opacity-80 hover:opacity-100 transition-opacity duration-300"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}