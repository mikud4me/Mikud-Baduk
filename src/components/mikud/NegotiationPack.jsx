import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, FileCheck, Target, TrendingUp, Download, ChevronDown, ChevronUp, Mail } from 'lucide-react';

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

  const downloadLetter = () => {
    const content = letterRef.current?.innerText || '';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `מכתב_פנייה_לבנק_${displayName || 'לקוח'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const powerScore = Math.min(100, Math.max(0,
    (results.dti < 35 ? 40 : results.dti < 40 ? 25 : 10) +
    (formData.creditHistory === 'clean' ? 30 : 10) +
    (formData.employmentStatusA === 'employee' ? 20 : 15) +
    (results.ltv < 70 ? 10 : 5)
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
        'אישור ניהול ספרים מרשות המסים',
        'אישור תשלום מקדמות מס שוטף',
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
          <strong>פרשנות:</strong> יחס ההחזר שלך עומד על {results.dti?.toFixed(1) || '—'}%
          {results.dti < 35 ? ' — נמוך מהממוצע, נקודת עוצמה משמעותית.' : results.dti < 40 ? ' — בגבול הסביר.' : ' — גבוה, מומלץ לשפר לפני הגשה.'}
          {' '}אחוז המימון (LTV) עומד על {results.ltv?.toFixed(1) || '—'}%
          {results.ltv < 70 ? ', מה שמסמן השקעה עצמית גבוהה — יתרון בעיני הבנק.' : '.'}
        </div>
      </Section>

      {/* מכתב לבנקאי */}
      <Section icon={Mail} title="מכתב פנייה מקצועי לבנק">
        <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-5 font-mono text-sm text-gray-800 leading-relaxed whitespace-pre-wrap text-right" dir="rtl">
{`לכבוד
מנהל/ת תחום משכנתאות
[שם הבנק]

${today}

הנדון: בקשה לאישור עקרוני למשכנתא — ${displayName}

שלום רב,

הריני לפנות אליכם בשם הלקוח/ה ${displayName}, המעוניין/ת לקבל אישור עקרוני למשכנתא בתנאים המפורטים להלן.

פרטי התיק:
——————————————
שם לווה:         ${displayName}
סכום מבוקש:      ₪${formatCurrency(results.loanAmount)}
שווי נכס:        ₪${formatCurrency(Number(String(formData.propertyPrice || 0).replace(/,/g, '')))}
אחוז מימון (LTV): ${results.ltv?.toFixed(1)}%
יחס החזר (DTI):  ${results.dti?.toFixed(1)}%
הכנסה כוללת:     ₪${formatCurrency(results.monthlyIncome || 0)} לחודש
תקופת הלוואה:    ${formData.loanDuration} שנים
מטרת ההלוואה:    ${formData.mortgageType === 'purchase_first' ? 'רכישת דירה ראשונה' : formData.mortgageType === 'purchase_improve' ? 'משפרי דיור' : formData.mortgageType === 'refinance' ? 'מחזור משכנתא' : 'כל מטרה'}

ריביות יעד מבוקשות:
——————————————
פריים:            P${targetRate <= 0.05 ? '-0.5%' : '+0.1%'}
קבועה לא צמודה:  ${((targetRate) * 100).toFixed(2)}%

נקודות חוזק התיק:
——————————————
• יחס החזר (DTI) של ${results.dti?.toFixed(1)}% — מתחת לתקרת בנק ישראל (40%)
• אחוז מימון של ${results.ltv?.toFixed(1)}% — מתחת לתקרת ${formData.mortgageType === 'purchase_first' ? '75%' : '70%'}
• ${formData.creditHistory === 'clean' ? 'היסטוריית אשראי תקינה' : 'לקוח ותיק עם פירעון עקבי'}

אבקש לקבל הצעת ריבית עקרונית בכתב תוך 5 ימי עסקים.
אשמח לשלוח את מלוא מסמכי ההגשה בעקבות הצעתכם.

בכבוד רב ובהוקרה,
${displayName}
טל׳: ${formData.phone || ''}
דוא״ל: ${formData.email || ''}`}
        </div>
        <p className="text-xs text-gray-400 mt-3 font-medium">* מלאו את שם הבנק לפני השליחה. ניתן לשלוח לכמה בנקים במקביל.</p>
      </Section>

      {/* תסריט השיחה */}
      <Section icon={MessageSquare} title="תסריט השיחה מול הבנקאי">
        <div className="space-y-4 mt-3">

          <div className="bg-[#1e3a5f]/5 border-r-4 border-[#1e3a5f] rounded-xl p-4">
            <p className="font-bold text-[#1e3a5f] text-sm mb-2 uppercase tracking-wide">שלב 1 — פתיחה</p>
            <p className="text-gray-800 text-sm leading-relaxed italic">
              "שלום, קוראים לי {displayName || '[שם]'}. אני מחפש משכנתא של ₪{formatCurrency(results.loanAmount)} על נכס ב-₪{formatCurrency(Number(String(formData.propertyPrice || 0).replace(/,/g, '')))}.
              יחס המימון עומד על {results.ltv?.toFixed(1)}% ויחס ההחזר שלי מתחת ל-{Math.ceil((results.dti || 20) / 5) * 5}%.
              קיבלתי הצעות ממספר גורמים — אשמח לשמוע מה הבנק שלכם יכול להציע."
            </p>
          </div>

          <div className="bg-[#1e3a5f]/5 border-r-4 border-[#1e3a5f] rounded-xl p-4">
            <p className="font-bold text-[#1e3a5f] text-sm mb-2 uppercase tracking-wide">שלב 2 — בניית אמינות</p>
            <p className="text-gray-800 text-sm leading-relaxed italic">
              "אני עובד עם יועץ משכנתאות, ויש לי את כל המסמכים מוכנים להגשה מיידית.
              הדגש שחשוב לי: אני לא מחפש את הריבית הנמוכה ביחס כלשהו — אני מחפש שותפות ארוכת טווח עם בנק שיתמוך בי גם בשנים הבאות."
            </p>
          </div>

          <div className="bg-[#1e3a5f]/5 border-r-4 border-[#c9a961] rounded-xl p-4">
            <p className="font-bold text-[#c9a961] text-sm mb-2 uppercase tracking-wide">שלב 3 — בקשה ספציפית</p>
            <p className="text-gray-800 text-sm leading-relaxed italic">
              "על בסיס הנתונים שלי, אני מכוון לריבית פריים של P-0.5% ו-{((targetRate) * 100).toFixed(2)}% בקבועה.
              האם אתם יכולים לעמוד בזה? אם כן — אני מוכן להתחיל תהליך מחר בבוקר."
            </p>
          </div>

          <div className="bg-red-50 border-r-4 border-red-400 rounded-xl p-4">
            <p className="font-bold text-red-700 text-sm mb-2 uppercase tracking-wide">שלב 4 — טיפול בהתנגדות</p>
            <p className="text-sm text-gray-600 mb-2">אם הבנקאי אומר <span className="font-bold text-red-600">"הריבית שלנו גבוהה יותר"</span>:</p>
            <p className="text-gray-800 text-sm leading-relaxed italic">
              "אני מעריך את הכנות. לפי נתוני בנק ישראל, ריביות הפריים הממוצעות ללקוחות בדירוג שלי נמוכות ממה שהצגת.
              אם הבנק לא יכול להיות גמיש — אין בעיה, אני ממשיך עם הגורם הבא ברשימה שלי."
            </p>
          </div>

          <div className="bg-green-50 border-r-4 border-green-500 rounded-xl p-4">
            <p className="font-bold text-green-700 text-sm mb-2 uppercase tracking-wide">שלב 5 — סגירה</p>
            <p className="text-gray-800 text-sm leading-relaxed italic">
              "אשמח שתישלח לי הצעה בכתב תוך יומיים. אם היא תואמת את מה שדיברנו — נסגור עוד השבוע."
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
        <p className="text-4xl font-black text-green-600 mb-2">₪{formatCurrency(results.loanAmount * 0.12)}</p>
        <p className="text-sm text-green-700 font-medium">
          הפחתה של 0.5% בריבית על פני {formData.loanDuration} שנים שווה לחיסכון זה. זה מה שמשא ומתן נכון מביא.
        </p>
      </div>

      {/* כפתור הדפסה */}
      <div className="text-center">
        <button
          onClick={() => window.print()}
          className="bg-gradient-to-r from-[#c9a961] to-[#d4b975] text-[#1e3a5f] px-8 py-4 rounded-2xl font-black text-base shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 mx-auto"
        >
          <Download className="w-5 h-5" />
          הורד את ערכת המשא ומתן (PDF)
        </button>
        <p className="text-xs text-gray-400 mt-2">הדפסת העמוד שומרת את כל המידע בפורמט PDF</p>
      </div>
    </div>
  );
}