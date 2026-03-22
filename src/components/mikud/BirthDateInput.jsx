import React, { useState, useRef } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';

/**
 * שדה תאריך לידה עם 3 תיבות קלט נפרדות: יום / חודש / שנה
 * מחזיר value בפורמט YYYY-MM-DD
 */
export default function BirthDateInput({ value, onChange, error }) {
  // parse existing value
  const parts = value ? value.split('-') : ['', '', ''];
  const [year, setYear] = useState(parts[0] || '');
  const [month, setMonth] = useState(parts[1] || '');
  const [day, setDay] = useState(parts[2] || '');

  const monthRef = useRef(null);
  const yearRef = useRef(null);

  const emit = (d, m, y) => {
    if (d && m && y && y.length === 4) {
      const dd = d.padStart(2, '0');
      const mm = m.padStart(2, '0');
      onChange(`${y}-${mm}-${dd}`);
    } else {
      onChange('');
    }
  };

  const handleDay = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setDay(val);
    emit(val, month, year);
    if (val.length === 2) monthRef.current?.focus();
  };

  const handleMonth = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setMonth(val);
    emit(day, val, year);
    if (val.length === 2) yearRef.current?.focus();
  };

  const handleYear = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setYear(val);
    emit(day, month, val);
  };

  const baseInput = `h-14 border-2 rounded-2xl outline-none focus:border-[#c9a961] focus:ring-4 focus:ring-[#c9a961]/20 transition-all text-gray-900 font-semibold text-base text-center shadow-md bg-gradient-to-br from-white to-gray-50 ${error ? 'border-red-500' : 'border-[#1e3a5f]'}`;

  return (
    <div className="mb-5 text-right w-full">
      <label className="flex items-center text-[#1e3a5f] font-semibold text-sm mb-2">
        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center ml-2">
          <Calendar size={16} className="text-gray-500" />
        </div>
        <span>תאריך לידה</span>
      </label>

      <div className="flex gap-2" dir="ltr">
        {/* יום */}
        <div className="flex flex-col items-center flex-1">
          <input
            type="text"
            inputMode="numeric"
            placeholder="DD"
            maxLength={2}
            className={`${baseInput} w-full`}
            value={day}
            onChange={handleDay}
          />
          <span className="text-xs text-gray-400 mt-1 font-medium">יום</span>
        </div>

        <div className="flex items-center pb-5 text-gray-400 font-bold text-xl">/</div>

        {/* חודש */}
        <div className="flex flex-col items-center flex-1">
          <input
            ref={monthRef}
            type="text"
            inputMode="numeric"
            placeholder="MM"
            maxLength={2}
            className={`${baseInput} w-full`}
            value={month}
            onChange={handleMonth}
          />
          <span className="text-xs text-gray-400 mt-1 font-medium">חודש</span>
        </div>

        <div className="flex items-center pb-5 text-gray-400 font-bold text-xl">/</div>

        {/* שנה */}
        <div className="flex flex-col items-center flex-[2]">
          <input
            ref={yearRef}
            type="text"
            inputMode="numeric"
            placeholder="YYYY"
            maxLength={4}
            className={`${baseInput} w-full`}
            value={year}
            onChange={handleYear}
          />
          <span className="text-xs text-gray-400 mt-1 font-medium">שנה</span>
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-3 bg-red-50 border-2 border-red-500 px-5 py-3 rounded-2xl">
          <AlertCircle size={20} className="text-red-600" />
          <p className="text-red-700 text-sm font-bold">{error}</p>
        </div>
      )}
    </div>
  );
}