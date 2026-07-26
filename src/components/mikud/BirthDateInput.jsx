import React, { useState, useRef } from 'react';

/**
 * שדה תאריך לידה עם 3 תיבות קלט נפרדות: יום / חודש / שנה
 * מחזיר value בפורמט YYYY-MM-DD
 */
export default function BirthDateInput({ value, onChange, error, onInvalidChange }) {
  // parse existing value
  const parts = value ? value.split('-') : ['', '', ''];
  const [year, setYear] = useState(parts[0] || '');
  const [month, setMonth] = useState(parts[1] || '');
  const [day, setDay] = useState(parts[2] || '');
  const [dateError, setDateError] = useState('');

  const monthRef = useRef(null);
  const yearRef = useRef(null);

  const validateAndEmit = (d, m, y) => {
    if (d.length === 2 && m.length === 2 && y.length === 4) {
      const dayNum = Number(d);
      const monthNum = Number(m);
      const yearNum = Number(y);
      const dateObj = new Date(`${y}-${m}-${d}`);
      const isValid =
        dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12 &&
        !isNaN(dateObj.getTime()) &&
        dateObj.getFullYear() === yearNum && dateObj.getMonth() + 1 === monthNum && dateObj.getDate() === dayNum;

      if (isValid) {
        setDateError('');
        onInvalidChange?.(false);
        onChange(`${y}-${m}-${d}`);
      } else {
        setDateError('תאריך לידה לא תקין');
        onInvalidChange?.(true);
        onChange('');
      }
    } else {
      setDateError('');
      onInvalidChange?.(false);
      onChange('');
    }
  };

  const handleDay = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setDay(val);
    validateAndEmit(val, month, year);
    if (val.length === 2) monthRef.current?.focus();
  };

  const handleMonth = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setMonth(val);
    validateAndEmit(day, val, year);
    if (val.length === 2) yearRef.current?.focus();
  };

  const handleYear = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setYear(val);
    validateAndEmit(day, month, val);
  };

  const showError = dateError || error;
  const baseInput = `h-[2.8rem] border rounded-lg outline-none focus:border-[#0153F4] focus:ring-4 focus:ring-[#0153F4]/20 transition-all text-mist-900 font-semibold text-base placeholder:text-[12.8px] text-center bg-periwinkle-100 ${showError ? 'border-red-500' : 'border-transparent'}`;

  return (
    <div className="mb-5 text-right w-full">
      <label className="flex items-center text-[#0C084A] font-normal text-sm mb-2">
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
          <span className="text-xs text-mist-400 mt-1 font-medium">יום</span>
        </div>

        <div className="flex items-center pb-5 text-mist-400 font-bold text-xl">/</div>

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

      {showError && (
        <p className="mt-2 text-red-600 text-xs font-bold">{dateError || error}</p>
      )}
    </div>
  );
}