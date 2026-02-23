import React from 'react';
import { User, Briefcase, ShieldCheck, Calendar, BadgeCheck, Coins, Plus } from 'lucide-react';
import PremiumInput from './PremiumInput';

const EMPLOYMENT_TYPES = [
  { val: 'employee', label: 'שכיר/ה' },
  { val: 'self_employed', label: 'עצמאי/ת' },
  { val: 'controlling_shareholder', label: 'בעל שליטה' },
  { val: 'foreign_income', label: 'הכנסה מחו"ל' },
  { val: 'pensioner', label: 'פנסיונר/ית' },
];

const EMPLOYMENT_LABELS = {
  employee: 'שכיר/ה',
  self_employed: 'עצמאי/ת',
  controlling_shareholder: 'בעל שליטה',
  foreign_income: 'הכנסה מחו"ל',
  pensioner: 'פנסיונר/ית (קצבה/גמלה)',
};

const calcSeniority = (day, month, year) => {
  if (!day || !month || !year) return '';
  const startDate = new Date(year, month - 1, day);
  const today = new Date();
  const years = (today - startDate) / (1000 * 60 * 60 * 24 * 365.25);
  return Math.max(0, years).toFixed(1);
};

// WorkStartField - שדה תאריך התחלת עבודה לסוג הכנסה ספציפי
function WorkStartField({ typeVal, typeLabel, data, onChange }) {
  const dayKey = `workStart_${typeVal}_day`;
  const monthKey = `workStart_${typeVal}_month`;
  const yearKey = `workStart_${typeVal}_year`;
  const seniorityKey = `seniority_${typeVal}`;

  const handleChange = (key, value, isDay, isMonth, isYear) => {
    onChange(key, value);
    const day = isDay ? value : (data[dayKey] || '');
    const month = isMonth ? value : (data[monthKey] || '');
    const year = isYear ? value : (data[yearKey] || '');
    if (day && month && year) {
      onChange(seniorityKey, calcSeniority(day, month, year));
    }
  };

  return (
    <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
      <p className="text-[#1e3a5f] font-semibold text-xs mb-2">📅 תאריך תחילת עיסוק – {typeLabel}</p>
      <div className="grid grid-cols-3 gap-2">
        {[
          { placeholder: 'יום', key: dayKey, min: 1, max: 31, isDay: true },
          { placeholder: 'חודש', key: monthKey, min: 1, max: 12, isMonth: true },
          { placeholder: 'שנה', key: yearKey, min: 1960, max: 2026, isYear: true },
        ].map(({ placeholder, key, min, max, isDay, isMonth, isYear }) => (
          <input
            key={key}
            type="number"
            placeholder={placeholder}
            min={min}
            max={max}
            className="bg-white h-12 px-3 border-2 border-[#1e3a5f] rounded-xl outline-none focus:border-[#c9a961] focus:ring-2 focus:ring-[#c9a961]/20 transition-all text-gray-900 font-semibold text-sm text-center"
            value={data[key] || ''}
            onChange={(e) => handleChange(key, e.target.value, isDay, isMonth, isYear)}
          />
        ))}
      </div>
      {data[seniorityKey] && (
        <div className="mt-2 p-2 bg-green-50 border border-green-300 rounded-lg text-center">
          <p className="text-green-800 font-bold text-xs">ותק: {data[seniorityKey]} שנים</p>
        </div>
      )}
      {/* הכנסה לפי סוג */}
      <div className="mt-3">
        <label className="text-[#1e3a5f] font-semibold text-xs mb-1 block">
          הכנסה חודשית נטו – {typeLabel}
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="סכום בשקלים"
            className="w-full bg-white h-12 px-4 pl-10 border-2 border-[#1e3a5f] rounded-xl outline-none focus:border-[#c9a961] transition-all text-gray-900 font-semibold text-sm text-right"
            value={data[`income_${typeVal}`] ? new Intl.NumberFormat('he-IL').format(data[`income_${typeVal}`]) : ''}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^\d]/g, '');
              onChange(`income_${typeVal}`, raw);
            }}
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c9a961] font-bold text-lg">₪</span>
        </div>
      </div>
    </div>
  );
}

export default function BorrowerForm({ borrower, index, onChange, onAddBorrower, isLast, isReverseMortgage }) {
  const isMainBorrower = index === 0;
  const isSecondaryBorrower = !isMainBorrower && borrower.borrowerRole === 'secondary';

  const handleChange = (name, value) => {
    onChange(index, { ...borrower, [name]: value });
  };

  const selectedTypes = borrower.employmentTypes || ['employee'];

  // הכנסות נוספות - רק סוגים שאינם ב-employmentTypes
  const additionalIncomeOptions = [
    { val: 'rent', label: 'שכירות נכנסת' },
    { val: 'national_insurance', label: 'קצבת ביטוח לאומי' },
    { val: 'disability', label: 'קצבת נכות' },
    { val: 'child_allowance', label: 'קצבאות ילדים' },
    { val: 'other', label: 'אחר' },
  ];

  // חישוב סה"כ הכנסה
  const totalIncomeFromTypes = selectedTypes.reduce((sum, t) => {
    return sum + (Number(borrower[`income_${t}`]) || 0);
  }, 0);
  const additionalInc = Number(borrower.additionalIncomeAmount) || 0;
  const totalGross = totalIncomeFromTypes + additionalInc;
  // לווה נוסף - הבנק מכיר ב-50% בלבד
  const effectiveIncome = isSecondaryBorrower ? totalGross * 0.5 : totalGross;

  return (
    <div className="animate-in fade-in slide-in-from-left-4 duration-500">
      {/* כותרת לווה */}
      <div className={`mb-6 p-4 rounded-xl border-2 ${isMainBorrower ? 'bg-[#1e3a5f]/5 border-[#1e3a5f]/20' : 'bg-[#c9a961]/10 border-[#c9a961]/30'}`}>
        <h3 className="text-base font-bold text-[#1e3a5f] mb-1">
          {isMainBorrower ? 'לווה 1 – פרטים אישיים' : `לווה ${index + 1} – פרטים אישיים`}
        </h3>
        {!isMainBorrower && (
          <div className="mt-2">
            <p className="text-xs text-gray-600 mb-2 font-semibold">סוג לווה:</p>
            <div className="flex gap-3">
              {[
                { val: 'primary', label: 'לווה עיקרי (בחוזה רכישה)' },
                { val: 'secondary', label: 'לווה נוסף (לשיפור הכנסות)' },
              ].map(opt => (
                <label key={opt.val} className={`flex items-center gap-2 p-2 px-3 rounded-xl border-2 cursor-pointer transition-all flex-1 text-center justify-center ${borrower.borrowerRole === opt.val ? 'border-[#c9a961] bg-[#c9a961]/10' : 'border-gray-200 bg-white hover:border-[#1e3a5f]/40'}`}>
                  <input type="radio" className="accent-[#1e3a5f]" checked={borrower.borrowerRole === opt.val} onChange={() => handleChange('borrowerRole', opt.val)} />
                  <span className="text-xs font-semibold text-gray-800">{opt.label}</span>
                </label>
              ))}
            </div>
            {isSecondaryBorrower && (
              <div className="mt-2 p-2 bg-amber-50 border border-amber-300 rounded-lg">
                <p className="text-amber-800 text-xs font-medium">⚠️ לווה נוסף: הבנק מכיר ב-50% מהכנסתו בלבד לחישוב DTI</p>
              </div>
            )}
          </div>
        )}
        {borrower.age && (
          <p className="text-xs text-gray-500 mt-1">גיל: <span className="font-bold text-[#c9a961]">{borrower.age}</span></p>
        )}
      </div>

      {/* שם + ת.ז */}
      <div className="grid grid-cols-2 gap-3 mb-1">
        <PremiumInput label="שם פרטי" name="firstName" value={borrower.firstName || ''} placeholder="ישראל" icon={User} onChange={handleChange} />
        <PremiumInput label="שם משפחה" name="lastName" value={borrower.lastName || ''} placeholder="ישראלי" icon={User} onChange={handleChange} />
      </div>
      <PremiumInput label="מספר תעודת זהות" name="idNumber" value={borrower.idNumber || ''} placeholder="123456789" icon={BadgeCheck} onChange={handleChange} />

      {/* תאריך לידה */}
      <div className="mb-5 text-right w-full">
        <label className="flex items-center text-[#1e3a5f] font-semibold text-sm mb-2">
          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center ml-2">
            <Calendar size={16} className="text-gray-500" />
          </div>
          <span>תאריך לידה</span>
        </label>
        <input
          type="date"
          min="1924-01-01"
          max="2007-12-31"
          className="w-full bg-gradient-to-br from-white to-gray-50 h-14 px-5 border-3 border-[#1e3a5f] rounded-2xl outline-none focus:border-[#c9a961] focus:ring-4 focus:ring-[#c9a961]/20 transition-all text-gray-900 font-semibold text-base text-right shadow-lg"
          value={borrower.birthDate || ''}
          onChange={(e) => {
            handleChange('birthDate', e.target.value);
            if (e.target.value) {
              const bd = new Date(e.target.value);
              const today = new Date();
              let age = today.getFullYear() - bd.getFullYear();
              const md = today.getMonth() - bd.getMonth();
              if (md < 0 || (md === 0 && today.getDate() < bd.getDate())) age--;
              handleChange('age', age.toString());
            }
          }}
        />
      </div>

      {/* מצב משפחתי – רק ללווה 1 */}
      {isMainBorrower && (
        <>
          <PremiumInput label="מצב משפחתי" name="maritalStatus" value={borrower.maritalStatus || 'single'} icon={User} onChange={handleChange}
            options={[{val:'single', label:'רווק/ה'}, {val:'married', label:'נשוי/אה'}, {val:'divorced', label:'גרוש/ה'}, {val:'widowed', label:'אלמן/ה'}]}
            tooltip="מצב המשפחתי משפיע על יכולת ההחזר" />
          <PremiumInput label="מספר ילדים מתחת לגיל 18" name="childrenUnder18" value={borrower.childrenUnder18 || '0'} icon={User} onChange={handleChange} placeholder="0" />
        </>
      )}

      {/* משכנתא הפוכה - גיל צעיר */}
      {isReverseMortgage && isMainBorrower && (
        <PremiumInput label="גיל הלווה הצעיר ביותר" name="youngestBorrowerAge" value={borrower.youngestBorrowerAge || ''} placeholder="60+" icon={Calendar} onChange={handleChange}
          tooltip="לצורך חישוב אחוז המימון המקסימלי" />
      )}

      {/* סוגי הכנסה – checkboxes */}
      <div className="mb-5 text-right w-full">
        <label className="flex items-center text-[#1e3a5f] font-semibold text-sm mb-3">
          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center ml-2">
            <Briefcase size={16} className="text-gray-500" />
          </div>
          <span>סוגי הכנסה (ניתן לסמן יותר מאחד)</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {EMPLOYMENT_TYPES.map(opt => {
            const checked = selectedTypes.includes(opt.val);
            return (
              <label key={opt.val} className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${checked ? 'border-[#c9a961] bg-[#c9a961]/10' : 'border-gray-200 bg-white hover:border-[#1e3a5f]/40'}`}>
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded accent-[#1e3a5f]"
                  checked={checked}
                  onChange={(e) => {
                    const cur = selectedTypes;
                    const next = e.target.checked ? [...cur, opt.val] : cur.filter(v => v !== opt.val);
                    handleChange('employmentTypes', next.length ? next : ['employee']);
                  }}
                />
                <span className="text-sm font-semibold text-gray-800">{opt.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* לכל סוג הכנסה מסומן: תאריך תחילת + הכנסה */}
      {selectedTypes.length > 0 && (
        <div className="mb-5 space-y-3">
          <h4 className="text-[#1e3a5f] font-bold text-sm">פירוט הכנסות לפי סוג:</h4>
          {selectedTypes.map(typeVal => (
            <WorkStartField
              key={typeVal}
              typeVal={typeVal}
              typeLabel={EMPLOYMENT_LABELS[typeVal] || typeVal}
              data={borrower}
              onChange={(key, val) => handleChange(key, val)}
            />
          ))}
        </div>
      )}

      {/* הכנסות נוספות (שאינן בסוגי ההכנסה שנבחרו) */}
      <div className="mb-5">
        <label className="flex items-center text-[#1e3a5f] font-semibold text-sm mb-3">
          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center ml-2">
            <Coins size={16} className="text-gray-500" />
          </div>
          <span>הכנסה נוספת (מחוץ להכנסות שפורטו)</span>
        </label>
        <select
          className="w-full bg-white h-14 px-5 border-2 border-[#1e3a5f] rounded-2xl outline-none focus:border-[#c9a961] transition-all text-gray-900 font-semibold text-base text-right"
          value={borrower.additionalIncomeType || 'none'}
          onChange={(e) => handleChange('additionalIncomeType', e.target.value)}
          dir="rtl"
        >
          <option value="none">אין הכנסה נוספת</option>
          {additionalIncomeOptions.map(opt => (
            <option key={opt.val} value={opt.val}>{opt.label}</option>
          ))}
        </select>
        {borrower.additionalIncomeType && borrower.additionalIncomeType !== 'none' && (
          <div className="mt-3 relative">
            <input
              type="text"
              placeholder="סכום חודשי נוסף"
              className="w-full bg-white h-12 px-4 pl-10 border-2 border-[#1e3a5f] rounded-xl outline-none focus:border-[#c9a961] transition-all text-gray-900 font-semibold text-sm text-right"
              value={borrower.additionalIncomeAmount ? new Intl.NumberFormat('he-IL').format(borrower.additionalIncomeAmount) : ''}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^\d]/g, '');
                handleChange('additionalIncomeAmount', raw);
              }}
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c9a961] font-bold text-lg">₪</span>
          </div>
        )}
      </div>

      {/* סיכום הכנסה */}
      {totalGross > 0 && (
        <div className={`mb-5 p-4 rounded-xl border-2 ${isSecondaryBorrower ? 'bg-amber-50 border-amber-300' : 'bg-green-50 border-green-300'}`}>
          <p className="font-bold text-sm text-gray-800">סה"כ הכנסה ברוטו: <span className="text-[#1e3a5f]">₪{new Intl.NumberFormat('he-IL').format(totalGross)}</span></p>
          {isSecondaryBorrower && (
            <p className="font-bold text-sm text-amber-800 mt-1">הכנסה מוכרת לבנק (50%): <span>₪{new Intl.NumberFormat('he-IL').format(effectiveIncome)}</span></p>
          )}
        </div>
      )}

      {/* דירוג אשראי */}
      <PremiumInput label="דירוג אשראי BDI" name="creditHistory" value={borrower.creditHistory || 'clean'} icon={ShieldCheck} onChange={handleChange}
        options={[{val:'clean', label:'תקין לחלוטין (ירוק)'}, {val:'issues', label:'מורכב (היו עיכובים)'}]}
        tooltip="דירוג האשראי משפיע על הסיכוי לאישור" />

      {/* הוספת לווה */}
      {isLast && (
        <button
          type="button"
          onClick={onAddBorrower}
          className="mt-6 w-full flex items-center justify-center gap-3 p-4 rounded-2xl border-2 border-dashed border-[#c9a961] bg-[#c9a961]/5 hover:bg-[#c9a961]/10 transition-all text-[#1e3a5f] font-bold text-sm"
        >
          <Plus size={20} className="text-[#c9a961]" />
          הוסף לווה {index + 2}
        </button>
      )}
    </div>
  );
}