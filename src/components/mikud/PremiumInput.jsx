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
    <div className="mb-5 text-right w-full group">
      <label className="flex items-center text-[#1e3a5f] font-semibold text-sm mb-2 group-focus-within:text-[#c9a961] transition-colors">
        {IconComponent && (
          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center ml-2 group-focus-within:bg-[#c9a961]/10 transition-all">
            <IconComponent size={16} className="text-gray-500 group-focus-within:text-[#c9a961]" />
          </div>
        )}
        {label}
      </label>
      
      {options ? (
        <select 
          className="w-full bg-white h-12 px-4 border border-gray-300 rounded-xl outline-none focus:border-[#c9a961] focus:ring-2 focus:ring-[#c9a961]/20 transition-all text-gray-900 font-medium text-sm appearance-none text-right cursor-pointer hover:border-gray-400" 
          dir="rtl" 
          value={value} 
          onChange={(e) => onChange(name, e.target.value)}
        >
          {options.map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
        </select>
      ) : type === "range" ? (
        <div className="flex flex-col gap-3" dir="ltr">
          <input 
            type="range" 
            min={min} 
            max={max} 
            step="1" 
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#c9a961]" 
            value={value} 
            onChange={(e) => onChange(name, e.target.value)} 
          />
          <div className="flex justify-between text-xs font-medium text-gray-400" dir="rtl">
            <span className="text-[#1e3a5f]">{max} שנים</span>
            <span>{min} שנים</span>
          </div>
          <div className="bg-[#1e3a5f] text-white self-center px-5 py-1.5 rounded-full text-sm font-semibold">
            {value} שנים
          </div>
        </div>
      ) : (
        <div className="relative">
          <input 
            type={type} 
            placeholder={placeholder} 
            className={`w-full bg-white h-12 px-4 border rounded-xl outline-none focus:border-[#c9a961] focus:ring-2 focus:ring-[#c9a961]/20 transition-all text-gray-900 font-medium text-base text-right hover:border-gray-400 ${error ? 'border-red-400 focus:border-red-500' : 'border-gray-300'}`} 
            value={displayValue} 
            onChange={(['age', 'loanDuration', 'idNumber', 'birthYear'].includes(name)) 
              ? (e) => onChange(name, e.target.value) 
              : (e) => onChange(name, isNumeric ? parseInputToNumber(e.target.value) : e.target.value)
            } 
          />
          {isNumeric && !['loanDuration', 'age', 'idNumber', 'birthYear'].includes(name) && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <span className="text-[#c9a961] font-semibold text-lg">₪</span>
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