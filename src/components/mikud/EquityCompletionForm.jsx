import React from 'react';
import { Coins, AlertTriangle, CheckCircle, Wallet, TrendingUp, Users, Building2 } from 'lucide-react';
import PremiumInput from './PremiumInput';

const formatCurrency = (val) => {
  if (!val || isNaN(val)) return '0';
  return new Intl.NumberFormat('he-IL').format(Math.round(val));
};

export default function EquityCompletionForm({ data, onChange, errors = {}, gap }) {
  const update = (name, value) => onChange({ ...data, [name]: value });
  const hasGap = gap > 0;

  const COMPLETION_OPTIONS = [
    { val: 'balloon_existing', label: 'שעבוד / בלון על נכס קיים', icon: Building2, desc: 'לקיחת הלוואה בגיבוי הנכס הקיים — כפוף לאישור' },
    { val: 'sale_proceeds', label: 'תמורת מכירת נכס קיים', icon: Building2, desc: 'יתרת נטו לאחר כיסוי המשכנתא הקיימת' },
    { val: 'family_help', label: 'עזרה ממשפחה מדרגה ראשונה', icon: Users, desc: 'הורים / ילדים — ייתכן שידרש תצהיר מתנה (לא נוטריוני)' },
    { val: 'savings', label: 'פירוק חסכונות / קרן השתלמות', icon: Wallet, desc: 'חסכונות נזילים, קרן השתלמות לאחר 6 שנים' },
    { val: 'securities', label: 'מימוש ניירות ערך / תיק השקעות', icon: TrendingUp, desc: 'מניות, קרנות נאמנות, תיק השקעות' },
    { val: 'provident', label: 'משיכת קופת גמל / פנסיה (חלקית)', icon: Coins, desc: 'בכפוף לתנאי הקופה ולגיל — ייתכנו קנסות' },
    { val: 'other', label: 'מקור אחר', icon: Coins, desc: 'ירושה, פיצויים, מימוש עסק — יש לפרט' },
  ];

  const selectedSources = data.completionSources || [];
  const toggleSource = (val) => {
    const next = selectedSources.includes(val)
      ? selectedSources.filter(v => v !== val)
      : [...selectedSources, val];
    update('completionSources', next);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">

      {/* כרטיס פער */}
      {hasGap && (
        <div className="p-5 bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-400 rounded-2xl text-center">
          <AlertTriangle size={28} className="text-red-500 mx-auto mb-2" />
          <p className="font-black text-red-700 text-base">נדרשת השלמת הון עצמי</p>
          <p className="text-4xl font-black text-red-600 my-2">₪{formatCurrency(gap)}</p>
          <p className="text-xs text-red-600 font-bold">
            הפער בין שווי הנכס לבין סכום המשכנתא + ההון העצמי שהוזן
          </p>
        </div>
      )}

      {!hasGap && (
        <div className="p-4 bg-green-50 border-2 border-green-400 rounded-2xl text-center">
          <CheckCircle size={24} className="text-green-600 mx-auto mb-1" />
          <p className="font-black text-green-700 text-sm">ההון העצמי שלך מכסה את מלוא הפער — מצוין!</p>
        </div>
      )}

      {hasGap && (
        <>
          <div>
            <p className="text-sm font-black text-[#1e3a5f] mb-3">כיצד תשלים את ה-₪{formatCurrency(gap)} החסרים? (ניתן לסמן מספר מקורות)</p>
            <div className="space-y-2">
              {COMPLETION_OPTIONS.map(opt => {
                const checked = selectedSources.includes(opt.val);
                const Icon = opt.icon;
                return (
                  <label
                    key={opt.val}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${checked ? 'border-[#c9a961] bg-[#c9a961]/10' : 'border-gray-200 bg-white hover:border-[#1e3a5f]/40'}`}
                  >
                    <input
                      type="checkbox"
                      className="w-5 h-5 mt-0.5 rounded accent-[#1e3a5f] flex-shrink-0"
                      checked={checked}
                      onChange={() => toggleSource(opt.val)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Icon size={15} className={checked ? 'text-[#c9a961]' : 'text-gray-400'} />
                        <span className="text-sm font-bold text-gray-800">{opt.label}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* אזהרת שעבוד נכס קיים */}
          {selectedSources.includes('balloon_existing') && (
            <div className="p-4 bg-red-50 border-2 border-red-400 rounded-2xl animate-in fade-in duration-200">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-black text-red-700 text-sm">אזהרה: שעבוד נכס קיים</p>
                  <p className="text-xs text-red-600 mt-1 leading-relaxed">
                    השלמת הון עצמי ממשכנתא/שעבוד על נכס קיים <strong>מגדילה את ה-DTI הכולל שלך</strong>.
                    הבנק יחשב את ההחזר על ההלוואה הנוספת ועלול לדחות את הבקשה.
                    <strong> מומלץ להתייעץ עם יועץ לפני.</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* אזהרת עזרת משפחה */}
          {selectedSources.includes('family_help') && (
            <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-2xl animate-in fade-in duration-200">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-black text-amber-700 text-sm">עזרת משפחה — מה הבנק ידרוש?</p>
                  <p className="text-xs text-amber-600 mt-1 leading-relaxed">
                   הבנק ידרוש <strong>תצהיר מתנה</strong> (לא נוטריוני) המאשר שהסכום הוא מתנה ולא הלוואה.
                   אם מדובר בהלוואה ממשפחה — יחושב כהתחייבות ב-DTI.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* סכום שהושלם */}
          {selectedSources.length > 0 && (
            <PremiumInput
              label="סכום ההשלמה המתוכנן בפועל (₪)"
              name="completionAmount"
              value={data.completionAmount || ''}
              placeholder={`נדרש ₪${formatCurrency(gap)}`}
              icon={Coins}
              onChange={update}
              tooltip="הסכום הכולל שתוכל לגייס מכל המקורות שציינת"
            />
          )}
        </>
      )}

      {/* הון עצמי */}
      <PremiumInput
        label="הון עצמי זמין למשכנתא (₪)"
        name="equity"
        value={data.equity || ''}
        placeholder="סכום הון עצמי נזיל"
        icon={Wallet}
        onChange={update}
        error={errors.equity}
        tooltip="הסכום שיש לכם במזומן/חסכונות למטרת רכישת הנכס"
      />

    </div>
  );
}