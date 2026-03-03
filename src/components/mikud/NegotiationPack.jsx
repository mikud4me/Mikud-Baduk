import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, FileCheck, Target, TrendingUp, Download, Sparkles } from 'lucide-react';

const formatCurrency = (val) => {
  if (!val || isNaN(val)) return "0";
  return new Intl.NumberFormat('he-IL').format(Math.floor(val));
};

export default function NegotiationPack({ formData, results, selectedMix }) {
  const powerScore = Math.min(100, Math.max(0, 
    (results.dti < 35 ? 40 : results.dti < 40 ? 25 : 10) +
    (formData.creditHistory === 'clean' ? 30 : 10) +
    (formData.employmentStatusA === 'employee' ? 20 : 15) +
    (results.ltv < 70 ? 10 : 5)
  ));

  const scoreColor = powerScore >= 80 ? '#22c55e' : powerScore >= 60 ? '#f59e0b' : '#ef4444';
  const scoreLabel = powerScore >= 80 ? 'חזק מאוד' : powerScore >= 60 ? 'בינוני-גבוה' : 'בינוני';

  const isReverse = formData.mortgageType === 'reverse_mortgage';
  const empTypes = formData.employmentTypes || [formData.employmentStatusA || 'employee'];
  const isSelfEmployed = empTypes.some(t => ['self_employed', 'controlling_shareholder'].includes(t));
  const isPensioner = empTypes.includes('pensioner');
  const isMarried = formData.maritalStatus === 'married';

  const documents = [
    'תעודת זהות + ספח מעודכן (לכל לווה)',
    ...(isSelfEmployed ? [
      'שומות מס 2 השנים האחרונות',
      'אישור הכנסה מרואה חשבון',
      'דפי עו"ש 3 חודשים אחרונים',
    ] : isPensioner ? [
      'אישור קצבה/גמלה מקרן פנסיה / ביטוח לאומי',
      'דפי עו"ש 3 חודשים אחרונים',
    ] : [
      '3 תלושי שכר אחרונים',
      'דפי עו"ש 3 חודשים אחרונים',
    ]),
    ...(isReverse ? [
      'נסח טאבו מעודכן',
      'אישור הסכמת יורשים (חתום נוטריון)',
    ] : [
      'נסח טאבו / נסח בית משותף מעודכן',
    ]),
    ...(isMarried ? ['תיעוד זהות + מסמכים תואמים של לווה ב\''] : []),
    'אישור BDI / דוח נתוני אשראי',
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* כותרת ראשית */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-6 sm:py-8 bg-gradient-to-r from-[#1e3a5f] via-[#2a4a75] to-[#1e3a5f] rounded-2xl sm:rounded-[2rem] border-4 border-[#c9a961]"
      >
        <div className="flex items-center justify-center gap-3 mb-3">
          <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-[#c9a961]" />
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">ערכת המשא ומתן הבלעדית</h2>
          <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-[#c9a961]" />
        </div>
        <p className="text-[#c9a961] font-bold text-sm sm:text-base">לקוח: {formData.fullName} | דירוג כוח מיקוח: {powerScore}/100 ({scoreLabel})</p>
      </motion.div>

      {/* מדד כוח המיקוח */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-white to-gray-50 rounded-xl sm:rounded-2xl p-6 sm:p-8 border-2 border-[#c9a961] shadow-xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <Target className="w-6 h-6 sm:w-8 sm:h-8 text-[#c9a961]" />
          <h3 className="text-xl sm:text-2xl font-bold text-[#1e3a5f]">מדד כוח המיקוח שלך</h3>
        </div>
        
        <div className="relative w-full h-8 bg-gray-200 rounded-full overflow-hidden mb-4">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${powerScore}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(to right, ${scoreColor}, ${scoreColor}dd)` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-black text-lg drop-shadow-lg">{powerScore}/100</span>
          </div>
        </div>

        <div className="bg-blue-50 border-r-4 border-blue-600 p-4 rounded-xl">
          <p className="text-sm sm:text-base text-gray-800 font-medium leading-relaxed">
            💪 <strong>הסבר:</strong> בזכות יחס החזר (DTI) של {results.dti.toFixed(1)}% {results.dti < 35 ? 'ויציבות תעסוקתית' : ''}, 
            אתה נחשב ללקוח {powerScore >= 80 ? 'מועדף ביותר' : powerScore >= 60 ? 'איכותי' : 'סולידי'}. 
            הבנקים {powerScore >= 80 ? 'יילחמו עליך' : 'יתעניינו בך'} – אל תתפשר על פחות מריביות היעד שהצגנו!
          </p>
        </div>
      </motion.div>

      {/* תסריט המשא ומתן */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-[#1e3a5f] to-[#2a4a75] rounded-xl sm:rounded-2xl p-6 sm:p-8 text-white shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-[#c9a961]" />
          <h3 className="text-xl sm:text-2xl font-bold">תסריט השיחה מול הבנקאי</h3>
        </div>

        <div className="space-y-4 text-sm sm:text-base">
          <div className="bg-white/10 rounded-xl p-4 border-r-4 border-[#c9a961]">
            <p className="font-bold text-[#c9a961] mb-2">הפתיחה:</p>
            <p className="leading-relaxed italic">
              "שלום, הגשתי תצהיר דיגיטלי דרך מערכת 'מיקוד משכנתאות' וקיבלתי אישור עקרוני למחזור. 
              אני מכוון למרווח של P-0.5% בפריים, {((selectedMix?.tracks[0]?.rate || 0.05) * 100).toFixed(2)}% קבועה. 
              אתם שם?"
            </p>
          </div>

          <div className="bg-white/10 rounded-xl p-4 border-r-4 border-[#c9a961]">
            <p className="font-bold text-[#c9a961] mb-2">התמודדות עם התנגדות:</p>
            <p className="leading-relaxed">
              אם הבנקאי אומר <span className="text-red-300 font-bold">"זה נמוך מדי לשוק"</span>, 
              התשובה שלך: <span className="text-green-300 font-bold italic">
              "לפי נתוני בנק ישראל העדכניים, זה המרווח הממוצע ללקוחות בדירוג אשראי כמו שלי. 
              אני בודק בעוד שני בנקים במקביל, אז אשמח לתשובה חיובית בהקדם."
              </span>
            </p>
          </div>

          <div className="bg-white/10 rounded-xl p-4 border-r-4 border-[#c9a961]">
            <p className="font-bold text-[#c9a961] mb-2">⚡ המשפט המנצח:</p>
            <p className="leading-relaxed text-lg font-bold">
              "אני מחפש בנק שרואה בי שותף, לא סתם לווה. מי ייתן לי את התנאים הטובים ביותר?"
            </p>
          </div>
        </div>
      </motion.div>

      {/* רשימת המסמכים */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 border-2 border-gray-200 shadow-xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <FileCheck className="w-6 h-6 sm:w-8 sm:h-8 text-[#c9a961]" />
          <h3 className="text-xl sm:text-2xl font-bold text-[#1e3a5f]">רשימת ה"בונקר" - מסמכים להגשה</h3>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {documents.map((doc, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + idx * 0.1 }}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#c9a961] hover:bg-[#c9a961]/5 transition-all"
            >
              <div className="w-6 h-6 rounded-full bg-[#1e3a5f] flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">{idx + 1}</span>
              </div>
              <p className="text-sm sm:text-base text-gray-800 font-medium">{doc}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border-r-4 border-yellow-600 rounded-xl">
          <p className="text-sm sm:text-base text-gray-800 font-bold">
            💡 <strong>טיפ פרו:</strong> הכן את כל המסמכים בפורמט PDF מסודר, 
            עם שם קובץ ברור (לדוגמה: "תלושים_3חודשים_ינואר2026.pdf"). 
            זה יחסוך זמן ויעשה רושם מקצועי.
          </p>
        </div>
      </motion.div>

      {/* סטטיסטיקת החיסכון */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl sm:rounded-2xl p-6 sm:p-8 border-2 border-green-500 shadow-xl text-center"
      >
        <TrendingUp className="w-12 h-12 sm:w-16 sm:h-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-2xl sm:text-3xl font-black text-green-800 mb-3">הפוטנציאל שלך לחיסכון</h3>
        <p className="text-4xl sm:text-5xl md:text-6xl font-black text-green-600 mb-2">
          ₪{formatCurrency(results.loanAmount * 0.12)}
        </p>
        <p className="text-sm sm:text-base text-green-700 font-bold">
          זהו החיסכון הממוצע שלקוחות מיקוד משיגים על פני תקופת המשכנתא בזכות המשא ומתן האגרסיבי
        </p>
      </motion.div>

      {/* כפתור הורדה */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7 }}
        className="text-center"
      >
        <button 
          onClick={() => window.print()}
          className="bg-gradient-to-r from-[#c9a961] to-[#d4b975] text-[#1e3a5f] px-8 sm:px-12 py-4 sm:py-5 rounded-2xl font-black text-lg sm:text-xl shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 mx-auto"
        >
          <Download className="w-6 h-6" />
          <span>הורד את ערכת המשא ומתן המלאה (PDF)</span>
        </button>
        <p className="text-xs sm:text-sm text-gray-500 mt-3 font-medium">
          הדפסת העמוד תשמור את כל המידע בפורמט PDF מוכן למצגת
        </p>
      </motion.div>
    </div>
  );
}