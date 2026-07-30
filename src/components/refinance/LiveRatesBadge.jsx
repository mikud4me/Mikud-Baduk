import React from 'react';
import { TrendingUp } from 'lucide-react';

/**
 * LiveRatesBadge — מציג את הריביות החיות שבהן השתמש הניתוח
 */
export default function LiveRatesBadge({ newRates }) {
  if (!newRates?.average_rates) return null;
  const r = newRates.average_rates;

  const items = [
    { label: 'פריים', value: r.prime, color: '#0153F4' },
    { label: 'קבועה לא צמודה', value: r.fixed_unlinked, color: '#0C084A' },
    { label: 'משתנה לא צמודה', value: r.variable_unlinked, color: '#16A34A' },
    { label: 'קבועה צמודה', value: r.fixed_linked, color: '#D97706' },
  ].filter(i => i.value);

  return (
    <section className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-mist-100 p-5 sm:p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-[#0153F4]" />
        <span className="text-xs font-bold text-[#0153F4] uppercase tracking-wider">
          ריביות שוק בזמן אמת — ששימשו לחישוב
        </span>
        <span className="mr-auto text-xs text-mist-500">עודכן היום</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 bg-mist-50 rounded-xl px-3 py-2 border" style={{ borderColor: `${item.color}30` }}>
            <span className="text-xs text-mist-500">{item.label}</span>
            <span className="text-base font-bold" style={{ color: item.color }}>{item.value?.toFixed(2)}%</span>
          </div>
        ))}
      </div>
    </section>
  );
}
