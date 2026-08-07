import React from 'react';
import { formatCurrency } from '@/components/mortgage/mortgageUtils';

export default function Amount({ value }) {
  return (
    <span className="inline-flex items-baseline whitespace-nowrap" dir="ltr">
      <span className="text-[0.5em] font-normal align-top">₪</span>
      <span>{formatCurrency(value)}</span>
    </span>
  );
}
