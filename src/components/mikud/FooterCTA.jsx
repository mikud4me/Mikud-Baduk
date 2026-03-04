import React from 'react';
import { Phone, Shield, Clock, HeartHandshake } from 'lucide-react';

const badges = [
  { icon: Shield, text: 'ללא התחייבות' },
  { icon: Clock, text: 'תגובה תוך 24 שעות' },
  { icon: HeartHandshake, text: 'ייעוץ אישי חינם' },
];

export default function FooterCTA() {
  return (
    <footer className="w-full bg-gradient-to-br from-[#0f1f35] to-[#1e3a5f] py-20 px-4 border-t-4 border-[#c9a961]" dir="rtl">
      <div className="max-w-3xl mx-auto text-center">

        <div className="inline-block mb-6">
          <span className="text-[#c9a961] text-xs font-bold tracking-[0.3em] uppercase">מיקוד משכנתאות</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 leading-tight">
          המטרה שלנו —<br/>
          <span className="text-[#c9a961]">החיסכון שלכם</span>
        </h2>

        <p className="text-gray-300 text-base sm:text-lg font-light mb-10 leading-relaxed">
          מומחי מיקוד ישיגו לכם את התנאים הטובים ביותר מהמערכת הבנקאית.<br/>
          פגישת ייעוץ ראשונה — בחינם ובלי התחייבות.
        </p>

        {/* כפתור טלפון */}
        <a
          href="tel:2324"
          className="inline-flex items-center gap-4 bg-[#c9a961] hover:bg-[#d4b975] text-[#1e3a5f] px-12 py-5 rounded-2xl font-black text-3xl sm:text-4xl shadow-2xl hover:scale-105 active:scale-95 transition-all mb-10"
        >
          <Phone size={32} />
          2324*
        </a>

        {/* בדג'ים */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {badges.map((b, i) => {
            const Icon = b.icon;
            return (
              <div key={i} className="flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-2 rounded-full">
                <Icon size={14} className="text-[#c9a961]" />
                <span className="text-white text-xs font-semibold">{b.text}</span>
              </div>
            );
          })}
        </div>

        <p className="text-gray-500 text-xs">
          © {new Date().getFullYear()} מיקוד משכנתאות בע"מ &nbsp;·&nbsp; כל הזכויות שמורות &nbsp;·&nbsp; רישיון תיווך פיננסי
        </p>
      </div>
    </footer>
  );
}