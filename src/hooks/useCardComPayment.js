import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Shared CardCom LowProfile lifecycle. A report is unlocked only after the
 * corresponding server function verifies the CardCom transaction.
 */
export function useCardComPayment({ leadId, leadType = 'mortgage', onPaid }) {
  const lowProfileIdRef = useRef(null);
  const onPaidRef = useRef(onPaid);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState(null);

  useEffect(() => {
    onPaidRef.current = onPaid;
  }, [onPaid]);

  const closePaymentModal = useCallback(() => {
    setPaymentUrl(null);
  }, []);

  const verifyAndUnlock = useCallback(async () => {
    const lowProfileId = lowProfileIdRef.current;
    if (!leadId || !lowProfileId) return false;

    setPaymentNotice('מאמת את התשלום…');
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const res = await base44.functions.invoke('verifyCardComPayment', {
          leadId,
          leadType,
          lowProfileId,
        });
        if (res?.data?.paid) {
          setPaymentNotice(null);
          lowProfileIdRef.current = null;
          onPaidRef.current?.();
          return true;
        }
      } catch (error) {
        console.error('verifyCardComPayment failed:', error);
      }
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    setPaymentNotice(null);
    return false;
  }, [leadId, leadType]);

  const handlePaymentModalClose = useCallback(() => {
    closePaymentModal();
    verifyAndUnlock();
  }, [closePaymentModal, verifyAndUnlock]);

  const handlePurchaseClick = useCallback(async () => {
    if (!leadId) {
      setPaymentNotice('אירעה שגיאה בזיהוי הבקשה. נסה לרענן את העמוד.');
      return;
    }

    setPaymentNotice(null);
    setPaymentLoading(true);
    try {
      const response = await base44.functions.invoke('createCardComPayment', {
        leadId,
        leadType,
        origin: window.location.origin,
      });
      const url = response?.data?.url;
      if (!url) throw new Error('missing payment url');
      lowProfileIdRef.current = response?.data?.lowProfileId || null;
      setPaymentUrl(url);
    } catch (error) {
      console.error('Failed to start payment:', error);
      setPaymentNotice('פתיחת דף התשלום נכשלה. נסה שוב מאוחר יותר.');
    } finally {
      setPaymentLoading(false);
    }
  }, [leadId, leadType]);

  useEffect(() => {
    const onMessage = async (event) => {
      if (event.origin !== window.location.origin || event.data?.type !== 'cardcom-payment') return;

      closePaymentModal();
      if (event.data.status === 'success') {
        const paid = await verifyAndUnlock();
        if (!paid) {
          setPaymentNotice('התשלום התקבל אך האימות נכשל. פנה אלינו ונפתח את הדוח מיד.');
        }
      } else {
        setPaymentNotice('התשלום לא הושלם ולא בוצע חיוב. אפשר לנסות שוב.');
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [closePaymentModal, verifyAndUnlock]);

  return {
    paymentLoading,
    paymentNotice,
    paymentUrl,
    handlePurchaseClick,
    handlePaymentModalClose,
  };
}
