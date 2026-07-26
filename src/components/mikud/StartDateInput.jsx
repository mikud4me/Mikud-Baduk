import React, { useState, useRef } from 'react';
import { Calendar } from 'lucide-react';

/**
 * שדה תאריך התחלת עבודה עם 3 תיבות קלט נפרדות: חודש / שנה
 * מחזיר value בפורמט YYYY-MM-DD
 */
export default function StartDateInput({ value, onChange, label = 'תאריך התחלת עבודה' }) {
  const parts = value ? value.split('-') : ['', '', ''];
  const [year, setYear] = useState(parts[0] || '');
  const [month, setMonth] = useState(parts[1] || '');

  const yearRef = useRef(null);

  const emit = (m, y) => {
    if (m && y && y.length === 4) {
      const mm = m.padStart(2, '0');
      onChange(`${y}-${mm}-01`);
    } else {
      onChange('');
    }
  };

  const handleMonth = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setMonth(val);
    emit(val, year);
    if (val.length === 2) yearRef.current?.focus();
  };

  const handleYear = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setYear(val);
    emit(month, val);
  };

  const baseInput = `h-12 border border-transparent rounded-md outline-none focus:border-[#0153F4] focus:ring-4 focus:ring-[#0153F4]/20 transition-all text-mist-900 font-semibold text-base text-center bg-periwinkle-100`;

  return (
    <div className="mb-3">
      <label className="text-xs font-normal text-mist-600 mb-2 block flex items-center gap-1">
        <Calendar size={13} /> {label}
      </label>
      <div className="flex gap-2 items-start" dir="ltr">
        {/* חודש */}
        <div className="flex flex-col items-center flex-1">
          <input
            type="text"
            inputMode="numeric"
            placeholder="MM"
            maxLength={2}
            className={`${baseInput} w-full`}
            value={month}
            onChange={handleMonth}
          />
          <span className="text-xs text-mist-400 mt-1 font-medium">חודש</span>
        </div>

        <div className="flex items-center pb-5 text-mist-400 font-bold text-xl">/</div>

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
          <span className="text-xs text-mist-400 mt-1 font-medium">שנה</span>
        </div>
      </div>
    </div>
  );
}