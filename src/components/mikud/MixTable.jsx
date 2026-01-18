import React from 'react';

const formatCurrency = (val) => {
  if (!val || isNaN(val)) return "0";
  return new Intl.NumberFormat('he-IL').format(val);
};

export default function MixTable({ title, tracks, totalPmt, isRecommended }) {
  return (
    <div className={`bg-white rounded-[1.5rem] overflow-hidden shadow-lg border-2 ${isRecommended ? 'border-[#d4af37]' : 'border-slate-100'} mb-6 text-right w-full`}>
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center text-right" dir="rtl">
        <div>
          <h4 className="text-lg font-black text-[#001a33] tracking-tighter leading-tight">{title}</h4>
          {isRecommended && (
            <span className="bg-[#001a33] text-white text-[8px] px-3 py-0.5 rounded-full font-black mt-1 inline-block uppercase tracking-widest">
              מומלץ מיקוד משכנתאות
            </span>
          )}
        </div>
        <div className="text-right sm:text-left mt-3 sm:mt-0">
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">החזר חודשי</p>
          <p className="text-4xl font-black text-[#001a33] leading-none">₪{formatCurrency(Math.floor(totalPmt))}</p>
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