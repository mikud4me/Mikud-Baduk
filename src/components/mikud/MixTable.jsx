import React, { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, TrendingDown, ShieldCheck, Zap } from 'lucide-react';

const formatCurrency = (val) => {
  if (!val || isNaN(val)) return "0";
  return new Intl.NumberFormat('he-IL', { useGrouping: false }).format(Math.round(val));
};

const MIX_META = {
  recommended: {
    icon: Sparkles,
    strategy: 'תמהיל מותאם אישית לפרופיל הלקוח',
    rationale: 'התמהיל חושב דינמית לפי גיל, יחס ההחזר, ה-LTV ויציבות ההכנסה. חלוקת הפריים/קבועה/משתנה מותאמת אישית — לא חלוקה גנרית. מטרה: מיקסום חיסכון תוך שמירה על רמת סיכון המתאימה לפרופיל.',
    pros: ['חלוקה מחושבת לפי פרופיל ספציפי', 'איזון בין חיסכון ליציבות', 'מותאם לתקני בנק ישראל'],
    cons: ['החזר עשוי להשתנות עם שינויי ריבית'],
    riskLabel: 'סיכון מאוזן',
    riskColor: 'text-blue-600',
  },
  conservative: {
    icon: ShieldCheck,
    strategy: 'תמהיל שמרני — יציבות מקסימלית',
    rationale: 'כל הסכום בריבית קבועה לא צמודה — ההחזר החודשי לא ישתנה לאורך כל התקופה. מתאים ללקוחות שמעדיפים ודאות מוחלטת.',
    pros: ['החזר קבוע ומוכר לכל החיים', 'אפס חשיפה לשינויי ריבית', 'תכנון תזרים פשוט'],
    cons: ['עלות כוללת גבוהה יותר', 'לא מנצל ירידות ריבית'],
    riskLabel: 'סיכון נמוך',
    riskColor: 'text-green-600',
  },
  prime: {
    icon: Zap,
    strategy: 'תמהיל פריים — מקסום חיסכון',
    rationale: 'חצי בפריים וחצי בקל"צ. מתאים ללקוחות עם הכנסה גבוהה שיכולים לספוג שינויים בהחזר, ומאמינים שריבית הפריים תרד.',
    pros: ['חיסכון משמעותי אם הפריים יורד', 'גמישות גבוהה'],
    cons: ['חשיפה גבוהה לעליות ריבית', 'החזר עשוי לעלות'],
    riskLabel: 'סיכון גבוה יותר',
    riskColor: 'text-amber-600',
  },
};

export default function MixTable({ title, subtitle, tracks, totalPmt, isRecommended, mixType = 'recommended', loanAmount, durationYears, saving }) {
  const [expanded, setExpanded] = useState(isRecommended);
  const meta = MIX_META[mixType] || MIX_META.recommended;
  const Icon = meta.icon;

  const totalPayment = totalPmt * durationYears * 12;
  const totalInterest = loanAmount ? totalPayment - loanAmount : null;

  return (
    <div
      className={`bg-white rounded-2xl overflow-hidden shadow-md border-2 text-right w-full relative flex flex-col transition-all duration-300 hover:shadow-xl ${isRecommended ? 'border-[#c9a961]' : 'border-gray-200'}`}
      dir="rtl"
    >
      {/* פס צבע עליון */}
      <div className={`h-1.5 w-full ${isRecommended ? 'bg-gradient-to-r from-[#c9a961] to-[#d4b975]' : 'bg-gray-200'}`} />

      {isRecommended && (
        <div className="absolute top-3 left-3 z-10">
          <div className="bg-gradient-to-r from-[#c9a961] to-[#d4b975] text-white px-3 py-1 rounded-full font-bold text-[10px] shadow flex items-center gap-1">
            <Sparkles size={10} />
            מומלץ
          </div>
        </div>
      )}

      {/* כותרת + סכום */}
      <div className={`p-4 sm:p-5 ${isRecommended ? 'bg-gradient-to-br from-[#1e3a5f] to-[#162e4a]' : 'bg-gray-50'}`}>
        <div className="flex items-center gap-2 mb-2">
          <Icon size={16} className={isRecommended ? 'text-[#c9a961]' : 'text-gray-500'} />
          <h4 className={`text-sm sm:text-base font-black leading-tight ${isRecommended ? 'text-white' : 'text-[#1e3a5f]'}`}>{title}</h4>
        </div>
        <p className={`text-[11px] mb-3 leading-snug ${isRecommended ? 'text-white/70' : 'text-gray-500'}`}>{subtitle || meta.strategy}</p>
        <div className={`rounded-xl px-4 py-3 text-center ${isRecommended ? 'bg-white/15 border border-white/20' : 'bg-[#1e3a5f]'}`}>
          <p className="text-[10px] text-white/60 font-semibold mb-0.5">החזר חודשי</p>
          <p className="text-2xl sm:text-3xl font-black text-white">₪{formatCurrency(Math.floor(totalPmt))}</p>
        </div>
        {saving != null ? (
          <div className="mt-2">
            <div className={`rounded-lg px-3 py-2 text-center ${isRecommended ? 'bg-green-500/20 border border-green-400' : 'bg-green-50 border border-green-300'}`}>
              <p className={`text-[9px] font-semibold ${isRecommended ? 'text-green-300' : 'text-green-600'}`}>חיסכון כולל בתקופה</p>
              <p className={`text-base font-black ${saving > 0 ? (isRecommended ? 'text-green-300' : 'text-green-600') : 'text-red-400'}`}>
                {saving > 0 ? '+' : ''}₪{formatCurrency(Math.abs(Math.floor(saving)))}
              </p>
            </div>
          </div>
        ) : totalInterest !== null && (
          <div className="mt-2 grid grid-cols-2 gap-2 text-center">
            <div className={`rounded-lg px-2 py-1.5 ${isRecommended ? 'bg-white/10' : 'bg-white border border-gray-200'}`}>
              <p className={`text-[9px] font-semibold ${isRecommended ? 'text-white/60' : 'text-gray-400'}`}>סה"כ ריבית</p>
              <p className={`text-xs font-black ${isRecommended ? 'text-red-300' : 'text-red-500'}`}>₪{formatCurrency(Math.floor(totalInterest))}</p>
            </div>
            <div className={`rounded-lg px-2 py-1.5 ${isRecommended ? 'bg-white/10' : 'bg-white border border-gray-200'}`}>
              <p className={`text-[9px] font-semibold ${isRecommended ? 'text-white/60' : 'text-gray-400'}`}>סה"כ לתשלום</p>
              <p className={`text-xs font-black ${isRecommended ? 'text-white' : 'text-[#1e3a5f]'}`}>₪{formatCurrency(Math.floor(totalPayment))}</p>
            </div>
          </div>
        )}
      </div>

      {/* טבלת מסלולים */}
      <div className="flex-1 p-3 sm:p-4 space-y-2">
        {tracks.map((track, idx) => (
          <div key={idx} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-100 hover:border-[#c9a961]/30 transition-colors">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-xs text-[#1e3a5f] leading-tight truncate">{track.name}</p>
              <p className="text-[10px] text-gray-400 leading-tight truncate">{track.desc}</p>
            </div>
            <div className="text-center flex-shrink-0 px-2">
              <p className="text-[#c9a961] font-black text-xs">{(track.rate * 100).toFixed(2)}%</p>
              <p className="text-gray-400 text-[9px]">{track.years} שנה</p>
            </div>
            <div className="text-left flex-shrink-0">
              <p className="font-black text-sm text-[#1e3a5f]">₪{formatCurrency(Math.floor(track.pmt))}</p>
              <p className="text-[9px] text-gray-400 text-center">לחודש</p>
            </div>
          </div>
        ))}
      </div>

      {/* הסבר אסטרטגי — ניתן לפתוח/סגור */}
      <div className="border-t border-gray-100">
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-right"
        >
          <span className="text-[11px] font-bold text-[#1e3a5f]">למה בחרנו תמהיל זה?</span>
          {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </button>
        {expanded && (
          <div className="px-4 pb-4 space-y-3">
            <p className="text-xs text-gray-700 leading-relaxed">{meta.rationale}</p>
            <div className="grid grid-cols-1 gap-2">
              <div className="bg-green-50 border-r-4 border-green-400 rounded-lg p-3">
                <p className="text-[10px] font-bold text-green-700 mb-1">יתרונות</p>
                {meta.pros.map((p, i) => <p key={i} className="text-[10px] text-green-600">✓ {p}</p>)}
              </div>
              <div className="bg-red-50 border-r-4 border-red-300 rounded-lg p-3">
                <p className="text-[10px] font-bold text-red-600 mb-1">חסרונות</p>
                {meta.cons.map((c, i) => <p key={i} className="text-[10px] text-red-500">✗ {c}</p>)}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingDown size={12} className={meta.riskColor} />
              <span className={`text-[10px] font-bold ${meta.riskColor}`}>{meta.riskLabel}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}