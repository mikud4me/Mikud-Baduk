import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function CardComPaymentModal({ paymentUrl, onClose }) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (paymentUrl) modalRef.current?.focus();
  }, [paymentUrl]);

  if (!paymentUrl) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-modal-title"
        tabIndex={-1}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[820px] max-h-[95vh] overflow-hidden flex flex-col outline-none"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-mist-100 flex-shrink-0">
          <h3 id="payment-modal-title" className="font-black text-[#0C084A] text-sm">תשלום מאובטח — מיקוד משכנתאות</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-mist-50 transition-colors"
            aria-label="סגור"
          >
            <X size={20} className="text-mist-500" />
          </button>
        </div>
        <iframe
          src={paymentUrl}
          title="CardCom תשלום"
          className="w-full flex-1 border-0"
          allow="payment"
        />
      </div>
    </div>
  );
}
