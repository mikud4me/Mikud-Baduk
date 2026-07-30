import React from 'react';
import { Sparkles } from 'lucide-react';
import FormattedAnalysis from '@/components/mikud/FormattedAnalysis';

/** Shared professional-analysis block for the calculator and refinance report. */
export default function ProfessionalAnalysis({ text, title = 'ניתוח מקצועי מלא' }) {
  if (!text) return null;

  return (
    <section className="bg-periwinkle-100 border border-periwinkle-200 p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl mb-5 sm:mb-6 text-right">
      <h3 className="text-base sm:text-lg font-semibold text-[#0C084A] mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
        <Sparkles size={14} className="sm:w-5 sm:h-5 text-[#0153F4]" />
        {title}
      </h3>
      <div className="text-mist-700 text-sm sm:text-base leading-relaxed font-normal">
        <FormattedAnalysis text={text} />
      </div>
    </section>
  );
}
