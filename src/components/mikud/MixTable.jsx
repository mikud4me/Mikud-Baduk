import React from 'react';

const formatCurrency = (val) => {
  if (!val || isNaN(val)) return "0";
  return new Intl.NumberFormat('he-IL').format(val);
};

export default function MixTable({ title, tracks, totalPmt, isRecommended }) {
  return (
    <div className={`bg-gradient-to-br from-white via-slate-50 to-white rounded-[2rem] overflow-hidden shadow-2xl border-4 ${isRecommended ? 'border-[#d4af37] ring-4 ring-[#d4af37]/20' : 'border-slate-200'} mb-8 text-right w-full relative group hover:scale-[1.02] transition-all duration-500`}>
      {isRecommended && (
        <div className="absolute -top-4 right-8 z-10">
          <div className="bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#001a33] px-6 py-2 rounded-full font-black text-sm shadow-2xl shadow-[#d4af37]/50 flex items-center gap-2">
            <Sparkles size={16} />
            מומלץ ביותר!
          </div>
        </div>
      )}
      <div className="p-6 border-b-2 border-slate-200 bg-gradient-to-r from-slate-50 to-white flex flex-col sm:flex-row justify-between items-center text-right" dir="rtl">
        <div>
          <h4 className="text-2xl font-black text-[#001a33] tracking-tight leading-tight mb-2">{title}</h4>
          <p className="text-slate-500 text-sm font-bold">תמהיל מקצועי ומאוזן</p>
        </div>
        <div className="text-right sm:text-left mt-4 sm:mt-0">
          <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-2">החזר חודשי משוער</p>
          <div className="bg-gradient-to-r from-[#001a33] to-[#003d66] text-white px-6 py-4 rounded-2xl shadow-xl">
            <p className="text-5xl font-black leading-none">₪{formatCurrency(Math.floor(totalPmt))}</p>
          </div>
        </div>
      </div>
      
      <div className="p-0 overflow-x-auto">
        <table className="w-full text-right min-w-[550px]">
          <thead>
            <tr className="text-slate-400 text-[10px] uppercase font-black border-b border-slate-50">
              <th className="p-3 pr-4 text-right">מסלול</th>
              <th className="p-3 text-center">סכום</th>
              <th className="p-3 text-center">ריבית</th>
              <th className="p-3 text-center">תקופה</th>
              <th className="p-3 text-left pl-4">החזר</th>
            </tr>
          </thead>
          <tbody className="text-sm font-black text-[#001a33]">
            {tracks.map((track, idx) => (
              <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-blue-50/20 transition-colors">
                <td className="p-3 pr-4 text-right">
                  <div className="font-black text-sm">{track.name}</div>
                  <div className="text-[9px] text-slate-400 font-bold">{track.desc}</div>
                </td>
                <td className="p-3 text-center">₪{formatCurrency(Math.floor(track.amount))}</td>
                <td className="p-3 text-center text-[#d4af37] italic font-black">
                  {(track.rate * 100).toFixed(2)}%
                </td>
                <td className="p-3 text-center">{track.years} ש'</td>
                <td className="p-3 text-left font-black text-xl pl-4">₪{formatCurrency(Math.floor(track.pmt))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}