import React from 'react';
import { Star, Quote } from 'lucide-react';

const stats = [
  { value: '₪148,000', label: 'חיסכון ממוצע ללקוח' },
  { value: '500+', label: 'תיקים שטיפלנו' },
  { value: '15', label: 'שנות ניסיון' },
  { value: '97%', label: 'שביעות רצון' },
];

const testimonials = [
  {
    name: 'רוני ואורית כהן',
    location: 'תל אביב',
    text: 'חסכנו ₪180,000 לעומת ההצעה הראשונית של הבנק. פשוט לא האמנו שאפשר.',
    stars: 5,
  },
  {
    name: 'אבי לוי',
    location: 'ירושלים',
    text: 'הגעתי לבנק עם המכתב והניתוח מהמערכת — הבנקאי שינה את הריבית על המקום.',
    stars: 5,
  },
  {
    name: 'שרה ומשה גולן',
    location: 'חיפה',
    text: 'תוך 5 דקות קיבלנו תמונה מלאה על המצב שלנו. מדהים כמה זה פשוט.',
    stars: 5,
  },
];

export default function SocialProof() {
  return (
    <section className="w-full bg-white py-20 px-4" dir="rtl">
      <div className="max-w-5xl mx-auto">

        {/* סטטיסטיקות */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-20">
          {stats.map((s, i) => (
            <div key={i} className="text-center p-6 rounded-2xl bg-gradient-to-br from-[#1e3a5f]/5 to-[#c9a961]/10 border border-[#c9a961]/20">
              <div className="text-3xl sm:text-4xl font-black text-[#1e3a5f] mb-1">{s.value}</div>
              <div className="text-xs text-gray-500 font-semibold">{s.label}</div>
            </div>
          ))}
        </div>

        {/* כותרת */}
        <div className="text-center mb-10">
          <span className="inline-block bg-[#1e3a5f] text-[#c9a961] text-xs font-bold px-5 py-2 rounded-full tracking-widest uppercase mb-4">
            לקוחות מרוצים
          </span>
          <h2 className="text-3xl font-black text-[#1e3a5f]">הם כבר חסכו — עכשיו תורכם</h2>
        </div>

        {/* המלצות */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow relative">
              <Quote size={24} className="text-[#c9a961] mb-3 opacity-60" />
              <p className="text-gray-700 text-sm leading-relaxed mb-4 italic">"{t.text}"</p>
              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} size={12} className="text-[#c9a961] fill-[#c9a961]" />
                ))}
              </div>
              <div>
                <p className="font-black text-[#1e3a5f] text-sm">{t.name}</p>
                <p className="text-gray-400 text-xs">{t.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}