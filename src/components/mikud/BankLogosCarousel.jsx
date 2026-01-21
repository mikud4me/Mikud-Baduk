import React from 'react';

export default function BankLogosCarousel() {
  const banks = [
    { name: 'הפועלים', img: 'https://www.be-all.com/wp-content/uploads/2019/08/%D7%91%D7%A0%D7%A7-%D7%94%D7%A4%D7%95%D7%A2%D7%9C%D7%99%D7%9D-%D7%9C%D7%95%D7%92%D7%95-%D7%9C%D7%90%D7%AA%D7%A8.png' },
    { name: 'לאומי', img: 'https://www.leumi.co.il/static-resources/bopMain/style/img/logo.svg' },
    { name: 'דיסקונט', img: 'https://www.discountbank.co.il/Style%20Library/MASTER2015/images/header/logo-desctop.svg' },
    { name: 'מזרחי', img: 'https://www.mizrahi-tefahot.co.il/Style%20Library/Digital/logo.svg' },
    { name: 'ירושלים', img: 'https://www.bankjerusalem.co.il/Style%20Library/Images/logo.svg' },
    { name: 'בינלאומי', img: 'https://www.fibi.co.il/wps/wcm/connect/marketing/marketing_he/homepage/images/logo-fibi.svg' },
    { name: 'מסד', img: 'https://www.bank-massad.co.il/SiteFiles/1/Images/logo.svg' },
    { name: 'אוצר החייל', img: 'https://www.bankotsar.co.il/PublishingImages/Logo-Bank-Otsar-Hahayal.svg' },
  ];

  // כפול את המערך 3 פעמים
  const allBanks = [...banks, ...banks, ...banks];

  return (
    <div className="bg-white border-y border-gray-100 py-3 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-2">
        <p className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          עובדים עם כל הבנקים המובילים
        </p>
      </div>
      
      <div className="relative">
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        
        <div className="flex animate-scroll-rtl">
          {allBanks.map((bank, index) => (
            <div 
              key={`${bank.name}-${index}`}
              className="flex-shrink-0 px-6 flex items-center justify-center"
            >
              <img 
                src={bank.img} 
                alt={`בנק ${bank.name}`}
                className="h-6 w-auto object-contain opacity-40 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="60" height="24"%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="10" fill="%23666"%3E' + bank.name + '%3C/text%3E%3C/svg%3E';
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