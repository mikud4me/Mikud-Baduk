import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

// Landing page for the CardCom payment iframe. After the borrower pays, CardCom
// redirects the iframe here; we notify the parent window (MortgageCalculator),
// which then re-fetches the lead to confirm the SERVER set isPurchased. The
// postMessage below is UX-only — it grants nothing on its own.
export default function PaymentReturn() {
  const [status, setStatus] = useState('pending');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('status') === 'success' ? 'success' : 'failed';
    setStatus(s);

    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        { type: 'cardcom-payment', status: s },
        window.location.origin
      );
    }
  }, []);

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-white p-6 font-sans text-center">
      <div className="max-w-sm">
        {status === 'pending' && (
          <Loader2 className="w-12 h-12 text-[#1e3a5f] animate-spin mx-auto" />
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-2xl font-black text-[#001a33] mb-2">התשלום התקבל!</h1>
            <p className="text-slate-600 font-medium">הדוח המלא נפתח עבורך. אפשר לחזור לעמוד.</p>
          </>
        )}
        {status === 'failed' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-black text-[#001a33] mb-2">התשלום לא הושלם</h1>
            <p className="text-slate-600 font-medium">לא בוצע חיוב. אפשר לנסות שוב.</p>
          </>
        )}
      </div>
    </div>
  );
}
