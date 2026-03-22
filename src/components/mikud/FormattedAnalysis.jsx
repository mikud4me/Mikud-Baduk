import React from 'react';

// כותרות צבעוניות לפי סוג סעיף
const SECTION_COLORS = {
  default: { border: 'border-[#1e3a5f]', title: 'text-[#1e3a5f]', bg: 'bg-[#1e3a5f]/5' },
  strength: { border: 'border-green-600', title: 'text-green-700', bg: 'bg-green-50' },
  improve: { border: 'border-amber-600', title: 'text-amber-700', bg: 'bg-amber-50' },
  risk: { border: 'border-red-600', title: 'text-red-700', bg: 'bg-red-50' },
  strategy: { border: 'border-blue-600', title: 'text-blue-700', bg: 'bg-blue-50' },
};

function getSectionColor(title) {
  if (!title) return SECTION_COLORS.default;
  if (/חוזק|יתרון/i.test(title)) return SECTION_COLORS.strength;
  if (/שיפור|חיסרון|בעי/i.test(title)) return SECTION_COLORS.improve;
  if (/סיכון|אזהרה|סיכוי/i.test(title)) return SECTION_COLORS.risk;
  if (/אסטרטגי|הגשה|המלצ/i.test(title)) return SECTION_COLORS.strategy;
  return SECTION_COLORS.default;
}

/**
 * ממיר טקסט ניתוח לסעיפים מעוצבים.
 * שורות "X. כותרת —" מהוות כותרת סעיף.
 * כל שאר הטקסט (כולל ממוספר) נכנס לגוף הסעיף הפתוח.
 */
export default function FormattedAnalysis({ text }) {
  if (!text) return null;

  const lines = text.split('\n');
  const sections = [];
  let current = null;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // זיהוי שורת כותרת: מספר + נקודה + מלל שמסתיים ב— או מכיל —
    const headerMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    const isHeader = headerMatch && (
      /—|:$/.test(headerMatch[2]) ||        // מסתיים ב— או :
      /^(סיכום|ניתוח|נקודות|אסטרטגי|תחזית)/i.test(headerMatch[2]) // מילות מפתח
    );

    if (isHeader) {
      if (current) sections.push(current);
      current = { num: headerMatch[1], title: headerMatch[2].replace(/\s*—\s*$/, '').trim(), body: [] };
    } else {
      // כל שאר הטקסט — כולל "4. - נקודה" — הולך לגוף הסעיף הנוכחי
      if (current) {
        // נקה ממספור מיותר בתחילת שורה (למשל "4. - " → "- ")
        const cleaned = trimmed.replace(/^\d+\.\s+/, '');
        current.body.push(cleaned);
      } else {
        // טקסט לפני הסעיף הראשון
        sections.push({ num: null, title: null, body: [trimmed] });
      }
    }
  });
  if (current) sections.push(current);

  return (
    <div className="space-y-5">
      {sections.map((sec, i) => {
        if (!sec.title) {
          return (
            <p key={i} className="text-gray-700 text-sm leading-relaxed">
              {sec.body.join(' ')}
            </p>
          );
        }

        const color = getSectionColor(sec.title);
        const bodyText = sec.body.join('\n').trim();

        return (
          <div key={i} className={`rounded-xl border-r-4 ${color.border} ${color.bg} overflow-hidden`}>
            {/* כותרת */}
            <div className="px-5 pt-4 pb-2 flex items-start gap-2">
              <span className={`font-black text-base ${color.title}`}>{sec.num}.</span>
              <h4 className={`font-black text-base leading-tight ${color.title}`}>{sec.title}</h4>
            </div>
            {/* גוף */}
            {bodyText && (
              <div className="px-5 pb-4">
                <p className="text-gray-800 text-sm leading-relaxed font-medium whitespace-pre-line">{bodyText}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}