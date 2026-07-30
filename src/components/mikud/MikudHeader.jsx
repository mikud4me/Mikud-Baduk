import React from 'react';
import { Check } from 'lucide-react';
import { createPageUrl } from '@/utils';

/**
 * Shared site header for the calculator and the refinance quick check.
 * `activePage` hides the navigation action for the page the visitor is on.
 */
export default function MikudHeader({
  activePage = 'calculator',
  isChatOpen,
  setIsChatOpen,
  onBrandClick,
}) {
  const brand = (
    <>
      <Check size={26} className="text-[#0153F4] flex-shrink-0" strokeWidth={3} />
      <span className="text-3xl sm:text-4xl font-black text-[#0153F4] transition-colors">בדוק</span>
    </>
  );

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-mist-100 shadow-sm backdrop-blur-xl h-28 sm:h-32 px-6 sm:px-10 flex items-center justify-between" dir="rtl">
      <div className="flex items-center gap-6">
        {onBrandClick ? (
          <button type="button" onClick={onBrandClick} className="flex items-center gap-2 cursor-pointer group" aria-label="לדף הראשי">
            {brand}
          </button>
        ) : (
          <a href={createPageUrl('MortgageCalculator')} className="flex items-center gap-2 cursor-pointer group" aria-label="לדף הראשי">
            {brand}
          </a>
        )}

        {activePage !== 'refinance' && (
          <div className="relative hidden sm:block">
            <div className="absolute -inset-3 bg-gradient-to-r from-brand-400/40 to-brand-600/30 rounded-full blur-xl pointer-events-none" />
            <a
              href={createPageUrl('RefinanceQuickCheck')}
              className="relative bg-[#0153F4] text-white px-6 py-3 rounded-full font-black text-lg hover:bg-[#0141C2] hover:scale-105 transition-all shadow-lg"
            >
              ממחזרים את המשכנתא?
            </a>
          </div>
        )}
      </div>

      <div className="flex items-center gap-6">
        {setIsChatOpen && (
          <button
            type="button"
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="hidden sm:block text-[#0C084A] font-bold hover:text-[#0153F4] transition-all"
          >
            שאלות?
          </button>
        )}
        <a href={createPageUrl('AdminDashboard')} className="hidden sm:block text-[#0C084A] font-bold text-sm hover:text-[#0153F4] transition-all">
          פאנל ניהול
        </a>
        <a href="tel:2324" className="bg-[#0C084A] text-white px-8 py-3 rounded-full font-bold text-base hover:bg-[#0153F4] transition-all shadow-md hover:shadow-lg text-center">
          2324*
        </a>
      </div>
    </nav>
  );
}
