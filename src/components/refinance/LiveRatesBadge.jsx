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
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E1E4EA',
      borderRadius: '12px',
      padding: '12px 16px',
      marginBottom: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <TrendingUp style={{ width: '14px', height: '14px', color: '#0153F4' }} />
        <span style={{ fontSize: '11px', fontWeight: 800, color: '#0153F4', textTransform: 'uppercase', letterSpacing: '1px' }}>
          ריביות שוק בזמן אמת — ששימשו לחישוב
        </span>
        <span style={{ fontSize: '10px', color: '#8E8E8E', marginRight: 'auto' }}>עודכן היום</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {items.map((item, i) => (
          <div key={i} style={{
            background: '#F7F8FA',
            border: `1px solid ${item.color}30`,
            borderRadius: '8px',
            padding: '6px 12px',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <span style={{ fontSize: '11px', color: '#8E8E8E' }}>{item.label}</span>
            <span style={{ fontSize: '14px', fontWeight: 900, color: item.color }}>{item.value?.toFixed(2)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
