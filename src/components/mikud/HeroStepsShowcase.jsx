import React, { useEffect, useRef, useState } from 'react';

// הוק פשוט לזיהוי כניסה לתצוגה בגלילה
function useInView(threshold = 0.35) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView];
}

// שרטוט קטן לכל שלב — "ציור" קווי שמצייר את עצמו
function StepSketch({ variant, visible, color }) {
  const common = {
    fill: 'none',
    stroke: color,
    strokeWidth: 2.2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    pathLength: 1,
    style: {
      strokeDasharray: 1,
      strokeDashoffset: visible ? 0 : 1,
      transition: 'stroke-dashoffset 1.1s ease-out 0.15s',
    },
  };

  if (variant === 'form') {
    return (
      <svg width="44" height="44" viewBox="0 0 44 44">
        <path d="M10 6h20a2 2 0 0 1 2 2v28a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" {...common} />
        <path d="M14 15h16" {...common} />
        <path d="M14 22h16" {...common} />
        <path d="M14 29h10" {...common} />
        <path d="M31 27l3 3 5-6" {...common} stroke="#22c55e" />
      </svg>
    );
  }
  if (variant === 'routes') {
    return (
      <svg width="44" height="44" viewBox="0 0 44 44">
        <path d="M6 34C14 34 12 12 22 12s6 22 16 22" {...common} />
        <circle cx="6" cy="34" r="2.4" {...common} />
        <circle cx="22" cy="12" r="2.4" {...common} />
        <circle cx="38" cy="34" r="2.4" {...common} />
        <path d="M22 6v-2M22 6l-2.4 2M22 6l2.4 2" {...common} />
      </svg>
    );
  }
  // negotiation
  return (
    <svg width="44" height="44" viewBox="0 0 44 44">
      <path d="M7 11h26a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V13a2 2 0 0 1 2-2Z" {...common} />
      <path d="M5 13l17 13 17-13" {...common} />
      <path d="M28 26l3 3 5-6" {...common} stroke="#22c55e" />
    </svg>
  );
}

// חץ מעוגל שמצייר את עצמו בין שני שלבים
function StepConnector({ flip }) {
  const [ref, visible] = useInView(0.6);
  const d = flip
    ? 'M70 4C40 4 30 46 4 46'
    : 'M4 4C34 4 44 46 70 46';

  return (
    <div ref={ref} className="flex justify-center py-1" dir="ltr">
      <svg width="74" height="50" viewBox="0 0 74 50">
        <path
          d={d}
          fill="none"
          stroke="#BABAFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          pathLength="1"
          style={{
            strokeDasharray: 1,
            strokeDashoffset: visible ? 0 : 1,
            transition: 'stroke-dashoffset 0.8s ease-out',
          }}
        />
        <path
          d={flip ? 'M4 46l8-4M4 46l8 4' : 'M70 46l-8-4M70 46l-8 4'}
          fill="none"
          stroke="#BABAFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength="1"
          style={{
            strokeDasharray: 1,
            strokeDashoffset: visible ? 0 : 1,
            transition: 'stroke-dashoffset 0.4s ease-out 0.8s',
          }}
        />
      </svg>
    </div>
  );
}

function Step({ num, title, text, align, sketch }) {
  const [ref, visible] = useInView(0.3);
  const fromSide = align === 'right' ? 'translate-x-6' : '-translate-x-6';

  return (
    <div ref={ref} className={`flex ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`w-full sm:w-[78%] flex items-start gap-4 p-2 transition-all duration-700 ${
          visible ? 'opacity-100 translate-x-0' : `opacity-0 ${fromSide}`
        }`}
      >
        <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center relative">
          <StepSketch variant={sketch} visible={visible} color="#0153F4" />
          <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#0C084A] text-white text-[11px] font-black flex items-center justify-center shadow">
            {num}
          </span>
        </div>
        <div className="text-right">
          <h3 className="text-[#0C084A] font-black text-base sm:text-lg mb-1">{title}</h3>
          <p className="text-mist-600 text-sm leading-relaxed">{text}</p>
        </div>
      </div>
    </div>
  );
}

const STEPS = [
  {
    num: 1,
    align: 'right',
    sketch: 'form',
    title: 'ממלאים כמה פרטים',
    text: 'פרטים בסיסיים על הנכס, ההכנסה והצרכים שלך — לוקח פחות מ-3 דקות.',
  },
  {
    num: 2,
    align: 'left',
    sketch: 'routes',
    title: 'אנחנו בונים לכם מסלול',
    text: 'המערכת מנתחת את התיק ומפיקה 3 תמהילי משכנתא אופטימליים במיוחד עבורך.',
  },
  {
    num: 3,
    align: 'right',
    sketch: 'negotiation',
    title: 'חוסכים עשרות אלפי שקלים',
    text: 'הגע לבנק עם נתונים, תסריט שיחה ומכתב מקצועי — ותנהל משא ומתן כמו מומחה.',
  },
];

export default function HeroStepsShowcase() {
  return (
    <div className="relative w-full max-w-xl mx-auto mt-[6.5rem] mb-4 px-2 py-10" dir="rtl">
      <div
        className="absolute left-1/2 -translate-x-1/2 w-screen overflow-hidden pointer-events-none"
        style={{ top: '-4rem', height: 'calc(100% + 8rem)' }}
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[85%] min-h-[420px] blur-[70px]"
          style={{ background: 'radial-gradient(ellipse, rgba(186,186,255,0.5) 0%, rgba(186,186,255,0.26) 30%, rgba(186,186,255,0.1) 50%, rgba(186,186,255,0.03) 68%, rgba(186,186,255,0) 82%)' }}
        />
      </div>
      <div className="relative z-10">
        <p className="text-center text-xs font-bold tracking-[0.3em] uppercase text-[#0153F4] mb-6">איך זה עובד?</p>
        <div className="flex flex-col">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.num}>
              <Step {...s} />
              {i < STEPS.length - 1 && <StepConnector flip={s.align === 'right'} />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
