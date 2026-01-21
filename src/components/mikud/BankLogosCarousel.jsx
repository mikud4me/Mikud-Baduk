import React from 'react';

export default function BankLogosCarousel() {
  const banks = [
    { name: 'בנק הפועלים', logo: 'https://upload.wikimedia.org/wikipedia/he/9/91/Bank_Hapoalim_logo.svg' },
    { name: 'בנק לאומי', logo: 'https://upload.wikimedia.org/wikipedia/he/1/15/BankLeumiLogo.svg' },
    { name: 'בנק דיסקונט', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/27/Discount_Bank%2C_Ltd_logo.png' },
    { name: 'בנק מזרחי טפחות', logo: 'https://upload.wikimedia.org/wikipedia/he/c/c8/%D7%9C%D7%95%D7%92%D7%95_%D7%A9%D7%9C_%D7%91%D7%A0%D7%A7_%D7%9E%D7%96%D7%A8%D7%97%D7%99-%D7%98%D7%A4%D7%97%D7%95%D7%AA.svg' },
    { name: 'בנק ירושלים', logo: 'https://upload.wikimedia.org/wikipedia/he/c/cd/%D7%A1%D7%9E%D7%9C%D7%99%D7%9C_%D7%91%D7%A0%D7%A7_%D7%99%D7%A8%D7%95%D7%A9%D7%9C%D7%99%D7%9D_2024.svg' },
    { name: 'הבנק הבינלאומי', logo: 'https://www.fibi.co.il/wps/wcm/connect/marketing/marketing_he/homepage/images/logo-fibi.svg' },
    { name: 'בנק מסד', logo: 'https://www.bank-massad.co.il/SiteFiles/1/Images/logo.svg' },
    { name: 'בנק אוצר החייל', logo: 'https://www.bankotsar.co.il/PublishingImages/Logo-Bank-Otsar-Hahayal.svg' },
  ];

  // כפול את המערך פעמיים כדי שהאנימציה תהיה חלקה
  const allBanks = [...banks, ...banks];

  return (
    <div className="bg-white border-y border-gray-100 py-6 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 mb-3">
        <p className="text-center text-sm font-semibold text-gray-500">
          עובדים עם כל הבנקים והמוסדות הפיננסיים המובילים בישראל
        </p>
      </div>
      
      <div className="relative">
        {/* Gradient overlays */}
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10" />
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10" />
        
        {/* Scrolling container */}
        <div className="flex animate-scroll-rtl">
          {allBanks.map((bank, index) => (
            <div 
              key={`${bank.name}-${index}`}
              className="flex-shrink-0 px-8 flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300 opacity-50 hover:opacity-100"
            >
              <img 
                src={bank.logo} 
                alt={bank.name}
                className="h-8 w-auto object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll-rtl {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(50%);
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