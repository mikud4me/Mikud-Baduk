import React, { useState } from 'react';
import { User, Briefcase, ShieldCheck, Coins, AlertTriangle, Phone, BadgeCheck } from 'lucide-react';
import PremiumInput from './PremiumInput';
import StartDateInput from './StartDateInput';
import BirthDateInput from './BirthDateInput';

// אלגוריתם לוהן לבדיקת תקינות ת.ז ישראלית
function validateIsraeliId(id) {
  const str = String(id).trim();
  if (!/^\d{9}$/.test(str)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let digit = Number(str[i]) * ((i % 2) + 1);
    if (digit > 9) digit -= 9;
    sum += digit;
  }
  return sum % 10 === 0;
}

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

const parseAmount = (val) => String(val).replace(/[^\d]/g, '');

export default function BorrowerForm({ borrower, index, onChange, errors = {}, borrowerAge, onMaritalChange }) {
  const isFirst = index === 0;
  const [showPensionerWarning, setShowPensionerWarning] = useState(false);
  const [pendingPensioner, setPendingPensioner] = useState(false);
  const [idError, setIdError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const update = (field, value) => onChange({ ...borrower, [field]: value });

  const handleIdChange = (_, value) => {
    const clean = value.replace(/\D/g, '').slice(0, 9);
    update('idNumber', clean);
    if (clean.length === 9) {
      setIdError(validateIsraeliId(clean) ? '' : 'מספר ת.ז לא תקין');
    } else {
      setIdError('');
    }
  };

  const handlePhoneChange = (_, value) => {
    const clean = value.replace(/\D/g, '').slice(0, 10);
    update('phone', clean);
    if (clean.length > 0 && clean.length < 10) {
      setPhoneError('מספר טלפון חייב להכיל 10 ספרות');
    } else if (clean.length === 10 && !/^05\d{8}$/.test(clean)) {
      setPhoneError('מספר נייד לא תקין (חייב להתחיל ב-05)');
    } else {
      setPhoneError('');
    }
  };

  const updateIncomeSource = (type, field, value) => {
    const sources = { ...(borrower.incomeSources || {}) };
    if (field === 'amount') value = parseAmount(value);
    sources[type] = { ...(sources[type] || {}), [field]: value };
    if (field === 'startDate') {
      const sen = calcSeniorityFromDate(value);
      if (sen !== null) sources[type].seniority = sen;
    }
    onChange({ ...borrower, incomeSources: sources });
  };

  const toggleEmploymentType = (val) => {
    const cur = borrower.employmentTypes || [];
    if (val === 'pensioner' && !cur.includes(val) && borrowerAge && Number(borrowerAge) <= 40) {
      setPendingPensioner(true);
      setShowPensionerWarning(true);
      return;
    }
    let next = cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val];
    if (next.length === 0) next = ['employee'];
    onChange({ ...borrower, employmentTypes: next });
  };

  const confirmPensioner = () => {
    const cur = borrower.employmentTypes || [];
    const next = [...cur, 'pensioner'];
    onChange({ ...borrower, employmentTypes: next });
    setShowPensionerWarning(false);
    setPendingPensioner(false);
  };

  const cancelPensioner = () => {
    setShowPensionerWarning(false);
    setPendingPensioner(false);
  };

  const selectedTypes = borrower.employmentTypes || ['employee'];
  const incomeSources = borrower.incomeSources || {};

  const EXTRA_INCOME_OPTIONS = [
    { val: 'rent', label: 'שכירות נכנסת' },
    { val: 'national_insurance', label: 'קצבת ביטוח לאומי' },
    { val: 'disability', label: 'קצבת נכות' },
    { val: 'child_allowance', label: 'קצבאות ילדים' },
  ].filter(opt => !selectedTypes.includes(opt.val));

  return (
    <div className="space-y-4">

      {/* אזהרת פנסיונר צעיר */}
      {showPensionerWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 border-4 border-amber-400 text-right animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={32} className="text-amber-500 flex-shrink-0" />
              <h3 className="text-lg font-black text-[#1e3a5f]">האם אתה בטוח שאתה פנסיונר?</h3>
            </div>
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 mb-5">
              <p className="text-amber-800 font-bold text-sm leading-relaxed">
                לפי תאריך הלידה, גיל הלווה הוא <span className="text-amber-900 font-black">{borrowerAge} שנים</span>.
              </p>
              <p className="text-amber-700 text-xs mt-2 leading-relaxed">
                פנסיונרים בגיל זה נדירים. ייתכן מדובר בגמלת נכות, קצבת ביטוח לאומי, או מקור הכנסה אחר.
                האם אתה בטוח שהגדרת "פנסיונר" נכונה?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={cancelPensioner}
                className="py-3 px-4 rounded-2xl border-2 border-gray-300 font-bold text-sm text-gray-600 hover:bg-gray-50 transition-all">
                לא, ביטול
              </button>
              <button onClick={confirmPensioner}
                className="py-3 px-4 rounded-2xl bg-amber-500 text-white font-black text-sm hover:bg-amber-600 transition-all">
                כן, אני פנסיונר
              </button>
            </div>
          </div>
        </div>
      )}

      {/* סוג לווה - רק מלווה 2 ומעלה */}
      {!isFirst && !borrower.isSpouse && (
        <div className="p-4 bg-[#1e3a5f]/5 rounded-xl border-2 border-[#1e3a5f]/20 mb-4">
          <p className="text-sm font-bold text-[#1e3a5f] mb-3">סוג לווה</p>
          <div className="grid grid-cols-2 gap-3">
            <label className={`flex items-start gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${borrower.borrowerType !== 'additional' ? 'border-[#c9a961] bg-[#c9a961]/10' : 'border-gray-200 bg-white hover:border-[#1e3a5f]/40'}`}>
              <input type="radio" name={`borrowerType-${index}`} checked={borrower.borrowerType !== 'additional'} onChange={() => update('borrowerType', 'primary')} className="mt-0.5 accent-[#1e3a5f]" />
              <div>
                <p className="font-bold text-sm text-gray-800">לווה עיקרי</p>
                <p className="text-xs text-gray-500">הבנק מכיר ב-100% מהכנסותיו.</p>
              </div>
            </label>
            <label className={`flex items-start gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${borrower.borrowerType === 'additional' ? 'border-[#c9a961] bg-[#c9a961]/10' : 'border-gray-200 bg-white hover:border-[#1e3a5f]/40'}`}>
              <input type="radio" name={`borrowerType-${index}`} checked={borrower.borrowerType === 'additional'} onChange={() => update('borrowerType', 'additional')} className="mt-0.5 accent-[#1e3a5f]" />
              <div>
                <p className="font-bold text-sm text-gray-800">לווה נוסף</p>
                <p className="text-xs text-gray-500">הבנק מכיר ב-50% מהכנסותיו.</p>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* הסבר בן/בת זוג */}
      {!isFirst && borrower.isSpouse && (
        <div className="p-4 bg-green-50 rounded-xl border-2 border-green-400 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">👫</span>
            <p className="text-sm font-black text-green-800">בן/בת זוג — לווה מלא</p>
          </div>
          <p className="text-xs text-green-700 leading-relaxed">
            כבן/בת זוג, <strong>הבנק מכיר ב-100% מהכנסתך</strong> — בדיוק כמו הלווה הראשי.
            זה שונה מ"לווה נוסף" (כגון קרוב משפחה) שהבנק מכיר רק ב-50% מהכנסתו.
          </p>
        </div>
      )}

      {/* שם, ת.ז וטלפון — ללווים נוספים בלבד */}
      {!isFirst && (
        <div className="space-y-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="mb-4 text-right">
              <label className="flex items-center text-[#1e3a5f] font-semibold text-sm mb-2">
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center ml-2">
                  <User size={16} className="text-gray-500" />
                </div>
                שם פרטי
              </label>
              <input
                type="text"
                placeholder="שם פרטי"
                className="w-full bg-white h-12 px-4 border-2 border-[#1e3a5f] rounded-xl outline-none focus:border-[#c9a961] transition-all text-gray-900 font-semibold text-right"
                value={borrower.firstName || ''}
                onChange={e => update('firstName', e.target.value)}
              />
            </div>
            <div className="mb-4 text-right">
              <label className="flex items-center text-[#1e3a5f] font-semibold text-sm mb-2">
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center ml-2">
                  <User size={16} className="text-gray-500" />
                </div>
                שם משפחה
              </label>
              <input
                type="text"
                placeholder="שם משפחה"
                className="w-full bg-white h-12 px-4 border-2 border-[#1e3a5f] rounded-xl outline-none focus:border-[#c9a961] transition-all text-gray-900 font-semibold text-right"
                value={borrower.lastName || ''}
                onChange={e => update('lastName', e.target.value)}
              />
            </div>
          </div>

          <div className="mb-4 text-right">
            <label className="flex items-center text-[#1e3a5f] font-semibold text-sm mb-2">
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center ml-2">
                <BadgeCheck size={16} className="text-gray-500" />
              </div>
              מספר תעודת זהות
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="9 ספרות"
              maxLength={9}
              className={`w-full bg-white h-12 px-4 border-2 rounded-xl outline-none focus:border-[#c9a961] transition-all text-gray-900 font-semibold text-right ${idError ? 'border-red-500' : 'border-[#1e3a5f]'}`}
              value={borrower.idNumber || ''}
              onChange={e => handleIdChange('idNumber', e.target.value)}
            />
            {idError && <p className="text-red-600 text-xs font-bold mt-1">{idError}</p>}
            {!idError && borrower.idNumber?.length === 9 && (
              <p className="text-green-600 text-xs font-bold mt-1">✓ ת.ז תקינה</p>
            )}
          </div>

          <div className="mb-4 text-right">
            <label className="flex items-center text-[#1e3a5f] font-semibold text-sm mb-2">
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center ml-2">
                <Phone size={16} className="text-gray-500" />
              </div>
              טלפון נייד
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="05XXXXXXXX"
              maxLength={10}
              className={`w-full bg-white h-12 px-4 border-2 rounded-xl outline-none focus:border-[#c9a961] transition-all text-gray-900 font-semibold text-right ${phoneError ? 'border-red-500' : 'border-[#1e3a5f]'}`}
              value={borrower.phone || ''}
              onChange={e => handlePhoneChange('phone', e.target.value)}
            />
            {phoneError && <p className="text-red-600 text-xs font-bold mt-1">{phoneError}</p>}
          </div>

          {/* תאריך לידה ללווה נוסף */}
          <BirthDateInput
            value={borrower.birthDate || ''}
            onChange={(val) => {
              // חשב גיל ושמור
              let age = '';
              if (val) {
                const bd = new Date(val);
                const today = new Date();
                let a = today.getFullYear() - bd.getFullYear();
                const m = today.getMonth() - bd.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) a--;
                if (a >= 18 && a <= 100) age = a.toString();
              }
              update('birthDate', val);
              if (age) update('age', age);
            }}
          />
          {borrower.age && (
            <div className="mb-3 p-2 bg-[#1e3a5f]/5 rounded-xl border border-[#1e3a5f]/15 flex items-center gap-2">
              <User size={14} className="text-[#c9a961]" />
              <p className="text-xs font-bold text-[#1e3a5f]">גיל מחושב: <span className="text-[#c9a961]">{borrower.age}</span></p>
            </div>
          )}
        </div>
      )}

      {/* מצב משפחתי + ילדים - ללווה ראשי בלבד */}
      {isFirst && (
        <>
          <PremiumInput label="מצב משפחתי" name="maritalStatus" value={borrower.maritalStatus || 'single'} icon={User} onChange={(_, v) => { update('maritalStatus', v); if (onMaritalChange) onMaritalChange(v); }}
            options={[{ val: 'single', label: 'רווק/ה' }, { val: 'married', label: 'נשוי/אה' }, { val: 'divorced', label: 'גרוש/ה' }, { val: 'widowed', label: 'אלמן/ה' }]} />
          <PremiumInput label="מספר ילדים מתחת לגיל 18" name="childrenUnder18" value={borrower.childrenUnder18 || '0'} icon={User} onChange={(_, v) => update('childrenUnder18', v)} placeholder="0" />
        </>
      )}

      {/* דירוג אשראי */}
      <PremiumInput label="דירוג אשראי BDI" name="creditHistory" value={borrower.creditHistory || 'clean'} icon={ShieldCheck} onChange={(_, v) => update('creditHistory', v)}
        options={[{ val: 'clean', label: 'תקין לחלוטין (ירוק)' }, { val: 'issues', label: 'מורכב (היו עיכובים)' }]}
        tooltip="דירוג האשראי משפיע על הסיכוי לאישור ועל תנאי המשכנתא" />

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

      {/* הכנסה לכל סוג */}
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
                <input type="text" inputMode="numeric"
                  className="w-full bg-white h-12 px-4 pr-10 border-2 border-[#1e3a5f] rounded-xl outline-none focus:border-[#c9a961] transition-all text-gray-900 font-semibold"
                  placeholder="סכום חודשי"
                  value={formatAmount(src.amount)}
                  onChange={e => updateIncomeSource(type, 'amount', e.target.value)}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c9a961] font-bold text-xl">₪</span>
              </div>
            </div>
            {type !== 'pensioner' && (
              <StartDateInput
                value={src.startDate || ''}
                onChange={(val) => updateIncomeSource(type, 'startDate', val)}
              />
            )}
            {src.seniority && type !== 'pensioner' && (
              <div className="p-2 bg-green-50 border-2 border-green-300 rounded-xl text-center">
                <p className="text-green-800 font-bold text-xs">ותק: {src.seniority} שנים</p>
              </div>
            )}
          </div>
        );
      })}

      {/* הכנסות נוספות */}
      {EXTRA_INCOME_OPTIONS.length > 0 && (
        <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200 space-y-3">
          <p className="font-bold text-[#1e3a5f] text-sm">הכנסות נוספות</p>
          {EXTRA_INCOME_OPTIONS.map(opt => {
            const src = incomeSources[opt.val] || {};
            return (
              <div key={opt.val} className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                  <input type="checkbox" className="w-4 h-4 rounded accent-[#1e3a5f]"
                    checked={!!src.enabled}
                    onChange={e => updateIncomeSource(opt.val, 'enabled', e.target.checked)}
                  />
                  <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">{opt.label}</span>
                </label>
                {src.enabled && (
                  <div className="relative flex-1">
                    <input type="text" inputMode="numeric"
                      className="w-full bg-white h-10 px-3 pr-8 border-2 border-[#1e3a5f] rounded-xl outline-none focus:border-[#c9a961] transition-all text-gray-900 font-semibold text-sm"
                      placeholder="סכום חודשי"
                      value={formatAmount(src.amount)}
                      onChange={e => updateIncomeSource(opt.val, 'amount', e.target.value)}
                    />
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#c9a961] font-bold text-base">₪</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}