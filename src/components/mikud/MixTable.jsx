import React from 'react';
import { Sparkles } from 'lucide-react';

const formatCurrency = (val) => {
  if (!val || isNaN(val)) return "0";
  return new Intl.NumberFormat('he-IL').format(val);
};

export default function MixTable({ title, tracks, totalPmt, isRecommended }) {
  return (
    <div className={`bg-white rounded-2xl overflow-hidden shadow-md border-2 text-right w-full relative flex flex-col transition-all duration-300 hover:shadow-xl ${isRecommended ? 'border-[#c9a961]' : 'border-gray-200'}`} dir="rtl">
      {/* פס צבע עליון */}
      <div className={`h-1.5 w-full ${isRecommended ? 'bg-gradient-to-r from-[#c9a961] to-[#d4b975]' : 'bg-gray-200'}`} />

      {isRecommended && (
        <div className="absolute top-3 left-3 z-10">
          <div className="bg-gradient-to-r from-[#c9a961] to-[#d4b975] text-white px-3 py-1 rounded-full font-bold text-[10px] shadow flex items-center gap-1">
            <Sparkles size={10} />
            מומלץ
          </div>
        </div>
      )}

      {/* כותרת + סכום */}
      <div className={`p-4 sm:p-5 ${isRecommended ? 'bg-gradient-to-br from-[#1e3a5f] to-[#162e4a]' : 'bg-gray-50'}`}>
        <h4 className={`text-sm sm:text-base font-black mb-3 leading-tight ${isRecommended ? 'text-white' : 'text-[#1e3a5f]'}`}>{title}</h4>
        <div className={`rounded-xl px-4 py-3 text-center ${isRecommended ? 'bg-white/15 border border-white/20' : 'bg-[#1e3a5f]'}`}>
          <p className="text-[10px] text-white/60 font-semibold mb-0.5">החזר חודשי</p>
          <p className="text-2xl sm:text-3xl font-black text-white">₪{formatCurrency(Math.floor(totalPmt))}</p>
        </div>
      </div>

      {/* טבלת מסלולים */}
      <div className="flex-1 p-3 sm:p-4 space-y-2">
        {tracks.map((track, idx) => (
          <div key={idx} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-100 hover:border-[#c9a961]/30 transition-colors">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-xs text-[#1e3a5f] leading-tight truncate">{track.name}</p>
              <p className="text-[10px] text-gray-400 leading-tight truncate">{track.desc}</p>
            </div>
            <div className="text-center flex-shrink-0 px-2">
              <p className="text-[#c9a961] font-black text-xs">{(track.rate * 100).toFixed(2)}%</p>
              <p className="text-gray-400 text-[9px]">{track.years} שנה</p>
            </div>
            <div className="text-left flex-shrink-0">
              <p className="font-black text-sm text-[#1e3a5f]">₪{formatCurrency(Math.floor(track.pmt))}</p>
              <p className="text-[9px] text-gray-400 text-center">לחודש</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}