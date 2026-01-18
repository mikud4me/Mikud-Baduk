import React from 'react';
import { Sparkles } from 'lucide-react';

const formatCurrency = (val) => {
  if (!val || isNaN(val)) return "0";
  return new Intl.NumberFormat('he-IL').format(val);
};

export default function MixTable({ title, tracks, totalPmt, isRecommended }) {
  return (
    <div className={`bg-gradient-to-br from-white via-slate-50 to-white rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden shadow-2xl border-2 sm:border-4 ${isRecommended ? 'border-[#d4af37] ring-2 sm:ring-4 ring-[#d4af37]/20' : 'border-slate-200'} mb-6 sm:mb-8 text-right w-full relative group hover:scale-[1.02] transition-all duration-500`}>
      {isRecommended && (
        <div className="absolute -top-3 sm:-top-4 right-4 sm:right-8 z-10">
          <div className="bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#001a33] px-3 sm:px-6 py-1.5 sm:py-2 rounded-full font-black text-xs sm:text-sm shadow-2xl shadow-[#d4af37]/50 flex items-center gap-1 sm:gap-2">
            <Sparkles size={12} className="sm:w-4 sm:h-4" />
            מומלץ ביותר!
          </div>
        </div>
      )}
      <div className="p-4 sm:p-6 border-b-2 border-slate-200 bg-gradient-to-r from-slate-50 to-white flex flex-col sm:flex-row justify-between items-center text-right" dir="rtl">
        <div>
          <h4 className="text-lg sm:text-xl md:text-2xl font-black text-[#001a33] tracking-tight leading-tight mb-1 sm:mb-2">{title}</h4>
          <p className="text-slate-500 text-xs sm:text-sm font-bold">תמהיל מקצועי ומאוזן</p>
        </div>
        <div className="text-right sm:text-left mt-3 sm:mt-0">
          <p className="text-[10px] sm:text-xs text-slate-400 font-black uppercase tracking-widest mb-1 sm:mb-2">החזר חודשי משוער</p>
          <div className="bg-gradient-to-r from-[#001a33] to-[#003d66] text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-xl">
            <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black leading-none">₪{formatCurrency(Math.floor(totalPmt))}</p>
          </div>
        </div>
      </div>
      
      <div className="p-0 overflow-x-auto">
        <table className="w-full text-right min-w-[450px] sm:min-w-[550px]">
          <thead>
            <tr className="text-slate-400 text-[8px] sm:text-[10px] uppercase font-black border-b border-slate-50">
              <th className="p-2 sm:p-3 pr-3 sm:pr-4 text-right">מסלול</th>
              <th className="p-2 sm:p-3 text-center">סכום</th>
              <th className="p-2 sm:p-3 text-center">ריבית</th>
              <th className="p-2 sm:p-3 text-center">תקופה</th>
              <th className="p-2 sm:p-3 text-left pl-3 sm:pl-4">החזר</th>
            </tr>
          </thead>
          <tbody className="text-xs sm:text-sm font-black text-[#001a33]">
            {tracks.map((track, idx) => (
              <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-blue-50/20 transition-colors">
                <td className="p-2 sm:p-3 pr-3 sm:pr-4 text-right">
                  <div className="font-black text-xs sm:text-sm">{track.name}</div>
                  <div className="text-[8px] sm:text-[9px] text-slate-400 font-bold">{track.desc}</div>
                </td>
                <td className="p-2 sm:p-3 text-center text-[11px] sm:text-sm">₪{formatCurrency(Math.floor(track.amount))}</td>
                <td className="p-2 sm:p-3 text-center text-[#d4af37] italic font-black text-xs sm:text-sm">
                  {(track.rate * 100).toFixed(2)}%
                </td>
                <td className="p-2 sm:p-3 text-center text-[11px] sm:text-sm">{track.years} ש'</td>
                <td className="p-2 sm:p-3 text-left font-black text-base sm:text-lg md:text-xl pl-3 sm:pl-4">₪{formatCurrency(Math.floor(track.pmt))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}