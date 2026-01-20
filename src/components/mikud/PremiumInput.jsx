import React from 'react';
import { AlertCircle } from 'lucide-react';

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
  const isNumeric = ['propertyPrice', 'equity', 'netIncome', 'partnerNetIncome', 'monthlyDebts', 'loanDuration', 'additionalIncomeAmount', 'age', 'idNumber', 'birthYear'].includes(name);
  const displayValue = isNumeric && value !== "" && !['age', 'loanDuration', 'idNumber', 'birthYear'].includes(name)
    ? formatCurrency(value) 
    : value;

  return (
    <div className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500 text-right w-full group">
      <label className="flex items-center text-[#001a33] font-black text-base mb-2 pr-1 group-focus-within:text-[#d4af37] transition-colors">
        {IconComponent && (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-[#f4d03f]/20 flex items-center justify-center ml-3 group-focus-within:scale-110 transition-transform">
            <IconComponent size={18} className="text-[#d4af37]" />
          </div>
        )}
        {label}
      </label>
      
      {options ? (
        <select 
          className="w-full bg-gradient-to-br from-white to-slate-50 h-14 px-5 border-2 border-slate-200 rounded-2xl outline-none focus:border-[#d4af37] focus:shadow-lg focus:shadow-[#d4af37]/20 transition-all text-slate-900 font-bold text-base appearance-none text-right cursor-pointer shadow-md hover:border-[#d4af37]/50" 
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
            className={`w-full bg-gradient-to-br from-white to-slate-50 h-14 px-5 border-2 rounded-2xl outline-none focus:border-[#d4af37] focus:shadow-lg focus:shadow-[#d4af37]/20 transition-all text-slate-900 font-bold text-lg text-right shadow-md hover:border-[#d4af37]/50 ${error ? 'border-red-400 focus:border-red-500' : 'border-slate-200'}`} 
            value={displayValue} 
            onChange={(['age', 'loanDuration', 'idNumber', 'birthYear'].includes(name)) 
              ? (e) => onChange(name, e.target.value) 
              : (e) => onChange(name, isNumeric ? parseInputToNumber(e.target.value) : e.target.value)
            } 
          />
          {isNumeric && !['loanDuration', 'age', 'idNumber', 'birthYear'].includes(name) && (
            <div className="absolute left-5 top-1/2 -translate-y-1/2">
              <span className="text-[#d4af37] font-black text-xl">₪</span>
            </div>
          )}
        </div>
      )}
      {error && (
        <div className="mt-2 flex items-center gap-2 bg-red-50 border-r-4 border-red-500 px-4 py-2 rounded-lg">
          <AlertCircle size={16} className="text-red-600" />
          <p className="text-red-600 text-sm font-bold">{error}</p>
        </div>
      )}
    </div>
  );
}