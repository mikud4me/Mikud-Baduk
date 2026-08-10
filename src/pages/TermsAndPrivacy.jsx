import React from 'react';
import { FileText, ShieldCheck, Phone, Mail } from 'lucide-react';

export default function TermsAndPrivacy() {
  return (
    <div dir="rtl" className="min-h-screen bg-white p-6 font-sans">
      <div className="max-w-2xl mx-auto py-12">
        <FileText className="w-12 h-12 text-[#1e3a5f] mb-4" />
        <h1 className="text-2xl font-black text-[#001a33] mb-6">תנאי שימוש ומדיניות פרטיות</h1>

        <section id="terms" className="scroll-mt-6">
          <h2 className="text-xl font-black text-[#001a33] mb-4 pb-2 border-b border-slate-100">תנאי שימוש</h2>
          <div className="space-y-6 text-slate-700 leading-relaxed">
            <p>
              השימוש באתר "מיקוד משכנתאות" (״האתר״) כפוף לתנאים המפורטים להלן. גלישה
              באתר ו/או שימוש בשירותיו מהווים הסכמה לתנאים אלה.
            </p>

            <div>
              <h3 className="text-lg font-bold text-[#001a33] mb-2">אופי השירות</h3>
              <p>
                הכלים המוצגים באתר, לרבות בדיקת זכאות למחזור משכנתא וניתוח מסמכים,
                נועדו למתן מידע כללי והערכה ראשונית בלבד. התוצאות המוצגות אינן מהוות
                הצעה מחייבת, ייעוץ משכנתאות רשמי או התחייבות של בנק כלשהו, ואינן
                מהוות תחליף לייעוץ פרטני מול יועץ מוסמך. אישור סופי של כל עסקה כפוף
                לבדיקת הבנק ולתנאיו.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#001a33] mb-2">שימוש הוגן באתר</h3>
              <p>
                אין להשתמש באתר למטרה בלתי חוקית, אין להעלות תכנים או מסמכים שאינם
                שייכים למשתמש או שהוא אינו רשאי להעביר, ואין לנסות לשבש את פעילות
                האתר או לעקוף את אמצעי האבטחה בו.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#001a33] mb-2">קניין רוחני</h3>
              <p>
                כל הזכויות בתכני האתר, לרבות עיצוב, טקסטים, סימנים מסחריים וקוד,
                שייכות למיקוד משכנתאות בע"מ או לצדדים שלישיים שהעניקו לה רישיון
                שימוש, ואין להעתיקן או להשתמש בהן ללא אישור מראש ובכתב.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#001a33] mb-2">הגבלת אחריות</h3>
              <p>
                השימוש באתר נעשה באחריות המשתמש בלבד. החברה אינה אחראית לכל נזק,
                ישיר או עקיף, שייגרם כתוצאה מהסתמכות על מידע המוצג באתר או כתוצאה
                מתקלה טכנית, זמינות חלקית או הפרעה בפעילות האתר.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#001a33] mb-2">שינויים בתנאים</h3>
              <p>
                החברה רשאית לעדכן תנאים אלה מעת לעת. הנוסח המחייב הוא הנוסח המפורסם
                באתר במועד השימוש. דין ישראל יחול על תנאים אלה, וסמכות השיפוט הבלעדית
                נתונה לבתי המשפט המוסמכים בישראל.
              </p>
            </div>
          </div>
        </section>

        <section id="privacy" className="scroll-mt-6 mt-12">
          <h2 className="text-xl font-black text-[#001a33] mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#1e3a5f]" />
            מדיניות פרטיות
          </h2>
          <div className="space-y-6 text-slate-700 leading-relaxed">
            <div>
              <h3 className="text-lg font-bold text-[#001a33] mb-2">כללי</h3>
              <p>
                מדיניות זו מסבירה כיצד מיקוד משכנתאות בע"מ ("החברה", "אנחנו") אוספת,
                משתמשת ושומרת על מידע אישי שנמסר לה על ידי משתמשי האתר, בהתאם לחוק
                הגנת הפרטיות, התשמ"א-1981.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#001a33] mb-2">איזה מידע נאסף</h3>
              <p>
                בעת השימוש באתר ייתכן שנאסוף פרטים כגון שם מלא, מספר תעודת זהות,
                מספר טלפון, כתובת דוא"ל, וכן מסמכים ונתוני משכנתא שהמשתמש בוחר להעלות
                לצורך בדיקת זכאות למחזור משכנתא וקבלת ניתוח מותאם אישית.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#001a33] mb-2">כיצד נעשה שימוש במידע</h3>
              <p>
                המידע משמש אותנו ליצירת קשר עם המשתמש, להפקת בדיקת הזכאות והדוחות
                המבוקשים, לעיבוד תשלומים במקרה הרלוונטי, לשיפור השירות ולעמידה
                בדרישות רגולטוריות.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#001a33] mb-2">מסירת מידע לצדדים שלישיים</h3>
              <p>
                החברה עשויה להיעזר בספקי שירות חיצוניים לצורך אחסון מאובטח של מידע
                ומסמכים, ניתוח ממוחשב של מסמכים באמצעות כלי בינה מלאכותית וסליקת
                תשלומים. ספקים אלה מחויבים לשמור על סודיות המידע ולהשתמש בו אך ורק
                לצורך מתן השירות עבור החברה. החברה אינה מוכרת מידע אישי לצדדים
                שלישיים למטרות שיווק.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#001a33] mb-2">אבטחת מידע</h3>
              <p>
                אנו נוקטים באמצעי אבטחה מקובלים, לרבות הצפנה והרשאות גישה מוגבלות,
                כדי להגן על המידע הנאסף מפני גישה, שימוש או חשיפה בלתי מורשים. עם
                זאת, לא ניתן להבטיח הגנה מוחלטת מפני כל פגיעה אפשרית.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#001a33] mb-2">שמירת מידע</h3>
              <p>
                המידע נשמר למשך הזמן הדרוש למימוש המטרות שלשמן נאסף, ובכלל זה עמידה
                בדרישות חוקיות ורגולטוריות, ולאחר מכן נמחק או הופך לאנונימי בהתאם
                למדיניות החברה.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#001a33] mb-2">עוגיות (Cookies)</h3>
              <p>
                האתר עשוי לעשות שימוש בעוגיות ובטכנולוגיות דומות לצורך תפעולו
                התקין וניתוח השימוש בו. ניתן לחסום עוגיות באמצעות הגדרות הדפדפן,
                אם כי הדבר עלול לפגוע בפעילות תקינה של חלק מהשירותים.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#001a33] mb-2">זכויות המשתמש</h3>
              <p>
                בהתאם לחוק הגנת הפרטיות, כל משתמש רשאי לפנות לחברה ולבקש לעיין
                במידע שנשמר אודותיו, לתקנו או לבקש את מחיקתו, בכפוף לכל דין.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#001a33] mb-2">שינויים במדיניות</h3>
              <p>
                מדיניות זו עשויה להתעדכן מעת לעת. עדכונים מהותיים יפורסמו בעמוד זה.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#001a33] mb-2">יצירת קשר</h3>
              <p>לשאלות או בקשות בנוגע למידע האישי שלכם ניתן לפנות אלינו:</p>
              <div className="flex flex-col gap-1 mt-2">
                <a href="tel:2324" className="flex items-center gap-2 text-[#1e3a5f] hover:underline w-fit">
                  <Phone size={16} />
                  2324*
                </a>
                <a href="mailto:office@mikud4me.co.il" className="flex items-center gap-2 text-[#1e3a5f] hover:underline w-fit">
                  <Mail size={16} />
                  office@mikud4me.co.il
                </a>
              </div>
            </div>

            <p className="text-sm text-slate-500 pt-4 border-t border-slate-100">
              עודכן לאחרונה: 10 באוגוסט 2026
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
