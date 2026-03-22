import React from 'react';

// צבעוניות אחידה שחורה
const SECTION_COLORS = {
  default: { border: 'border-gray-300', title: 'text-black', bg: 'bg-white' },
  strength: { border: 'border-gray-300', title: 'text-black', bg: 'bg-white' },
  improve: { border: 'border-gray-300', title: 'text-black', bg: 'bg-white' },
  risk: { border: 'border-gray-300', title: 'text-black', bg: 'bg-white' },
  strategy: { border: 'border-gray-300', title: 'text-black', bg: 'bg-white' },
};

function getSectionColor(title) {
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
            <p key={i} className="text-black text-sm leading-relaxed font-normal">
              {sec.body.join(' ')}
            </p>
          );
        }

        const color = getSectionColor(sec.title);
        const bodyText = sec.body.join('\n').trim();

        return (
           <div key={i} className={`rounded-lg border-l-4 ${color.border} ${color.bg} overflow-hidden`}>
            {/* כותרת */}
            <div className="px-5 pt-4 pb-2 flex items-start gap-2">
              <span className={`font-bold text-base ${color.title}`}>{sec.num}.</span>
              <h4 className={`font-bold text-base leading-tight ${color.title}`}>{sec.title}</h4>
            </div>
            {/* גוף */}
            {bodyText && (
              <div className="px-5 pb-4">
                <p className="text-black text-sm leading-relaxed font-normal whitespace-pre-line">{bodyText}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}