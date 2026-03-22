import React from 'react';

// צבעים לכותרות לפי מספר סעיף
const SECTION_STYLES = [
  { bg: 'bg-[#1e3a5f]', text: 'text-white', dot: 'bg-[#c9a961]' },
  { bg: 'bg-blue-700', text: 'text-white', dot: 'bg-blue-300' },
  { bg: 'bg-green-700', text: 'text-white', dot: 'bg-green-300' },
  { bg: 'bg-amber-600', text: 'text-white', dot: 'bg-amber-200' },
  { bg: 'bg-purple-700', text: 'text-white', dot: 'bg-purple-300' },
  { bg: 'bg-rose-700', text: 'text-white', dot: 'bg-rose-300' },
];

/**
 * ממיר טקסט ניתוח בפורמט "1. כותרת\nתוכן..." לכרטיסים מודגשים וצבעוניים.
 * שורות שמתחילות ב-"X." (ספרה + נקודה) הופכות לכותרת.
 */
export default function FormattedAnalysis({ text }) {
  if (!text) return null;

  const lines = text.split('\n');
  const sections = [];
  let current = null;

  lines.forEach(line => {
    const match = line.match(/^(\d+)\.\s+(.+)/);
    if (match) {
      if (current) sections.push(current);
      current = { title: match[2], body: [] };
    } else if (current) {
      current.body.push(line);
    } else {
      // שורות לפני הסעיף הראשון
      sections.push({ title: null, body: [line] });
    }
  });
  if (current) sections.push(current);

  return (
    <div className="space-y-4">
      {sections.map((sec, i) => {
        const style = SECTION_STYLES[i % SECTION_STYLES.length];
        const bodyText = sec.body.join('\n').trim();

        if (!sec.title) {
          // שורות מבוא ללא כותרת
          return bodyText ? (
            <p key={i} className="text-gray-600 text-sm leading-relaxed">{bodyText}</p>
          ) : null;
        }

        return (
          <div key={i} className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
            {/* כותרת */}
            <div className={`${style.bg} px-5 py-3 flex items-center gap-3`}>
              <span className={`w-6 h-6 rounded-full ${style.dot} flex items-center justify-center text-xs font-black text-gray-800 flex-shrink-0`}>
                {i + 1}
              </span>
              <h4 className={`font-black text-base leading-tight ${style.text}`}>{sec.title}</h4>
            </div>
            {/* תוכן */}
            {bodyText && (
              <div className="px-5 py-4 bg-white">
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{bodyText}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}