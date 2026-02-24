import React from 'react';
import { User, Briefcase, Calendar, ShieldCheck, BadgeCheck, Coins, Plus } from 'lucide-react';
import PremiumInput from './PremiumInput';

const EMPLOYMENT_OPTIONS = [
  { val: 'employee', label: 'שכיר/ה' },
  { val: 'self_employed', label: 'עצמאי/ת' },
  { val: 'controlling_shareholder', label: 'בעל שליטה' },
  { val: 'foreign_income', label: 'הכנסה מחו"ל' },
  { val: 'pensioner', label: 'פנסיונר/ית' },
];

const INCOME_TYPE_LABELS = {
  employee: 'שכיר/ה',
  self_employed: 'עצמאי/ת',
  controlling_shareholder: 'בעל שליטה',
  foreign_income: 'הכנסה מחו"ל',
  pensioner: 'פנסיה/גמלה',
};

function calcSeniorityFromDate(dateStr) {
  if (!dateStr) return null;
  const startDate = new Date(dateStr);
  if (isNaN(startDate)) return null;
  const today = new Date();
  const years = (today - startDate) / (1000 * 60 * 60 * 24 * 365.25);
  return Math.max(0, years.toFixed(1));
}

const formatAmount = (val) => {
  if (!val) return '';
  const num = String(val).replace(/[^\d]/g, '');
  if (!num) return '';
  return new Intl.NumberFormat('he-IL').format(num);
};

const parseAmount = (val) => {
  return String(val).replace(/[^\d]/g, '');
};

export default function BorrowerForm({ borrower, index, onChange, isReverseMortgage, errors = {} }) {
  const isFirst = index === 0;
  const isSub = !isFirst; // לווה מספר 2 ומעלה

  const update = (field, value) => {
    onChange({ ...borrower, [field]: value });
  };

  const updateIncomeSource = (type, field, value) => {
    const sources = { ...(borrower.incomeSources || {}) };
    if (field === 'amount') {
      value = parseAmount(value);
    }
    sources[type] = { ...(sources[type] || {}), [field]: value };
    if (field === 'startDate') {
      const sen = calcSeniorityFromDate(value);
      if (sen !== null) sources[type].seniority = sen;
    }
    onChange({ ...borrower, incomeSources: sources });
  };

  const toggleEmploymentType = (val) => {
    const cur = borrower.employmentTypes || [];
    let next;
    if (cur.includes(val)) {
      next = cur.filter(v => v !== val);
    } else {
      next = [...cur, val];
    }
    if (next.length === 0) next = ['employee'];
    onChange({ ...borrower, employmentTypes: next });
  };

  const selectedTypes = borrower.employmentTypes || ['employee'];
  const incomeSources = borrower.incomeSources || {};

  // הכנסות נוספות: כל מה שלא בסוגי ההכנסה הראשיים
  const EXTRA_INCOME_OPTIONS = [
    { val: 'rent', label: 'שכירות נכנסת' },
    { val: 'national_insurance', label: 'קצבת ביטוח לאומי' },
    { val: 'disability', label: 'קצבת נכות' },
    { val: 'child_allowance', label: 'קצבאות ילדים' },
  ].filter(opt => !selectedTypes.includes(opt.val));

  return (
    <div className="space-y-4">

      {/* סוג לווה - רק מלווה 2 ומעלה */}
      {isSub && (
        <div className="p-4 bg-[#1e3a5f]/5 rounded-xl border-2 border-[#1e3a5f]/20 mb-4">
          <p className="text-sm font-bold text-[#1e3a5f] mb-3">סוג לווה</p>
          <div className="grid grid-cols-2 gap-3">
            <label className={`flex items-start gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${borrower.borrowerType !== 'additional' ? 'border-[#c9a961] bg-[#c9a961]/10' : 'border-gray-200 bg-white hover:border-[#1e3a5f]/40'}`}>
              <input type="radio" name={`borrowerType-${index}`} checked={borrower.borrowerType !== 'additional'} onChange={() => update('borrowerType', 'primary')} className="mt-0.5 accent-[#1e3a5f]" />
              <div>
                <p className="font-bold text-sm text-gray-800">לווה עיקרי</p>
                <p className="text-xs text-gray-500">רשום בחוזה הרכישה. הבנק מכיר ב-100% מהכנסותיו.</p>
              </div>
            </label>
            <label className={`flex items-start gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${borrower.borrowerType === 'additional' ? 'border-[#c9a961] bg-[#c9a961]/10' : 'border-gray-200 bg-white hover:border-[#1e3a5f]/40'}`}>
              <input type="radio" name={`borrowerType-${index}`} checked={borrower.borrowerType === 'additional'} onChange={() => update('borrowerType', 'additional')} className="mt-0.5 accent-[#1e3a5f]" />
              <div>
                <p className="font-bold text-sm text-gray-800">לווה נוסף</p>
                <p className="text-xs text-gray-500">התווסף לשיפור הכנסות. הבנק מכיר ב-50% מהכנסותיו בלבד.</p>
              </div>
            </label>
          </div>
          {borrower.borrowerType === 'additional' && (
            <div className="mt-3 p-3 bg-amber-50 border-r-4 border-amber-400 rounded-xl text-xs text-amber-800 font-medium">
              ⚠️ לווה נוסף: הבנק יחשב 50% בלבד מהכנסותיו לצורך חישוב כושר ההחזר (DTI).
            </div>
          )}
        </div>
      )}

      {/* מצב משפחתי - רק ללווה הראשי */}
      {isFirst && (
        <>
          <PremiumInput label="מצב משפחתי" name="maritalStatus" value={borrower.maritalStatus || 'single'} icon={User} onChange={(_, v) => update('maritalStatus', v)} options={[{ val: 'single', label: 'רווק/ה' }, { val: 'married', label: 'נשוי/אה' }, { val: 'divorced', label: 'גרוש/ה' }, { val: 'widowed', label: 'אלמן/ה' }]} tooltip="מצב משפחתי משפיע על חישוב הכנסות ועלויות" />
          <PremiumInput label="מספר ילדים מתחת לגיל 18" name="childrenUnder18" value={borrower.childrenUnder18 || '0'} icon={User} onChange={(_, v) => update('childrenUnder18', v)} placeholder="0" />
        </>
      )}

      {/* דירוג אשראי */}
      <PremiumInput label="דירוג אשראי BDI" name="creditHistory" value={borrower.creditHistory || 'clean'} icon={ShieldCheck} onChange={(_, v) => update('creditHistory', v)} options={[{ val: 'clean', label: 'תקין לחלוטין (ירוק)' }, { val: 'issues', label: 'מורכב (היו עיכובים)' }]} tooltip="דירוג האשראי משפיע על הסיכוי לאישור ועל תנאי המשכנתא" />

      {/* גיל לווה צעיר - רק ללווה ראשי עם משכנתא הפוכה */}
      {isFirst && isReverseMortgage && (
        <div className="animate-in slide-in-from-top-2 duration-300">
          <PremiumInput label="גיל הלווה הצעיר ביותר" name="youngestBorrowerAge" value={borrower.youngestBorrowerAge || ''} placeholder="גיל מינימלי (60+)" icon={Calendar} onChange={(_, v) => update('youngestBorrowerAge', v)} error={errors.youngestBorrowerAge} tooltip="לצורך חישוב אחוז המימון המקסימלי במשכנתא הפוכה" />
          <div className="p-3 bg-amber-50 border-r-4 border-amber-500 rounded-xl text-xs text-amber-800 font-medium mb-4">
            💡 גיל 60-64 = 20%, גיל 65-69 = 25%, גיל 70-74 = 30%, גיל 75-79 = 40%, גיל 80+ = 50%
          </div>
        </div>
      )}

      {/* סוגי הכנסה */}
      <div className="mb-2">
        <label className="flex items-center text-[#1e3a5f] font-semibold text-sm mb-3">
          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center ml-2">
            <Briefcase size={16} className="text-gray-500" />
          </div>
          <span>סוגי הכנסה (ניתן לסמן יותר מאחד)</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {EMPLOYMENT_OPTIONS.map(opt => {
            const checked = selectedTypes.includes(opt.val);
            return (
              <label key={opt.val} className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${checked ? 'border-[#c9a961] bg-[#c9a961]/10' : 'border-gray-200 bg-white hover:border-[#1e3a5f]/40'}`}>
                <input type="checkbox" className="w-4 h-4 rounded accent-[#1e3a5f]" checked={checked} onChange={() => toggleEmploymentType(opt.val)} />
                <span className="text-sm font-semibold text-gray-800">{opt.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* לכל סוג הכנסה מסומן: סכום + תאריך התחלה */}
      {selectedTypes.map(type => {
        const src = incomeSources[type] || {};
        return (
          <div key={type} className="p-4 bg-gray-50 rounded-xl border-2 border-[#1e3a5f]/10 space-y-3">
            <p className="font-bold text-[#1e3a5f] text-sm flex items-center gap-2">
              <Coins size={16} className="text-[#c9a961]" />
              הכנסה מ{INCOME_TYPE_LABELS[type] || type}
            </p>
            <div className="relative">
              <label className="text-xs font-semibold text-gray-600 mb-1 block">
                {type === 'pensioner' ? 'גמלה/פנסיה חודשית נטו (₪)' : 'הכנסה חודשית נטו (₪)'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  className="w-full bg-white h-12 px-4 pr-10 border-2 border-[#1e3a5f] rounded-xl outline-none focus:border-[#c9a961] transition-all text-gray-900 font-semibold"
                  placeholder="סכום חודשי"
                  value={formatAmount(src.amount)}
                  onChange={e => updateIncomeSource(type, 'amount', e.target.value)}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c9a961] font-bold text-xl">₪</span>
              </div>
            </div>

            {/* תאריך התחלה - רק אם לא פנסיונר */}
            {type !== 'pensioner' && (
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-2 block flex items-center gap-1">
                  <Calendar size={13} /> תאריך התחלת עבודה ({INCOME_TYPE_LABELS[type]})
                </label>
                <input
                  type="date"
                  min="1960-01-01"
                  max="2026-12-31"
                  className="w-full bg-white h-12 px-4 border-2 border-[#1e3a5f] rounded-xl outline-none focus:border-[#c9a961] transition-all text-gray-900 font-semibold"
                  value={src.startDate || ''}
                  onChange={e => updateIncomeSource(type, 'startDate', e.target.value)}
                />
                {src.seniority && (
                  <div className="mt-2 p-2 bg-green-50 border-2 border-green-300 rounded-xl text-center">
                    <p className="text-green-800 font-bold text-xs">ותק: {src.seniority} שנים</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* הכנסות נוספות (לא כפולות עם סוגי ההכנסה) */}
      {EXTRA_INCOME_OPTIONS.length > 0 && (
        <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200 space-y-3">
          <p className="font-bold text-[#1e3a5f] text-sm">הכנסות נוספות (לא ממקום עבודה)</p>
          {EXTRA_INCOME_OPTIONS.map(opt => {
            const src = incomeSources[opt.val] || {};
            return (
              <div key={opt.val} className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded accent-[#1e3a5f]"
                    checked={!!src.enabled}
                    onChange={e => updateIncomeSource(opt.val, 'enabled', e.target.checked)}
                  />
                  <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">{opt.label}</span>
                </label>
                {src.enabled && (
                  <input
                    type="text"
                    inputMode="numeric"
                    className="flex-1 bg-white h-10 px-3 border-2 border-[#1e3a5f] rounded-xl outline-none focus:border-[#c9a961] transition-all text-gray-900 font-semibold text-sm"
                    placeholder="סכום חודשי ₪"
                    value={src.amount || ''}
                    onChange={e => updateIncomeSource(opt.val, 'amount', e.target.value)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}