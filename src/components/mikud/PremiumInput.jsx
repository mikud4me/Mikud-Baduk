import React, { useState } from 'react';
import { AlertCircle, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  type = "text",
  tooltip 
}) {
  const [isFocused, setIsFocused] = useState(false);
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
        <span className="flex-1">{label}</span>
        {tooltip && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="mr-1 hover:scale-110 transition-transform">
                  <HelpCircle size={16} className="text-gray-400 hover:text-[#c9a961]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs bg-[#1e3a5f] text-white border-[#c9a961]">
                <p className="text-sm leading-relaxed">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </label>
      
      {options ? (
        <select 
          className="w-full bg-gradient-to-br from-white to-gray-50 h-14 px-5 border-3 border-[#1e3a5f] rounded-2xl outline-none focus:border-[#c9a961] focus:ring-4 focus:ring-[#c9a961]/20 focus:shadow-xl transition-all text-gray-900 font-semibold text-base appearance-none text-right cursor-pointer hover:border-[#c9a961] shadow-lg hover:shadow-xl active:scale-[0.99]" 
          dir="rtl" 
          value={value} 
          onChange={(e) => onChange(name, e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        >
          {options.map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
        </select>
      ) : type === "range" ? (
        <div className={`flex flex-col gap-4 p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-3 shadow-lg transition-all ${isFocused ? 'border-[#c9a961] ring-4 ring-[#c9a961]/20 shadow-xl' : 'border-[#1e3a5f]'}`} dir="ltr">
          <input 
            type="range" 
            min={min} 
            max={max} 
            step="1" 
            className="w-full h-3 bg-gradient-to-r from-[#1e3a5f] via-[#c9a961] to-[#1e3a5f] rounded-full appearance-none cursor-pointer hover:scale-[1.02] transition-transform active:scale-100" 
            style={{
              background: `linear-gradient(to right, #1e3a5f 0%, #c9a961 ${((value - min) / (max - min)) * 100}%, #e5e7eb ${((value - min) / (max - min)) * 100}%, #e5e7eb 100%)`
            }}
            value={value} 
            onChange={(e) => onChange(name, e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)} 
          />
          <div className="flex justify-between text-xs font-bold text-gray-500" dir="rtl">
            <span className="text-[#1e3a5f] text-base">{max} שנים</span>
            <span>{min} שנים</span>
          </div>
          <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2a4a6f] text-white self-center px-8 py-2.5 rounded-full text-lg font-bold shadow-lg">
            {value} שנים
          </div>
        </div>
      ) : (
        <div className="relative">
          <input 
            type={type} 
            placeholder={placeholder} 
            className={`w-full bg-gradient-to-br from-white to-gray-50 h-14 px-5 border-3 rounded-2xl outline-none focus:border-[#c9a961] focus:ring-4 focus:ring-[#c9a961]/20 focus:shadow-xl transition-all text-gray-900 font-semibold text-base text-right hover:border-[#c9a961] hover:shadow-xl shadow-lg active:scale-[0.99] ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-200 animate-shake' : 'border-[#1e3a5f]'} ${isFocused ? 'scale-[1.01]' : ''}`} 
            value={displayValue} 
            onChange={(['age', 'loanDuration', 'idNumber', 'birthYear'].includes(name)) 
              ? (e) => onChange(name, e.target.value) 
              : (e) => onChange(name, isNumeric ? parseInputToNumber(e.target.value) : e.target.value)
            }
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)} 
          />
          {isNumeric && !['loanDuration', 'age', 'idNumber', 'birthYear'].includes(name) && (
            <div className="absolute left-5 top-1/2 -translate-y-1/2">
              <span className="text-[#c9a961] font-bold text-2xl">₪</span>
            </div>
          )}
        </div>
      )}
      {error && (
        <div className="mt-3 flex items-center gap-3 bg-red-50 border-3 border-red-500 px-5 py-3 rounded-2xl shadow-lg">
          <AlertCircle size={20} className="text-red-600" />
          <p className="text-red-700 text-sm font-bold">{error}</p>
        </div>
      )}
    </div>
  );
}