import React from 'react';

export default function BankLogosCarousel() {
  return (
    <div className="bg-white border-y border-gray-100 py-3 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-2">
        <p className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          עובדים עם כל הבנקים המובילים
        </p>
      </div>
      
      <div className="relative flex items-center justify-center">
        <img 
          src="https://adlai-partners.com/wp-content/uploads/igud_2_670x247.jpg" 
          alt="לוגואים של הבנקים המובילים"
          className="h-12 w-auto object-contain opacity-60"
        />
      </div>
    </div>
  );
}