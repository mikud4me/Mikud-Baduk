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
    desc: 'המערכת שלנו מנתחת את התיק ומפיקה 3 תמהילי משכנתא אופטימליים במיוחד עבורך',
  },
  {
    icon: TrendingDown,
    num: '03',
    title: 'חסוך בריבית',
    desc: 'הגע לבנק עם נתונים, תסריט שיחה ומכתב מקצועי — ותנהל משא ומתן כמו מומחה',
  },
];

export default function HowItWorks() {
  return (
    <section className="w-full bg-gradient-to-b from-white to-gray-50 py-20 px-4" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <span className="inline-block bg-[#1e3a5f] text-[#c9a961] text-xs font-bold px-5 py-2 rounded-full tracking-widest uppercase mb-4">
            איך זה עובד
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#1e3a5f] leading-tight">
            שלושה שלבים פשוטים<br/>
            <span className="text-[#c9a961]">לחיסכון של עשרות אלפי שקלים</span>
          </h2>
        </div>

        <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* קו חיבור */}
          <div className="hidden sm:block absolute top-10 right-[16.5%] left-[16.5%] h-0.5 bg-gradient-to-l from-[#c9a961] via-[#c9a961]/40 to-[#c9a961]" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="flex flex-col items-center text-center group">
                <div className="relative mb-5">
                  <div className="w-20 h-20 rounded-full bg-white border-4 border-[#c9a961] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 z-10 relative">
                    <Icon size={32} className="text-[#1e3a5f]" />
                  </div>
                  <span className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-[#1e3a5f] text-[#c9a961] text-xs font-black flex items-center justify-center">
                    {step.num}
                  </span>
                </div>
                <h3 className="text-lg font-black text-[#1e3a5f] mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}