import React, { useState, useRef, useEffect } from 'react';
import {
  User, Home, ChevronLeft, Phone, Wallet, Building2,
  Mail, BadgeCheck, Coins, TrendingDown,
  Key, Target, X, UserPlus, AlertCircle, Smartphone
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PremiumInput from '@/components/mikud/PremiumInput';
import BorrowerForm from '@/components/mikud/BorrowerForm';
import { Checkbox } from '@/components/ui/checkbox';
import { createPageUrl } from '@/utils';

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
  const [currentLeadId, setCurrentLeadId] = useState(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const creditModalRef = useRef(null);
  useEffect(() => { if (showCreditModal) creditModalRef.current?.focus(); }, [showCreditModal]);

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
      const [by, bm, bd] = formData.birthDate.split('-').map(Number);
      const birthDate = new Date(formData.birthDate);
      const isValidCalendarDate = !isNaN(birthDate.getTime()) && birthDate.getFullYear() === by && birthDate.getMonth() + 1 === bm && birthDate.getDate() === bd;
      if (!isValidCalendarDate) {
        errors.birthDate = 'תאריך לידה לא תקין';
      } else {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
        if (age < 18 || age > 100) errors.birthDate = 'גיל לא תקין (18–100)';
        else setFormData(prev => ({ ...prev, age: age.toString() }));
      }
    }
    if (!formData.consent) errors.consent = 'חובה לאשר יצירת קשר';
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
    setOtpSent(true);
    // שמירת ליד חלקי ראשוני ברגע בקשת קוד האימות (פרטי קשר הוזנו) — לשיחת המשך.
    // בבקשת קוד חוזרת באותו סשן זה מעדכן את אותו הליד ולא יוצר כפילות.
    savePartialLead();
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

  // בונה את מטען הנתונים של הליד מהמצב הנוכחי (משותף לשמירה חלקית ולסופית)
  /** @param {{ status?: string }} [opts] */
  const buildLeadPayload = ({ status } = {}) => ({
    fullName,
    phone: formData.phone,
    email: formData.email,
    idNumber: formData.idNumber,
    birthDate: formData.birthDate,
    age: formData.age ? Number(formData.age) : undefined,
    purpose: formData.mortgageType,
    propertyPrice: formData.propertyPrice ? Number(String(formData.propertyPrice).replace(/,/g, '')) : undefined,
    loanAmount: formData.loanAmount ? Number(String(formData.loanAmount).replace(/,/g, '')) : undefined,
    equity: formData.equity ? Number(String(formData.equity).replace(/,/g, '')) : undefined,
    netIncome: calcTotalIncome(),
    monthlyDebts: formData.monthlyDebts ? Number(String(formData.monthlyDebts).replace(/,/g, '')) : 0,
    monthlyOverdraft: formData.monthlyOverdraft ? Number(String(formData.monthlyOverdraft).replace(/,/g, '')) : 0,
    loanDuration: formData.loanDuration ? Number(formData.loanDuration) : undefined,
    maritalStatus: borrowers[0]?.maritalStatus,
    childrenUnder18: Number(borrowers[0]?.childrenUnder18 || 0),
    creditHistory: borrowers[0]?.creditHistory,
    employmentStatusA: (borrowers[0]?.employmentTypes || []).join(', '),
    status,
  });

  // שמירת ליד חלקי (ליד "לא הושלם" שמתעדכן בכל שלב) — fire-and-forget, לעולם לא חוסם ניווט.
  // הזהות נקבעת לפי currentLeadId של הסשן הנוכחי בלבד; אין חיפוש/מיזוג לפי טלפון/ת.ז,
  // כך שכל מילוי חוזר של הטופס נשמר כליד חדש ואינו דורס נתונים קיימים.
  const savePartialLead = async () => {
    try {
      if (!currentLeadId) {
        const lead = await base44.entities.Lead.create(buildLeadPayload({ status: 'partial' }));
        setCurrentLeadId(lead.id);
      } else {
        await base44.entities.Lead.update(currentLeadId, buildLeadPayload({ status: 'partial' }));
      }
    } catch (err) {
      console.error('savePartialLead failed:', err);
    }
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

      // שדרוג הליד החלקי של הסשן (אם קיים) לליד מלא, אחרת יצירה (fallback אם השמירות החלקיות נכשלו)
      const leadPayload = buildLeadPayload({ status: 'new' });
      if (currentLeadId) {
        await base44.entities.Lead.update(currentLeadId, leadPayload);
      } else {
        const lead = await base44.entities.Lead.create(leadPayload);
        setCurrentLeadId(lead.id);
      }
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
          <h1 className="text-3xl font-black text-[#0C084A] mb-4">תודה רבה!</h1>
          <p className="text-mist-600 font-medium text-lg mb-2">הפרטים התקבלו בהצלחה</p>
          <p className="text-mist-600 text-sm">נציג שלנו יחזור אליך בהקדם</p>
          <a href="tel:2324" className="mt-8 inline-block bg-[#0C084A] text-white px-10 py-4 rounded-full font-black text-xl shadow-lg hover:bg-[#0153F4] transition-all">
            2324*
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-right bg-white" dir="rtl">

      {/* Header */}
      <nav className="sticky top-0 z-50 bg-white border-b border-mist-100 shadow-sm h-20 px-6 flex items-center justify-between">
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696ca6d05493d178c33e26fd/0c936db5c_Gemini_Generated_Image_ae1zscae1zscae1z.jpg"
          alt="מיקוד משכנתאות"
          className="h-16 w-auto object-contain"
        />
        <div className="flex items-center gap-6">
          <div className="relative hidden sm:block">
            <div className="absolute -inset-3 bg-gradient-to-r from-brand-400/40 to-brand-600/30 rounded-full blur-xl pointer-events-none" />
            <a
              href={createPageUrl('RefinanceQuickCheck')}
              className="relative bg-[#0153F4] text-white px-6 py-3 rounded-full font-black text-lg hover:bg-[#0141C2] hover:scale-105 transition-all shadow-lg"
            >
              ממחזרים את המשכנתא?
            </a>
          </div>
          <a href="tel:2324" className="bg-[#0C084A] text-white px-8 py-3 rounded-full font-bold text-base hover:bg-[#0153F4] transition-all shadow-md">
            2324*
          </a>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-10">

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border-4 border-[#0C084A] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#0C084A] via-[#0153F4] to-[#0C084A]" />
          <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-[#0C084A] via-[#0153F4] to-[#0C084A]" />

          {/* Step Header */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex-1">
              <div className="inline-flex items-center gap-3 bg-[#0C084A] px-5 py-2.5 rounded-full shadow-sm mb-2">
                <div className="w-9 h-9 rounded-full bg-[#0153F4] flex items-center justify-center">
                  <StepIcon size={18} className="text-white" />
                </div>
                <div>
                  <h1 className="text-base sm:text-xl font-bold text-white leading-none">
                    {step === 1 && !otpSent ? 'בואו נכיר' : step === 1 && otpSent ? 'אימות זהות' : STEP_TITLES[step]}
                  </h1>
                  <p className="text-[#0153F4] font-medium text-xs mt-1">שלב {step} מתוך 5</p>
                </div>
              </div>
            </div>
            {/* Progress Circle */}
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-mist-200" />
                <circle cx="40" cy="40" r="36" stroke="#0153F4" strokeWidth="3" fill="transparent" strokeDasharray={226} strokeDashoffset={226 - (226 * step) / 5} strokeLinecap="round" className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-[#0C084A]">{step}</span>
                <span className="text-xs font-medium text-mist-400">מתוך 5</span>
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
                <label htmlFor="cq-birthDate" className="flex items-center text-[#0C084A] font-normal text-sm mb-2">
                  תאריך לידה
                </label>
                <input type="date" id="cq-birthDate" min="1924-01-01" max="2007-12-31"
                  className="w-full bg-white h-14 px-5 border-2 border-[#0C084A] rounded-2xl outline-none focus:border-[#0153F4] focus:ring-4 focus:ring-[#0153F4]/20 transition-all text-mist-900 font-semibold text-base text-right shadow-md"
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

              <div className="mt-4 flex items-start gap-3 p-4 rounded-xl border-2 bg-mist-50">
                <Checkbox checked={formData.consent} onCheckedChange={(checked) => handleInputChange('consent', checked)} className="mt-0.5" aria-labelledby="cq-consent-contact-label" />
                <p id="cq-consent-contact-label" className="text-xs text-mist-600 font-bold leading-relaxed text-right">אני מאשר ליועץ ממיקוד משכנתאות ליצור איתי קשר לצורך קידום התיק.</p>
              </div>
              {fieldErrors.consent && <p className="text-red-600 text-xs font-bold mt-1">{fieldErrors.consent}</p>}

              <div className="mt-3 flex items-start gap-3 p-4 rounded-xl border-2 bg-periwinkle-100 border-periwinkle-200">
                <Checkbox
                  checked={formData.creditConsent}
                  onCheckedChange={(checked) => { handleInputChange('creditConsent', checked); if (checked) setShowCreditModal(true); }}
                  className="mt-0.5"
                  aria-labelledby="cq-consent-credit-label"
                />
                <p id="cq-consent-credit-label" className="text-xs text-[#0C084A] font-bold leading-relaxed text-right">
                  אני מאשר לבנק לבצע בדיקת חווי אשראי (BDI).{' '}
                  <button type="button" onClick={() => setShowCreditModal(true)} className="underline text-[#0C084A]">מה זה אומר?</button>
                </p>
              </div>
            </div>
          )}

          {/* מודל BDI */}
          {showCreditModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowCreditModal(false)}>
              <div
                ref={creditModalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="cq-credit-modal-title"
                tabIndex={-1}
                className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border-4 border-[#0C084A] text-right outline-none"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-5">
                  <button onClick={() => setShowCreditModal(false)}><X size={24} className="text-mist-400" /></button>
                  <h3 id="cq-credit-modal-title" className="text-xl font-black text-[#0C084A]">מהי בדיקת חווי אשראי?</h3>
                </div>
                <div className="space-y-4 text-sm text-mist-700">
                  <p className="font-bold text-[#0C084A]">בדיקת BDI היא בדיקה שגרתית שהבנק מבצע לפני אישור משכנתא.</p>
                  <div className="bg-brand-50 border-r-4 border-brand-500 p-4 rounded-xl">
                    <p className="font-bold text-brand-800 mb-2">מה הבנק בודק?</p>
                    <ul className="space-y-1 text-brand-700 text-xs">
                      <li>• היסטוריית תשלומים</li>
                      <li>• חובות ועיקולים קיימים</li>
                      <li>• דירוג האשראי הכללי</li>
                    </ul>
                  </div>
                  <p className="text-xs text-mist-600">הבדיקה אינה פוגעת בדירוג האשראי שלך.</p>
                </div>
                <button onClick={() => { setShowCreditModal(false); handleInputChange('creditConsent', true); }}
                  className="mt-6 w-full bg-[#0C084A] text-white py-3 rounded-2xl font-black hover:bg-[#0153F4] transition-all">
                  הבנתי ומאשר ✓
                </button>
              </div>
            </div>
          )}

          {/* STEP 1 OTP */}
          {step === 1 && otpSent && (
            <div className="text-center py-8">
              <Smartphone size={40} className="text-[#0C084A] mx-auto mb-4" />
              <h2 className="text-lg font-black text-[#0C084A] mb-4">הזן קוד אימות</h2>
              <PremiumInput label="הזן קוד" name="otp" value={userInputOtp} onChange={(n, v) => setUserInputOtp(v)} placeholder="0000" icon={Key} error={fieldErrors.otp} />
              <p className="mt-2 text-xs text-mist-600 italic">קוד לבדיקה: <span className="text-[#0153F4] font-bold">{generatedOtp}</span></p>
            </div>
          )}

          {/* STEP 2 - לווים */}
          {step === 2 && (
            <div className="animate-in fade-in duration-500">
              <div className="flex gap-2 mb-5 flex-wrap">
                {borrowers.map((b, idx) => (
                  <div key={idx}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-sm transition-all border-2 ${activeBorrowerTab === idx ? 'bg-[#0C084A] text-white border-[#0C084A]' : 'bg-white text-[#0C084A] border-[#0C084A]/30'}`}>
                    <button type="button" onClick={() => setActiveBorrowerTab(idx)} className="flex items-center gap-1.5 bg-transparent text-inherit">
                      <User size={14} />
                      לווה {['א', 'ב', 'ג', 'ד', 'ה'][idx] || (idx + 1)}
                    </button>
                    {idx > 0 && (
                      <button type="button" onClick={() => removeBorrower(idx)} aria-label={`הסר לווה ${['א', 'ב', 'ג', 'ד', 'ה'][idx] || (idx + 1)}`} className="mr-1 text-red-400 hover:text-red-600 font-black bg-transparent">×</button>
                    )}
                  </div>
                ))}
                {borrowers.length < 5 && (
                  <button onClick={addBorrower} className="flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-sm border-2 border-dashed border-[#0153F4] text-[#0153F4] hover:bg-[#0153F4]/10 transition-all">
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
              <div className="mb-5 p-4 bg-[#0C084A]/5 rounded-xl border border-[#0C084A]/15">
                <p className="text-sm font-bold text-[#0C084A] mb-3 flex items-center gap-2">
                  <Coins size={16} className="text-[#0153F4]" /> סיכום הכנסות לווים
                </p>
                {borrowers.map((b, idx) => {
                  const sources = b.incomeSources || {};
                  const factor = idx > 0 && b.borrowerType === 'additional' ? 0.5 : 1;
                  const totalB = Object.values(sources).reduce((acc, src) => {
                    if (!src || (!src.amount && !src.enabled)) return acc;
                    return acc + Number(String(src.amount || '0').replace(/,/g, ''));
                  }, 0);
                  return (
                    <div key={idx} className="flex justify-between items-center py-1.5 border-b border-mist-200 last:border-0 text-sm">
                      <span className="text-mist-600 font-medium">לווה {['א','ב','ג','ד','ה'][idx] || idx+1} {idx > 0 && b.borrowerType === 'additional' ? <span className="text-amber-600 text-xs">(נוסף - 50%)</span> : ''}</span>
                      <span className="font-bold text-[#0C084A]">₪{new Intl.NumberFormat('he-IL').format(Math.floor(totalB * factor))}</span>
                    </div>
                  );
                })}
                <div className="flex justify-between items-center pt-2 text-sm font-black text-[#0C084A]">
                  <span>סה"כ מוכר לבנק</span>
                  <span className="text-[#0153F4]">₪{new Intl.NumberFormat('he-IL').format(Math.floor(calcTotalIncome()))}</span>
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
                className="flex-1 h-14 rounded-full font-bold text-base text-mist-600 border-2 border-mist-200 hover:bg-mist-50 transition-all"
              >
                ← חזור
              </button>
            )}
            <button
              onClick={() => {
                if (step === 1 && !otpSent) startVerification();
                else if (step === 1 && otpSent) verifyOtp();
                else if (step === 5) { if (validateStep(5)) handleSubmit(); }
                else if (validateStep(step)) { setStep(s => s + 1); savePartialLead(); }
              }}
              disabled={submitting}
              className={`h-14 rounded-full font-bold text-lg shadow-md transition-all bg-[#0C084A] text-white hover:bg-[#0153F4] active:scale-95 ${step > 1 ? 'flex-[2]' : 'flex-1'}`}
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