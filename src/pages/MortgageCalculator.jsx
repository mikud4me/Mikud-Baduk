import React, { useState, useMemo, useEffect } from 'react';
import { 
  User, Home, Briefcase, AlertCircle, ChevronLeft, Loader2, Phone, 
  Wallet, Building2, ShieldCheck, Sparkles, Mail, BadgeCheck, 
  Calendar, Coins, TrendingDown, Rocket, MessageSquareQuote, 
  ClipboardList, Lock, HelpCircle, Smartphone, Key, Target, HeartHandshake, ShieldAlert
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PremiumInput from '@/components/mikud/PremiumInput';
import MixTable from '@/components/mikud/MixTable';
import MikoChat from '@/components/mikud/MikoChat';

const TODAY_DATE = "18 בינואר 2026";
const RATES = {
  FIXED_UNLINKED: 0.0505, 
  VAR_UNLINKED: 0.0498,   
  FIXED_LINKED: 0.0347,   
  VAR_LINKED: 0.0361,    
  PRIME: 0.0550,          
  PRIME_CALC: 0.0500
};

const formatCurrency = (val) => {
  if (!val || isNaN(val)) return "0";
  return new Intl.NumberFormat('he-IL').format(val);
};

const calculatePayment = (principal, rate, years) => {
  if (!principal || !rate || !years || years <= 0) return 0;
  const i = rate / 12;
  const n = years * 12;
  if (i === 0) return principal / n;
  return (principal * i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
};

const cleanAiText = (text) => {
  if (!text) return "";
  const lines = text.replace(/[*#_\\-]/g, '').split('\n').map(l => l.trim()).filter(l => l.length > 0);
  return lines.map((line, i) => `${i + 1}. ${line.replace(/^[0-9]+\.\s*/, '')}`).join('\n\n');
};

export default function MortgageCalculator() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [bankerEmail, setBankerEmail] = useState("");
  const [isPurchased, setIsPurchased] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [userInputOtp, setUserInputOtp] = useState("");

  const [formData, setFormData] = useState({
    fullName: '', phone: '', email: '', consent: false,
    purpose: 'first_home', loanDuration: '25',
    propertyPrice: '', propertyStatus: 'first_home',
    age: '', employmentStatusA: 'employee', employmentStatusB: 'none',
    netIncome: '', partnerNetIncome: '0',
    monthlyDebts: '0', creditHistory: 'clean', equity: '',
    additionalIncomeType: 'none', additionalIncomeAmount: '0'
  });

  const maxTerm = useMemo(() => {
    const ageNum = Number(formData.age) || 35;
    return Math.min(30, Math.max(1, 80 - ageNum));
  }, [formData.age]);

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: null }));
  };

  const startVerification = () => {
    const errors = {};
    if (!formData.fullName || formData.fullName.trim().length < 2) errors.fullName = "אנא הזן שם מלא תקין";
    if (!/^05\d{8}$/.test(formData.phone)) errors.phone = "טלפון נייד לא תקין (10 ספרות)";
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email)) errors.email = "נא להזין כתובת אימייל אמיתית ותקינה";
    
    if (!formData.consent) errors.consent = "חובה לאשר יצירת קשר";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
    setOtpSent(true);
  };

  const verifyOtp = () => {
    if (userInputOtp === generatedOtp) { 
      setOtpVerified(true); 
      setStep(2); 
    } else { 
      setFieldErrors({ otp: "קוד שגוי" }); 
    }
  };

  const validateStep = (currentStep) => {
    const errors = {};
    if (currentStep === 2 && !formData.age) errors.age = "חובה להזין גיל";
    if (currentStep === 3 && !formData.propertyPrice) errors.propertyPrice = "חובה להזין שווי נכס";
    if (currentStep === 4 && !formData.netIncome) errors.netIncome = "חובה להזין הכנסה";
    if (currentStep === 5 && !formData.equity) errors.equity = "חובה להזין הון עצמי";
    setFieldErrors(errors);
    return Object.keys(errors).filter(k => errors[k]).length === 0;
  };

  const results = useMemo(() => {
    const price = Number(formData.propertyPrice) || 0;
    const eq = Number(formData.equity) || 0;
    const duration = Math.min(maxTerm, Number(formData.loanDuration) || maxTerm);
    const loanAmount = Math.max(0, price - eq);
    const ltv = price > 0 ? (loanAmount / price) : 0;
    const totalInc = (Number(formData.netIncome) || 0) + (Number(formData.partnerNetIncome) || 0) + (Number(formData.additionalIncomeAmount) || 0);
    const freeIncome = Math.max(1, totalInc - Number(formData.monthlyDebts));

    const mixB_T1 = { 
      name: "פריים (Prime)", 
      amount: loanAmount * 0.33, 
      rate: RATES.PRIME_CALC, 
      years: duration, 
      pmt: calculatePayment(loanAmount * 0.33, RATES.PRIME_CALC, duration), 
      desc: "P-0.5%" 
    };
    const mixB_T2 = { 
      name: "קבועה לא צמודה (קל\"צ)", 
      amount: loanAmount * 0.33, 
      rate: RATES.FIXED_UNLINKED, 
      years: duration, 
      pmt: calculatePayment(loanAmount * 0.33, RATES.FIXED_UNLINKED, duration), 
      desc: "החזר קבוע" 
    };
    const mixB_T3 = { 
      name: "משתנה כל 5 שנים צמודה", 
      amount: loanAmount * 0.34, 
      rate: RATES.VAR_LINKED, 
      years: duration, 
      pmt: calculatePayment(loanAmount * 0.34, RATES.VAR_LINKED, duration), 
      desc: "משתנה צמודה" 
    };
    const pmtB = mixB_T1.pmt + mixB_T2.pmt + mixB_T3.pmt;

    return {
      loanAmount, 
      ltv: ltv * 100, 
      totalIncome: totalInc, 
      dti: (pmtB / freeIncome) * 100, 
      actualDuration: duration,
      mixA: { 
        tracks: [{ 
          name: "100% קבועה לא צמודה", 
          amount: loanAmount, 
          rate: RATES.FIXED_UNLINKED, 
          years: duration, 
          pmt: calculatePayment(loanAmount, RATES.FIXED_UNLINKED, duration), 
          desc: "הגנה מלאה" 
        }], 
        total: calculatePayment(loanAmount, RATES.FIXED_UNLINKED, duration) 
      },
      mixB: { tracks: [mixB_T1, mixB_T2, mixB_T3], total: pmtB },
      mixC: { 
        tracks: [
          { 
            name: "50% פריים (Prime)", 
            amount: loanAmount * 0.5, 
            rate: RATES.PRIME_CALC, 
            years: duration, 
            pmt: calculatePayment(loanAmount*0.5, RATES.PRIME_CALC, duration), 
            desc: "ניצול שוק" 
          }, 
          { 
            name: "50% קבועה (קל\"צ)", 
            amount: loanAmount * 0.5, 
            rate: RATES.FIXED_UNLINKED, 
            years: duration, 
            pmt: calculatePayment(loanAmount*0.5, RATES.FIXED_UNLINKED, duration), 
            desc: "עוגן יציבות" 
          }
        ], 
        total: calculatePayment(loanAmount*0.5, RATES.PRIME_CALC, duration) + calculatePayment(loanAmount*0.5, RATES.FIXED_UNLINKED, duration) 
      },
      score: Math.min(100, Math.max(0, (ltv <= 0.75 ? 50 : 5) + ((pmtB / freeIncome) <= 0.40 ? 50 : 10)))
    };
  }, [formData, maxTerm]);

  const generateFullAnalysis = async () => {
    if (!validateStep(6)) return;
    setLoading(true);
    setStep(7);
    
    const prompt = `נתח תיק משכנתא: סכום ${results.loanAmount}₪, הון ${formData.equity}₪, מימון ${results.ltv.toFixed(1)}%. כתוב 4 סעיפים ממוספרים של המלצות אסטרטגיות וסיכונים. ענה בעברית בלבד ללא Markdown.`;
    const emailPrompt = `צור טיוטת אימייל מקצועית ✨ לבנקאי עבור תיק משכנתא זה.`;

    try {
      const [analysisResponse, emailResponse] = await Promise.all([
        base44.integrations.Core.InvokeLLM({ 
          prompt, 
          add_context_from_internet: false 
        }),
        base44.integrations.Core.InvokeLLM({ 
          prompt: emailPrompt, 
          add_context_from_internet: false 
        })
      ]);
      
      const analysis = analysisResponse?.output || analysisResponse || "הניתוח הושלם. קיימת היתכנות גבוהה לעסקה.";
      const email = emailResponse?.output || emailResponse || "";
      
      setAiAnalysis(cleanAiText(analysis));
      setBankerEmail(email.replace(/[*#]/g, ''));
      
      await base44.entities.Lead.create({
        ...formData,
        loanAmount: results.loanAmount,
        ltv: results.ltv,
        score: results.score,
        aiAnalysis: analysis,
        isPurchased: false,
        status: 'new'
      });
    } catch (err) {
      console.error(err);
      setAiAnalysis("הניתוח הושלם. קיימת היתכנות גבוהה לעסקה.");
    } finally { 
      setLoading(false); 
    }
  };

  const getAiInsight = async (type) => {
    if (!isPurchased) return;
    setInsightLoading(true);
    
    const types = {
      roadmap: { label: "אסטרטגיית חיסכון", prompt: "צור 3 טיפים אסטרטגיים לחיסכון וקיצור תקופה. ענה כרשימה ממוספרת נקייה." },
      negotiation: { label: "הכנה למשא ומתן", prompt: "צור 3 שאלות מפתח לבנקאי לשיפור תנאים." },
      documents: { label: "רשימת מסמכים להגשה", prompt: "צור רשימת מסמכים מדויקת להגשה לבנק." }
    };
    
    try {
      const response = await base44.integrations.Core.InvokeLLM({ 
        prompt: types[type].prompt,
        add_context_from_internet: false 
      });
      const data = response?.output || response || "פנה ליועץ לקבלת המידע המלא.";
      setAiInsights({ type: types[type].label, content: cleanAiText(data) });
    } catch (e) {
      setAiInsights({ type: types[type].label, content: "פנה ליועץ לקבלת המידע המלא." });
    } finally { 
      setInsightLoading(false); 
    }
  };

  return (
    <div className="min-h-screen font-sans text-right transition-all duration-700 bg-slate-50 overflow-x-hidden" dir="rtl">
      
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm h-14 px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.reload()}>
          <div className="w-8 h-8 rounded-lg bg-[#001a33] flex items-center justify-center text-[#d4af37] font-black text-xl shadow-lg">M</div>
          <h1 className="text-lg font-black text-[#001a33]">מיקוד משכנתאות</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 text-[#001a33] font-black hover:text-[#d4af37] transition-colors cursor-pointer text-xs" onClick={() => setIsChatOpen(!isChatOpen)}>
            <HelpCircle size={16} className="text-[#d4af37]" />
            <span>צריכים עזרה?</span>
          </div>
          <a href="tel:2324" className="bg-[#001a33] text-white px-3 py-1.5 rounded-lg font-black text-sm shadow-lg hover:bg-blue-900 transition-all active:scale-95 text-center">2324*</a>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-6 flex flex-col items-center">
        {step <= 6 ? (
          <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-xl p-6 sm:p-10 border border-slate-100 transition-all duration-700">
            <div className="flex items-center justify-between mb-8">
              <div className="text-right">
                <h2 className="text-xl font-black text-[#001a33] uppercase leading-none text-right">
                  {step === 1 && !otpSent && "זיהוי וקשר"}
                  {step === 1 && otpSent && "אימות קוד"}
                  {step === 2 && "פרופיל לווים"}
                  {step === 3 && "פרטי הנכס"}
                  {step === 4 && "הכנסות והתחייבויות"}
                  {step === 5 && "מקורות מימון"}
                  {step === 6 && "העדפות משכנתא"}
                </h2>
                <p className="text-slate-400 font-bold text-[10px] mt-1 tracking-widest uppercase">שלב {step} מתוך 6</p>
              </div>
              <div className="relative w-14 h-14 flex items-center justify-center text-[#d4af37]">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-slate-50" />
                  <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-[#d4af37] transition-all duration-1000" strokeDasharray={151} strokeDashoffset={151 - (151 * step) / 6} strokeLinecap="round" />
                </svg>
                <span className="absolute text-xs font-black text-[#001a33]">{step}/6</span>
              </div>
            </div>

            <div className="min-h-[300px]">
              {step === 1 && !otpSent && (
                <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                  <PremiumInput label="שם מלא לתיק הלקוח" name="fullName" value={formData.fullName} placeholder="ישראל ישראלי" icon={User} onChange={handleInputChange} error={fieldErrors.fullName} />
                  <PremiumInput label="טלפון נייד" name="phone" value={formData.phone} placeholder="05XXXXXXXX" icon={Phone} onChange={handleInputChange} error={fieldErrors.phone} />
                  <PremiumInput label="כתובת דוא״ל" name="email" value={formData.email} placeholder="name@domain.com" icon={Mail} onChange={handleInputChange} type="email" error={fieldErrors.email} />
                  <div className="mt-4 flex items-start gap-3 p-5 rounded-xl border-2 bg-slate-50 shadow-inner">
                    <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-[#001a33] focus:ring-[#001a33]" checked={formData.consent} onChange={(e) => handleInputChange('consent', e.target.checked)} />
                    <p className="text-[11px] text-slate-500 font-bold leading-relaxed text-right">אני מאשר ליועץ ממיקוד משכנתאות ליצור איתי קשר לצורך קידום התיק.</p>
                  </div>
                </div>
              )}

              {step === 1 && otpSent && !otpVerified && (
                <div className="animate-in zoom-in-95 duration-500 text-center py-8">
                  <Smartphone size={40} className="text-[#001a33] mx-auto mb-4" />
                  <h4 className="text-lg font-black text-[#001a33] mb-2 text-center">הזן קוד אימות</h4>
                  <PremiumInput label="הזן קוד" name="otp" value={userInputOtp} onChange={(n, v) => setUserInputOtp(v)} placeholder="0000" icon={Key} error={fieldErrors.otp} />
                  <p className="mt-2 text-[10px] text-slate-400 italic font-black text-center">קוד לבדיקה: <span className="text-[#d4af37]">{generatedOtp}</span></p>
                </div>
              )}

              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                  <PremiumInput label="גיל לווה מבוגר ביותר" name="age" value={formData.age} icon={Calendar} onChange={handleInputChange} placeholder="40" error={fieldErrors.age} />
                  <PremiumInput label="סטטוס תעסוקתי" name="employmentStatusA" value={formData.employmentStatusA} icon={Briefcase} onChange={handleInputChange} options={[{val:'employee', label:'שכיר/ה'}, {val:'self_employed', label:'עצמאי/ת'}, {val:'both', label:'גם וגם'}]} />
                  <PremiumInput label="דירוג אשראי BDI" name="creditHistory" value={formData.creditHistory} icon={ShieldCheck} onChange={handleInputChange} options={[{val:'clean', label:'תקין לחלוטין (ירוק)'}, {val:'issues', label:'מורכב (היו עיכובים)'}]} />
                </div>
              )}

              {step === 3 && (
                <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                  <PremiumInput label="מטרת המשכנתא" name="purpose" value={formData.purpose} icon={Target} onChange={handleInputChange} 
                    options={[{val:'first_home', label:'דירה ראשונה'}, {val:'improvement', label:'משפרי דיור / חליפית'}, {val:'contractor', label:'רכישה מקבלן'}, {val:'any_purpose', label:'לכל מטרה / השקעה'}]} />
                  <PremiumInput label="שווי הנכס (חוזה או הערכה)" name="propertyPrice" value={formData.propertyPrice} placeholder="שווי שוק מוערך" icon={Home} onChange={handleInputChange} error={fieldErrors.propertyPrice} />
                  <PremiumInput label="סטטוס וסוג הנכס" name="propertyStatus" value={formData.propertyStatus} icon={Building2} onChange={handleInputChange} 
                    options={[
                      {val:'first_home', label:'דירה ראשונה (עד 75% מימון)'}, 
                      {val:'second_hand', label:'דירה יד שנייה / חליפית (עד 70% מימון)'}, 
                      {val:'contractor', label:'רכישה מקבלן (עד 75% מימון)'}, 
                      {val:'investment', label:'דירה להשקעה (עד 50% מימון)'}, 
                      {val:'self_build', label:'מגרש / בנייה עצמית (עד 75% מימון)'}, 
                      {val:'any_purpose', label:'הלוואה לכל מטרה (עד 50% מימון)'}
                    ]} 
                  />
                </div>
              )}

              {step === 4 && (
                <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                  <PremiumInput label="נטו לווה א' (ממוצע 3 חודשים)" name="netIncome" value={formData.netIncome} icon={Coins} onChange={handleInputChange} error={fieldErrors.netIncome} />
                  <PremiumInput label="נטו לווה ב' (אם קיים)" name="partnerNetIncome" value={formData.partnerNetIncome} icon={Coins} onChange={handleInputChange} />
                  <PremiumInput label="החזרי הלוואות חודשיים" name="monthlyDebts" value={formData.monthlyDebts} placeholder="סכום חודשי" icon={TrendingDown} onChange={handleInputChange} />
                </div>
              )}

              {step === 5 && (
                <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                  <PremiumInput label="הון עצמי זמין למשכנתא" name="equity" value={formData.equity} placeholder="סכום הון עצמי" icon={Wallet} onChange={handleInputChange} error={fieldErrors.equity} />
                  <div className="space-y-4">
                    <PremiumInput label="סוג הכנסה נוספת" name="additionalIncomeType" value={formData.additionalIncomeType} icon={HeartHandshake} onChange={handleInputChange} 
                      options={[{val:'none', label:'אין לי הכנסות נוספות'}, {val:'rent', label:'הכנסה משכירות'}, {val:'child', label:'קצבאות ילדים'}, {val:'other', label:'אחר'}]} />
                    
                    {formData.additionalIncomeType !== 'none' && (
                      <div className="animate-in slide-in-from-top-2 duration-300">
                        <PremiumInput label="סכום חודשי נוסף" name="additionalIncomeAmount" value={formData.additionalIncomeAmount} icon={Coins} onChange={handleInputChange} />
                        <div className="p-4 bg-red-50 border-r-8 border-red-600 rounded-xl flex items-start gap-4 shadow-sm text-right">
                          <ShieldAlert size={24} className="text-red-600 shrink-0" />
                          <div className="text-right">
                            <p className="text-red-900 font-black text-sm">אזהרה רגולטורית</p>
                            <p className="text-red-700 text-xs font-bold leading-relaxed">
                              שימו לב: הבנק יכיר בשכירות אך ורק אם מדובר בהכנסה עסקית מתועדת ומדווחת כחוק.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="animate-in fade-in slide-in-from-left-4 duration-500 text-center py-10">
                  <PremiumInput label="תקופת הלוואה רצויה (בשנים)" name="loanDuration" type="range" value={formData.loanDuration} min={4} max={maxTerm} onChange={handleInputChange} icon={Building2} />
                  <div className="mt-16 w-full text-center">
                    <p className="text-3xl sm:text-4xl font-black text-[#d4af37] italic animate-pulse tracking-tight drop-shadow-md leading-tight">
                      מיד מסיימים ואל תשכחו: <br/> מיקוד משכנתאות - המטרה שלנו, החיסכון שלכם
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex gap-4 text-right" dir="rtl">
              <button onClick={() => {if(step === 1 && otpSent) setOtpSent(false); else if(step > 1) setStep(s => s - 1);}} className="flex-1 h-12 rounded-xl font-black text-lg text-slate-500 border-2 border-slate-100 hover:bg-slate-50 transition-all active:scale-95 text-center">חזור</button>
              <button onClick={() => {
                if (step === 1 && !otpSent) startVerification();
                else if (step === 1 && otpSent) verifyOtp();
                else if (validateStep(step)) step === 6 ? generateFullAnalysis() : setStep(s => s + 1);
              }} className="flex-[2] h-12 rounded-xl font-black text-xl shadow-lg transition-all bg-[#001a33] text-white hover:bg-[#d4af37] hover:text-[#001a33] active:scale-95 text-center">
                <span>{step === 6 ? 'הפקת דוח מסכם' : step === 1 && !otpSent ? 'שלח קוד' : 'המשך'}</span>
                <ChevronLeft size={20} className="inline mr-1" />
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in-95 duration-1000 max-w-4xl mx-auto text-right" dir="rtl">
            <div className="bg-white rounded-[2.5rem] shadow-2xl p-6 sm:p-10 border-t-[12px] border-[#001a33] relative">
              <div className="mb-10 pb-8 border-b-4 border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 text-right">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-[#d4af37] font-black text-[10px] uppercase tracking-[0.2em]">
                    <BadgeCheck size={24}/>תיק היתכנות אסטרטגי רשמי
                  </div>
                  <h2 className="text-4xl font-black text-[#001a33] tracking-tighter uppercase leading-none">{formData.fullName}</h2>
                  <p className="text-slate-400 font-bold text-sm italic mt-1 tracking-wider uppercase leading-none">PRIVATE ADVISORY REPORT | {TODAY_DATE}</p>
                </div>
                <div className="bg-slate-50 px-6 py-3 rounded-2xl border-2 border-slate-100 text-left">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Portfolio ID</p>
                  <p className="text-lg font-black text-[#001a33] leading-none uppercase">MK-{Math.random().toString(36).substr(2, 5).toUpperCase()}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 text-right">
                <div className="p-8 rounded-[2rem] shadow-xl border-b-8 bg-[#001a33] border-[#d4af37] text-white">
                  <span className="font-black text-[11px] uppercase tracking-widest text-[#d4af37]">סכום משכנתא מבוקש / יחס מימון</span>
                  <div className="text-5xl font-black mt-2 leading-none text-right">₪{formatCurrency(results.loanAmount)}</div>
                  <div className="mt-3 font-bold text-xs text-slate-400">{results.ltv.toFixed(1)}% מימון מהנכס</div>
                </div>
                <div className="p-8 rounded-[2rem] border-2 shadow-sm flex flex-col justify-between bg-[#FDF9F0] border-[#EAD9B5] text-right">
                  <div>
                    <span className="font-black text-[11px] uppercase tracking-widest text-[#785C28]">ציון היתכנות לאישור סופי</span>
                    <div className="text-5xl font-black mt-2 leading-none text-[#001a33]">{results.score}%</div>
                  </div>
                  <div className="mt-6 h-2.5 bg-white rounded-full overflow-hidden border border-slate-200">
                    <div className="h-full bg-[#001a33] transition-all duration-2000" style={{width: `${results.score}%`}} />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-200 relative overflow-hidden mb-12 shadow-inner text-right">
                <div className="absolute top-0 right-0 w-2.5 h-full bg-[#001a33]" />
                <h3 className="text-2xl font-black text-[#001a33] mb-8 flex items-center gap-4">
                  <Sparkles size={28} className="text-[#d4af37]" /> ניתוח אסטרטגי מלא מיקוד משכנתאות
                </h3>
                <div className="text-slate-700 text-lg leading-loose font-bold text-justify whitespace-pre-line">
                  {loading ? (
                    <div className="flex items-center gap-4 italic text-xl text-right">
                      <Loader2 className="animate-spin text-blue-600" /> המערכת מנתחת את התיק שלכם...
                    </div>
                  ) : aiAnalysis}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-400 font-bold italic">
                  * החישוב מבוסס על ריביות ממוצעות ועדכניות ליום החישוב מאתר בנק ישראל.
                </div>
              </div>

              <div className="text-center mb-8">
                <h4 className="text-2xl font-black text-[#001a33] italic">לחצו כאן לקבלת חומרים ואסטרטגיות נוספות ממיקו ה-AI</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 text-right">
                <button onClick={() => getAiInsight('roadmap')} className={`p-8 rounded-[2rem] font-black flex items-center justify-between shadow-2xl transition-all active:scale-95 group border-b-8 ${isPurchased ? 'bg-[#001a33] text-white border-[#d4af37] cursor-pointer' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'}`} disabled={!isPurchased}>
                  <div className="flex items-center gap-4"><Rocket size={24} className="text-[#d4af37]" /><span>✨ אסטרטגיה</span></div>
                  <ChevronLeft size={20} />
                </button>
                <button onClick={() => getAiInsight('negotiation')} className={`p-8 rounded-[2rem] font-black flex items-center justify-between shadow-2xl transition-all active:scale-95 group border-b-8 ${isPurchased ? 'bg-[#001a33] text-white border-[#d4af37] cursor-pointer' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'}`} disabled={!isPurchased}>
                  <div className="flex items-center gap-4"><MessageSquareQuote size={24} className="text-[#d4af37]" /><span>✨ מו"מ</span></div>
                  <ChevronLeft size={20} />
                </button>
                <button onClick={() => getAiInsight('documents')} className={`p-8 rounded-[2rem] font-black flex items-center justify-between shadow-2xl transition-all active:scale-95 group border-b-8 ${isPurchased ? 'bg-[#001a33] text-white border-[#d4af37] cursor-pointer' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'}`} disabled={!isPurchased}>
                  <div className="flex items-center gap-4"><ClipboardList size={24} className="text-[#d4af37]" /><span>✨ מסמכים</span></div>
                  <ChevronLeft size={20} />
                </button>
              </div>

              {aiInsights && (
                <div className="bg-[#FDF9F0] p-10 rounded-[3rem] border-2 border-[#EAD9B5] mb-12 animate-in slide-in-from-bottom-4 duration-500 text-right shadow-sm relative">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#EAD9B5]/30">
                    <Sparkles className="text-[#785C28]" />
                    <h4 className="text-xl font-black text-[#785C28] uppercase tracking-widest italic">{aiInsights.type}</h4>
                  </div>
                  <div className="text-[#785C28] text-lg font-medium leading-relaxed whitespace-pre-wrap">
                    {insightLoading ? (
                      <div className="flex items-center gap-3">
                        <Loader2 size={16} className="animate-spin" />
                        <span>מייצר ניתוח...</span>
                      </div>
                    ) : String(aiInsights.content)}
                  </div>
                </div>
              )}

              <div className="relative min-h-[300px] mb-12">
                {!isPurchased && (
                  <div className="absolute inset-0 z-20 backdrop-blur-xl bg-white/40 rounded-[3rem] flex flex-col items-center justify-center border-4 border-dashed border-[#d4af37]/40 p-10 text-center shadow-2xl">
                    <Lock size={64} className="text-[#001a33] mb-6" />
                    <h4 className="text-4xl font-black text-[#001a33] mb-4 leading-none">דוח תמהילים אופטימלי נעול</h4>
                    <p className="text-slate-700 font-bold text-lg max-w-sm mb-10 leading-relaxed italic">הפקת התמהילים המדויקים, פירוט הריביות והחזרים חודשיים מלאים דורשת פתיחת תיק בחברת מיקוד משכנתאות.</p>
                    <button onClick={() => setIsPurchased(true)} className="bg-[#001a33] text-white px-12 py-5 rounded-[2.5rem] font-black text-3xl shadow-3xl hover:bg-[#d4af37] hover:text-[#001a33] transition-all transform hover:scale-105 active:scale-95 flex items-center gap-6">
                      <span>רכוש דוח מלא ב-₪499 + מע"מ</span>
                      <ChevronLeft size={28}/>
                    </button>
                  </div>
                )}
                <div className={`space-y-12 transition-all duration-1000 ${!isPurchased ? 'blur-3xl opacity-20 pointer-events-none' : ''}`}>
                  <MixTable title='תמהיל אסטרטגי משולב (מומלץ)' tracks={results.mixB.tracks} totalPmt={results.mixB.total} isRecommended={true} />
                  <MixTable title='תמהיל שמרני (100% קבועה)' tracks={results.mixA.tracks} totalPmt={results.mixA.total} />
                  <MixTable title='תמהיל פריים weighted' tracks={results.mixC.tracks} totalPmt={results.mixC.total} />
                </div>
              </div>

              <div className={`p-10 bg-[#001a33] rounded-[3rem] mb-12 text-white shadow-2xl transition-all duration-1000 ${!isPurchased ? 'opacity-30 blur-md pointer-events-none' : ''}`}>
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-6 text-center sm:text-right">
                  <div className="text-right">
                    <h4 className="text-3xl font-black flex items-center gap-4 justify-center sm:justify-start leading-none mb-2">
                      <Mail size={32} className="text-[#d4af37]" /> ✨ טיוטת פנייה לבנק
                    </h4>
                    <p className="text-slate-400 text-sm font-bold italic">מיקו יצר עבורכם את המייל המקצועי ביותר להגשה לבנקאי.</p>
                  </div>
                </div>
                <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 shadow-inner font-bold text-lg text-slate-100 leading-loose text-right whitespace-pre-wrap">
                  {bankerEmail || "הטיוטה תופיע כאן לאחר רכישת הדוח..."}
                </div>
              </div>

              <div className="mt-12 bg-[#001a33] rounded-[4rem] p-16 text-white flex flex-col lg:flex-row items-center justify-between gap-12 border-b-[10px] border-[#d4af37] shadow-3xl text-right">
                <div className="text-right max-w-xl">
                  <h4 className="text-5xl font-black mb-8 leading-tight tracking-tighter italic uppercase">המטרה שלנו היא<br/>החיסכון הגדול שלכם.</h4>
                  <p className="text-slate-400 text-xl font-bold leading-relaxed italic">הניתוח הוא רק ההתחלה. מומחי מיקוד משכנתאות ישיגו לכם את התנאים המנצחים במערכת הבנקאית.</p>
                </div>
                <div className="flex flex-col items-center gap-8 text-center">
                  <a href="tel:2324" className="bg-[#d4af37] text-[#001a33] px-16 py-8 rounded-[2rem] font-black text-6xl shadow-2xl hover:bg-white transition-all transform hover:scale-105 active:scale-95 leading-none">2324*</a>
                  <p className="text-[#d4af37] font-black tracking-widest uppercase text-xs">פגישת ייעוץ אישית ללא התחייבות</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <MikoChat formData={formData} results={results} isPurchased={isPurchased} isOpen={isChatOpen} setIsOpen={setIsChatOpen} />
      
    </div>
  );
}