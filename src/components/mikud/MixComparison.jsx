import React, { useState } from 'react';
import { Sparkles, ShieldCheck, Zap, TrendingDown, ChevronDown, ChevronUp, Brain, Star } from 'lucide-react';

const fmt = (val) => {
  if (!val || isNaN(val)) return "0";
  return new Intl.NumberFormat('he-IL', { useGrouping: false }).format(Math.round(val));
};

const MIX_META = {
  recommended: {
    icon: Sparkles,
    label: 'מאוזן',
    labelColor: 'from-[#c9a961] to-[#d4b975]',
    borderColor: 'border-[#c9a961]/60',
    glowColor: 'shadow-[0_0_40px_rgba(201,169,97,0.25)]',
    accentColor: '#c9a961',
    strategy: 'תמהיל מותאם אישית',
    rationale: 'חושב דינמית לפי גיל, יחס ההחזר, ה-LTV ויציבות ההכנסה. מיקסום חיסכון תוך שמירה על רמת סיכון מתאימה.',
    pros: ['חלוקה מחושבת לפי פרופיל ספציפי', 'איזון בין חיסכון ליציבות', 'מותאם לתקני בנק ישראל'],
    cons: ['החזר עשוי להשתנות עם שינויי ריבית'],
    riskLabel: 'סיכון מאוזן',
    riskColor: 'text-blue-400',
    badge: '✦ אסטרטגי',
  },
  conservative: {
    icon: ShieldCheck,
    label: 'שמרני',
    labelColor: 'from-blue-400 to-blue-500',
    borderColor: 'border-blue-400/30',
    glowColor: 'shadow-[0_0_30px_rgba(96,165,250,0.12)]',
    accentColor: '#60a5fa',
    strategy: 'יציבות מקסימלית',
    rationale: 'כל הסכום בריבית קבועה לא צמודה — ההחזר החודשי לא ישתנה לאורך כל התקופה.',
    pros: ['החזר קבוע ומוכר לכל החיים', 'אפס חשיפה לשינויי ריבית', 'תכנון תזרים פשוט'],
    cons: ['עלות כוללת גבוהה יותר', 'לא מנצל ירידות ריבית'],
    riskLabel: 'סיכון נמוך',
    riskColor: 'text-green-400',
    badge: '🛡️ בטוח',
  },
  prime: {
    icon: Zap,
    label: 'פריים',
    labelColor: 'from-amber-400 to-orange-500',
    borderColor: 'border-amber-400/30',
    glowColor: 'shadow-[0_0_30px_rgba(251,191,36,0.12)]',
    accentColor: '#f59e0b',
    strategy: 'מקסום חיסכון',
    rationale: 'חצי בפריים וחצי בקל"צ. מתאים להכנסה גבוהה ולמי שמאמין שהריבית תרד.',
    pros: ['חיסכון משמעותי אם הפריים יורד', 'גמישות גבוהה'],
    cons: ['חשיפה גבוהה לעליות ריבית', 'החזר עשוי לעלות'],
    riskLabel: 'סיכון גבוה יותר',
    riskColor: 'text-amber-400',
    badge: '⚡ חיסכון',
  },
};

function MixCard({ title, subtitle, tracks, totalPmt, isRecommended, mixType = 'recommended', loanAmount, durationYears, saving, isValid = true }) {
  const [expanded, setExpanded] = useState(false);
  const meta = MIX_META[mixType] || MIX_META.recommended;
  const Icon = meta.icon;

  const totalPayment = totalPmt * (durationYears || 25) * 12;
  const totalInterest = loanAmount ? totalPayment - loanAmount : null;

  return (
    <div
      dir="rtl"
      className={`
        relative flex flex-col rounded-3xl border overflow-hidden text-right
        bg-gradient-to-b from-[#0f1e35] to-[#0a1628]
        ${isValid ? meta.borderColor : 'border-red-500/60'} ${isValid ? meta.glowColor : 'shadow-[0_0_30px_rgba(239,68,68,0.2)]'}
        transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1
      `}
      style={{
        boxShadow: !isValid
          ? '0 8px 32px rgba(239,68,68,0.2), 0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)'
          : isRecommended
          ? '0 8px 32px rgba(201,169,97,0.2), 0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)'
          : '0 8px 24px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      {/* פס עליון מואר */}
      <div
        className={`h-0.5 w-full bg-gradient-to-r ${isValid ? meta.labelColor : 'from-red-500 to-red-600'}`}
        style={{ boxShadow: isValid ? `0 0 12px ${meta.accentColor}80` : '0 0 12px rgba(239,68,68,0.8)' }}
      />

      {/* שכבת אזהרה אם תמהיל לא תקין */}
      {!isValid && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-red-950/80 backdrop-blur-sm rounded-3xl p-6 text-center">
          <div className="text-4xl mb-3">⛔</div>
          <p className="text-red-300 font-black text-base mb-2">תמהיל זה חורג מכושר ההחזר שלך</p>
          <p className="text-red-400/80 text-xs leading-relaxed">
            ההחזר החודשי של תמהיל זה עולה על 40% מהכנסתך הפנויה — הבנק לא יאשר אותו בסטנדרט רגיל.
          </p>
          <div className="mt-4 px-4 py-2.5 rounded-xl bg-amber-500/20 border border-amber-400/40">
            <p className="text-amber-300 text-[11px] font-bold">💡 ניתן לשקול מסלולים צמודי מדד בלבד, הגדלת הכנסות, או הקטנת סכום ההלוואה</p>
          </div>
        </div>
      )}

      {/* תג */}
      <div className="absolute top-4 left-4 z-10">
        <span
          className={`text-[10px] font-black px-3 py-1 rounded-full bg-gradient-to-r ${meta.labelColor} text-white shadow-lg`}
          style={{ boxShadow: `0 0 10px ${meta.accentColor}60` }}
        >
          {meta.badge}
        </span>
      </div>

      {/* ראש הכרטיס */}
      <div className="px-6 pt-10 pb-6">
        {/* אייקון */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 relative"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${meta.accentColor}40, ${meta.accentColor}10)`,
            border: `1px solid ${meta.accentColor}40`,
            boxShadow: `0 4px 16px ${meta.accentColor}30, inset 0 1px 0 rgba(255,255,255,0.1)`,
          }}
        >
          <Icon size={24} style={{ color: meta.accentColor }} />
          {/* ברק */}
          <div
            className="absolute inset-0 rounded-2xl"
            style={{ background: `radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1), transparent 60%)` }}
          />
        </div>

        <h3 className="text-white font-black text-lg leading-tight mb-1">{title}</h3>
        <p className="text-white/50 text-xs font-medium leading-relaxed mb-5">{subtitle || meta.strategy}</p>

        {/* כרטיס מחיר ראשי */}
        <div
          className="rounded-2xl p-5 text-center relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${meta.accentColor}18, ${meta.accentColor}08)`,
            border: `1px solid ${meta.accentColor}30`,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 16px rgba(0,0,0,0.3)`,
          }}
        >
          <div
            className="absolute inset-0 rounded-2xl"
            style={{ background: `radial-gradient(ellipse at 50% 0%, ${meta.accentColor}15, transparent 70%)` }}
          />
          <p className="text-white/50 text-[11px] font-semibold mb-1 relative z-10">החזר חודשי</p>
          <p
            className="text-4xl font-black relative z-10"
            style={{ color: meta.accentColor, textShadow: `0 0 20px ${meta.accentColor}60` }}
          >
            ₪{fmt(Math.floor(totalPmt))}
          </p>
          <p className="text-white/30 text-[10px] mt-1 relative z-10">לחודש</p>
        </div>

        {/* חיסכון / ריבית */}
        {saving != null ? (
          <div className="mt-3 rounded-xl p-3 text-center"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}>
            <p className="text-green-400/70 text-[10px] font-semibold">חיסכון כולל בתקופה</p>
            <p className={`text-base font-black ${saving > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {saving > 0 ? '+' : ''}₪{fmt(Math.abs(Math.floor(saving)))}
            </p>
          </div>
        ) : totalInterest !== null && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl p-2.5 text-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-white/40 text-[9px] font-semibold">סה"כ ריבית</p>
              <p className="text-red-400 font-black text-xs">₪{fmt(Math.floor(totalInterest))}</p>
            </div>
            <div className="rounded-xl p-2.5 text-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-white/40 text-[9px] font-semibold">סה"כ לתשלום</p>
              <p className="text-white font-black text-xs">₪{fmt(Math.floor(totalPayment))}</p>
            </div>
          </div>
        )}
      </div>

      {/* מסלולים */}
      <div className="px-6 pb-4 space-y-2">
        <div className="h-px bg-white/5 mb-3" />
        {tracks.map((track, idx) => (
          <div
            key={idx}
            className="rounded-xl p-3 flex items-center justify-between gap-2"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
            }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-white/90 font-bold text-xs leading-tight truncate">{track.name}</p>
              <p className="text-white/30 text-[10px] truncate">{track.desc}</p>
            </div>
            <div className="text-center flex-shrink-0 px-2">
              <p className="font-black text-xs" style={{ color: meta.accentColor }}>
                {(track.rate * 100).toFixed(2)}%
              </p>
              <p className="text-white/30 text-[9px]">{track.years} שנה</p>
            </div>
            <div className="text-left flex-shrink-0">
              <p className="font-black text-sm text-white">₪{fmt(Math.floor(track.pmt))}</p>
            </div>
          </div>
        ))}
        {/* סה"כ */}
        <div
          className="rounded-xl p-3 flex items-center justify-between"
          style={{
            background: `linear-gradient(135deg, ${meta.accentColor}18, ${meta.accentColor}08)`,
            border: `1px solid ${meta.accentColor}30`,
          }}
        >
          <span className="font-black text-xs text-white/80">סה"כ לחודש</span>
          <span className="font-black text-base" style={{ color: meta.accentColor }}>₪{fmt(Math.floor(totalPmt))}</span>
        </div>
      </div>

      {/* הסבר אסטרטגי */}
      <div className="px-6 pb-6">
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center justify-between py-2 text-right transition-opacity hover:opacity-80"
        >
          <span className="text-[11px] font-bold text-white/50">למה בחרנו תמהיל זה?</span>
          {expanded
            ? <ChevronUp size={14} className="text-white/30" />
            : <ChevronDown size={14} className="text-white/30" />
          }
        </button>
        {expanded && (
          <div className="mt-3 space-y-3 animate-in fade-in duration-300">
            <p className="text-white/60 text-xs leading-relaxed">{meta.rationale}</p>
            <div className="space-y-2">
              <div className="rounded-xl p-3"
                style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <p className="text-green-400 text-[10px] font-bold mb-1">יתרונות</p>
                {meta.pros.map((p, i) => (
                  <p key={i} className="text-green-400/70 text-[10px]">✓ {p}</p>
                ))}
              </div>
              <div className="rounded-xl p-3"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <p className="text-red-400 text-[10px] font-bold mb-1">חסרונות</p>
                {meta.cons.map((c, i) => (
                  <p key={i} className="text-red-400/70 text-[10px]">✗ {c}</p>
                ))}
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

// טיפ AI
function AiTip({ text }) {
  if (!text) return null;
  return (
    <div
      dir="rtl"
      className="rounded-3xl p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0f1e35, #0a1628)',
        border: '1px solid rgba(201,169,97,0.3)',
        boxShadow: '0 8px 32px rgba(201,169,97,0.1), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* זוהר ברקע */}
      <div
        className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(201,169,97,0.1), transparent 70%)', transform: 'translate(30%, -30%)' }}
      />
      <div className="flex items-start gap-4 relative z-10">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(201,169,97,0.4), rgba(201,169,97,0.1))',
            border: '1px solid rgba(201,169,97,0.4)',
            boxShadow: '0 4px 16px rgba(201,169,97,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
        >
          <Brain size={22} className="text-[#c9a961]" />
        </div>
        <div>
          <p className="text-[#c9a961] font-black text-sm mb-1 flex items-center gap-1">
            <Star size={12} fill="currentColor" /> המלצת AI
          </p>
          <p className="text-white/70 text-xs leading-relaxed">{text}</p>
        </div>
      </div>
    </div>
  );
}

export default function MixComparison({ mixA, mixB, mixC, loanAmount, durationYears, isRefinance, aiTip, isPurchased, isDeclarationApprovalPossible, minMix, totalIncome }) {
  const aiText = aiTip || (isPurchased
    ? `על בסיס הפרופיל שלך, התמהיל המאוזן מציע את האיזון הטוב ביותר בין יציבות לחיסכון בריבית.`
    : null);

  return (
    <div dir="rtl" className="space-y-6">
      {/* כותרת */}
      <div className="text-center relative">
        <div
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-4"
          style={{
            background: 'rgba(201,169,97,0.1)',
            border: '1px solid rgba(201,169,97,0.3)',
            boxShadow: '0 0 20px rgba(201,169,97,0.1)',
          }}
        >
          <Sparkles size={14} className="text-[#c9a961]" />
          <span className="text-[#c9a961] font-bold text-xs tracking-wider">3 תמהילים מומלצים</span>
        </div>
        <h3
          className="text-2xl sm:text-3xl font-black text-white leading-tight"
          style={{ textShadow: '0 0 40px rgba(201,169,97,0.3)' }}
        >
          בחרו את התמהיל המתאים לכם
        </h3>
        <p className="text-white/40 text-sm mt-2">מחושב לפי נתוני השוק ופרופיל הלווה</p>
      </div>

      {/* גריד הכרטיסים */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <MixCard
          title={isRefinance ? mixB.label : 'תמהיל אסטרטגי'}
          subtitle={isRefinance ? mixB.subtitle : undefined}
          tracks={mixB.tracks}
          totalPmt={mixB.total}
          isRecommended={false}
          mixType="recommended"
          loanAmount={loanAmount}
          durationYears={durationYears}
          saving={isRefinance ? mixB.saving : undefined}
          isValid={mixB.isValid !== false}
        />
        <MixCard
          title={isRefinance ? mixA.label : 'תמהיל שמרני'}
          subtitle={isRefinance ? mixA.subtitle : undefined}
          tracks={mixA.tracks}
          totalPmt={mixA.total}
          mixType="conservative"
          loanAmount={loanAmount}
          durationYears={durationYears}
          saving={isRefinance ? mixA.saving : undefined}
          isValid={mixA.isValid !== false}
        />
        <MixCard
          title={isRefinance ? mixC.label : 'תמהיל פריים'}
          subtitle={isRefinance ? mixC.subtitle : undefined}
          tracks={mixC.tracks}
          totalPmt={mixC.total}
          mixType="prime"
          loanAmount={loanAmount}
          durationYears={durationYears}
          saving={isRefinance ? mixC.saving : undefined}
          isValid={mixC.isValid !== false}
        />
      </div>

      {/* הודעת אישור על בסיס תצהיר — כשהתשלום המינימלי עובר את הבדיקה */}
      {!isRefinance && isDeclarationApprovalPossible && (
        <div
          dir="rtl"
          className="rounded-2xl p-5 border-2 border-amber-500 bg-amber-950"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">📋</span>
            <div>
              <p className="text-amber-300 font-black text-sm mb-1">אפשרות: אישור על בסיס תצהיר</p>
              <p className="text-amber-100 text-xs leading-relaxed">
                על בסיס התשלום המינימלי המחושב (⅓ קבועה צמודה + ⅔ משתנה צמודה לתקופה מלאה), ניתן לקבל אישור עקרוני על פי <strong className="text-white">הצהרה עצמית של הלווה</strong> בפני הבנק.
              </p>
              <div className="mt-2 px-3 py-2 rounded-xl bg-red-900/60 border border-red-400/50">
                <p className="text-red-300 text-[11px] font-bold">⚠️ חשוב: מסלול זה אינו מומלץ — הוא מוגביל, עלול לדרוש ערבים נוספים, ומסייג את כושר המשכון העתידי. מומלץ מאוד להתייעץ עם יועץ לפני בחירה במסלול זה.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* אזהרה: לא ניתן לאשר בכלל — גם לא על בסיס תצהיר */}
      {!isRefinance && !isDeclarationApprovalPossible && totalIncome > 0 && minMix && (
        <div
          dir="rtl"
          className="rounded-2xl p-5 border-2 border-red-500/60"
          style={{ background: 'linear-gradient(135deg, rgba(220,38,38,0.12), rgba(220,38,38,0.05))' }}
        >
          <div className="flex items-start gap-3">
            <span className="text-3xl flex-shrink-0">🚫</span>
            <div className="w-full">
              <p className="text-red-300 font-black text-sm mb-1">לא ניתן לאשר אישור עקרוני — גם לא על בסיס תצהיר</p>
              <p className="text-red-200/70 text-xs leading-relaxed mb-3">
                ההכנסה הנוכחית (<strong className="text-white">₪{fmt(Math.floor(totalIncome))}</strong>) אינה עומדת בדרישת ההכנסה המינימלית לתשלום הבסיסי ביותר (<strong className="text-white">₪{fmt(Math.floor(minMix.requiredIncome))}</strong>).
                חסר <strong className="text-red-300">₪{fmt(Math.floor(minMix.requiredIncome - totalIncome))}</strong> נטו לחודש.
              </p>
              <div className="space-y-2">
                <p className="text-white/60 text-[11px] font-black uppercase tracking-wide mb-1">אפשרויות לפתרון:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-amber-300 text-xs font-black mb-0.5">💰 הגדלת הכנסות</p>
                    <p className="text-white/60 text-[11px]">נדרשת הכנסה נוספת של לפחות ₪{fmt(Math.floor(minMix.requiredIncome - totalIncome))} נטו/חודש</p>
                  </div>
                  <div className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-blue-300 text-xs font-black mb-0.5">👤 הוספת לווה נוסף</p>
                    <p className="text-white/60 text-[11px]">לווה עם הכנסה חודשית של ₪{fmt(Math.floor((minMix.requiredIncome - totalIncome) * 2))}+ (מוכר ב-50%)</p>
                  </div>
                  <div className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-green-300 text-xs font-black mb-0.5">🏦 מימון חוץ-בנקאי</p>
                    <p className="text-white/60 text-[11px]">חברות חוץ-בנקאיות פועלות בקריטריונים גמישים יותר — ריביות 8%–18%</p>
                  </div>
                  <div className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-purple-300 text-xs font-black mb-0.5">📞 ייעוץ מקצועי</p>
                    <p className="text-white/60 text-[11px]">פנה ליועץ משכנתאות ב-<strong className="text-white">2324*</strong> לתכנון אסטרטגי מותאם</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* טיפ AI */}
      {aiText && <AiTip text={aiText} />}
    </div>
  );
}