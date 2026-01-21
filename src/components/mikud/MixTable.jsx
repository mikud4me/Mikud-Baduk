import React from 'react';
import { Sparkles } from 'lucide-react';

const formatCurrency = (val) => {
  if (!val || isNaN(val)) return "0";
  return new Intl.NumberFormat('he-IL').format(val);
};

export default function MixTable({ title, tracks, totalPmt, isRecommended }) {
  return (
    <div className={`bg-white rounded-2xl overflow-hidden shadow-lg border ${isRecommended ? 'border-[#c9a961]' : 'border-gray-200'} mb-6 text-right w-full relative transition-all duration-300 hover:shadow-xl`}>
      {isRecommended && (
        <div className="absolute -top-3 right-6 z-10">
          <div className="bg-gradient-to-r from-[#c9a961] to-[#d4b975] text-white px-5 py-1.5 rounded-full font-semibold text-xs shadow-md flex items-center gap-1.5">
            <Sparkles size={14} />
            מומלץ ביותר
          </div>
        </div>
      )}
      <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center text-right" dir="rtl">
        <div>
          <h4 className="text-xl sm:text-2xl font-bold text-[#1e3a5f] mb-1">{title}</h4>
          <p className="text-gray-500 text-sm font-medium">תמהיל מקצועי ומאוזן</p>
        </div>
        <div className="text-right sm:text-left mt-4 sm:mt-0">
          <p className="text-xs text-gray-400 font-medium mb-2">החזר חודשי משוער</p>
          <div className="bg-[#1e3a5f] text-white px-6 py-3 rounded-xl">
            <p className="text-3xl sm:text-4xl font-bold">₪{formatCurrency(Math.floor(totalPmt))}</p>
          </div>
        </div>
      </div>
      
      <div className="p-0 overflow-x-auto">
        <table className="w-full text-right min-w-[450px]">
          <thead>
            <tr className="text-gray-400 text-xs font-semibold border-b border-gray-200">
              <th className="p-3 pr-6 text-right">מסלול</th>
              <th className="p-3 text-center">סכום</th>
              <th className="p-3 text-center">ריבית</th>
              <th className="p-3 text-center">תקופה</th>
              <th className="p-3 text-left pl-6">החזר</th>
            </tr>
          </thead>
          <tbody className="text-sm font-medium text-gray-900">
            {tracks.map((track, idx) => (
              <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                <td className="p-3 pr-6 text-right">
                  <div className="font-semibold text-sm">{track.name}</div>
                  <div className="text-xs text-gray-400 font-normal">{track.desc}</div>
                </td>
                <td className="p-3 text-center">₪{formatCurrency(Math.floor(track.amount))}</td>
                <td className="p-3 text-center text-[#c9a961] font-semibold">
                  {(track.rate * 100).toFixed(2)}%
                </td>
                <td className="p-3 text-center">{track.years} ש'</td>
                <td className="p-3 text-left font-bold text-lg pl-6">₪{formatCurrency(Math.floor(track.pmt))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}