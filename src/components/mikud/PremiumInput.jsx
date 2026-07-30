import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formatCurrency = (val) => {
  if (!val || isNaN(val)) return "0";
  return new Intl.NumberFormat('he-IL').format(val);
};

const parseInputToNumber = (val) => {
  if (typeof val !== 'string') return val;
  return val.replace(/[^\d]/g, "");
};

const NON_FORMAT_FIELDS = ['age', 'loanDuration', 'idNumber', 'childrenUnder18', 'employmentSeniority', 'youngestBorrowerAge'];

export default function PremiumInput({
  label, name, value, placeholder, options, onChange, error, min, max, type = "text",
  onBlur, disabled = false, inputMode, maxLength, autoComplete,
}) {
  const isNumeric = ['propertyPrice', 'loanAmount', 'equity', 'netIncome', 'partnerNetIncome', 'monthlyDebts', 'monthlyOverdraft', 'loanDuration', 'additionalIncomeAmount', 'age', 'idNumber', 'childrenUnder18', 'employmentSeniority', 'existingPropertyValue', 'existingMortgageBalance', 'existingMortgagePayment', 'rentalIncome', 'salePrice', 'completionAmount', 'refinanceBalance', 'currentMonthlyPayment', 'refinanceIncreaseAmount', 'appraisalValue', 'rentIncomeFromPurchased'].includes(name) || name.startsWith('amount_');
  const displayValue = isNumeric && value !== "" && !NON_FORMAT_FIELDS.includes(name) ? formatCurrency(value) : value;
  const inputId = `premium-input-${name}`;

  return (
    <div className="mb-5 text-right w-full group">
      <label htmlFor={inputId} className="flex items-center text-[#0C084A] font-normal text-sm mb-2 group-focus-within:text-[#0153F4] transition-colors">
        <span className="flex-1">{label}</span>
      </label>

      {options ? (
        <Select dir="rtl" value={value} onValueChange={(v) => onChange(name, v)} disabled={disabled}>
          <SelectTrigger id={inputId} className="w-full bg-periwinkle-100 h-[2.8rem] px-5 border border-transparent rounded-lg outline-none focus:border-[#0153F4] focus:ring-4 focus:ring-[#0153F4]/20 transition-all text-mist-900 font-semibold text-base text-right cursor-pointer [&_svg]:text-[#0153F4]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border border-mist-100 rounded-lg shadow-lg" dir="rtl">
            {options.map(opt => (
              <SelectItem
                key={opt.val}
                value={opt.val}
                className="text-right text-base text-mist-900 font-medium rounded-md cursor-pointer focus:bg-periwinkle-100 focus:text-[#0C084A] data-[state=checked]:text-[#0153F4] data-[state=checked]:font-bold [&_svg]:text-[#0153F4]"
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : type === "range" ? (
        <div className="py-1" dir="ltr">
          <input
            id={inputId}
            type="range"
            min={min}
            max={max}
            step="1"
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{ background: `linear-gradient(to right, #0C084A 0%, #BABAFF 100%)` }}
            value={value}
            onChange={(e) => onChange(name, e.target.value)}
          />
          <div className="flex justify-between text-xs text-mist-600 mt-3" dir="rtl">
            <span>{max} שנים</span>
            <span className="text-[#0C084A] font-bold text-sm">{value} שנים</span>
            <span>{min} שנים</span>
          </div>
        </div>
      ) : (
        <div className="relative">
          <input
            id={inputId}
            type={type}
            placeholder={placeholder}
            disabled={disabled}
            onBlur={onBlur}
            inputMode={inputMode}
            maxLength={maxLength}
            autoComplete={autoComplete}
            className={`w-full bg-periwinkle-100 h-[2.8rem] px-5 border rounded-lg outline-none focus:border-[#0153F4] focus:ring-4 focus:ring-[#0153F4]/20 transition-all text-mist-900 font-semibold text-base text-right ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-transparent'}`}
            value={displayValue}
            onChange={(e) => onChange(name, isNumeric ? parseInputToNumber(e.target.value) : e.target.value)}
          />
          {isNumeric && !NON_FORMAT_FIELDS.includes(name) && (
            <div className="absolute left-5 top-1/2 -translate-y-1/2">
              <span className="text-[#0153F4] font-bold text-2xl">₪</span>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-center gap-3 bg-red-50 border border-red-500 px-5 py-3 rounded-2xl">
          <AlertCircle size={20} className="text-red-600" />
          <p className="text-red-700 text-sm font-bold">{error}</p>
        </div>
      )}
    </div>
  );
}
