import React, { useState, useMemo, useEffect } from 'react';
import { 
  User, Home, Briefcase, AlertCircle, ChevronLeft, Loader2, Phone, 
  Wallet, Building2, ShieldCheck, Sparkles, Mail, BadgeCheck, 
  Calendar, Coins, TrendingDown, Rocket, MessageSquareQuote, 
  ClipboardList, Lock, HelpCircle, Smartphone, Key, Target, HeartHandshake, ShieldAlert, X
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PremiumInput from '@/components/mikud/PremiumInput';
import MixTable from '@/components/mikud/MixTable';
import MikoChat from '@/components/mikud/MikoChat';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_test_51QcMelJvSiJi40JJ79sN9CXTTxyHQqH0p92aU7TLPl67xyqG9mXC4yBM0SovVlnZ31RB5IZJpRfmNaTFOjdUe96o00E8OxJmC7');

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
  const [showPayment, setShowPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [currentLeadId, setCurrentLeadId] = useState(null);

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
      
      const lead = await base44.entities.Lead.create({
        ...formData,
        loanAmount: results.loanAmount,
        ltv: results.ltv,
        score: results.score,
        aiAnalysis: analysis,
        isPurchased: false,
        status: 'new'
      });
      
      setCurrentLeadId(lead.id);
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

  const handlePurchaseClick = async () => {
    try {
      const response = await base44.functions.invoke('createPaymentIntent', {
        amount: 499,
        currency: 'ils',
        metadata: { leadId: currentLeadId, reportType: 'full' }
      });
      
      if (response.data?.clientSecret) {
        setClientSecret(response.data.clientSecret);
        setShowPayment(true);
      } else {
        throw new Error('Failed to create payment');
      }
    } catch (error) {
      console.error('Payment creation failed:', error);
      alert('שגיאה ביצירת תשלום. אנא נסה שוב.');
    }
  };

  const handlePaymentSuccess = async () => {
    setIsPurchased(true);
    setShowPayment(false);
    
    if (currentLeadId) {
      await base44.entities.Lead.update(currentLeadId, { isPurchased: true });
    }
  };

  return (
    <div className="min-h-screen font-sans text-right transition-all duration-700 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 overflow-x-hidden relative" dir="rtl">
      
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-[#d4af37]/20 via-transparent to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-blue-600/10 via-transparent to-transparent rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-gradient-to-br from-[#d4af37]/10 via-transparent to-transparent rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
      </div>

      <nav className="sticky top-0 z-50 bg-gradient-to-r from-[#001a33] via-[#002a4d] to-[#001a33] border-b-2 border-[#d4af37]/30 shadow-2xl backdrop-blur-xl h-24 px-6 sm:px-10 flex items-center justify-between">
        <div className="flex items-center cursor-pointer group" onClick={() => window.location.reload()}>
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696ca6d05493d178c33e26fd/c3cbe376c_Screenshot_20260117_000002_Gallery.jpg" 
            alt="מיקוד משכנתאות - המטרה שלנו, החיסכון שלכם" 
            className="h-20 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold hover:bg-white/20 transition-all group"
          >
            <HelpCircle size={18} className="text-[#d4af37] group-hover:rotate-12 transition-transform" />
            <span>צריכים עזרה?</span>
          </button>
          <a href="tel:2324" className="bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#001a33] px-6 py-3 rounded-2xl font-black text-lg shadow-2xl shadow-[#d4af37]/50 hover:scale-105 transition-all active:scale-95 text-center">
            2324*
          </a>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-12 flex flex-col items-center relative z-10">
        {step <= 6 ? (
          <div className="w-full max-w-2xl">
            {/* Hero Section Above Form */}
            {step === 1 && !otpSent && (
              <div className="text-center mb-10 animate-in fade-in slide-in-from-top-8 duration-1000">
                <div className="inline-block mb-6">
                  <div className="bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#001a33] px-8 py-3 rounded-full font-black text-sm shadow-2xl shadow-[#d4af37]/50 animate-pulse">
                    ✨ מערכת חכמה לבניית תמהילי משכנתא ✨
                  </div>
                </div>
                <h1 className="text-5xl sm:text-6xl font-black text-white mb-6 leading-tight drop-shadow-2xl">
                  המשכנתא המושלמת<br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] to-[#f4d03f]">
                    מתחילה כאן
                  </span>
                </h1>
                <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium">
                  מערכת AI מתקדמת שבונה עבורכם 3 תמהילים אופטימליים תוך דקות ספורות
                </p>
                <div className="flex justify-center gap-8 mt-8 text-sm">
                  <div className="flex items-center gap-2 text-[#d4af37]">
                    <div className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse" />
                    <span className="text-white font-bold">חיסכון ממוצע ₪150K</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#d4af37]">
                    <div className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse" />
                    <span className="text-white font-bold">תוצאות ב-3 דקות</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#d4af37]">
                    <div className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse" />
                    <span className="text-white font-bold">100% חינם</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-gradient-to-br from-white via-slate-50 to-white rounded-[2rem] sm:rounded-[3rem] shadow-2xl p-5 sm:p-8 md:p-12 border-2 sm:border-4 border-[#d4af37]/20 transition-all duration-700 relative overflow-hidden backdrop-blur-xl">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#d4af37]/10 to-transparent rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full blur-3xl" />
              
              <div className="flex items-center justify-between mb-10 relative z-10">
              <div className="text-right flex-1">
                <div className="inline-flex items-center gap-3 bg-gradient-to-r from-[#001a33] to-[#003d66] px-6 py-3 rounded-2xl shadow-xl mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#f4d03f] flex items-center justify-center shadow-lg">
                    {step === 1 && <User size={20} className="text-[#001a33]" />}
                    {step === 2 && <Calendar size={20} className="text-[#001a33]" />}
                    {step === 3 && <Home size={20} className="text-[#001a33]" />}
                    {step === 4 && <Coins size={20} className="text-[#001a33]" />}
                    {step === 5 && <Wallet size={20} className="text-[#001a33]" />}
                    {step === 6 && <Building2 size={20} className="text-[#001a33]" />}
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-2xl font-black text-white leading-none">
                      {step === 1 && !otpSent && "בואו נכיר"}
                      {step === 1 && otpSent && "אימות זהות"}
                      {step === 2 && "פרופיל אישי"}
                      {step === 3 && "הנכס שלכם"}
                      {step === 4 && "מצב כלכלי"}
                      {step === 5 && "מקורות מימון"}
                      {step === 6 && "העדפות"}
                    </h2>
                    <p className="text-[#d4af37] font-bold text-[10px] sm:text-xs mt-1">שלב {step} מתוך 6 - כמעט שם!</p>
                  </div>
                </div>
              </div>
              
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-200" />
                  <circle cx="48" cy="48" r="40" stroke="url(#gradient)" strokeWidth="4" fill="transparent" className="transition-all duration-1000" strokeDasharray={251} strokeDashoffset={251 - (251 * step) / 6} strokeLinecap="round" />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#d4af37" />
                      <stop offset="100%" stopColor="#f4d03f" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-[#001a33]">{step}</span>
                  <span className="text-xs font-bold text-slate-400">מתוך 6</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/20 to-transparent rounded-full blur-xl animate-pulse" />
              </div>
              </div>

              <div className="min-h-[300px] relative z-10">
              {step === 1 && !otpSent && (
                <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                  <PremiumInput label="שם מלא לתיק הלקוח" name="fullName" value={formData.fullName} placeholder="ישראל ישראלי" icon={User} onChange={handleInputChange} error={fieldErrors.fullName} />
                  <PremiumInput label="טלפון נייד" name="phone" value={formData.phone} placeholder="05XXXXXXXX" icon={Phone} onChange={handleInputChange} error={fieldErrors.phone} />
                  <PremiumInput label="כתובת דוא״ל" name="email" value={formData.email} placeholder="Office@mikud4me.co.il" icon={Mail} onChange={handleInputChange} type="email" error={fieldErrors.email} />
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

            <div className="mt-10 flex gap-4 text-right relative z-10" dir="rtl">
              {step > 1 && (
                <button 
                  onClick={() => {if(step === 1 && otpSent) setOtpSent(false); else if(step > 1) setStep(s => s - 1);}} 
                  className="flex-1 h-16 rounded-2xl font-black text-lg text-slate-600 border-3 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all active:scale-95 text-center shadow-lg group"
                >
                  <span className="group-hover:-translate-x-1 inline-block transition-transform">← חזור</span>
                </button>
              )}
              <button 
                onClick={() => {
                  if (step === 1 && !otpSent) startVerification();
                  else if (step === 1 && otpSent) verifyOtp();
                  else if (validateStep(step)) step === 6 ? generateFullAnalysis() : setStep(s => s + 1);
                }} 
                className={`h-16 rounded-2xl font-black text-xl shadow-2xl transition-all bg-gradient-to-r from-[#001a33] to-[#003d66] text-white hover:from-[#d4af37] hover:to-[#f4d03f] hover:text-[#001a33] active:scale-95 text-center group ${step > 1 ? 'flex-[2]' : 'flex-1'}`}
              >
                <span className="flex items-center justify-center gap-2">
                  {step === 6 ? (
                    <>
                      <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
                      הפקת דוח מסכם
                    </>
                  ) : step === 1 && !otpSent ? (
                    <>
                      שלח קוד אימות
                      <ChevronLeft size={24} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  ) : (
                    <>
                      המשך לשלב הבא
                      <ChevronLeft size={24} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>
            </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in-95 duration-1000 max-w-4xl mx-auto text-right px-2 sm:px-0" dir="rtl">
              <div className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl p-4 sm:p-6 md:p-10 border-t-[6px] sm:border-t-[12px] border-[#001a33] relative">
                <div className="mb-6 sm:mb-10 pb-4 sm:pb-8 border-b-2 sm:border-b-4 border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 text-right">
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-[#d4af37] font-black text-[8px] sm:text-[10px] uppercase tracking-[0.1em] sm:tracking-[0.2em]">
                      <BadgeCheck size={16} className="sm:w-6 sm:h-6"/>תיק היתכנות אסטרטגי רשמי
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#001a33] tracking-tighter uppercase leading-none">{formData.fullName}</h2>
                    <p className="text-slate-400 font-bold text-xs sm:text-sm italic mt-1 tracking-wide sm:tracking-wider uppercase leading-none">PRIVATE ADVISORY REPORT | {TODAY_DATE}</p>
                  </div>
                <div className="bg-slate-50 px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl border-2 border-slate-100 text-left">
                  <p className="text-[8px] sm:text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Portfolio ID</p>
                  <p className="text-sm sm:text-lg font-black text-[#001a33] leading-none uppercase">MK-{Math.random().toString(36).substr(2, 5).toUpperCase()}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-10 text-right">
                <div className="p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] shadow-xl border-b-4 sm:border-b-8 bg-[#001a33] border-[#d4af37] text-white">
                  <span className="font-black text-[9px] sm:text-[11px] uppercase tracking-widest text-[#d4af37]">סכום משכנתא מבוקש / יחס מימון</span>
                  <div className="text-2xl sm:text-4xl md:text-5xl font-black mt-2 leading-none text-right">₪{formatCurrency(results.loanAmount)}</div>
                  <div className="mt-2 sm:mt-3 font-bold text-[10px] sm:text-xs text-slate-400">{results.ltv.toFixed(1)}% מימון מהנכס</div>
                </div>
                <div className="p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border-2 shadow-sm flex flex-col justify-between bg-[#FDF9F0] border-[#EAD9B5] text-right">
                  <div>
                    <span className="font-black text-[9px] sm:text-[11px] uppercase tracking-widest text-[#785C28]">ציון היתכנות לאישור סופי</span>
                    <div className="text-2xl sm:text-4xl md:text-5xl font-black mt-2 leading-none text-[#001a33]">{results.score}%</div>
                  </div>
                  <div className="mt-4 sm:mt-6 h-2 sm:h-2.5 bg-white rounded-full overflow-hidden border border-slate-200">
                    <div className="h-full bg-[#001a33] transition-all duration-2000" style={{width: `${results.score}%`}} />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-5 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] md:rounded-[3rem] border border-slate-200 relative overflow-hidden mb-8 sm:mb-12 shadow-inner text-right">
                <div className="absolute top-0 right-0 w-1.5 sm:w-2.5 h-full bg-[#001a33]" />
                <h3 className="text-lg sm:text-xl md:text-2xl font-black text-[#001a33] mb-4 sm:mb-6 md:mb-8 flex items-center gap-2 sm:gap-4">
                  <Sparkles size={20} className="sm:w-7 sm:h-7 text-[#d4af37]" /> ניתוח אסטרטגי מלא מיקוד משכנתאות
                </h3>
                <div className="text-slate-700 text-sm sm:text-base md:text-lg leading-relaxed sm:leading-loose font-bold text-justify whitespace-pre-line">
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

              <div className="text-center mb-6 sm:mb-8">
                <h4 className="text-base sm:text-xl md:text-2xl font-black text-[#001a33] italic px-2">לחצו כאן לקבלת חומרים ואסטרטגיות נוספות ממיקו ה-AI</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12 text-right">
                <button onClick={() => getAiInsight('roadmap')} className={`p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-[2rem] font-black flex flex-col sm:flex-row items-center justify-between shadow-2xl transition-all active:scale-95 group border-b-4 sm:border-b-8 ${isPurchased ? 'bg-[#001a33] text-white border-[#d4af37] cursor-pointer' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'}`} disabled={!isPurchased}>
                  <div className="flex items-center gap-2 sm:gap-4 text-sm sm:text-base"><Rocket size={20} className="sm:w-6 sm:h-6 text-[#d4af37]" /><span>✨ אסטרטגיה</span></div>
                  <ChevronLeft size={16} className="hidden sm:block sm:w-5 sm:h-5" />
                </button>
                <button onClick={() => getAiInsight('negotiation')} className={`p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-[2rem] font-black flex flex-col sm:flex-row items-center justify-between shadow-2xl transition-all active:scale-95 group border-b-4 sm:border-b-8 ${isPurchased ? 'bg-[#001a33] text-white border-[#d4af37] cursor-pointer' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'}`} disabled={!isPurchased}>
                  <div className="flex items-center gap-2 sm:gap-4 text-sm sm:text-base"><MessageSquareQuote size={20} className="sm:w-6 sm:h-6 text-[#d4af37]" /><span>✨ מו"מ</span></div>
                  <ChevronLeft size={16} className="hidden sm:block sm:w-5 sm:h-5" />
                </button>
                <button onClick={() => getAiInsight('documents')} className={`p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-[2rem] font-black flex flex-col sm:flex-row items-center justify-between shadow-2xl transition-all active:scale-95 group border-b-4 sm:border-b-8 ${isPurchased ? 'bg-[#001a33] text-white border-[#d4af37] cursor-pointer' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'}`} disabled={!isPurchased}>
                  <div className="flex items-center gap-2 sm:gap-4 text-sm sm:text-base"><ClipboardList size={20} className="sm:w-6 sm:h-6 text-[#d4af37]" /><span>✨ מסמכים</span></div>
                  <ChevronLeft size={16} className="hidden sm:block sm:w-5 sm:h-5" />
                </button>
              </div>

              {aiInsights && (
                <div className="bg-[#FDF9F0] p-5 sm:p-8 md:p-10 rounded-xl sm:rounded-[2rem] md:rounded-[3rem] border-2 border-[#EAD9B5] mb-8 sm:mb-12 animate-in slide-in-from-bottom-4 duration-500 text-right shadow-sm relative">
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-[#EAD9B5]/30">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-[#785C28]" />
                    <h4 className="text-base sm:text-lg md:text-xl font-black text-[#785C28] uppercase tracking-wide sm:tracking-widest italic">{aiInsights.type}</h4>
                  </div>
                  <div className="text-[#785C28] text-sm sm:text-base md:text-lg font-medium leading-relaxed whitespace-pre-wrap">
                    {insightLoading ? (
                      <div className="flex items-center gap-3">
                        <Loader2 size={14} className="sm:w-4 sm:h-4 animate-spin" />
                        <span>מייצר ניתוח...</span>
                      </div>
                    ) : String(aiInsights.content)}
                  </div>
                </div>
              )}

              <div className="relative min-h-[300px] mb-8 sm:mb-12">
                {!isPurchased && (
                  <div className="absolute inset-0 z-20 backdrop-blur-xl bg-white/40 rounded-[2rem] sm:rounded-[3rem] flex flex-col items-center justify-center border-2 sm:border-4 border-dashed border-[#d4af37]/40 p-6 sm:p-10 text-center shadow-2xl">
                    <Lock size={40} className="sm:w-16 sm:h-16 text-[#001a33] mb-4 sm:mb-6" />
                    <h4 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#001a33] mb-3 sm:mb-4 leading-tight px-4">דוח תמהילים אופטימלי נעול</h4>
                    <p className="text-slate-700 font-bold text-sm sm:text-base md:text-lg max-w-sm mb-6 sm:mb-10 leading-relaxed italic px-4">הפקת התמהילים המדויקים, פירוט הריביות והחזרים חודשיים מלאים דורשת פתיחת תיק בחברת מיקוד משכנתאות.</p>
                    <button onClick={handlePurchaseClick} className="bg-[#001a33] text-white px-6 sm:px-10 md:px-12 py-4 sm:py-5 rounded-xl sm:rounded-[2.5rem] font-black text-lg sm:text-2xl md:text-3xl shadow-3xl hover:bg-[#d4af37] hover:text-[#001a33] transition-all transform hover:scale-105 active:scale-95 flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
                      <span className="text-center">רכוש דוח מלא<br className="sm:hidden"/> ב-₪499 + מע"מ</span>
                      <ChevronLeft size={24} className="sm:w-7 sm:h-7"/>
                    </button>
                  </div>
                )}
                <div className={`space-y-6 sm:space-y-12 transition-all duration-1000 ${!isPurchased ? 'blur-3xl opacity-20 pointer-events-none' : ''}`}>
                  <MixTable title='תמהיל אסטרטגי משולב (מומלץ)' tracks={results.mixB.tracks} totalPmt={results.mixB.total} isRecommended={true} />
                  <MixTable title='תמהיל שמרני (100% קבועה)' tracks={results.mixA.tracks} totalPmt={results.mixA.total} />
                  <MixTable title='תמהיל פריים weighted' tracks={results.mixC.tracks} totalPmt={results.mixC.total} />
                </div>
              </div>

              <div className={`p-5 sm:p-8 md:p-10 bg-[#001a33] rounded-xl sm:rounded-[2rem] md:rounded-[3rem] mb-8 sm:mb-12 text-white shadow-2xl transition-all duration-1000 ${!isPurchased ? 'opacity-30 blur-md pointer-events-none' : ''}`}>
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4 sm:gap-6 text-center sm:text-right">
                  <div className="text-center sm:text-right">
                    <h4 className="text-xl sm:text-2xl md:text-3xl font-black flex items-center gap-3 sm:gap-4 justify-center sm:justify-start leading-none mb-2">
                      <Mail size={24} className="sm:w-8 sm:h-8 text-[#d4af37]" /> ✨ טיוטת פנייה לבנק
                    </h4>
                    <p className="text-slate-400 text-xs sm:text-sm font-bold italic">מיקו יצר עבורכם את המייל המקצועי ביותר להגשה לבנקאי.</p>
                  </div>
                </div>
                <div className="bg-white/5 p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-[2rem] border border-white/10 shadow-inner font-bold text-sm sm:text-base md:text-lg text-slate-100 leading-relaxed sm:leading-loose text-right whitespace-pre-wrap">
                  {bankerEmail || "הטיוטה תופיע כאן לאחר רכישת הדוח..."}
                </div>
              </div>

              <div className="mt-8 sm:mt-12 bg-[#001a33] rounded-[2rem] sm:rounded-[3rem] md:rounded-[4rem] p-6 sm:p-10 md:p-16 text-white flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8 md:gap-12 border-b-[6px] sm:border-b-[10px] border-[#d4af37] shadow-3xl text-right">
                <div className="text-right max-w-xl">
                  <h4 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-4 sm:mb-6 md:mb-8 leading-tight tracking-tighter italic uppercase">המטרה שלנו היא<br/>החיסכון הגדול שלכם.</h4>
                  <p className="text-slate-400 text-sm sm:text-base md:text-lg lg:text-xl font-bold leading-relaxed italic">הניתוח הוא רק ההתחלה. מומחי מיקוד משכנתאות ישיגו לכם את התנאים המנצחים במערכת הבנקאית.</p>
                </div>
                <div className="flex flex-col items-center gap-4 sm:gap-6 md:gap-8 text-center">
                  <a href="tel:2324" className="bg-[#d4af37] text-[#001a33] px-10 sm:px-12 md:px-16 py-5 sm:py-6 md:py-8 rounded-[1.5rem] sm:rounded-[2rem] font-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl shadow-2xl hover:bg-white transition-all transform hover:scale-105 active:scale-95 leading-none">2324*</a>
                  <p className="text-[#d4af37] font-black tracking-widest uppercase text-[10px] sm:text-xs">פגישת ייעוץ אישית ללא התחייבות</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <MikoChat formData={formData} results={results} isPurchased={isPurchased} isOpen={isChatOpen} setIsOpen={setIsChatOpen} />
      
      {showPayment && clientSecret && (
        <div className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowPayment(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative" onClick={(e) => e.stopPropagation()} dir="rtl">
            <button onClick={() => setShowPayment(false)} className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 transition-colors">
              <X size={24} />
            </button>
            
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-[#d4af37] to-[#f4d03f] rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock size={32} className="text-[#001a33]" />
              </div>
              <h3 className="text-2xl font-black text-[#001a33] mb-2">רכישת דוח מלא</h3>
              <p className="text-slate-600 font-bold">תשלום מאובטח ב-₪499 + מע"מ</p>
            </div>
            
            <Elements stripe={stripePromise} options={{ clientSecret, locale: 'he' }}>
              <PaymentForm onSuccess={handlePaymentSuccess} />
            </Elements>
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentForm({ onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: 'if_required'
    });

    if (submitError) {
      setError(submitError.message);
      setLoading(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {error && (
        <div className="bg-red-50 border-2 border-red-500 rounded-xl p-4 text-right">
          <p className="text-red-700 font-bold text-sm">{error}</p>
        </div>
      )}
      
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-gradient-to-r from-[#001a33] to-[#003d66] text-white py-4 rounded-2xl font-black text-xl hover:from-[#d4af37] hover:to-[#f4d03f] hover:text-[#001a33] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            מעבד תשלום...
          </>
        ) : (
          <>
            <Lock size={20} />
            שלם ופתח דוח מלא
          </>
        )}
      </button>
      
      <p className="text-center text-xs text-slate-400 font-bold">תשלום מאובטח עם הצפנה מלאה</p>
    </form>
  );
}