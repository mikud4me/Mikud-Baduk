import React from 'react';
import { Accessibility, Phone, Mail } from 'lucide-react';

export default function AccessibilityStatement() {
  return (
    <div dir="rtl" className="min-h-screen bg-white p-6 font-sans">
      <div className="max-w-2xl mx-auto py-12">
        <Accessibility className="w-12 h-12 text-[#1e3a5f] mb-4" />
        <h1 className="text-2xl font-black text-[#001a33] mb-6">הצהרת נגישות</h1>

        <div className="space-y-6 text-slate-700 leading-relaxed">
          <p>
            אתר "מיקוד משכנתאות" פועל להנגשת השירותים והמידע המוצגים בו לכלל
            הגולשים, ובכלל זה אנשים עם מוגבלות, בהתאם לתקן הישראלי ת"י 5568
            להנגשת תכנים באינטרנט (ברמת AA), התואם את הנחיות WCAG 2.0.
          </p>

          <div>
            <h2 className="text-lg font-bold text-[#001a33] mb-2">אמצעי נגישות באתר</h2>
            <p>
              באתר מותקן תפריט נגישות (הזמין בלחצן נגישות בפינת המסך) המאפשר,
              בין היתר: הגדלת/הקטנת טקסט, שינוי ניגודיות צבעים, גופן ידידותי
              לדיסלקציה, הדגשת קישורים, עצירת אנימציות, סמן מוגדל וסיוע בניווט
              מקלדת.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-[#001a33] mb-2">מגבלות ידועות</h2>
            <p>
              אנו פועלים באופן שוטף לשיפור הנגישות באתר. אם נתקלתם בתוכן או
              רכיב שאינו נגיש, נשמח שתדווחו לנו באמצעות פרטי הקשר שלהלן ונפעל
              לתיקון בהקדם.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-[#001a33] mb-2">רכז נגישות</h2>
            <p>לפניות בנושאי נגישות ניתן לפנות לרכז/ת הנגישות מטעם החברה:</p>
            <p className="mt-2 font-semibold text-[#001a33]">
              [להשלמה: שם רכז/ת הנגישות]
            </p>
            <div className="flex flex-col gap-1 mt-2">
              <a href="tel:2324" className="flex items-center gap-2 text-[#1e3a5f] hover:underline w-fit">
                <Phone size={16} />
                [להשלמה: מספר טלפון ישיר לרכז/ת הנגישות]
              </a>
              <a href="mailto:office@mikud4me.co.il" className="flex items-center gap-2 text-[#1e3a5f] hover:underline w-fit">
                <Mail size={16} />
                office@mikud4me.co.il
              </a>
            </div>
          </div>

          <p className="text-sm text-slate-500 pt-4 border-t border-slate-100">
            הצהרת נגישות זו עודכנה לאחרונה בתאריך: [להשלמה: תאריך עדכון אחרון]
          </p>
        </div>
      </div>
    </div>
  );
}
