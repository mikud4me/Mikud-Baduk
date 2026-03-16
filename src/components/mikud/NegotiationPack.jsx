import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, FileCheck, Target, TrendingUp, Download, ChevronDown, ChevronUp, Mail, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const formatCurrency = (val) => {
  if (!val || isNaN(val)) return "0";
  return new Intl.NumberFormat('he-IL').format(Math.floor(val));
};

const Section = ({ icon: Icon, title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-2 border-gray-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-5 bg-white hover:bg-gray-50 transition-colors text-right"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#1e3a5f] flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-[#c9a961]" />
          </div>
          <span className="text-base sm:text-lg font-bold text-[#1e3a5f]">{title}</span>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2 bg-white border-t border-gray-100">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function NegotiationPack({ formData, results, selectedMix, fullName, borrowers = [], aiAnalysis }) {
  const letterRef = useRef(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const isRefinance = formData.mortgageType === 'refinance';
  const displayLoanAmount = isRefinance ? results.balance : results.loanAmount;
  const displayLTV = isRefinance ? null : results.ltv;
  const displayDTI = isRefinance ? null : results.dti;

  const downloadLetter = () => {
    downloadFullPack();
    return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const today = new Date().toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
    const name = displayName || 'לקוח';
    const loanStr = formatCurrency(results.loanAmount);
    const propStr = formatCurrency(Number(String(formData.propertyPrice || 0).replace(/,/g, '')));
    const ltvStr = results.ltv?.toFixed(1) + '%';
    const dtiStr = results.dti?.toFixed(1) + '%';
    const targetRateStr = ((targetRate) * 100).toFixed(2) + '%';

    // Use built-in font - write RTL text mirrored by placing content carefully
    doc.setFont('helvetica');
    doc.setR2L(true);

    // Header bar
    doc.setFillColor(30, 58, 95);
    doc.rect(0, 0, 210, 22, 'F');
    doc.setFillColor(201, 169, 97);
    doc.rect(0, 22, 210, 2, 'F');

    doc.setTextColor(201, 169, 97);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Mikud Mortgages - Bank Application Letter', 105, 13, { align: 'center' });

    // Date
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(today, 20, 32);

    // Recipient
    doc.setTextColor(30, 58, 95);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('To: Mortgage Department Manager', 190, 42, { align: 'right' });
    doc.text('[Bank Name]', 190, 48, { align: 'right' });

    // Subject
    doc.setFillColor(248, 245, 240);
    doc.setDrawColor(201, 169, 97);
    doc.roundedRect(15, 54, 180, 10, 2, 2, 'FD');
    doc.setTextColor(30, 58, 95);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Re: Mortgage Pre-Approval Request - ${name}`, 105, 61, { align: 'center' });

    // Greeting
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.text('Dear Sir/Madam,', 190, 74, { align: 'right' });
    doc.text(`I hereby request a mortgage pre-approval for ${name}, under the terms detailed below.`, 190, 81, { align: 'right' });

    // Details box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(220, 220, 220);
    doc.roundedRect(15, 88, 180, 52, 3, 3, 'FD');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 95);
    doc.text('LOAN DETAILS', 105, 95, { align: 'center' });

    const details = [
      ['Borrower Name:', name],
      ['Requested Amount:', `NIS ${loanStr}`],
      ['Property Value:', `NIS ${propStr}`],
      ['LTV Ratio:', ltvStr],
      ['DTI Ratio:', dtiStr],
      ['Loan Period:', `${formData.loanDuration} years`],
    ];
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    details.forEach(([label, val], i) => {
      const y = 102 + i * 6;
      doc.setFont('helvetica', 'bold');
      doc.text(label, 190, y, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.text(val, 110, y, { align: 'right' });
    });

    // Target rates box
    doc.setFillColor(30, 58, 95);
    doc.roundedRect(15, 144, 180, 14, 3, 3, 'F');
    doc.setTextColor(201, 169, 97);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Target Interest Rates', 105, 151, { align: 'center' });
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Prime: P-0.5%   |   Fixed Unlinked: ${targetRateStr}`, 105, 156, { align: 'center' });

    // Strengths
    doc.setTextColor(30, 58, 95);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Portfolio Strengths:', 190, 168, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(9);
    doc.text(`  ✓ DTI of ${dtiStr} — below Bank of Israel cap (40%)`, 190, 175, { align: 'right' });
    doc.text(`  ✓ LTV of ${ltvStr} — below maximum threshold`, 190, 181, { align: 'right' });
    doc.text('  ✓ Clean credit history', 190, 187, { align: 'right' });

    // Closing
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text('I kindly request a written interest rate offer within 5 business days.', 190, 197, { align: 'right' });
    doc.text('I will be happy to submit all required documents upon receiving your offer.', 190, 203, { align: 'right' });

    // Signature
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 214, 195, 214);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 95);
    doc.setFontSize(10);
    doc.text('Sincerely,', 190, 222, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text(name, 190, 228, { align: 'right' });
    if (formData.phone) doc.text(`Tel: ${formData.phone}`, 190, 234, { align: 'right' });
    if (formData.email) doc.text(`Email: ${formData.email}`, 190, 240, { align: 'right' });

    // Footer
    doc.setFillColor(30, 58, 95);
    doc.rect(0, 280, 210, 17, 'F');
    doc.setTextColor(201, 169, 97);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('MIKUD MORTGAGES — Our Goal, Your Savings', 105, 290, { align: 'center' });
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('*2324', 105, 295, { align: 'center' });

    doc.save(`Bank_Letter_${name}.pdf`);
  };

  // כוח מיקוח = ציון מהמנוע המתקדם + בונוסים
  const powerScore = isRefinance
    ? Math.min(100, Math.max(0,
        (results.isWorthwhile ? 75 : 45) +
        (results.monthlySaving > 1000 ? 15 : results.monthlySaving > 500 ? 10 : 5) +
        (results.breakEvenMonths && results.breakEvenMonths < 18 ? 10 : results.breakEvenMonths < 30 ? 5 : 0)
      ))
    : Math.min(100, Math.max(0,
        (results.score || 70) +                                    // ציון מנוע מתקדם
        (borrowers.length > 1 ? 5 : 0) +                          // בונוס לווה נוסף
        (results.ltv < 60 ? 5 : 0) -                              // בונוס LTV נמוך
        (borrowers.some(b => b.creditHistory === 'issues') ? 15 : 0) // קנס אשראי
      ));

  const scoreColor = powerScore >= 80 ? '#22c55e' : powerScore >= 60 ? '#f59e0b' : '#ef4444';
  const scoreLabel = powerScore >= 80 ? 'חזק מאוד' : powerScore >= 60 ? 'בינוני-גבוה' : 'בינוני';

  const isReverse = formData.mortgageType === 'reverse_mortgage';
  const isSeniorBank = formData.mortgageType === 'senior_bank';

  // מיפוי כל סוגי ההכנסה מכל הלווים
  const allEmpTypes = borrowers.flatMap(b => b.employmentTypes || []);
  const hasEmployee = allEmpTypes.includes('employee');
  const hasSelfEmployed = allEmpTypes.some(t => ['self_employed', 'controlling_shareholder'].includes(t));
  const hasForeignIncome = allEmpTypes.includes('foreign_income');
  const hasPensioner = allEmpTypes.includes('pensioner');
  const hasMultipleBorrowers = borrowers.length > 1;

  // הכנסות נוספות (rent, national_insurance, disability, child_allowance)
  const extraIncomeSources = borrowers.flatMap(b => {
    const sources = b.incomeSources || {};
    return Object.entries(sources)
      .filter(([key, src]) => src?.enabled && ['rent','national_insurance','disability','child_allowance'].includes(key))
      .map(([key]) => key);
  });
  const hasRent = extraIncomeSources.includes('rent');
  const hasDisability = extraIncomeSources.includes('disability');
  const hasNationalInsurance = extraIncomeSources.includes('national_insurance');

  // האם יש לווה עם דירוג אשראי לא תקין
  const hasCreditIssues = borrowers.some(b => b.creditHistory === 'issues');

  // מסמכים מחולקים לפי קטגוריה
  const docGroups = [
    {
      title: 'מסמכי בסיס — חובה לכולם',
      color: 'border-[#1e3a5f] bg-[#1e3a5f]/5',
      headerColor: 'bg-[#1e3a5f] text-white',
      icon: '📋',
      docs: [
        'תעודת זהות + ספח מעודכן (לכל לווה)',
        'דפי עו"ש 3 חודשים אחרונים',
        'דוח נתוני אשראי BDI',
        isReverse || isSeniorBank ? 'נסח טאבו מעודכן' : 'נסח טאבו / נסח בית משותף מעודכן',
        isReverse || isSeniorBank ? 'אישור הסכמת יורשים (חתום)' : 'חוזה רכישה / הסכם מכר (אם קיים)',
        'שמאות נכס (תואם מוסד פיננסי)',
        ...(hasCreditIssues ? ['הסבר בכתב על עיכובי תשלום עבר + אסמכתאות סיום'] : []),
      ],
    },
    ...(hasEmployee ? [{
      title: 'שכיר/ה',
      color: 'border-blue-400 bg-blue-50',
      headerColor: 'bg-blue-600 text-white',
      icon: '👔',
      docs: [
        '3 תלושי שכר אחרונים',
        'אישור מעסיק על המשך העסקה',
      ],
    }] : []),
    ...(hasSelfEmployed ? [{
      title: 'עצמאי/ת / בעל שליטה',
      color: 'border-purple-400 bg-purple-50',
      headerColor: 'bg-purple-600 text-white',
      icon: '💼',
      docs: [
        'שומות מס הכנסה 2 שנים אחרונות + אישור רו"ח',
        'דפי עו"ש עסקי 3 חודשים אחרונים',
      ],
    }] : []),
    ...(hasPensioner ? [{
      title: 'פנסיונר/ית',
      color: 'border-green-400 bg-green-50',
      headerColor: 'bg-green-600 text-white',
      icon: '🏦',
      docs: [
        'אישור קצבה/גמלה חודשית מקרן פנסיה / ביטוח לאומי',
        'אישור יתרת זכויות קרן פנסיה',
      ],
    }] : []),
    ...(hasForeignIncome ? [{
      title: 'הכנסה מחו"ל',
      color: 'border-orange-400 bg-orange-50',
      headerColor: 'bg-orange-500 text-white',
      icon: '🌍',
      docs: [
        'Pay Stubs / תלושי שכר + תרגום נוטריוני',
        'אישור ניכוי מס במקור (אם רלוונטי)',
      ],
    }] : []),
    ...((hasRent || hasDisability || hasNationalInsurance) ? [{
      title: 'הכנסות נוספות',
      color: 'border-amber-400 bg-amber-50',
      headerColor: 'bg-amber-500 text-white',
      icon: '➕',
      docs: [
        ...(hasRent ? ['חוזה שכירות פעיל + קבלות תשלום', 'אישור תשלום מס על הכנסה מדמי שכירות (אם רלוונטי)'] : []),
        ...(hasDisability ? ['אישור קצבת נכות מביטוח לאומי'] : []),
        ...(hasNationalInsurance ? ['אישור קצבה מביטוח לאומי'] : []),
      ],
    }] : []),
  ];

  const targetRate = selectedMix?.tracks?.[0]?.rate || 0.05;
  const displayName = fullName || formData.fullName || '';
  const today = new Date().toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });

  const mortgageTypeLabel = {
    purchase_first: 'רכישת דירה ראשונה',
    purchase_improve: 'משפרי דיור / חליפית',
    purchase_additional: 'נכס נוסף / דירה להשקעה',
    any_purpose: 'כל מטרה',
    reverse_mortgage: 'משכנתא הפוכה',
    senior_bank: 'משכנתא לגיל הזהב',
    refinance: 'מחזור משכנתא',
  }[formData.mortgageType] || formData.mortgageType;

  const downloadFullPack = async () => {
    setPdfLoading(true);
    try {
      const response = await base44.functions.invoke('generatePdfReport', {
        formData,
        results,
        fullName: displayName,
        borrowers,
      });

      if (response.data?.fallback && response.data?.html) {
        // פתח HTML בחלון חדש לצורך הדפסה כ-PDF
        const win = window.open('', '_blank');
        win.document.write(response.data.html);
        win.document.close();
        setTimeout(() => win.print(), 800);
      } else if (response.data instanceof ArrayBuffer || response.request?.responseType === 'arraybuffer') {
        // PDF binary
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Mikud_Report_${(displayName || 'client').replace(/\s+/g, '_')}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // fallback — open HTML
        const win = window.open('', '_blank');
        win.document.write(response.data?.html || '<p>שגיאה בהכנת הדוח</p>');
        win.document.close();
        setTimeout(() => win.print(), 800);
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('אירעה שגיאה בהכנת הדוח. אנא נסה שנית.');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="space-y-4">

      {/* כותרת */}
      <div className="text-center py-6 sm:py-8 bg-gradient-to-r from-[#1e3a5f] via-[#2a4a75] to-[#1e3a5f] rounded-2xl border-4 border-[#c9a961]">
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">ערכת המשא ומתן המקצועית</h2>
        {displayName && (
          <p className="text-[#c9a961] font-bold text-sm sm:text-base">
            לקוח: {displayName} &nbsp;|&nbsp; כוח מיקוח: {powerScore}/100 ({scoreLabel})
          </p>
        )}
      </div>

      {/* מדד כוח מיקוח */}
      <Section icon={Target} title="מדד כוח המיקוח שלך" defaultOpen={true}>
        <div className="relative w-full h-7 bg-gray-200 rounded-full overflow-hidden mb-4 mt-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${powerScore}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(to right, ${scoreColor}cc, ${scoreColor})` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-black text-sm drop-shadow">{powerScore}/100</span>
          </div>
        </div>
        <div className="bg-blue-50 border-r-4 border-blue-600 p-4 rounded-xl text-sm text-gray-800 leading-relaxed">
          {isRefinance ? (
            <><strong>פרשנות:</strong> המחזור צפוי לחסוך ₪{formatCurrency(results.monthlySaving)} לחודש
            {results.isWorthwhile ? ' — כדאי מאוד למחזר!' : ' — כדאיות מוגבלת, מומלץ להתייעץ.'}{' '}
            ריבית קיימת משוערת: {results.impliedRate?.toFixed(2)}%.</>
          ) : (
            <><strong>פרשנות:</strong> יחס ההחזר שלך עומד על {results.dti?.toFixed(1) || '—'}%
            {results.dti < 35 ? ' — נמוך מהממוצע, נקודת עוצמה משמעותית.' : results.dti < 40 ? ' — בגבול הסביר.' : ' — גבוה, מומלץ לשפר לפני הגשה.'}
            {' '}אחוז המימון (LTV) עומד על {results.ltv?.toFixed(1) || '—'}%
            {results.ltv < 70 ? ', מה שמסמן השקעה עצמית גבוהה — יתרון בעיני הבנק.' : '.'}</>
          )}
        </div>
      </Section>

      {/* מכתב לבנקאי */}
      <Section icon={Mail} title="מכתב פנייה מקצועי לבנק">
        <div className="mt-3 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm" dir="rtl">
          {/* נייר מכתבים */}
          <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2a4a75] px-6 py-4 flex items-center justify-between">
            <span className="text-[#c9a961] font-bold text-sm">מכתב פנייה למשכנתא</span>
            <button
              onClick={downloadLetter}
              disabled={pdfLoading}
              className="flex items-center gap-2 bg-[#c9a961] text-[#1e3a5f] px-4 py-2 rounded-lg font-bold text-xs hover:bg-[#d4b975] transition-all disabled:opacity-60"
            >
              {pdfLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {pdfLoading ? 'מכין דוח...' : 'הורד מכתב'}
            </button>
          </div>
          <div ref={letterRef} className="p-6 sm:p-8 text-sm text-gray-800 leading-8 space-y-4" style={{ fontFamily: 'Assistant, Arial, sans-serif' }}>
            <div className="text-left text-gray-500 text-xs">{today}</div>

            <div className="space-y-0.5">
              <p className="font-bold">לכבוד,</p>
              <p>מנהל/ת תחום משכנתאות</p>
              <p className="text-[#1e3a5f] font-semibold">[שם הבנק]</p>
            </div>

            <div className="border-r-4 border-[#c9a961] pr-4 py-1">
              <p className="font-bold text-[#1e3a5f]">הנדון: {isRefinance ? `בקשה למחזור משכנתא — ${displayName}` : `בקשה לאישור עקרוני למשכנתא — ${displayName}`}</p>
            </div>

            <p>שלום רב,</p>
            <p>{isRefinance
              ? <>הריני לפנות אליכם בבקשה לקבל הצעה למחזור משכנתא עבור <strong>{displayName}</strong>, ביתרה של ₪{formatCurrency(results.balance)} בתנאים המפורטים להלן.</>
              : <>הריני לפנות אליכם בבקשה לקבל אישור עקרוני למשכנתא עבור <strong>{displayName}</strong>, בתנאים המפורטים להלן.</>
            }</p>

            <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-100">
              <p className="font-bold text-[#1e3a5f] mb-3 text-sm uppercase tracking-wide">פרטי התיק</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                <span className="text-gray-500">שם לווה</span><span className="font-semibold">{displayName}</span>
                {isRefinance ? (
                  <>
                    <span className="text-gray-500">יתרת משכנתא קיימת</span><span className="font-semibold">₪{formatCurrency(results.balance)}</span>
                    <span className="text-gray-500">החזר חודשי נוכחי</span><span className="font-semibold">₪{formatCurrency(results.currentMonthly)}</span>
                    <span className="text-gray-500">ריבית משוערת קיימת</span><span className="font-semibold">{results.impliedRate?.toFixed(2)}%</span>
                    <span className="text-gray-500">שנים שנשארו</span><span className="font-semibold">{results.remainingYears} שנים</span>
                    <span className="text-gray-500">חיסכון חודשי צפוי</span><span className="font-semibold text-green-600">₪{formatCurrency(results.monthlySaving)}</span>
                  </>
                ) : (
                  <>
                    <span className="text-gray-500">סכום מבוקש</span><span className="font-semibold">₪{formatCurrency(results.loanAmount)}</span>
                    <span className="text-gray-500">שווי נכס</span><span className="font-semibold">₪{formatCurrency(Number(String(formData.propertyPrice || 0).replace(/,/g, '')))}</span>
                    <span className="text-gray-500">אחוז מימון (LTV)</span><span className="font-semibold">{results.ltv?.toFixed(1)}% (תקרה: {formData.mortgageType === 'purchase_first' ? '75%' : ['purchase_improve','purchase_additional','any_purpose'].includes(formData.mortgageType) ? '70%' : '50%'})</span>
                    <span className="text-gray-500">יחס החזר (DTI)</span><span className="font-semibold">{results.dti?.toFixed(1)}%</span>
                    <span className="text-gray-500">תקופת הלוואה</span><span className="font-semibold">{formData.loanDuration} שנים</span>
                    <span className="text-gray-500">מטרת ההלוואה</span><span className="font-semibold">{{
                      purchase_first: 'רכישת דירה ראשונה',
                      purchase_improve: 'משפרי דיור / חליפית',
                      purchase_additional: 'נכס נוסף / דירה להשקעה',
                      any_purpose: 'כל מטרה',
                      reverse_mortgage: 'משכנתא הפוכה',
                      senior_bank: 'משכנתא לגיל הזהב',
                    }[formData.mortgageType] || formData.mortgageType}</span>
                  </>
                )}
              </div>
            </div>

            <div className="bg-[#1e3a5f]/5 rounded-xl p-4 border border-[#1e3a5f]/10">
              <p className="font-bold text-[#1e3a5f] mb-2 text-sm">בקשת ריבית תחרותית</p>
              <p className="text-sm leading-relaxed">אבקש לקבל הצעת ריבית תחרותית בהתאם לפרופיל התיק ולנתוני השוק העדכניים. כל הצעה טובה תיבחן ברצינות.</p>
            </div>

            <p>אבקש לקבל הצעת ריבית עקרונית בכתב תוך <strong>5 ימי עסקים</strong>. אשמח לשלוח את מלוא מסמכי ההגשה בעקבות הצעתכם.</p>

            <div className="pt-4 border-t border-gray-200 space-y-0.5">
              <p className="font-bold">בכבוד רב,</p>
              <p>{displayName}</p>
              {formData.phone && <p>טל׳: {formData.phone}</p>}
              {formData.email && <p>דוא״ל: {formData.email}</p>}
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3 font-medium">* מלאו את שם הבנק לפני השליחה. ניתן לשלוח לכמה בנקים במקביל.</p>
      </Section>

      {/* תסריט השיחה */}
      <Section icon={MessageSquare} title="תסריט השיחה מול הבנקאי">
        <div className="space-y-4 mt-3">

          <div className="bg-[#1e3a5f]/5 border-r-4 border-[#1e3a5f] rounded-xl p-4">
            <p className="font-bold text-[#1e3a5f] text-sm mb-2 uppercase tracking-wide">שלב 1 — פתיחה</p>
            <p className="text-gray-800 text-sm leading-relaxed italic">
              {isRefinance
                ? `"שלום, קוראים לי ${displayName || '[שם]'}. יש לי משכנתא קיימת ביתרה של ₪${formatCurrency(results.balance)} עם ${results.remainingYears} שנים שנותרו. הריבית הנוכחית שלי עומדת על ${results.impliedRate?.toFixed(2)}% ואני בוחן אפשרות למחזור לתנאים טובים יותר. אשמח לשמוע מה הבנק שלכם יכול להציע."`
                : `"שלום, קוראים לי ${displayName || '[שם]'}. אני פונה אליכם בבקשה לאישור עקרוני למשכנתא בסך ₪${formatCurrency(results.loanAmount)} על רכישת נכס בשווי ₪${formatCurrency(Number(String(formData.propertyPrice || 0).replace(/,/g, '')))}. יחס המימון עומד על ${results.ltv?.toFixed(1)}% ויחס ההחזר שלי מתחת ל-${Math.ceil((results.dti || 20) / 5) * 5}%. פניתי למספר בנקים — אשמח לשמוע את הצעתכם."`
              }
            </p>
          </div>

          <div className="bg-[#1e3a5f]/5 border-r-4 border-[#1e3a5f] rounded-xl p-4">
            <p className="font-bold text-[#1e3a5f] text-sm mb-2 uppercase tracking-wide">שלב 2 — בניית אמינות</p>
            <p className="text-gray-800 text-sm leading-relaxed italic">
              "אני פועל בליווי יועץ משכנתאות מקצועי ויש לי את כל המסמכים מוכנים להגשה מיידית.
              התיק שלי מוכן ומסודר — מה שמקצר משמעותית את זמן האישור."
            </p>
          </div>

          <div className="bg-[#1e3a5f]/5 border-r-4 border-[#c9a961] rounded-xl p-4">
            <p className="font-bold text-[#c9a961] text-sm mb-2 uppercase tracking-wide">שלב 3 — בקשת הצעה</p>
            <p className="text-gray-800 text-sm leading-relaxed italic">
              "על בסיס נתוני התיק שלי ונתוני השוק העדכניים, אבקש לקבל את הצעת הריבית הטובה ביותר שאתם יכולים להציע.
              אני מקבל מספר הצעות ואבחר את המשתלמת ביותר."
            </p>
          </div>

          <div className="bg-red-50 border-r-4 border-red-400 rounded-xl p-4">
            <p className="font-bold text-red-700 text-sm mb-2 uppercase tracking-wide">שלב 4 — טיפול בהתנגדות</p>
            <p className="text-sm text-gray-600 mb-2">אם הבנקאי אומר <span className="font-bold text-red-600">"הריבית שלנו גבוהה יותר"</span>:</p>
            <p className="text-gray-800 text-sm leading-relaxed italic">
              "אני מעריך את הכנות. אני מכיר את נתוני השוק ואת ממוצעי הריבית לתיקים בפרופיל שלי.
              אשמח אם תבדקו שוב — תיקים עם נתונים כמו שלי מקבלים בדרך כלל תנאים טובים יותר."
            </p>
          </div>

          <div className="bg-green-50 border-r-4 border-green-500 rounded-xl p-4">
            <p className="font-bold text-green-700 text-sm mb-2 uppercase tracking-wide">שלב 5 — סגירה</p>
            <p className="text-gray-800 text-sm leading-relaxed italic">
              "אשמח לקבל את הצעתכם בכתב תוך יומיים. אני נמצא בתהליך עם מספר בנקים ואקבל החלטה עד סוף השבוע."
            </p>
          </div>

        </div>
      </Section>

      {/* רשימת מסמכים */}
      <Section icon={FileCheck} title="רשימת מסמכים להגשה">
        <div className="space-y-4 mt-3">
          {docGroups.map((group, gIdx) => (
            <div key={gIdx} className={`rounded-xl border-2 overflow-hidden ${group.color}`}>
              <div className={`px-4 py-2.5 flex items-center gap-2 ${group.headerColor}`}>
                <span className="text-base">{group.icon}</span>
                <span className="font-bold text-sm">{group.title}</span>
              </div>
              <div className="p-3 space-y-1.5">
                {group.docs.map((doc, dIdx) => (
                  <div key={dIdx} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-white border-2 border-current flex items-center justify-center flex-shrink-0 mt-0.5 opacity-70">
                      <span className="text-[10px] font-bold">{dIdx + 1}</span>
                    </div>
                    <p className="text-sm text-gray-800 font-medium leading-snug">{doc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 bg-amber-50 border-r-4 border-amber-500 rounded-xl">
          <p className="text-sm text-gray-800 leading-relaxed">
            <strong>טיפ מקצועי:</strong> הכן תיק PDF מסודר עם שם קובץ ברור לכל מסמך (לדוגמה: "תלושים_ינואר2026.pdf"). תיק מסודר מקצר את זמן האישור ומשדר אמינות.
          </p>
        </div>
      </Section>

      {/* פוטנציאל חיסכון */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-500 text-center">
        <TrendingUp className="w-10 h-10 text-green-600 mx-auto mb-3" />
        <h3 className="text-xl font-black text-green-800 mb-2">פוטנציאל החיסכון שלך</h3>
        <p className="text-4xl font-black text-green-600 mb-2">₪{isRefinance ? formatCurrency(results.totalSaving) : formatCurrency(displayLoanAmount * 0.12)}</p>
        <p className="text-sm text-green-700 font-medium">
          {isRefinance
            ? `חיסכון כולל צפוי מהמחזור לאורך כל תקופת ההלוואה הנותרת (${results.remainingYears} שנים).`
            : `הפחתה של 0.5% בריבית על פני ${formData.loanDuration} שנים שווה לחיסכון זה. זה מה שמשא ומתן נכון מביא.`
          }
        </p>
      </div>

      {/* כפתור הורדת PDF */}
      <div className="text-center">
        <button
          onClick={downloadFullPack}
          disabled={pdfLoading}
          className="bg-gradient-to-r from-[#c9a961] to-[#d4b975] text-[#1e3a5f] px-8 py-4 rounded-2xl font-black text-base shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 mx-auto disabled:opacity-60 disabled:scale-100"
        >
          {pdfLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          {pdfLoading ? 'מכין את הדוח...' : 'הורד ערכת משא ומתן (PDF)'}
        </button>
        <p className="text-xs text-gray-400 mt-2">דוח PDF בעברית — מכתב לבנק, תמהילים ורשימת מסמכים</p>
      </div>
    </div>
  );
}