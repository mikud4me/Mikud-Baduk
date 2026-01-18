import React from 'react';

const formatCurrency = (val) => {
  if (!val || isNaN(val)) return "0";
  return new Intl.NumberFormat('he-IL').format(val);
};

const parseInputToNumber = (val) => {
  if (typeof val !== 'string') return val;
  return val.replace(/[^\d]/g, "");
};

export default function PremiumInput({ 
  label, 
  icon: IconComponent, 
  name, 
  value, 
  placeholder, 
  options, 
  onChange, 
  error, 
  min, 
  max, 
  type = "text" 
}) {
  const isNumeric = ['propertyPrice', 'equity', 'netIncome', 'partnerNetIncome', 'monthlyDebts', 'loanDuration', 'additionalIncomeAmount', 'age'].includes(name);
  const displayValue = isNumeric && value !== "" && name !== 'age' && name !== 'loanDuration' 
    ? formatCurrency(value) 
    : value;

  return (
    <div className="mb-4 animate-in fade-in slide-in-from-bottom-2 duration-500 text-right w-full">
      <label className="flex items-center text-[#001a33] font-black text-sm mb-1.5 pr-1">
        {IconComponent && <IconComponent size={15} className="text-[#d4af37] ml-2" />}
        {label}
      </label>
      
      {options ? (
        <select 
          className="w-full bg-white h-10 px-3 border-2 border-slate-100 rounded-xl outline-none focus:border-[#d4af37] transition-all text-slate-900 font-bold text-sm appearance-none text-right cursor-pointer shadow-sm" 
          dir="rtl" 
          value={value} 
          onChange={(e) => onChange(name, e.target.value)}
        >
          {options.map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
        </select>
      ) : type === "range" ? (
        <div className="flex flex-col gap-2" dir="ltr">
          <input 
            type="range" 
            min={min} 
            max={max} 
            step="1" 
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#001a33]" 
            value={value} 
            onChange={(e) => onChange(name, e.target.value)} 
          />
          <div className="flex justify-between text-[11px] font-black text-slate-400" dir="rtl">
            <span className="text-[#001a33]">{max} שנים</span>
            <span className="text-slate-300">{min} שנים</span>
          </div>
          <div className="bg-[#001a33] text-white self-center px-4 py-1 rounded-full text-sm font-black shadow-lg">
            {value} שנים
          </div>
        </div>
      ) : (
        <div className="relative">
          <input 
            type={type} 
            placeholder={placeholder} 
            className={`w-full bg-white h-10 px-4 border-2 rounded-xl outline-none focus:border-[#d4af37] transition-all text-slate-900 font-bold text-base text-right shadow-sm ${error ? 'border-red-400' : 'border-slate-100'}`} 
            value={displayValue} 
            onChange={(name === 'age' || name === 'loanDuration') 
              ? (e) => onChange(name, e.target.value) 
              : (e) => onChange(name, isNumeric ? parseInputToNumber(e.target.value) : e.target.value)
            } 
          />
          {isNumeric && !['loanDuration', 'age'].includes(name) && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-base opacity-50">₪</span>
          )}
        </div>
      )}
      {error && <p className="text-red-600 text-[10px] font-black mt-1 pr-1">{error}</p>}
    </div>
  );
}