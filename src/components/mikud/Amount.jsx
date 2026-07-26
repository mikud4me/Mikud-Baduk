import React from 'react';
import { formatCurrency } from '@/components/mortgage/mortgageUtils';

export default function Amount({ value }) {
  return (
    <>
      <span className="text-[0.5em] font-normal align-top">₪</span>
      {formatCurrency(value)}
    </>
  );
}
