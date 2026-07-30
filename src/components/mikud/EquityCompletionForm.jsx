import React from 'react';
import { Coins, AlertTriangle, CheckCircle, Wallet, TrendingUp, Users, Building2 } from 'lucide-react';
import PremiumInput from './PremiumInput';
import { Checkbox } from '@/components/ui/checkbox';

const formatCurrency = (val) => {
  if (!val || isNaN(val)) return '0';
  return new Intl.NumberFormat('he-IL').format(Math.round(val));
};

const COMPLETION_OPTIONS = [
  { val: 'liquid_equity', label: 'הון עצמי נזיל', icon: Wallet, desc: 'מזומן / חסכונות זמינים מיידית לרכישת הנכס' },
  { val: 'balloon_existing', label: 'שעבוד / בלון על נכס קיים', icon: Building2, desc: 'לקיחת הלוואה בגיבוי הנכס הקיים — כפוף לאישור' },
  { val: 'sale_proceeds', label: 'תמורת מכירת נכס קיים', icon: Building2, desc: 'יתרת נטו לאחר כיסוי המשכנתא הקיימת' },
  { val: 'family_help', label: 'עזרה ממשפחה מדרגה ראשונה', icon: Users, desc: 'הורים / ילדים — ייתכן שידרש תצהיר מתנה (לא נוטריוני)' },
  { val: 'savings', label: 'פירוק חסכונות / קרן השתלמות', icon: Wallet, desc: 'חסכונות נזילים, קרן השתלמות לאחר 6 שנים' },
  { val: 'securities', label: 'מימוש ניירות ערך / תיק השקעות', icon: TrendingUp, desc: 'מניות, קרנות נאמנות, תיק השקעות' },
  { val: 'provident', label: 'משיכת קופת גמל / פנסיה (חלקית)', icon: Coins, desc: 'בכפוף לתנאי הקופה ולגיל — ייתכנו קנסות' },
  { val: 'other', label: 'מקור אחר', icon: Coins, desc: 'ירושה, פיצויים, מימוש עסק — יש לפרט' },
];

export default function EquityCompletionForm({ data, onChange, errors = {}, gap, requiredEquity }) {
  const hasGap = gap > 0;
  const selectedSources = data.completionSources || [];
  const sourceAmounts = data.sourceAmounts || {};

  const getAmount = (val) => (val === 'liquid_equity' ? (data.equity || '') : (sourceAmounts[val] || ''));
  const setAmount = (val, amount) => {
    if (val === 'liquid_equity') onChange({ ...data, equity: amount });
    else onChange({ ...data, sourceAmounts: { ...sourceAmounts, [val]: amount } });
  };

  const toggleSource = (val) => {
    const isSelected = selectedSources.includes(val);
    const next = isSelected ? selectedSources.filter(v => v !== val) : [...selectedSources, val];
    const cleared = {};
    if (isSelected && val === 'liquid_equity') cleared.equity = '';
    if (isSelected && val !== 'liquid_equity') cleared.sourceAmounts = { ...sourceAmounts, [val]: '' };
    onChange({ ...data, completionSources: next, ...cleared });
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">

      {/* משפט פתיחה */}
      {requiredEquity > 0 && (
        <div className="p-4 bg-periwinkle-100 border border-periwinkle-200 rounded-lg">
          <p className="text-sm font-bold text-[#0C084A] text-center">
            נדרשת השלמת הון עצמי של <span className="text-[#0153F4] font-black">₪{formatCurrency(requiredEquity)}</span>
          </p>
        </div>
      )}

      {/* אפשרויות השלמה */}
      <div>
        <p className="text-sm font-black text-[#0C084A] mb-3">כיצד תשלים את ה-₪{formatCurrency(requiredEquity)}? (ניתן לסמן מספר מקורות)</p>
        <div className="space-y-2">
          {COMPLETION_OPTIONS.map(opt => {
            const checked = selectedSources.includes(opt.val);
            const Icon = opt.icon;
            return (
              <div key={opt.val} className="space-y-2">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleSource(opt.val)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSource(opt.val); } }}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${checked ? 'border-[#0153F4] bg-[#0153F4]/10' : 'border-mist-200 bg-white hover:border-[#0C084A]/40'}`}
                >
                  <Checkbox checked={checked} tabIndex={-1} className="mt-0.5 pointer-events-none flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Icon size={15} className={checked ? 'text-[#0153F4]' : 'text-mist-400'} />
                      <span className="text-sm font-bold text-mist-800">{opt.label}</span>
                    </div>
                    <p className="text-xs text-mist-500 mt-0.5">{opt.desc}</p>
                  </div>
                </div>

                {/* אזהרת שעבוד נכס קיים */}
                {checked && opt.val === 'balloon_existing' && (
                  <div className="mr-2 p-4 bg-red-50 border border-red-400 rounded-2xl animate-in fade-in duration-200">
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
                {checked && opt.val === 'family_help' && (
                  <div className="mr-2 p-4 bg-amber-50 border border-amber-400 rounded-2xl animate-in fade-in duration-200">
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

                {/* שדה סכום — מופיע ישירות מתחת למקור המסומן */}
                {checked && (
                  <div className="mr-2">
                    <PremiumInput
                      label={opt.val === 'liquid_equity' ? 'הון עצמי זמין (₪)' : `סכום מ${opt.label} (₪)`}
                      name={`amount_${opt.val}`}
                      value={getAmount(opt.val)}
                      onChange={(_, v) => setAmount(opt.val, v)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* הודעת סיכום — מוצגת ממש מעל כפתורי הניווט */}
      {selectedSources.length > 0 && (
        hasGap ? (
          <div className="p-4 bg-periwinkle-100 rounded-lg text-center">
            <AlertTriangle size={20} className="text-[#0153F4] mx-auto mb-1.5" />
            <p className="font-black text-[#0C084A] text-sm">עדיין חסרים ₪{formatCurrency(gap)} להשלמת ההון העצמי</p>
          </div>
        ) : (
          <div className="p-4 bg-green-50 border border-green-400 rounded-2xl text-center">
            <CheckCircle size={24} className="text-green-600 mx-auto mb-1" />
            <p className="font-black text-green-700 text-sm">ההון העצמי שלך מכסה את מלוא הפער — מצוין!</p>
          </div>
        )
      )}

      {errors.equity && (
        <div className="p-3 bg-red-50 border border-red-400 rounded-xl text-center">
          <p className="text-red-700 text-xs font-bold">{errors.equity}</p>
        </div>
      )}

    </div>
  );
}
