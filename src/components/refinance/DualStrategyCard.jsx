import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Shows one refinance strategy at a time so customers can focus on the
 * trade-off that matters to them: total savings or monthly cash flow.
 */
export default function DualStrategyCard({ dualStrategy, currentMonthlyPayment }) {
  const [selectedStrategy, setSelectedStrategy] = useState('savings');

  if (!dualStrategy) return null;

  const { strategyA, strategyB } = dualStrategy;
  const current = currentMonthlyPayment || dualStrategy.currentMonthly || 0;
  const strategy = selectedStrategy === 'savings' ? strategyA : strategyB;
  const isSavingsStrategy = selectedStrategy === 'savings';
  const formatNum = (number) => Math.round(number || 0).toLocaleString('he-IL');
  const netSavings = strategy?.netSavings || 0;
  const hasPositiveSavings = netSavings >= 0;

  const choices = [
    { id: 'savings', label: 'מקסימום חיסכון', icon: '🏆' },
    { id: 'cashflow', label: 'מקסימום חמצן', icon: '🫁' },
  ];

  return (
    <section className="mb-6 rounded-2xl border border-mist-100 bg-white p-5 shadow-xl sm:rounded-3xl sm:p-8" dir="rtl">
      <div className="mb-5 text-center">
        <div className="mb-2 inline-flex items-center rounded-full border border-[#ABC7FF] bg-[#EAF1FF] px-4 py-1.5">
          <span className="text-xs font-black uppercase tracking-[0.08em] text-[#0153F4]">בחר את הדרך שלך</span>
        </div>
        <h3 className="m-0 text-[clamp(15px,4vw,20px)] font-semibold text-[#0C084A]">2 אסטרטגיות מחזור — כל אחת לצורך אחר</h3>
        <p className="mt-1 text-[13px] text-[#8E8E8E]">
          החזר נוכחי: <strong className="text-[#0153F4]">₪{formatNum(current)}</strong> — כמה רוצים לשנות?
        </p>
      </div>

      <div className="mx-auto mb-4 flex w-full max-w-md rounded-2xl border border-[#D5E2FF] bg-[#F4F7FF] p-1" role="tablist" aria-label="בחירת אסטרטגיית מחזור">
        {choices.map((choice) => {
          const isSelected = selectedStrategy === choice.id;
          return (
            <button
              key={choice.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls="refinance-strategy-panel"
              onClick={() => setSelectedStrategy(choice.id)}
              className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-extrabold transition-all duration-200 sm:text-sm ${
                isSelected
                  ? 'bg-[#0153F4] text-white shadow-[0_4px_12px_rgba(1,83,244,0.28)]'
                  : 'text-[#0C084A] hover:bg-white hover:text-[#0153F4]'
              }`}
            >
              <span aria-hidden="true">{choice.icon}</span>
              <span>{choice.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={selectedStrategy}
          id="refinance-strategy-panel"
          role="tabpanel"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="relative overflow-hidden rounded-3xl border-2 border-[#0153F4] bg-white p-5 shadow-[0_8px_24px_rgba(1,83,244,0.15)]"
        >
          <div className="-mx-5 -mt-5 mb-4 bg-gradient-to-r from-[#0141C2] via-[#0153F4] to-[#0141C2] px-3 py-1.5 text-center text-[10px] font-black uppercase tracking-[0.15em] text-white">
            ⭐ {isSavingsStrategy ? 'חיסכון מרבי' : 'חמצן לתזרים'}
          </div>

          <div className="mb-3 flex items-center gap-2">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl border text-xl ${
              isSavingsStrategy ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'
            }`}>
              {isSavingsStrategy ? '🏆' : '🫁'}
            </div>
            <div>
              <div className={`text-[10px] font-bold uppercase tracking-[0.1em] ${isSavingsStrategy ? 'text-green-600' : 'text-[#0153F4]'}`}>
                {isSavingsStrategy ? 'מקסימום חיסכון' : 'מקסימום חמצן'}
              </div>
              <div className="text-sm font-extrabold text-[#0C084A]">{isSavingsStrategy ? 'קיצור שנים' : 'הפחתת החזר'}</div>
            </div>
          </div>

          {isSavingsStrategy && strategy?.yearsShortened > 0 && (
            <div className="mb-3 flex items-center justify-center gap-1.5 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm font-black text-green-600">
              <span aria-hidden="true">⏱️</span>
              קיצור של {strategy.yearsShortened} שנים מהתקופה
            </div>
          )}
          {!isSavingsStrategy && strategy?.monthlyRelief > 0 && (
            <div className="mb-3 flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-black text-[#0153F4]">
              <span aria-hidden="true">🪙</span>
              ₪{formatNum(strategy.monthlyRelief)} יותר בעו"ש כל חודש
            </div>
          )}

          <div className={`mb-3 rounded-xl border p-4 text-center ${
            hasPositiveSavings ? 'border-green-200 bg-gradient-to-br from-emerald-50 to-green-50' : 'border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100'
          }`}>
            <div className={`mb-1 text-[11px] font-bold ${hasPositiveSavings ? 'text-green-700' : 'text-amber-700'}`}>
              {hasPositiveSavings ? 'חיסכון נטו כולל לאורך התקופה' : 'עלות נוספת לתקופה (מחיר ה"חמצן")'}
            </div>
            <div className={`text-[clamp(26px,7vw,38px)] font-black leading-none ${hasPositiveSavings ? 'text-green-600' : 'text-amber-600'}`}>
              {hasPositiveSavings ? '' : '+'}₪{formatNum(Math.abs(netSavings))}
            </div>
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-[#F7F8FA] p-2 text-center">
              <div className="mb-0.5 text-[9px] text-[#8E8E8E]">החזר חודשי חדש</div>
              <div className="text-base font-black text-[#0C084A]">₪{formatNum(strategy?.monthlyPayment)}</div>
              {strategy?.monthlyDelta !== undefined && (
                <div className={`text-[9px] font-bold ${strategy.monthlyDelta <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {strategy.monthlyDelta <= 0
                    ? `▼ ₪${formatNum(Math.abs(strategy.monthlyDelta))} פחות`
                    : `▲ ₪${formatNum(Math.abs(strategy.monthlyDelta))} יותר`}
                </div>
              )}
            </div>
            <div className="rounded-lg bg-[#F7F8FA] p-2 text-center">
              <div className="mb-0.5 text-[9px] text-[#8E8E8E]">תקופה</div>
              <div className="text-base font-black text-[#0C084A]">{strategy?.periodYears}<span className="mr-0.5 text-[10px] text-[#8E8E8E]">שנ'</span></div>
              {!isSavingsStrategy && <div className="text-[9px] text-[#8E8E8E]">מקסימום מותר</div>}
            </div>
          </div>

          <p className="m-0 text-center text-[11px] italic text-[#8E8E8E]">{strategy?.suitedFor}</p>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
