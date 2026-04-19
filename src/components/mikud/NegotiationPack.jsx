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

export default function NegotiationPack({ formData, results, selectedMix, fullName, borrowers = [] }) {
  const letterRef = useRef(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const isRefinance = formData.mortgageType === 'refinance';
  const displayLoanAmount = isRefinance ? results.balance : results.loanAmount;
  const displayLTV = isRefinance ? null : results.ltv;
  const displayDTI = isRefinance ? null : results.dti;

  const downloadLetter = () => {
    downloadFullPack();
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
        results: { ...results, aiAnalysis: results.aiAnalysis },
        fullName: displayName,
        borrowers,
      });

      // response.data היא HTML string
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE')) {
        const win = window.open('', '_blank');
        win.document.write(response.data);
        win.document.close();
        setTimeout(() => win.print(), 500);
      } else {
        alert('שגיאה בהכנת הדוח. אנא נסה שנית.');
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
          <div ref={letterRef} className="p-6 sm:p-8 text-sm text-black leading-8 space-y-4" style={{ fontFamily: 'Assistant, Arial, sans-serif' }}>
           <div className="text-left text-gray-600 text-xs font-semibold">{today}</div>

           <div className="space-y-1">
             <p className="font-bold text-black">לכבוד,</p>
             <p className="text-black">מנהל/ת תחום משכנתאות</p>
             <p className="text-black font-bold">[שם הבנק]</p>
           </div>

           <div className="py-2">
             <p className="font-bold text-black">הנדון: {isRefinance ? `בקשה למחזור משכנתא — ${displayName}` : `בקשה לאישור עקרוני למשכנתא — ${displayName}`}</p>
           </div>

           <p className="text-black font-semibold">שלום רב,</p>
           <p className="text-black">{isRefinance
             ? <>הריני לפנות אליכם בבקשה לקבל הצעה למחזור משכנתא עבור <strong>{displayName}</strong>, ביתרה של ₪{formatCurrency(results.balance)} בתנאים המפורטים להלן.</>
             : <>הריני לפנות אליכם בבקשה לקבל אישור עקרוני למשכנתא עבור <strong>{displayName}</strong>, בתנאים המפורטים להלן.</>
           }</p>

           <div className="rounded-xl p-4 space-y-2 border border-gray-300">
             <p className="font-bold text-black mb-3 text-sm">פרטי התיק</p>
              <div className="space-y-2 text-sm">
                <div className="flex gap-4"><span className="font-bold w-40">1. שם לווה</span><span className="text-black">{displayName}</span></div>
                {isRefinance ? (
                  <>
                    <div className="flex gap-4"><span className="font-bold w-40">2. יתרת משכנתא קיימת</span><span className="text-black">₪{formatCurrency(results.balance)}</span></div>
                    <div className="flex gap-4"><span className="font-bold w-40">3. החזר חודשי נוכחי</span><span className="text-black">₪{formatCurrency(results.currentMonthly)}</span></div>
                    <div className="flex gap-4"><span className="font-bold w-40">4. ריבית משוערת קיימת</span><span className="text-black">{results.impliedRate?.toFixed(2)}%</span></div>
                    <div className="flex gap-4"><span className="font-bold w-40">5. שנים שנשארו</span><span className="text-black">{results.remainingYears} שנים</span></div>
                    <div className="flex gap-4"><span className="font-bold w-40">6. חיסכון חודשי צפוי</span><span className="text-black font-semibold">₪{formatCurrency(results.monthlySaving)}</span></div>
                  </>
                ) : (
                   <>
                    {(() => {
                      const baseEquity = Number(String(formData.equity || 0).replace(/,/g, ''));
                      const completionAmount = Number(String(formData.completionAmount || 0).replace(/,/g, ''));
                      const totalEquity = baseEquity + completionAmount;
                      const completionSources = formData.completionSources || [];
                      const sourceLabels = {
                        balloon_existing: 'שעבוד נכס קיים',
                        sale_proceeds: 'תמורת מכירת נכס',
                        family_help: 'עזרה ממשפחה מדרגה ראשונה',
                        savings: 'פירוק חסכונות / קרן השתלמות',
                        securities: 'מימוש ניירות ערך',
                        provident: 'משיכת קופת גמל',
                        other: 'מקור אחר',
                      };
                      let itemNum = 2;
                      return (
                        <>
                          <div className="flex gap-4"><span className="font-bold w-40">{itemNum++}. סכום מבוקש</span><span className="text-black">₪{formatCurrency(results.loanAmount)}</span></div>
                          <div className="flex gap-4"><span className="font-bold w-40">{itemNum++}. שווי נכס</span><span className="text-black">₪{formatCurrency(Number(String(formData.propertyPrice || 0).replace(/,/g, '')))}</span></div>
                          <div className="flex gap-4"><span className="font-bold w-40">{itemNum++}. הון עצמי נזיל</span><span className="text-black">₪{formatCurrency(baseEquity)}</span></div>
                          {completionAmount > 0 && (
                            <>
                              <div className="flex gap-4"><span className="font-bold w-40">{itemNum++}. השלמת הון עצמי</span><span className="text-black">₪{formatCurrency(completionAmount)} ({completionSources.map(s => sourceLabels[s] || s).join(', ')})</span></div>
                              <div className="flex gap-4"><span className="font-bold w-40">{itemNum++}. סה"כ הון עצמי</span><span className="text-black font-semibold">₪{formatCurrency(totalEquity)}</span></div>
                            </>
                          )}
                          <div className="flex gap-4"><span className="font-bold w-40">{itemNum++}. אחוז מימון (LTV)</span><span className="text-black">{results.ltv?.toFixed(1)}% (תקרה: {formData.mortgageType === 'purchase_first' ? '75%' : formData.mortgageType === 'purchase_improve' ? '70%' : formData.mortgageType === 'purchase_additional' ? '50%' : formData.mortgageType === 'any_purpose' ? '50%' : '50%'})</span></div>
                          <div className="flex gap-4"><span className="font-bold w-40">{itemNum++}. תקופת הלוואה</span><span className="text-black">{formData.loanDuration} שנים</span></div>
                          <div className="flex gap-4"><span className="font-bold w-40">{itemNum++}. מטרת ההלוואה</span><span className="text-black">{{
                            purchase_first: 'רכישת דירה ראשונה',
                            purchase_improve: 'משפרי דיור / חליפית',
                            purchase_additional: 'נכס נוסף / דירה להשקעה',
                            any_purpose: 'כל מטרה',
                            reverse_mortgage: 'משכנתא הפוכה',
                            senior_bank: 'משכנתא לגיל הזהב',
                          }[formData.mortgageType] || formData.mortgageType}</span></div>
                        </>
                      );
                    })()}
                  </>
                )}
              </div>
            </div>

            <p className="text-black font-semibold mt-6">בקשת ריבית תחרותית</p>
            <p className="text-black">אבקש לקבל הצעת ריבית תחרותית בהתאם לפרופיל התיק ולנתוני השוק העדכניים. כל הצעה טובה תיבחן ברצינות.</p>

            <p className="text-black">אבקש לקבל הצעת ריבית עקרונית בכתב תוך <strong>5 ימי עסקים</strong>. אשמח לשלוח את מלוא מסמכי ההגשה בעקבות הצעתכם.</p>

            <div className="pt-6 border-t-2 border-gray-400 space-y-1">
              <p className="font-bold text-black">בכבוד רב,</p>
              <p className="text-black font-semibold mt-3">{displayName}</p>
              {formData.phone && <p className="text-black">טל׳: {formData.phone}</p>}
              {formData.email && <p className="text-black">דוא״ל: {formData.email}</p>}
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