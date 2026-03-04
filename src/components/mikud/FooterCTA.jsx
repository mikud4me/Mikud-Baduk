import React from 'react';
import { Phone, Shield, Clock, HeartHandshake, Mail } from 'lucide-react';

const badges = [
  { icon: Shield, text: 'ללא התחייבות' },
  { icon: Clock, text: 'תגובה תוך 24 שעות' },
  { icon: HeartHandshake, text: 'ייעוץ אישי חינם' },
];

export default function FooterCTA() {
  return (
    <footer className="w-full bg-gradient-to-br from-[#0f1f35] to-[#1e3a5f] py-24 px-4 border-t-4 border-[#c9a961]" dir="rtl">
      <div className="max-w-3xl mx-auto text-center">

        <div className="inline-block mb-8">
          <span className="text-[#c9a961] text-xs font-bold tracking-[0.3em] uppercase">מיקוד משכנתאות</span>
        </div>

        {/* לוגו */}
        <div className="flex justify-center mb-10">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696ca6d05493d178c33e26fd/0c936db5c_Gemini_Generated_Image_ae1zscae1zscae1z.jpg"
            alt="מיקוד משכנתאות"
            className="h-36 sm:h-44 w-auto object-contain"
          />
        </div>

        {/* סלוגן פרימיום */}
        <div className="flex flex-col items-center gap-4 mb-12">
          <div className="flex items-center justify-center gap-4 sm:gap-8 flex-wrap">
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-none tracking-tight whitespace-nowrap">
              המטרה שלנו
            </h2>
            <div className="w-16 sm:w-24 h-px bg-gradient-to-r from-transparent via-[#c9a961] to-transparent" />
            <h2 className="text-3xl sm:text-5xl font-black text-[#c9a961] leading-none tracking-tight whitespace-nowrap">
              החיסכון שלכם &nbsp;!!!
            </h2>
          </div>
        </div>

        <p className="text-gray-400 text-sm sm:text-base font-light mb-12 leading-relaxed max-w-xl mx-auto">
          מומחי מיקוד ישיגו לכם את התנאים הטובים ביותר מהמערכת הבנקאית.<br/>
          פגישת ייעוץ ראשונה — בחינם ובלי התחייבות.
        </p>

        {/* כפתורי יצירת קשר */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <a
            href="tel:2324"
            className="inline-flex items-center gap-3 bg-[#c9a961] hover:bg-[#d4b975] text-[#1e3a5f] px-10 py-5 rounded-2xl font-black text-3xl sm:text-4xl shadow-2xl hover:scale-105 active:scale-95 transition-all"
          >
            <Phone size={28} />
            2324*
          </a>
          <a
            href="mailto:Office@mikud4me.co.il"
            className="inline-flex items-center gap-3 bg-white/10 hover:bg-white/15 border border-white/20 hover:border-[#c9a961]/50 text-white px-8 py-5 rounded-2xl font-semibold text-sm sm:text-base transition-all"
          >
            <Mail size={18} className="text-[#c9a961]" />
            Office@mikud4me.co.il
          </a>
        </div>

        {/* בדג'ים */}
        <div className="flex flex-wrap justify-center gap-3 mb-14">
          {badges.map((b, i) => {
            const Icon = b.icon;
            return (
              <div key={i} className="flex items-center gap-2 bg-white/8 border border-white/15 px-4 py-2 rounded-full">
                <Icon size={13} className="text-[#c9a961]" />
                <span className="text-gray-300 text-xs font-semibold">{b.text}</span>
              </div>
            );
          })}
        </div>

        <div className="w-full h-px bg-white/10 mb-6" />

        <p className="text-gray-600 text-xs">
          © {new Date().getFullYear()} מיקוד משכנתאות בע"מ &nbsp;·&nbsp; כל הזכויות שמורות &nbsp;·&nbsp; רישיון תיווך פיננסי
        </p>
      </div>
    </footer>
  );
}