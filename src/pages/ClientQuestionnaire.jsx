import React, { useState } from 'react';
import {
  User, Home, Briefcase, ChevronLeft, Phone, Wallet, Building2,
  Mail, BadgeCheck, Calendar, Coins, TrendingDown,
  Key, Target, X, UserPlus, AlertCircle, Smartphone
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PremiumInput from '@/components/mikud/PremiumInput';
import BorrowerForm from '@/components/mikud/BorrowerForm';

const defaultBorrower = () => ({
  maritalStatus: 'single',
  childrenUnder18: '0',
  creditHistory: 'clean',
  employmentTypes: ['employee'],
  incomeSources: {},
  borrowerType: 'primary',
});

export default function ClientQuestionnaire() {
  const [step, setStep] = useState(1);
  const [fieldErrors, setFieldErrors] = useState({});
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [userInputOtp, setUserInputOtp] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', phone: '', email: '',
    idNumber: '', birthDate: '', consent: false, creditConsent: false,
    mortgageType: 'purchase_first', loanDuration: '25',
    propertyPrice: '', loanAmount: '',
    monthlyDebts: '0', monthlyOverdraft: '0', equity: '',
  });

  const [borrowers, setBorrowers] = useState([defaultBorrower()]);
  const [activeBorrowerTab, setActiveBorrowerTab] = useState(0);

  const fullName = `${formData.firstName || ''} ${formData.lastName || ''}`.trim();

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: null }));
  };

  const updateBorrower = (index, data) => setBorrowers(prev => prev.map((b, i) => i === index ? data : b));

  const addBorrower = () => {
    setBorrowers(prev => [...prev, { ...defaultBorrower(), borrowerType: 'primary' }]);
    setActiveBorrowerTab(borrowers.length);
  };

  const removeBorrower = (index) => {
    if (borrowers.length <= 1) return;
    setBorrowers(prev => prev.filter((_, i) => i !== index));
    setActiveBorrowerTab(Math.max(0, activeBorrowerTab - 1));
  };

  const calcTotalIncome = () => {
    let total = 0;
    borrowers.forEach((b, idx) => {
      const factor = (idx > 0 && b.borrowerType === 'additional') ? 0.5 : 1.0;
      const sources = b.incomeSources || {};
      Object.values(sources).forEach(src => {
        if (src && (src.amount || src.enabled)) {
          total += Number(String(src.amount || '0').replace(/,/g, '')) * factor;
        }
      });
    });
    return total;
  };

  const startVerification = () => {
    const errors = {};
    if (!formData.firstName || formData.firstName.trim().length < 2) errors.firstName = 'אנא הזן שם פרטי תקין';
    if (!formData.lastName || formData.lastName.trim().length < 2) errors.lastName = 'אנא הזן שם משפחה תקין';
    if (!/^05\d{8}$/.test(formData.phone)) errors.phone = 'טלפון נייד לא תקין (10 ספרות)';
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) errors.email = 'נא להזין כתובת אימייל תקינה';
    if (!/^\d{9}$/.test(formData.idNumber)) errors.idNumber = 'ת.ז לא תקינה (9 ספרות)';
    if (!formData.birthDate) {
      errors.birthDate = 'נא להזין תאריך לידה';
    } else {
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
      if (age < 18 || age > 100) errors.birthDate = 'גיל לא תקין (18–100)';
      else setFormData(prev => ({ ...prev, age: age.toString() }));
    }
    if (!formData.consent) errors.consent = 'חובה לאשר יצירת קשר';
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
    setOtpSent(true);
  };

  const verifyOtp = () => {
    if (userInputOtp === generatedOtp) { setOtpVerified(true); setStep(2); }
    else setFieldErrors({ otp: 'קוד שגוי' });
  };

  const validateStep = (s) => {
    const errors = {};
    if (s === 3 && !formData.propertyPrice) errors.propertyPrice = 'חובה להזין שווי נכס';
    if (s === 3 && !formData.loanAmount) errors.loanAmount = 'חובה להזין סכום מבוקש';
    if (s === 4 && calcTotalIncome() <= 0) errors.netIncome = 'חובה להזין הכנסה לפחות ללווה אחד';
    if (s === 5 && !formData.equity) errors.equity = 'חובה להזין הון עצמי';
    setFieldErrors(errors);
    return Object.keys(errors).filter(k => errors[k]).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) return;
    setSubmitting(true);
    try {
      const borrowersSummary = borrowers.map((b, i) => {
        const sources = b.incomeSources || {};
        const totalB = Object.values(sources).reduce((acc, src) => acc + Number(String(src?.amount || '0').replace(/,/g, '')), 0);
        const factor = i > 0 && b.borrowerType === 'additional' ? 0.5 : 1;
        return {
          index: i + 1,
          borrowerType: b.borrowerType,
          maritalStatus: b.maritalStatus,
          childrenUnder18: b.childrenUnder18,
          creditHistory: b.creditHistory,
          employmentTypes: b.employmentTypes,
          incomeSources: b.incomeSources,
          totalRecognizedIncome: Math.floor(totalB * factor),
        };
      });

      await base44.entities.Lead.create({
        fullName,
        phone: formData.phone,
        email: formData.email,
        idNumber: formData.idNumber,
        birthDate: formData.birthDate,
        age: Number(formData.age),
        purpose: formData.mortgageType,
        propertyPrice: Number(String(formData.propertyPrice).replace(/,/g, '')),
        loanAmount: Number(String(formData.loanAmount).replace(/,/g, '')),
        equity: Number(String(formData.equity).replace(/,/g, '')),
        netIncome: calcTotalIncome(),
        monthlyDebts: Number(String(formData.monthlyDebts).replace(/,/g, '')),
        monthlyOverdraft: Number(String(formData.monthlyOverdraft).replace(/,/g, '')),
        loanDuration: Number(formData.loanDuration),
        maritalStatus: borrowers[0]?.maritalStatus,
        childrenUnder18: Number(borrowers[0]?.childrenUnder18 || 0),
        creditHistory: borrowers[0]?.creditHistory,
        employmentStatusA: (borrowers[0]?.employmentTypes || []).join(', '),
        status: 'new',
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const STEP_TITLES = ['', 'פרטים אישיים', 'פרופיל לווים', 'פרטי הנכס', 'מצב כלכלי', 'מימון ותקופה'];
  const STEP_ICONS = [null, User, User, Home, Coins, Wallet];
  const StepIcon = STEP_ICONS[step] || User;

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6" dir="rtl">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <BadgeCheck size={48} className="text-green-600" />
          </div>
          <h2 className="text-3xl font-black text-[#1e3a5f] mb-4">תודה רבה!</h2>
          <p className="text-gray-600 font-medium text-lg mb-2">הפרטים התקבלו בהצלחה</p>
          <p className="text-gray-500 text-sm">נציג שלנו יחזור אליך בהקדם</p>
          <a href="tel:2324" className="mt-8 inline-block bg-[#1e3a5f] text-white px-10 py-4 rounded-full font-black text-xl shadow-lg hover:bg-[#152d47] transition-all">
            2324*
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-right bg-white" dir="rtl">

      {/* Header */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm h-20 px-6 flex items-center justify-between">
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696ca6d05493d178c33e26fd/0c936db5c_Gemini_Generated_Image_ae1zscae1zscae1z.jpg"
          alt="מיקוד משכנתאות"
          className="h-16 w-auto object-contain"
        />
        <a href="tel:2324" className="bg-[#1e3a5f] text-white px-8 py-3 rounded-full font-bold text-base hover:bg-[#152d47] transition-all shadow-md">
          2324*
        </a>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-10">

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border-4 border-[#1e3a5f] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#1e3a5f] via-[#c9a961] to-[#1e3a5f]" />
          <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-[#1e3a5f] via-[#c9a961] to-[#1e3a5f]" />

          {/* Step Header */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex-1">
              <div className="inline-flex items-center gap-3 bg-[#1e3a5f] px-5 py-2.5 rounded-full shadow-sm mb-2">
                <div className="w-9 h-9 rounded-full bg-[#c9a961] flex items-center justify-center">
                  <StepIcon size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base sm:text-xl font-bold text-white leading-none">
                    {step === 1 && !otpSent ? 'בואו נכיר' : step === 1 && otpSent ? 'אימות זהות' : STEP_TITLES[step]}
                  </h2>
                  <p className="text-[#c9a961] font-medium text-xs mt-1">שלב {step} מתוך 5</p>
                </div>
              </div>
            </div>
            {/* Progress Circle */}
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-gray-200" />
                <circle cx="40" cy="40" r="36" stroke="#c9a961" strokeWidth="3" fill="transparent" strokeDasharray={226} strokeDashoffset={226 - (226 * step) / 5} strokeLinecap="round" className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-[#1e3a5f]">{step}</span>
                <span className="text-xs font-medium text-gray-400">מתוך 5</span>
              </div>
            </div>
          </div>

          {/* STEP 1 - פרטים אישיים */}
          {step === 1 && !otpSent && (
            <div className="animate-in fade-in duration-500">
              <div className="grid grid-cols-2 gap-3">
                <PremiumInput label="שם פרטי" name="firstName" value={formData.firstName} placeholder="ישראל" icon={User} onChange={handleInputChange} error={fieldErrors.firstName} />
                <PremiumInput label="שם משפחה" name="lastName" value={formData.lastName} placeholder="ישראלי" icon={User} onChange={handleInputChange} error={fieldErrors.lastName} />
              </div>
              <PremiumInput label="מספר תעודת זהות" name="idNumber" value={formData.idNumber} placeholder="123456789" icon={BadgeCheck} onChange={handleInputChange} error={fieldErrors.idNumber} />

              <div className="mb-5">
                <label className="flex items-center text-[#1e3a5f] font-semibold text-sm mb-2">
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center ml-2"><Calendar size={16} className="text-gray-500" /></div>
                  תאריך לידה
                </label>
                <input type="date" min="1924-01-01" max="2007-12-31"
                  className="w-full bg-white h-14 px-5 border-2 border-[#1e3a5f] rounded-2xl outline-none focus:border-[#c9a961] focus:ring-4 focus:ring-[#c9a961]/20 transition-all text-gray-900 font-semibold text-base text-right shadow-md"
                  value={formData.birthDate || ''}
                  onChange={(e) => handleInputChange('birthDate', e.target.value)}
                />
                {fieldErrors.birthDate && (
                  <div className="mt-2 flex items-center gap-2 bg-red-50 border-2 border-red-500 px-4 py-2 rounded-xl">
                    <AlertCircle size={18} className="text-red-600" />
                    <p className="text-red-700 text-sm font-bold">{fieldErrors.birthDate}</p>
                  </div>
                )}
              </div>

              <PremiumInput label="טלפון נייד" name="phone" value={formData.phone} placeholder="05XXXXXXXX" icon={Phone} onChange={handleInputChange} error={fieldErrors.phone} />
              <PremiumInput label="כתובת דוא״ל" name="email" value={formData.email} placeholder="example@email.com" icon={Mail} onChange={handleInputChange} type="email" error={fieldErrors.email} />

              <div className="mt-4 flex items-center gap-3 p-4 rounded-xl border-2 bg-slate-50">
                <input type="checkbox" className="w-5 h-5 rounded flex-shrink-0 accent-[#1e3a5f]" checked={formData.consent} onChange={(e) => handleInputChange('consent', e.target.checked)} />
                <p className="text-xs text-slate-500 font-bold leading-relaxed text-right">אני מאשר ליועץ ממיקוד משכנתאות ליצור איתי קשר לצורך קידום התיק.</p>
              </div>
              {fieldErrors.consent && <p className="text-red-600 text-xs font-bold mt-1">{fieldErrors.consent}</p>}

              <div className="mt-3 flex items-center gap-3 p-4 rounded-xl border-2 bg-amber-50 border-amber-200">
                <input type="checkbox" className="w-5 h-5 rounded flex-shrink-0 accent-[#1e3a5f]"
                  checked={formData.creditConsent}
                  onChange={(e) => { handleInputChange('creditConsent', e.target.checked); if (e.target.checked) setShowCreditModal(true); }}
                />
                <p className="text-xs text-amber-800 font-bold leading-relaxed text-right">
                  אני מאשר לבנק לבצע בדיקת חווי אשראי (BDI).{' '}
                  <button type="button" onClick={() => setShowCreditModal(true)} className="underline text-[#1e3a5f]">מה זה אומר?</button>
                </p>
              </div>
            </div>
          )}

          {/* מודל BDI */}
          {showCreditModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowCreditModal(false)}>
              <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border-4 border-[#1e3a5f] text-right" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                  <button onClick={() => setShowCreditModal(false)}><X size={24} className="text-gray-400" /></button>
                  <h3 className="text-xl font-black text-[#1e3a5f]">מהי בדיקת חווי אשראי?</h3>
                </div>
                <div className="space-y-4 text-sm text-gray-700">
                  <p className="font-bold text-[#1e3a5f]">בדיקת BDI היא בדיקה שגרתית שהבנק מבצע לפני אישור משכנתא.</p>
                  <div className="bg-blue-50 border-r-4 border-blue-500 p-4 rounded-xl">
                    <p className="font-bold text-blue-800 mb-2">מה הבנק בודק?</p>
                    <ul className="space-y-1 text-blue-700 text-xs">
                      <li>• היסטוריית תשלומים</li>
                      <li>• חובות ועיקולים קיימים</li>
                      <li>• דירוג האשראי הכללי</li>
                    </ul>
                  </div>
                  <p className="text-xs text-gray-500">הבדיקה אינה פוגעת בדירוג האשראי שלך.</p>
                </div>
                <button onClick={() => { setShowCreditModal(false); handleInputChange('creditConsent', true); }}
                  className="mt-6 w-full bg-[#1e3a5f] text-white py-3 rounded-2xl font-black hover:bg-[#152d47] transition-all">
                  הבנתי ומאשר ✓
                </button>
              </div>
            </div>
          )}

          {/* STEP 1 OTP */}
          {step === 1 && otpSent && (
            <div className="text-center py-8">
              <Smartphone size={40} className="text-[#1e3a5f] mx-auto mb-4" />
              <h4 className="text-lg font-black text-[#1e3a5f] mb-4">הזן קוד אימות</h4>
              <PremiumInput label="הזן קוד" name="otp" value={userInputOtp} onChange={(n, v) => setUserInputOtp(v)} placeholder="0000" icon={Key} error={fieldErrors.otp} />
              <p className="mt-2 text-xs text-slate-400 italic">קוד לבדיקה: <span className="text-[#c9a961] font-bold">{generatedOtp}</span></p>
            </div>
          )}

          {/* STEP 2 - לווים */}
          {step === 2 && (
            <div className="animate-in fade-in duration-500">
              <div className="flex gap-2 mb-5 flex-wrap">
                {borrowers.map((b, idx) => (
                  <button key={idx} onClick={() => setActiveBorrowerTab(idx)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-sm transition-all border-2 ${activeBorrowerTab === idx ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-[#1e3a5f] border-[#1e3a5f]/30'}`}>
                    <User size={14} />
                    לווה {['א', 'ב', 'ג', 'ד', 'ה'][idx] || (idx + 1)}
                    {idx > 0 && (
                      <span onClick={e => { e.stopPropagation(); removeBorrower(idx); }} className="mr-1 text-red-400 hover:text-red-600 font-black cursor-pointer">×</span>
                    )}
                  </button>
                ))}
                {borrowers.length < 5 && (
                  <button onClick={addBorrower} className="flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-sm border-2 border-dashed border-[#c9a961] text-[#c9a961] hover:bg-[#c9a961]/10 transition-all">
                    <UserPlus size={14} /> הוסף לווה
                  </button>
                )}
              </div>
              <BorrowerForm
                key={activeBorrowerTab}
                borrower={borrowers[activeBorrowerTab]}
                index={activeBorrowerTab}
                onChange={(data) => updateBorrower(activeBorrowerTab, data)}
                errors={fieldErrors}
              />
            </div>
          )}

          {/* STEP 3 - נכס */}
          {step === 3 && (
            <div className="animate-in fade-in duration-500">
              <PremiumInput label="סוג ומטרת המשכנתא" name="mortgageType" value={formData.mortgageType} icon={Target} onChange={handleInputChange}
                options={[
                  { val: 'purchase_first', label: 'רכישה - דירה ראשונה' },
                  { val: 'purchase_improve', label: 'רכישה - משפרי דיור' },
                  { val: 'refinance', label: 'מחזור משכנתא' },
                  { val: 'any_purpose', label: 'כל מטרה' },
                  { val: 'reverse_mortgage', label: 'משכנתא הפוכה' },
                  { val: 'senior_bank', label: 'משכנתא בנקאית לגיל הזהב' },
                ]} />
              <PremiumInput label="שווי הנכס המשוער" name="propertyPrice" value={formData.propertyPrice} placeholder="שווי שוק" icon={Home} onChange={handleInputChange} error={fieldErrors.propertyPrice} tooltip="שווי הנכס על פי הערכה או חוזה רכישה" />
              <PremiumInput label="סכום מבוקש" name="loanAmount" value={formData.loanAmount} placeholder="כמה כסף אתם צריכים?" icon={Coins} onChange={handleInputChange} error={fieldErrors.loanAmount} />
            </div>
          )}

          {/* STEP 4 - מצב כלכלי */}
          {step === 4 && (
            <div className="animate-in fade-in duration-500">
              {/* סיכום הכנסות */}
              <div className="mb-5 p-4 bg-[#1e3a5f]/5 rounded-xl border border-[#1e3a5f]/15">
                <p className="text-sm font-bold text-[#1e3a5f] mb-3 flex items-center gap-2">
                  <Coins size={16} className="text-[#c9a961]" /> סיכום הכנסות לווים
                </p>
                {borrowers.map((b, idx) => {
                  const sources = b.incomeSources || {};
                  const factor = idx > 0 && b.borrowerType === 'additional' ? 0.5 : 1;
                  const totalB = Object.values(sources).reduce((acc, src) => {
                    if (!src || (!src.amount && !src.enabled)) return acc;
                    return acc + Number(String(src.amount || '0').replace(/,/g, ''));
                  }, 0);
                  return (
                    <div key={idx} className="flex justify-between items-center py-1.5 border-b border-gray-200 last:border-0 text-sm">
                      <span className="text-gray-600 font-medium">לווה {['א','ב','ג','ד','ה'][idx] || idx+1} {idx > 0 && b.borrowerType === 'additional' ? <span className="text-amber-600 text-xs">(נוסף - 50%)</span> : ''}</span>
                      <span className="font-bold text-[#1e3a5f]">₪{new Intl.NumberFormat('he-IL').format(Math.floor(totalB * factor))}</span>
                    </div>
                  );
                })}
                <div className="flex justify-between items-center pt-2 text-sm font-black text-[#1e3a5f]">
                  <span>סה"כ מוכר לבנק</span>
                  <span className="text-[#c9a961]">₪{new Intl.NumberFormat('he-IL').format(Math.floor(calcTotalIncome()))}</span>
                </div>
              </div>
              {fieldErrors.netIncome && (
                <div className="mb-4 flex items-center gap-2 bg-red-50 border-2 border-red-500 px-4 py-3 rounded-xl">
                  <AlertCircle size={18} className="text-red-600" />
                  <p className="text-red-700 text-sm font-bold">{fieldErrors.netIncome}</p>
                </div>
              )}
              <PremiumInput label="החזרי הלוואות חודשיים" name="monthlyDebts" value={formData.monthlyDebts} placeholder="סכום חודשי" icon={TrendingDown} onChange={handleInputChange} tooltip="הלוואות קיימות, ליסינג, אשראי" />
              <PremiumInput label="שכירות חודשית (אם יש)" name="monthlyOverdraft" value={formData.monthlyOverdraft} placeholder="0" icon={TrendingDown} onChange={handleInputChange} />
            </div>
          )}

          {/* STEP 5 - מימון ותקופה */}
          {step === 5 && (
            <div className="animate-in fade-in duration-500">
              <PremiumInput label="הון עצמי זמין" name="equity" value={formData.equity} placeholder="סכום הון עצמי" icon={Wallet} onChange={handleInputChange} error={fieldErrors.equity} tooltip="הסכום שיש לכם במזומן/חסכונות" />
              <PremiumInput label="תקופת הלוואה רצויה (בשנים)" name="loanDuration" type="range" value={formData.loanDuration} min={4} max={30} onChange={handleInputChange} icon={Building2} tooltip="תקופה ארוכה = החזר חודשי נמוך אך ריבית גבוהה יותר" />
            </div>
          )}

          {/* Buttons */}
          <div className="mt-10 flex gap-4" dir="rtl">
            {(step > 1 || otpSent) && (
              <button
                onClick={() => { if (step === 1 && otpSent) setOtpSent(false); else setStep(s => s - 1); }}
                className="flex-1 h-14 rounded-full font-bold text-base text-gray-600 border-2 border-gray-200 hover:bg-gray-50 transition-all"
              >
                ← חזור
              </button>
            )}
            <button
              onClick={() => {
                if (step === 1 && !otpSent) startVerification();
                else if (step === 1 && otpSent) verifyOtp();
                else if (step === 5) { if (validateStep(5)) handleSubmit(); }
                else if (validateStep(step)) setStep(s => s + 1);
              }}
              disabled={submitting}
              className={`h-14 rounded-full font-bold text-lg shadow-md transition-all bg-[#1e3a5f] text-white hover:bg-[#152d47] active:scale-95 ${step > 1 ? 'flex-[2]' : 'flex-1'}`}
            >
              {submitting ? 'שולח...' : step === 5 ? 'שלח טופס' : step === 1 && !otpSent ? 'שלח קוד אימות' : (
                <span className="flex items-center justify-center gap-2">המשך <ChevronLeft size={20} /></span>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}