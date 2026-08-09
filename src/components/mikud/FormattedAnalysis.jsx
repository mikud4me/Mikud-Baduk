import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function FormattedAnalysis({ text, previewParagraphs = 4 }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;

  const paragraphs = text.split('\n').map(p => p.trim()).filter(Boolean);
  const hasMore = paragraphs.length > previewParagraphs;
  const visible = expanded ? paragraphs : paragraphs.slice(0, previewParagraphs);

  return (
    <div>
      <div className="space-y-3">
        {visible.map((p, i) => (
          <p key={i} className="text-mist-700 text-sm sm:text-base leading-relaxed">{p}</p>
        ))}
      </div>
      {hasMore && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-3 flex items-center gap-1 text-[#0153F4] font-bold text-sm hover:underline"
        >
          {expanded ? 'הצג פחות' : 'קרא עוד'}
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      )}
    </div>
  );
}
