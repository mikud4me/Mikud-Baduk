import React from 'react';
import Amount from '@/components/mikud/Amount';

const STAT_ROWS = [
  { key: 'rate', label: 'ריבית ממוצעת', before: '5.2%', after: '4.1%' },
  { key: 'monthly', label: 'החזר חודשי', before: 7140, after: 6420 },
  { key: 'total', label: 'סך החזר כולל', before: 2142000, after: 1926000 },
];

function StatRow({ label, value, highlight, isLast }) {
  return (
    <div className={`flex items-center justify-between py-4 ${isLast ? '' : 'border-b border-mist-100'}`}>
      <span className="text-sm text-mist-700 font-semibold">{label}</span>
      <span className={`font-semibold text-base sm:text-lg ${highlight ? 'text-[#0153F4]' : 'text-[#0C084A]'}`}>
        {typeof value === 'number' ? <Amount value={value} /> : value}
      </span>
    </div>
  );
}

export default function BeforeAfterSavings() {
  return (
    <div className="w-full max-w-4xl mx-auto mt-4 mb-16" dir="rtl">
      <div className="text-center mb-10">
        <p className="text-xs font-bold tracking-[0.3em] uppercase text-[#0153F4] mb-3">לפני ואחרי</p>
        <h2 className="text-3xl sm:text-4xl font-black text-[#0C084A] leading-tight mb-4">
          ככה נראה ההבדל בין משכנתא רגילה
          <br />
          למשכנתא חכמה
        </h2>
        <p className="text-mist-500 max-w-xl mx-auto leading-relaxed">
          דוגמה להמחשה על הלוואה של <Amount value={1200000} /> ל-25 שנה. ההבדל בתמהיל הנכון —
          מצטבר לסכום שמשנה חיים.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
        <div className="rounded-3xl bg-mist-50 border border-mist-200 p-6 sm:p-8">
          <span className="inline-block bg-mist-100 text-mist-500 text-xs font-bold rounded-full px-3 py-1.5 mb-4">
            לפני · משכנתא סטנדרטית
          </span>
          <div>
            {STAT_ROWS.map((row, i) => (
              <StatRow key={row.key} label={row.label} value={row.before} isLast={i === STAT_ROWS.length - 1} />
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-white border-2 border-[#0153F4] shadow-xl shadow-brand-100/60 p-6 sm:p-8">
          <span className="inline-block bg-periwinkle-100 text-[#0153F4] text-xs font-bold rounded-full px-3 py-1.5 mb-4">
            אחרי · תמהיל חכם מותאם אישית
          </span>
          <div>
            {STAT_ROWS.map((row, i) => (
              <StatRow key={row.key} label={row.label} value={row.after} highlight isLast={i === STAT_ROWS.length - 1} />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl bg-emerald-50 border border-emerald-200 p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-emerald-200 text-center">
        <div className="pb-5 sm:pb-0">
          <p className="text-emerald-700/80 text-sm font-medium mb-1">חיסכון מצטבר לאורך המשכנתא</p>
          <p className="text-4xl font-black text-emerald-600">
            <Amount value={216000} />
          </p>
        </div>
        <div className="pt-5 sm:pt-0">
          <p className="text-emerald-700/80 text-sm font-medium mb-1">חיסכון בהחזר החודשי</p>
          <p className="text-4xl font-black text-emerald-600">
            <Amount value={720} />
          </p>
        </div>
      </div>

      <p className="text-center text-xs text-mist-400 mt-4">
        * הנתונים להמחשה בלבד. החיסכון בפועל תלוי בפרופיל הפיננסי ובתנאי השוק.
      </p>
    </div>
  );
}
