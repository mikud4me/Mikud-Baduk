import React from 'react';
import { ClipboardList, Sparkles, TrendingDown } from 'lucide-react';

const steps = [
  {
    icon: ClipboardList,
    num: '01',
    title: 'מלא שאלון קצר',
    desc: 'פרטים בסיסיים על הנכס, ההכנסה והצרכים שלך — לוקח פחות מ-3 דקות',
  },
  {
    icon: Sparkles,
    num: '02',
    title: 'קבל ניתוח AI מיידי',
    desc: 'המערכת מנתחת את התיק ומפיקה 3 תמהילי משכנתא אופטימליים במיוחד עבורך',
  },
  {
    icon: TrendingDown,
    num: '03',
    title: 'חסוך עשרות אלפי שקלים',
    desc: 'הגע לבנק עם נתונים, תסריט שיחה ומכתב מקצועי — ותנהל משא ומתן כמו מומחה',
  },
];

export default function HowItWorks() {
  return (
    <section className="w-full py-12 sm:py-16 px-4 bg-white" dir="rtl">
      <div className="max-w-5xl mx-auto">

        {/* כותרת */}
        <div className="text-center mb-8 sm:mb-10">
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-[#c9a961] mb-3">התהליך שלנו</p>
          <h2 className="text-3xl sm:text-4xl font-black text-[#1e3a5f] leading-tight">
            שלושה שלבים.
            <br />
            <span className="text-[#c9a961]">תוצאה אחת.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative">

          {/* קו מחבר */}
          <div className="hidden sm:block absolute top-[2.75rem] right-[calc(16.5%+2.5rem)] left-[calc(16.5%+2.5rem)] h-px bg-gradient-to-l from-[#c9a961]/30 via-[#c9a961]/60 to-[#c9a961]/30" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={i}
                className="relative flex flex-col items-center text-center group"
              >
                {/* מספר + אייקון */}
                <div className="relative mb-6 z-10">
                  {/* טבעת חיצונית */}
                  <div className="w-[5.5rem] h-[5.5rem] rounded-full border border-[#c9a961]/30 absolute -inset-2 group-hover:scale-105 transition-transform duration-500" />
                  <div className="w-[4.5rem] h-[4.5rem] rounded-full border-2 border-[#1e3a5f] bg-white flex items-center justify-center shadow-md group-hover:bg-[#1e3a5f] transition-colors duration-300">
                    <Icon size={26} className="text-[#1e3a5f] group-hover:text-[#c9a961] transition-colors duration-300" />
                  </div>
                  {/* מספר */}
                  <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#c9a961] text-[#1e3a5f] text-[10px] font-black flex items-center justify-center shadow">
                    {step.num}
                  </span>
                </div>

                <h3 className="text-base font-black text-[#1e3a5f] mb-2 tracking-tight">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed max-w-[220px]">{step.desc}</p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}