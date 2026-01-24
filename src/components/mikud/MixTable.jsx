import React from 'react';
import { Sparkles } from 'lucide-react';

const formatCurrency = (val) => {
  if (!val || isNaN(val)) return "0";
  return new Intl.NumberFormat('he-IL').format(val);
};

export default function MixTable({ title, tracks, totalPmt, isRecommended }) {
  return (
    <div className={`bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-lg border ${isRecommended ? 'border-[#c9a961]' : 'border-gray-200'} mb-4 sm:mb-6 text-right w-full relative transition-all duration-300 hover:shadow-xl`}>
      {isRecommended && (
        <div className="absolute -top-2 sm:-top-3 right-4 sm:right-6 z-10">
          <div className="bg-gradient-to-r from-[#c9a961] to-[#d4b975] text-white px-3 sm:px-5 py-1 sm:py-1.5 rounded-full font-semibold text-[10px] sm:text-xs shadow-md flex items-center gap-1 sm:gap-1.5">
            <Sparkles size={12} className="sm:w-[14px] sm:h-[14px]" />
            מומלץ ביותר
          </div>
        </div>
      )}
      <div className="p-4 sm:p-5 md:p-6 border-b border-gray-200 flex flex-col gap-3 text-right" dir="rtl">
        <div>
          <h4 className="text-base sm:text-lg md:text-xl font-bold text-[#1e3a5f] mb-1 leading-tight">{title}</h4>
          <p className="text-gray-500 text-xs sm:text-sm font-medium">תמהיל מקצועי ומאוזן</p>
        </div>
        <div className="text-right w-full">
          <p className="text-[10px] sm:text-xs text-gray-400 font-medium mb-2">החזר חודשי משוער</p>
          <div className="bg-[#1e3a5f] text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl w-full text-center">
            <p className="text-xl sm:text-2xl md:text-3xl font-bold">₪{formatCurrency(Math.floor(totalPmt))}</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right min-w-[450px]">
          <thead>
            <tr className="text-gray-400 text-[10px] sm:text-xs font-semibold border-b border-gray-200">
              <th className="p-2 sm:p-3 pr-3 sm:pr-6 text-right">מסלול</th>
              <th className="p-2 sm:p-3 text-center">סכום</th>
              <th className="p-2 sm:p-3 text-center">ריבית</th>
              <th className="p-2 sm:p-3 text-center">תקופה</th>
              <th className="p-2 sm:p-3 text-left pl-3 sm:pl-6">החזר</th>
            </tr>
          </thead>
          <tbody className="text-xs sm:text-sm font-medium text-gray-900">
            {tracks.map((track, idx) => (
              <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                <td className="p-2 sm:p-3 pr-3 sm:pr-6 text-right">
                  <div className="font-semibold text-xs sm:text-sm leading-tight">{track.name}</div>
                  <div className="text-[10px] sm:text-xs text-gray-400 font-normal">{track.desc}</div>
                </td>
                <td className="p-2 sm:p-3 text-center text-xs sm:text-sm">₪{formatCurrency(Math.floor(track.amount))}</td>
                <td className="p-2 sm:p-3 text-center text-[#c9a961] font-semibold text-xs sm:text-sm">
                  {(track.rate * 100).toFixed(2)}%
                </td>
                <td className="p-2 sm:p-3 text-center text-xs sm:text-sm">{track.years} ש'</td>
                <td className="p-2 sm:p-3 text-left font-bold text-sm sm:text-base md:text-lg pl-3 sm:pl-6">₪{formatCurrency(Math.floor(track.pmt))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}