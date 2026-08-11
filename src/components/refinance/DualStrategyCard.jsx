import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PiggyBank, Wind } from 'lucide-react';

export default function DualStrategyCard({ dualStrategy, selectedStrategy, onStrategyChange }) {
  if (!dualStrategy) return null;

  const { strategyA, strategyB } = dualStrategy;
  const isSavingsStrategy = selectedStrategy === 'savings';
  const strategy = isSavingsStrategy ? strategyA : strategyB;
  const formatNum = (number) => Math.round(Math.abs(number || 0)).toLocaleString('he-IL');
  const netSavings = Number(strategy?.netSavings || 0);
  const monthlyRelief = Number(strategy?.monthlyRelief || 0);
  const primaryValue = isSavingsStrategy ? netSavings : monthlyRelief;
  const primaryLabel = isSavingsStrategy ? 'חיסכון נטו לאורך התקופה' : 'תוספת חודשית לתזרים';
  const primaryPrefix = primaryValue < 0 ? '-' : '';
  const totalPayments = Number(strategy?.monthlyPayment || 0) * Number(strategy?.periodYears || 0) * 12;

  const options = [
    { id: 'savings', label: 'מקסימום חיסכון', icon: PiggyBank },
    { id: 'cashflow', label: 'מקסימום חמצן', icon: Wind },
  ];

  return (
    <section className="mb-6 rounded-2xl border border-mist-100 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-8" dir="rtl">
      <div className="mb-5 text-center">
        <h3 className="m-0 text-[clamp(16px,4vw,20px)] font-semibold text-[#0C084A]">בחרו את מטרת המחזור</h3>
      </div>

      <div
        className="mx-auto mb-4 flex w-full max-w-sm rounded-xl border border-mist-200 bg-mist-50 p-1"
        role="tablist"
        aria-label="בחירת אסטרטגיית מחזור"
      >
        {options.map((option) => {
          const isSelected = selectedStrategy === option.id;
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls="refinance-strategy-panel"
              onClick={() => onStrategyChange(option.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors duration-150 sm:text-sm ${
                isSelected
                  ? 'bg-white text-[#0C084A] shadow-sm'
                  : 'text-mist-500 hover:text-[#0C084A]'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {option.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={selectedStrategy}
          id="refinance-strategy-panel"
          role="tabpanel"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.16 }}
          className="overflow-hidden rounded-2xl border border-mist-200 bg-white"
        >
          <div className="px-5 py-7 text-center sm:px-8 sm:py-8">
            <p className="mb-2 text-xs font-medium text-mist-500">{primaryLabel}</p>
            <p
              className={`m-0 text-[clamp(32px,8vw,44px)] font-black leading-none ${
                primaryValue < 0 ? 'text-red-600' : 'text-green-600'
              }`}
              dir="ltr"
            >
              {primaryPrefix}₪{formatNum(primaryValue)}
            </p>
          </div>

          <div className="grid grid-cols-3 border-t border-mist-100">
            <div className="px-4 py-4 text-center sm:px-6">
              <p className="mb-1 text-[11px] text-mist-500">החזר חודשי חדש</p>
              <p className="m-0 text-base font-bold text-[#0C084A] sm:text-lg" dir="ltr">₪{formatNum(strategy?.monthlyPayment)}</p>
            </div>
            <div className="border-r border-mist-100 px-4 py-4 text-center sm:px-6">
              <p className="mb-1 text-[11px] text-mist-500">תקופה</p>
              <p className="m-0 text-base font-bold text-[#0C084A] sm:text-lg">{strategy?.periodYears || 0} שנים</p>
            </div>
            <div className="border-r border-mist-100 px-3 py-4 text-center sm:px-6">
              <p className="mb-1 text-[11px] text-mist-500">סך החזר כולל</p>
              <p className="m-0 text-base font-bold text-[#0C084A] sm:text-lg" dir="ltr">₪{formatNum(totalPayments)}</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
