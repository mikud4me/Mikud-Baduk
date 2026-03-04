import React from 'react';
import { Star } from 'lucide-react';

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
    text: 'הגעתי לבנק עם המכתב והניתוח — הבנקאי שינה את הריבית על המקום.',
    stars: 5,
  },
  {
    name: 'שרה ומשה גולן',
    location: 'חיפה',
    text: 'תוך 5 דקות קיבלנו תמונה מלאה. מדהים כמה זה פשוט ויעיל.',
    stars: 5,
  },
];

export default function SocialProof() {
  return (
    <section className="w-full bg-[#0d1b2e] py-24 px-4" dir="rtl">
      <div className="max-w-5xl mx-auto">

        {/* סטטיסטיקות */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/10 rounded-2xl overflow-hidden mb-20">
          {stats.map((s, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center text-center py-10 px-4 bg-[#0d1b2e] hover:bg-[#1e3a5f]/60 transition-colors duration-300"
            >
              <div className="text-3xl sm:text-4xl font-black text-white mb-1 tracking-tight">{s.value}</div>
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>

        {/* כותרת המלצות */}
        <div className="text-center mb-12">
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-[#c9a961] mb-3">לקוחות מרוצים</p>
          <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
            הם כבר חסכו.
            <br />
            <span className="text-[#c9a961]">עכשיו תורכם.</span>
          </h2>
        </div>

        {/* המלצות */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="group relative rounded-2xl overflow-hidden border border-white/10 hover:border-[#c9a961]/40 transition-all duration-300 bg-white/5 hover:bg-white/8 p-7 flex flex-col justify-between"
            >
              {/* פס עליון */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#c9a961]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* כוכבים */}
              <div className="flex items-center gap-0.5 mb-4">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} size={11} className="text-[#c9a961] fill-[#c9a961]" />
                ))}
              </div>

              <p className="text-gray-300 text-sm leading-relaxed mb-6 flex-1">
                "{t.text}"
              </p>

              <div className="border-t border-white/10 pt-4">
                <p className="font-bold text-white text-sm">{t.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">{t.location}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}