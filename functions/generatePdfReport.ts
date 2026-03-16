import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const formatCurrency = (val) => {
  if (!val || isNaN(val)) return "0";
  return new Intl.NumberFormat('he-IL').format(Math.floor(val));
};

const buildDocsList = (borrowers = [], formData = {}) => {
  const allTypes = borrowers.flatMap(b => b.employmentTypes || []);
  const hasEmployee = allTypes.includes('employee');
  const hasSelfEmployed = allTypes.some(t => ['self_employed', 'controlling_shareholder'].includes(t));
  const hasForeignIncome = allTypes.includes('foreign_income');
  const hasPensioner = allTypes.includes('pensioner');
  const isRefinance = formData.mortgageType === 'refinance';
  const isReverse = formData.mortgageType === 'reverse_mortgage';
  const isSenior = formData.mortgageType === 'senior_bank';

  const extraIncomeSources = borrowers.flatMap(b => {
    const sources = b.incomeSources || {};
    return Object.entries(sources)
      .filter(([key, src]) => src?.enabled && ['rent','national_insurance','disability','child_allowance'].includes(key))
      .map(([key]) => key);
  });
  const hasRent = extraIncomeSources.includes('rent');
  const hasDisability = extraIncomeSources.includes('disability');
  const hasNationalInsurance = extraIncomeSources.includes('national_insurance');

  if (isReverse || isSenior) {
    return [
      { title: 'מסמכים בסיסיים — חובה', color: '#1e3a5f', docs: [
        'תעודת זהות + ספח מעודכן (לכל לווה)',
        'דפי עו"ש 3 חודשים אחרונים',
        'נסח טאבו מעודכן',
        'שמאות נכס (תואם מוסד פיננסי)',
        'אישור קצבה/פנסיה חודשית',
        'אישור הסכמת יורשים/ילדים (חתום)',
        'דוח נתוני אשראי BDI',
      ]}
    ];
  }

  if (isRefinance) {
    return [
      { title: 'מסמכים למחזור משכנתא', color: '#1e3a5f', docs: [
        'תעודת זהות + ספח מעודכן (לכל לווה)',
        'יתרת סילוק משכנתא מהבנק (מסמך רשמי)',
        '3 תלושי שכר אחרונים (לכל לווה שכיר)',
        'דפי בנק 3 חודשים אחרונים',
        'נסח טאבו מעודכן',
        'אישור BDI / דוח נתוני אשראי',
      ]}
    ];
  }

  const groups = [
    { title: 'מסמכי בסיס — חובה לכולם', color: '#1e3a5f', docs: [
      'תעודת זהות + ספח מעודכן (לכל לווה)',
      'דפי עו"ש 3 חודשים אחרונים',
      'דוח נתוני אשראי BDI',
      'נסח טאבו / נסח בית משותף מעודכן',
      'חוזה רכישה / הסכם מכר',
      'שמאות נכס (תואם מוסד פיננסי)',
    ]},
  ];

  if (hasEmployee) groups.push({ title: 'שכיר/ה', color: '#1d4ed8', docs: [
    '3 תלושי שכר אחרונים',
    'אישור מעסיק על המשך העסקה',
  ]});

  if (hasSelfEmployed) groups.push({ title: 'עצמאי/ת / בעל שליטה', color: '#7c3aed', docs: [
    'שומות מס הכנסה 2 שנים אחרונות + אישור רו"ח',
    'דפי עו"ש עסקי 3 חודשים אחרונים',
  ]});

  if (hasPensioner) groups.push({ title: 'פנסיונר/ית', color: '#16a34a', docs: [
    'אישור קצבה/גמלה חודשית מקרן פנסיה / ביטוח לאומי',
    'אישור יתרת זכויות קרן פנסיה',
  ]});

  if (hasForeignIncome) groups.push({ title: 'הכנסה מחו"ל', color: '#ea580c', docs: [
    'Pay Stubs / תלושי שכר + תרגום נוטריוני',
    'אישור ניכוי מס במקור (אם רלוונטי)',
  ]});

  const extraDocs = [];
  if (hasRent) extraDocs.push('חוזה שכירות פעיל + קבלות תשלום', 'אישור תשלום מס על הכנסה מדמי שכירות');
  if (hasDisability) extraDocs.push('אישור קצבת נכות מביטוח לאומי');
  if (hasNationalInsurance) extraDocs.push('אישור קצבה מביטוח לאומי');
  if (extraDocs.length > 0) groups.push({ title: 'הכנסות נוספות', color: '#b45309', docs: extraDocs });

  return groups;
};

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { formData, results, fullName, borrowers = [], aiAnalysis } = body;

    const isRefinance = formData?.mortgageType === 'refinance';
    const today = new Date().toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });

    const loanStr = formatCurrency(isRefinance ? results.balance : results.loanAmount);
    const propStr = formatCurrency(Number(String(formData.propertyPrice || 0).replace(/,/g, '')));

    const mortgageTypeLabel = {
      purchase_first: 'רכישת דירה ראשונה',
      purchase_improve: 'משפרי דיור / חליפית',
      purchase_additional: 'נכס נוסף / דירה להשקעה',
      any_purpose: 'כל מטרה',
      reverse_mortgage: 'משכנתא הפוכה',
      senior_bank: 'משכנתא לגיל הזהב',
      refinance: 'מחזור משכנתא',
    }[formData.mortgageType] || formData.mortgageType;

    // ─── תמהילים (ללא ריביות ספציפיות במכתב) ───────────────────
    const mixes = [
      { label: isRefinance ? (results.mixB?.label || 'תמהיל מאוזן — מומלץ') : 'תמהיל אסטרטגי — מותאם אישית', tracks: results.mixB?.tracks || [], total: results.mixB?.total, highlight: true, badge: '★ מומלץ' },
      { label: isRefinance ? (results.mixA?.label || 'תמהיל שמרני') : 'תמהיל שמרני — קבועה', tracks: results.mixA?.tracks || [], total: results.mixA?.total, highlight: false },
      { label: isRefinance ? (results.mixC?.label || 'תמהיל פריים') : 'תמהיל פריים — גמיש', tracks: results.mixC?.tracks || [], total: results.mixC?.total, highlight: false },
    ];

    const mixRows = mixes.filter(m => m.tracks.length > 0).map(mix => `
      <div class="mix-card ${mix.highlight ? 'mix-recommended' : ''}">
        <div class="mix-title">
          ${mix.badge ? `<span class="mix-badge">${mix.badge}</span>` : ''}
          ${mix.label}
        </div>
        <table class="mix-table">
          <thead>
            <tr>
              <th>מסלול</th>
              <th>סכום</th>
              <th>ריבית</th>
              <th>החזר חודשי</th>
            </tr>
          </thead>
          <tbody>
            ${mix.tracks.map(t => `
              <tr>
                <td>${t.name}</td>
                <td>₪${formatCurrency(t.amount)}</td>
                <td>${(t.rate * 100).toFixed(2)}%</td>
                <td>₪${formatCurrency(Math.floor(t.pmt))}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="mix-total">סה"כ החזר חודשי: <strong>₪${formatCurrency(Math.floor(mix.total))}</strong></div>
      </div>
    `).join('');

    // ─── פרטי תיק ───────────────────────────────────────────────
    const detailsRows = isRefinance ? `
      <tr><td class="label">לווה</td><td>${fullName}</td></tr>
      <tr><td class="label">יתרת משכנתא קיימת</td><td>₪${loanStr}</td></tr>
      <tr><td class="label">החזר חודשי נוכחי</td><td>₪${formatCurrency(results.currentMonthly)}</td></tr>
      <tr><td class="label">ריבית משוערת קיימת</td><td>${results.impliedRate?.toFixed(2)}%</td></tr>
      <tr><td class="label">שנים שנשארו</td><td>${results.remainingYears} שנים</td></tr>
      <tr><td class="label">חיסכון חודשי צפוי</td><td class="savings">₪${formatCurrency(results.monthlySaving)}</td></tr>
    ` : `
      <tr><td class="label">לווה</td><td>${fullName}</td></tr>
      <tr><td class="label">סכום מבוקש</td><td>₪${loanStr}</td></tr>
      <tr><td class="label">שווי נכס</td><td>₪${propStr}</td></tr>
      <tr><td class="label">אחוז מימון (LTV)</td><td>${results.ltv?.toFixed(1)}%</td></tr>
      <tr><td class="label">יחס החזר (DTI)</td><td>${results.dti?.toFixed(1)}%</td></tr>
      <tr><td class="label">תקופת הלוואה</td><td>${formData.loanDuration} שנים</td></tr>
      <tr><td class="label">מטרת ההלוואה</td><td>${mortgageTypeLabel}</td></tr>
    `;

    // ─── רשימת מסמכים ───────────────────────────────────────────
    const docGroups = buildDocsList(borrowers, formData);
    const docsHtml = docGroups.map(group => `
      <div class="doc-group no-break">
        <div class="doc-group-title" style="background:${group.color}">${group.title}</div>
        <ul class="doc-list">
          ${group.docs.map((d, i) => `<li><span class="doc-num">${i+1}</span>${d}</li>`).join('')}
        </ul>
      </div>
    `).join('');

    // ─── ניתוח מקצועי ───────────────────────────────────────────
    const analysisHtml = aiAnalysis
      ? aiAnalysis.split('\n').filter(l => l.trim()).map(line => {
          // כותרת שורה (מתחילה במספר ונקודה)
          if (/^\d+\./.test(line.trim())) {
            return `<p class="analysis-heading">${line.trim()}</p>`;
          }
          return `<p class="analysis-line">${line.trim()}</p>`;
        }).join('')
      : `<p class="analysis-line">הניתוח המקצועי המלא מוצג בממשק הדיגיטלי. פנה ליועץ מיקוד לקבלת ניתוח מפורט נוסף.</p>`;

    const html = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;600;700;900&display=swap');
  
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  body {
    font-family: 'Heebo', Arial, sans-serif;
    direction: rtl;
    color: #1a1a2e;
    background: #fff;
    font-size: 13px;
    line-height: 1.6;
  }

  .page { page-break-after: always; padding: 0; }
  .page:last-child { page-break-after: avoid; }
  .no-break { page-break-inside: avoid; }

  .header {
    background: #1e3a5f;
    color: white;
    padding: 14px 30px 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .header-brand { color: #c9a961; font-size: 17px; font-weight: 900; }
  .header-subtitle { color: rgba(255,255,255,0.65); font-size: 9px; margin-top: 2px; }
  .header-page-title { color: rgba(255,255,255,0.85); font-size: 11px; font-weight: 600; }
  .gold-bar { height: 3px; background: linear-gradient(to left, #1e3a5f, #c9a961, #1e3a5f); }

  .footer {
    background: #1e3a5f;
    color: #c9a961;
    text-align: center;
    padding: 8px;
    font-size: 9px;
    font-weight: 700;
    margin-top: 16px;
  }

  .page-content { padding: 22px 32px; }

  /* ── עמוד 1: מכתב ── */
  .date-line { color: #888; font-size: 10px; margin-bottom: 14px; }
  .recipient { margin-bottom: 14px; }
  .recipient p { font-size: 12px; }
  .recipient strong { color: #1e3a5f; font-size: 13px; }
  .subject-box { background: #f8f5f0; border: 1.5px solid #c9a961; border-radius: 6px; padding: 9px 16px; margin-bottom: 16px; text-align: center; }
  .subject-box strong { color: #1e3a5f; font-size: 13px; }
  .body-text { margin-bottom: 14px; font-size: 12px; color: #333; line-height: 1.7; }
  .details-box { background: #f8fafc; border: 1px solid #ddd; border-radius: 6px; padding: 14px 18px; margin-bottom: 14px; }
  .details-box h4 { color: #1e3a5f; font-size: 10px; font-weight: 700; text-align: center; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #eee; }
  .details-box table { width: 100%; border-collapse: collapse; }
  .details-box td { padding: 4px 8px; font-size: 12px; }
  .details-box td.label { color: #666; font-weight: 600; width: 45%; }
  .details-box .savings { color: #16a34a; font-weight: 700; }

  /* תיבת בקשה גנרית ללא ריביות */
  .request-box { background: #1e3a5f; border-radius: 6px; padding: 11px 18px; margin-bottom: 14px; color: white; text-align: center; }
  .request-box .r-title { color: #c9a961; font-size: 12px; font-weight: 700; margin-bottom: 4px; }
  .request-box .r-text { font-size: 11px; color: rgba(255,255,255,0.85); line-height: 1.6; }

  .strengths { margin-bottom: 14px; }
  .strengths h4 { color: #1e3a5f; font-size: 12px; font-weight: 700; margin-bottom: 7px; }
  .strengths ul { list-style: none; padding: 0; }
  .strengths li { font-size: 11px; color: #333; padding: 2px 0; }
  .strengths li::before { content: "✓ "; color: #16a34a; font-weight: 700; }
  .closing { font-size: 11px; color: #333; margin-bottom: 14px; line-height: 1.7; }
  .divider { border: none; border-top: 1px solid #ddd; margin: 14px 0; }
  .signature { font-size: 11px; color: #333; }
  .signature strong { color: #1e3a5f; }

  /* ── עמוד 2: תמהילים ── */
  .page-title { text-align: center; color: #1e3a5f; font-size: 19px; font-weight: 900; margin-bottom: 4px; }
  .page-sub { text-align: center; color: #888; font-size: 11px; margin-bottom: 18px; }

  .mix-card { border: 1.5px solid #ddd; border-radius: 8px; margin-bottom: 12px; overflow: hidden; }
  .mix-card.mix-recommended { border-color: #c9a961; box-shadow: 0 2px 10px rgba(201,169,97,0.25); }
  .mix-title { background: #f0f4f8; color: #1e3a5f; font-weight: 700; font-size: 12px; padding: 8px 14px; border-bottom: 1px solid #ddd; display: flex; align-items: center; gap: 8px; }
  .mix-recommended .mix-title { background: #1e3a5f; color: #c9a961; }
  .mix-badge { background: #c9a961; color: #1e3a5f; font-size: 9px; font-weight: 900; padding: 2px 8px; border-radius: 10px; }
  .mix-recommended .mix-badge { background: white; }
  .mix-table { width: 100%; border-collapse: collapse; }
  .mix-table th { background: #f8fafc; color: #1e3a5f; font-size: 10px; font-weight: 700; padding: 5px 12px; text-align: right; border-bottom: 1px solid #eee; }
  .mix-recommended .mix-table th { background: #162d4a; color: #c9a961; }
  .mix-table td { padding: 5px 12px; font-size: 11px; border-bottom: 1px solid #f0f0f0; }
  .mix-table tr:last-child td { border-bottom: none; }
  .mix-total { text-align: left; padding: 6px 14px; font-size: 11px; color: #1e3a5f; background: #fafafa; border-top: 1px solid #eee; }
  .mix-recommended .mix-total { background: #162d4a; color: #c9a961; }

  .score-box { background: #f8f5f0; border: 1.5px solid #c9a961; border-radius: 6px; padding: 10px 18px; text-align: center; font-size: 12px; color: #1e3a5f; font-weight: 700; margin-top: 8px; }

  /* ── עמוד 3: ניתוח מקצועי ── */
  .analysis-heading { font-size: 12px; font-weight: 900; color: #1e3a5f; margin-top: 12px; margin-bottom: 4px; border-right: 3px solid #c9a961; padding-right: 8px; }
  .analysis-line { font-size: 11.5px; color: #333; margin-bottom: 4px; line-height: 1.7; }

  /* ── עמוד 4: תסריט שיחה ── */
  .script-step { border-radius: 8px; padding: 12px 16px; margin-bottom: 10px; }
  .script-step-title { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; }
  .script-step-text { font-size: 11.5px; line-height: 1.7; font-style: italic; color: #333; }
  .step-open { background: #eff6ff; border-right: 4px solid #1e3a5f; }
  .step-credibility { background: #f0fdf4; border-right: 4px solid #16a34a; }
  .step-ask { background: #fefce8; border-right: 4px solid #c9a961; }
  .step-objection { background: #fef2f2; border-right: 4px solid #dc2626; }
  .step-close { background: #f0fdf4; border-right: 4px solid #16a34a; }

  /* ── עמוד 5: מסמכים ── */
  .doc-group { margin-bottom: 14px; border-radius: 8px; overflow: hidden; border: 1px solid #e0e0e0; }
  .doc-group-title { color: white; font-size: 11px; font-weight: 700; padding: 7px 14px; }
  .doc-list { list-style: none; padding: 10px 14px; background: #fafafa; }
  .doc-list li { display: flex; align-items: flex-start; gap: 8px; font-size: 11px; color: #333; padding: 3px 0; border-bottom: 1px solid #f0f0f0; }
  .doc-list li:last-child { border-bottom: none; }
  .doc-num { background: #1e3a5f; color: #c9a961; font-size: 9px; font-weight: 700; min-width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }

  /* ── עמוד 6: תודה ── */
  .page-last { background: #1e3a5f; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 50px 40px; text-align: center; color: white; }
  .page-last .brand { color: #c9a961; font-size: 22px; font-weight: 900; margin-bottom: 4px; }
  .page-last .tagline { color: rgba(255,255,255,0.6); font-size: 11px; margin-bottom: 24px; }
  .gold-line { width: 80px; height: 2px; background: #c9a961; margin: 16px auto; }
  .page-last .thank-you { color: #c9a961; font-size: 30px; font-weight: 900; margin-bottom: 12px; }
  .page-last .desc { font-size: 12.5px; color: rgba(255,255,255,0.85); margin-bottom: 24px; line-height: 1.8; }
  .summary-grid { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin-bottom: 30px; }
  .summary-item { background: rgba(255,255,255,0.08); border: 1px solid rgba(201,169,97,0.3); border-radius: 8px; padding: 12px 20px; min-width: 120px; }
  .summary-item .s-label { color: rgba(255,255,255,0.55); font-size: 9px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .summary-item .s-val { color: white; font-size: 14px; font-weight: 700; }
  .cta-section { margin-top: 8px; }
  .cta-section p { color: #c9a961; font-size: 13px; font-weight: 700; margin-bottom: 8px; }
  .phone-big { color: #c9a961; font-size: 48px; font-weight: 900; letter-spacing: 3px; }
  .small-note { color: rgba(255,255,255,0.4); font-size: 9px; margin-top: 16px; }

  @media print {
    @page { margin: 0; size: A4; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { page-break-after: always; }
    .page:last-child { page-break-after: avoid; }
    .no-break { page-break-inside: avoid; }
  }
</style>
</head>
<body>

<!-- ═══════════════════════════════════════ -->
<!-- עמוד 1 — מכתב לבנק (ללא ריביות ספציפיות) -->
<!-- ═══════════════════════════════════════ -->
<div class="page">
  <div class="header">
    <div>
      <div class="header-brand">מיקוד משכנתאות</div>
      <div class="header-subtitle">המטרה שלנו, החיסכון שלכם</div>
    </div>
    <div class="header-page-title">מכתב פנייה לבנק</div>
  </div>
  <div class="gold-bar"></div>

  <div class="page-content">
    <p class="date-line">${today}</p>

    <div class="recipient no-break">
      <p>לכבוד,</p>
      <p>מנהל/ת תחום משכנתאות</p>
      <strong>[שם הבנק]</strong>
    </div>

    <div class="subject-box no-break">
      <strong>הנדון: ${isRefinance ? `בקשה למחזור משכנתא — ${fullName}` : `בקשה לאישור עקרוני למשכנתא — ${fullName}`}</strong>
    </div>

    <p class="body-text">שלום רב,<br>
    ${isRefinance
      ? `הריני לפנות אליכם בבקשה לקבל הצעה למחזור משכנתא עבור <strong>${fullName}</strong>, ביתרה של ₪${loanStr} בתנאים המפורטים להלן.`
      : `הריני לפנות אליכם בבקשה לקבל אישור עקרוני למשכנתא עבור <strong>${fullName}</strong>, בתנאים המפורטים להלן.`
    }</p>

    <div class="details-box no-break">
      <h4>פרטי התיק</h4>
      <table><tbody>${detailsRows}</tbody></table>
    </div>

    <div class="request-box no-break">
      <div class="r-title">בקשת הצעת ריבית</div>
      <div class="r-text">אבקש לקבל את הצעת הריבית התחרותית ביותר שהבנק יכול להציע לתיק זה, בהתאם לנתוני הפרופיל ולמדיניות המוסד הפיננסי.</div>
    </div>

    <div class="strengths no-break">
      <h4>נקודות חוזק התיק:</h4>
      <ul>
        ${isRefinance ? `
          <li>חיסכון חודשי צפוי של ₪${formatCurrency(results.monthlySaving)} לאורך כל התקופה</li>
          <li>יתרת משכנתא ₪${formatCurrency(results.balance)} עם ${results.remainingYears} שנים שנותרו</li>
          <li>היסטוריית אשראי תקינה</li>
          <li>לקוח קיים עם מוניטין פירעון תקין</li>
        ` : `
          <li>יחס החזר (DTI) של ${results.dti?.toFixed(1)}% — מתחת לתקרת בנק ישראל (40%)</li>
          <li>אחוז מימון (LTV) של ${results.ltv?.toFixed(1)}% — מתחת לתקרה המקסימלית</li>
          <li>היסטוריית אשראי תקינה</li>
          <li>תיק מסודר — כל המסמכים מוכנים להגשה</li>
        `}
      </ul>
    </div>

    <p class="closing">
      אבקש לקבל הצעת ריבית עקרונית בכתב תוך <strong>5 ימי עסקים</strong>. 
      ${isRefinance ? 'אני בוחן הצעות ממספר בנקים ואשמח לשמוע את ההצעה הטובה ביותר שלכם.' : 'פניתי למספר בנקים ואבחר את ההצעה המשתלמת ביותר.'}
      אשמח לשלוח את מלוא מסמכי ההגשה בעקבות הצעתכם.
    </p>

    <hr class="divider">
    <div class="signature no-break">
      <p><strong>בכבוד רב,</strong></p>
      <p>${fullName}</p>
      ${formData.phone ? `<p>טל׳: ${formData.phone}</p>` : ''}
      ${formData.email ? `<p>דוא"ל: ${formData.email}</p>` : ''}
    </div>
  </div>

  <div class="footer">מיקוד משכנתאות — המטרה שלנו, החיסכון שלכם &nbsp;|&nbsp; *2324</div>
</div>

<!-- ═══════════════════════════════════════ -->
<!-- עמוד 2 — תמהילים + סימון מומלץ -->
<!-- ═══════════════════════════════════════ -->
<div class="page">
  <div class="header">
    <div>
      <div class="header-brand">מיקוד משכנתאות</div>
      <div class="header-subtitle">המטרה שלנו, החיסכון שלכם</div>
    </div>
    <div class="header-page-title">השוואת תמהילים</div>
  </div>
  <div class="gold-bar"></div>

  <div class="page-content">
    <h2 class="page-title">תמהילי המשכנתא המומלצים</h2>
    <p class="page-sub">${fullName} &nbsp;|&nbsp; סה"כ: ₪${loanStr} &nbsp;|&nbsp; תקופה: ${formData.loanDuration || results.actualDuration} שנים</p>

    ${mixRows}

    <div class="score-box no-break">
      ציון איכות התיק: <strong>${results.score}/100</strong>
      ${!isRefinance ? ` &nbsp;|&nbsp; DTI: ${results.dti?.toFixed(1)}% &nbsp;|&nbsp; LTV: ${results.ltv?.toFixed(1)}%` : ` &nbsp;|&nbsp; חיסכון כולל: ₪${formatCurrency(results.totalSaving)}`}
    </div>

    <p style="font-size:9px;color:#aaa;text-align:center;margin-top:8px;">★ = תמהיל מומלץ על ידי מיקוד משכנתאות לפרופיל הספציפי שלך. החישוב מבוסס על ריביות עדכניות מבנק ישראל — לצורך הערכה בלבד.</p>
  </div>

  <div class="footer">מיקוד משכנתאות — המטרה שלנו, החיסכון שלכם &nbsp;|&nbsp; *2324</div>
</div>

<!-- ═══════════════════════════════════════ -->
<!-- עמוד 3 — ניתוח מקצועי מלא -->
<!-- ═══════════════════════════════════════ -->
<div class="page">
  <div class="header">
    <div>
      <div class="header-brand">מיקוד משכנתאות</div>
      <div class="header-subtitle">המטרה שלנו, החיסכון שלכם</div>
    </div>
    <div class="header-page-title">ניתוח מקצועי</div>
  </div>
  <div class="gold-bar"></div>

  <div class="page-content">
    <h2 class="page-title">ניתוח מקצועי מלא</h2>
    <p class="page-sub">הוכן על ידי מערכת AI של מיקוד משכנתאות</p>
    ${analysisHtml}
  </div>

  <div class="footer">מיקוד משכנתאות — המטרה שלנו, החיסכון שלכם &nbsp;|&nbsp; *2324</div>
</div>

<!-- ═══════════════════════════════════════ -->
<!-- עמוד 4 — תסריט שיחה מול הבנקאי -->
<!-- ═══════════════════════════════════════ -->
<div class="page">
  <div class="header">
    <div>
      <div class="header-brand">מיקוד משכנתאות</div>
      <div class="header-subtitle">המטרה שלנו, החיסכון שלכם</div>
    </div>
    <div class="header-page-title">תסריט שיחה</div>
  </div>
  <div class="gold-bar"></div>

  <div class="page-content">
    <h2 class="page-title">תסריט השיחה מול הבנקאי</h2>
    <p class="page-sub">5 שלבים להשגת התנאים הטובים ביותר</p>

    <div class="script-step step-open no-break">
      <div class="script-step-title" style="color:#1e3a5f">שלב 1 — פתיחה</div>
      <div class="script-step-text">
        "${isRefinance
          ? `שלום, קוראים לי ${fullName || '[שם]'}. יש לי משכנתא קיימת ביתרה של ₪${loanStr} עם ${results.remainingYears} שנים שנותרו. אני בוחן אפשרות למחזור לתנאים טובים יותר. אשמח לשמוע מה הבנק שלכם יכול להציע.`
          : `שלום, קוראים לי ${fullName || '[שם]'}. אני פונה אליכם בבקשה לאישור עקרוני למשכנתא בסך ₪${loanStr}. יחס המימון עומד על ${results.ltv?.toFixed(1)}% ויחס ההחזר שלי מתחת ל-40%. פניתי למספר בנקים — אשמח לשמוע את הצעתכם.`
        }"
      </div>
    </div>

    <div class="script-step step-credibility no-break">
      <div class="script-step-title" style="color:#16a34a">שלב 2 — בניית אמינות</div>
      <div class="script-step-text">"אני פועל בליווי יועץ משכנתאות מקצועי ויש לי את כל המסמכים מוכנים להגשה מיידית. התיק שלי מוכן ומסודר — מה שמקצר משמעותית את זמן האישור."</div>
    </div>

    <div class="script-step step-ask no-break">
      <div class="script-step-title" style="color:#b45309">שלב 3 — בקשת הצעה</div>
      <div class="script-step-text">"על בסיס נתוני התיק שלי ונתוני השוק העדכניים, אבקש לקבל את הצעת הריבית הטובה ביותר שאתם יכולים להציע. אני מקבל מספר הצעות ואבחר את המשתלמת ביותר."</div>
    </div>

    <div class="script-step step-objection no-break">
      <div class="script-step-title" style="color:#dc2626">שלב 4 — טיפול בהתנגדות</div>
      <div class="script-step-text">אם הבנקאי אומר "הריבית שלנו גבוהה יותר": <br>"אני מעריך את הכנות. אני מכיר את נתוני השוק ואת ממוצעי הריבית לתיקים בפרופיל שלי. אשמח אם תבדקו שנית — תיקים עם נתונים כמו שלי מקבלים בדרך כלל תנאים טובים יותר."</div>
    </div>

    <div class="script-step step-close no-break">
      <div class="script-step-title" style="color:#16a34a">שלב 5 — סגירה</div>
      <div class="script-step-text">"אשמח לקבל את הצעתכם בכתב תוך יומיים. אני נמצא בתהליך עם מספר בנקים ואקבל החלטה עד סוף השבוע."</div>
    </div>

    <div style="background:#f8f5f0;border:1.5px solid #c9a961;border-radius:6px;padding:10px 14px;margin-top:10px;">
      <p style="font-size:11px;color:#1e3a5f;font-weight:700;">טיפ מקצועי ממיקוד</p>
      <p style="font-size:11px;color:#555;margin-top:4px;">פנה לפחות ל-3 בנקים שונים. ההצעה הכי טובה מגיעה לרוב כשהבנק יודע שיש תחרות.</p>
    </div>
  </div>

  <div class="footer">מיקוד משכנתאות — המטרה שלנו, החיסכון שלכם &nbsp;|&nbsp; *2324</div>
</div>

<!-- ═══════════════════════════════════════ -->
<!-- עמוד 5 — רשימת מסמכים -->
<!-- ═══════════════════════════════════════ -->
<div class="page">
  <div class="header">
    <div>
      <div class="header-brand">מיקוד משכנתאות</div>
      <div class="header-subtitle">המטרה שלנו, החיסכון שלכם</div>
    </div>
    <div class="header-page-title">מסמכים נדרשים</div>
  </div>
  <div class="gold-bar"></div>

  <div class="page-content">
    <h2 class="page-title">רשימת מסמכים להגשה</h2>
    <p class="page-sub">מותאמת אישית לפרופיל הלקוח</p>

    ${docsHtml}

    <div style="background:#fffbeb;border:1.5px solid #f59e0b;border-radius:6px;padding:10px 14px;margin-top:8px;">
      <p style="font-size:11px;color:#92400e;font-weight:700;">טיפ מקצועי</p>
      <p style="font-size:11px;color:#78350f;margin-top:4px;">הכן תיק PDF מסודר עם שם קובץ ברור לכל מסמך. תיק מסודר מקצר את זמן האישור ומשדר אמינות לבנקאי.</p>
    </div>
  </div>

  <div class="footer">מיקוד משכנתאות — המטרה שלנו, החיסכון שלכם &nbsp;|&nbsp; *2324</div>
</div>

<!-- ═══════════════════════════════════════ -->
<!-- עמוד 6 — תודה ומיתוג -->
<!-- ═══════════════════════════════════════ -->
<div class="page-last">
  <div class="brand">מיקוד משכנתאות</div>
  <div class="tagline">המטרה שלנו, החיסכון שלכם &nbsp;·&nbsp; mikud4me.co.il</div>
  <div class="gold-line"></div>

  <div class="thank-you">תודה, ${fullName}!</div>
  <p class="desc">
    דוח זה הוכן עבורך על ידי מיקוד משכנתאות.<br>
    אנחנו כאן כדי להשיג לך את התנאים הטובים ביותר במערכת הבנקאית.
  </p>

  <div class="summary-grid">
    <div class="summary-item">
      <div class="s-label">סכום המשכנתא</div>
      <div class="s-val">₪${loanStr}</div>
    </div>
    <div class="summary-item">
      <div class="s-label">מטרת ההלוואה</div>
      <div class="s-val">${mortgageTypeLabel}</div>
    </div>
    <div class="summary-item">
      <div class="s-label">ציון התיק</div>
      <div class="s-val">${results.score}/100</div>
    </div>
    <div class="summary-item">
      <div class="s-label">תאריך הפקה</div>
      <div class="s-val">${today}</div>
    </div>
  </div>

  <div class="gold-line"></div>

  <div class="cta-section">
    <p>מוכן להתקדם? צור קשר עכשיו:</p>
    <div class="phone-big">*2324</div>
  </div>

  <p class="small-note">ייעוץ חינמי, ללא התחייבות. אנחנו עובדים למענך.</p>
</div>

</body>
</html>`;

    const apiUrl = 'https://api.html2pdf.app/v1/generate';
    const pdfResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html,
        apiKey: 'demo',
        marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
        landscape: false,
        printBackground: true,
        format: 'A4',
      }),
    });

    if (!pdfResponse.ok) {
      console.log('PDF API failed, returning HTML fallback');
      return new Response(JSON.stringify({ html, fallback: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Mikud_Report_${(fullName || 'client').replace(/\s+/g, '_')}.pdf"`,
      },
    });

  } catch (error) {
    console.error('generatePdfReport error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});