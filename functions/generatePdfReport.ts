import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const formatCurrency = (val) => {
  if (!val || isNaN(val)) return "0";
  return new Intl.NumberFormat('he-IL').format(Math.floor(val));
};

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { formData, results, fullName, borrowers = [] } = body;

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

    const targetRate = results?.mixB?.tracks?.[0]?.rate || 0.05;

    const mixes = [
      { label: isRefinance ? results.mixB?.label : 'תמהיל מאוזן — מומלץ', tracks: results.mixB?.tracks || [], total: results.mixB?.total, highlight: true },
      { label: isRefinance ? results.mixA?.label : 'תמהיל שמרני — קבועה', tracks: results.mixA?.tracks || [], total: results.mixA?.total, highlight: false },
      { label: isRefinance ? results.mixC?.label : 'תמהיל פריים — גמיש', tracks: results.mixC?.tracks || [], total: results.mixC?.total, highlight: false },
    ];

    const mixRows = mixes.filter(m => m.tracks.length > 0).map(mix => `
      <div class="mix-card ${mix.highlight ? 'mix-recommended' : ''}">
        <div class="mix-title">${mix.label}</div>
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

  /* PAGE BREAKS */
  .page { page-break-after: always; padding: 0; }
  .page:last-child { page-break-after: avoid; }
  .no-break { page-break-inside: avoid; }

  /* HEADER */
  .header {
    background: #1e3a5f;
    color: white;
    padding: 18px 30px 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .header-brand { color: #c9a961; font-size: 18px; font-weight: 900; }
  .header-subtitle { color: rgba(255,255,255,0.7); font-size: 10px; margin-top: 2px; }
  .header-page-title { color: rgba(255,255,255,0.85); font-size: 11px; }
  .gold-bar { height: 3px; background: linear-gradient(to left, #1e3a5f, #c9a961, #1e3a5f); }

  /* FOOTER */
  .footer {
    background: #1e3a5f;
    color: #c9a961;
    text-align: center;
    padding: 10px;
    font-size: 9px;
    font-weight: 700;
    margin-top: 20px;
  }

  /* PAGE 1 - LETTER */
  .page-content { padding: 25px 35px; }

  .date-line { color: #888; font-size: 10px; margin-bottom: 18px; }
  
  .recipient { margin-bottom: 16px; }
  .recipient p { font-size: 12px; }
  .recipient strong { color: #1e3a5f; font-size: 13px; }

  .subject-box {
    background: #f8f5f0;
    border: 1.5px solid #c9a961;
    border-radius: 6px;
    padding: 10px 16px;
    margin-bottom: 18px;
    text-align: center;
  }
  .subject-box strong { color: #1e3a5f; font-size: 13px; }

  .body-text { margin-bottom: 16px; font-size: 12px; color: #333; }

  .details-box {
    background: #f8fafc;
    border: 1px solid #ddd;
    border-radius: 6px;
    padding: 16px 20px;
    margin-bottom: 16px;
  }
  .details-box h4 {
    color: #1e3a5f;
    font-size: 11px;
    font-weight: 700;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #eee;
  }
  .details-box table { width: 100%; border-collapse: collapse; }
  .details-box td { padding: 5px 8px; font-size: 12px; }
  .details-box td.label { color: #666; font-weight: 600; width: 45%; }
  .details-box .savings { color: #16a34a; font-weight: 700; }

  .rates-box {
    background: #1e3a5f;
    border-radius: 6px;
    padding: 12px 20px;
    text-align: center;
    margin-bottom: 16px;
    color: white;
  }
  .rates-box .rates-title { color: #c9a961; font-size: 12px; font-weight: 700; margin-bottom: 4px; }
  .rates-box .rates-val { font-size: 11px; }

  .strengths { margin-bottom: 16px; }
  .strengths h4 { color: #1e3a5f; font-size: 12px; font-weight: 700; margin-bottom: 8px; }
  .strengths ul { list-style: none; padding: 0; }
  .strengths li { font-size: 11px; color: #333; padding: 3px 0; }
  .strengths li::before { content: "✓ "; color: #16a34a; font-weight: 700; }

  .closing { font-size: 11px; color: #333; margin-bottom: 16px; }
  .divider { border: none; border-top: 1px solid #ddd; margin: 16px 0; }
  .signature { font-size: 11px; color: #333; }
  .signature strong { color: #1e3a5f; }

  /* PAGE 2 - MIXES */
  .page2-title {
    text-align: center;
    color: #1e3a5f;
    font-size: 20px;
    font-weight: 900;
    margin-bottom: 4px;
  }
  .page2-sub {
    text-align: center;
    color: #888;
    font-size: 11px;
    margin-bottom: 20px;
  }

  .mix-card {
    border: 1.5px solid #ddd;
    border-radius: 8px;
    margin-bottom: 14px;
    overflow: hidden;
  }
  .mix-card.mix-recommended {
    border-color: #c9a961;
    box-shadow: 0 2px 8px rgba(201,169,97,0.2);
  }
  .mix-title {
    background: #f0f4f8;
    color: #1e3a5f;
    font-weight: 700;
    font-size: 12px;
    padding: 8px 14px;
    border-bottom: 1px solid #ddd;
  }
  .mix-recommended .mix-title {
    background: #1e3a5f;
    color: #c9a961;
  }
  .mix-table { width: 100%; border-collapse: collapse; }
  .mix-table th {
    background: #f8fafc;
    color: #1e3a5f;
    font-size: 10px;
    font-weight: 700;
    padding: 6px 12px;
    text-align: right;
    border-bottom: 1px solid #eee;
  }
  .mix-recommended .mix-table th { background: #162d4a; color: #c9a961; }
  .mix-table td { padding: 6px 12px; font-size: 11px; border-bottom: 1px solid #f0f0f0; }
  .mix-table tr:last-child td { border-bottom: none; }
  .mix-total {
    text-align: left;
    padding: 7px 14px;
    font-size: 11px;
    color: #1e3a5f;
    background: #fafafa;
    border-top: 1px solid #eee;
  }
  .mix-recommended .mix-total { background: #162d4a; color: #c9a961; }

  .score-box {
    background: #f8f5f0;
    border: 1.5px solid #c9a961;
    border-radius: 6px;
    padding: 12px 20px;
    text-align: center;
    font-size: 12px;
    color: #1e3a5f;
    font-weight: 700;
    margin-top: 10px;
  }

  /* PAGE 3 - THANK YOU */
  .page3 {
    background: #1e3a5f;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 40px;
    text-align: center;
    color: white;
  }
  .page3 .brand { color: #c9a961; font-size: 22px; font-weight: 900; margin-bottom: 6px; }
  .page3 .tagline { color: rgba(255,255,255,0.6); font-size: 12px; margin-bottom: 30px; }
  .gold-line { width: 80px; height: 2px; background: #c9a961; margin: 20px auto; }
  .page3 .thank-you { color: #c9a961; font-size: 32px; font-weight: 900; margin-bottom: 16px; }
  .page3 .desc { font-size: 13px; color: rgba(255,255,255,0.85); margin-bottom: 30px; line-height: 1.8; }
  .summary-grid {
    display: flex;
    gap: 20px;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 40px;
  }
  .summary-item {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(201,169,97,0.3);
    border-radius: 8px;
    padding: 14px 22px;
    min-width: 130px;
  }
  .summary-item .s-label { color: rgba(255,255,255,0.55); font-size: 9px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .summary-item .s-val { color: white; font-size: 15px; font-weight: 700; }
  .cta-section { margin-top: 10px; }
  .cta-section p { color: #c9a961; font-size: 14px; font-weight: 700; margin-bottom: 10px; }
  .phone-big { color: #c9a961; font-size: 50px; font-weight: 900; letter-spacing: 3px; }
  .page3 .small-note { color: rgba(255,255,255,0.4); font-size: 9px; margin-top: 20px; }

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
<!-- עמוד 1 — מכתב לבנק -->
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
      ? `הריני לפנות אליכם בבקשה לקבל הצעה למחזור משכנתא עבור <strong>${fullName}</strong>, ביתרה של ₪${loanStr}, בתנאים המפורטים להלן.`
      : `הריני לפנות אליכם בבקשה לקבל אישור עקרוני למשכנתא עבור <strong>${fullName}</strong>, בתנאים המפורטים להלן.`
    }</p>

    <div class="details-box no-break">
      <h4>פרטי התיק</h4>
      <table>
        <tbody>${detailsRows}</tbody>
      </table>
    </div>

    <div class="rates-box no-break">
      <div class="rates-title">ריביות יעד מבוקשות</div>
      <div class="rates-val">פריים: P-0.5% &nbsp;|&nbsp; קבועה לא צמודה: ${((targetRate) * 100).toFixed(2)}%</div>
    </div>

    <div class="strengths no-break">
      <h4>נקודות חוזק התיק:</h4>
      <ul>
        ${isRefinance ? `
          <li>חיסכון חודשי צפוי של ₪${formatCurrency(results.monthlySaving)} לאורך כל התקופה</li>
          <li>יתרת משכנתא ₪${formatCurrency(results.balance)} עם ${results.remainingYears} שנים שנותרו</li>
          <li>היסטוריית אשראי תקינה</li>
        ` : `
          <li>יחס החזר (DTI) של ${results.dti?.toFixed(1)}% — מתחת לתקרת בנק ישראל (40%)</li>
          <li>אחוז מימון (LTV) של ${results.ltv?.toFixed(1)}% — מתחת לתקרה המקסימלית</li>
          <li>היסטוריית אשראי תקינה</li>
        `}
      </ul>
    </div>

    <p class="closing">אבקש לקבל הצעת ריבית עקרונית בכתב תוך <strong>5 ימי עסקים</strong>. אשמח לשלוח את מלוא מסמכי ההגשה בעקבות הצעתכם.</p>

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
<!-- עמוד 2 — תמהילים -->
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
    <h2 class="page2-title">תמהילי המשכנתא המומלצים</h2>
    <p class="page2-sub">${fullName} &nbsp;|&nbsp; סה"כ: ₪${loanStr} &nbsp;|&nbsp; תקופה: ${formData.loanDuration || results.actualDuration} שנים</p>

    ${mixRows}

    <div class="score-box no-break">
      ציון איכות התיק: ${results.score}/100
      ${!isRefinance ? ` &nbsp;|&nbsp; DTI: ${results.dti?.toFixed(1)}% &nbsp;|&nbsp; LTV: ${results.ltv?.toFixed(1)}%` : ` &nbsp;|&nbsp; חיסכון כולל: ₪${formatCurrency(results.totalSaving)}`}
    </div>

    <p style="font-size:9px;color:#aaa;text-align:center;margin-top:10px;">* החישוב מבוסס על ריביות עדכניות מבנק ישראל. הנתונים לצורך הערכה בלבד.</p>
  </div>

  <div class="footer">מיקוד משכנתאות — המטרה שלנו, החיסכון שלכם &nbsp;|&nbsp; *2324</div>
</div>

<!-- ═══════════════════════════════════════ -->
<!-- עמוד 3 — תודה ומיתוג -->
<!-- ═══════════════════════════════════════ -->
<div class="page3">
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

    // Use an external HTML-to-PDF service (headless browser API)
    // We'll use the html2pdf approach via a free API
    const apiUrl = 'https://api.html2pdf.app/v1/generate';

    const pdfResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html,
        apiKey: 'demo',
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0,
        landscape: false,
        printBackground: true,
        format: 'A4',
      }),
    });

    if (!pdfResponse.ok) {
      // fallback: return HTML as blob
      console.log('PDF API failed, returning HTML fallback');
      return new Response(
        JSON.stringify({ html, fallback: true }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
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