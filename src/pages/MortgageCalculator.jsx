import React, { useState, useMemo, useEffect } from 'react';
import { 
  User, Home, Briefcase, AlertCircle, ChevronLeft, Loader2, Phone, 
  Wallet, Building2, ShieldCheck, Sparkles, Mail, BadgeCheck, 
  Calendar, Coins, TrendingDown, Rocket, MessageSquareQuote, 
  ClipboardList, Lock, HelpCircle, Smartphone, Key, Target, HeartHandshake, ShieldAlert, X, UserPlus, Trash2
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import {
  DEFAULT_RATES, formatCurrency, calculatePayment, cleanAiText,
  getReverseMortgageMaxLTV, calcTotalIncome, calculateResults,
  SENIOR_BANK_MAX_LTV, SENIOR_BANK_MAX_TERM, BALLOON_MAX_TERM,
} from '@/components/mortgage/mortgageUtils';
import PremiumInput from '@/components/mikud/PremiumInput';
import MixTable from '@/components/mikud/MixTable';
import MikoChat from '@/components/mikud/MikoChat';
import BankLogosCarousel from '@/components/mikud/BankLogosCarousel';
import NegotiationPack from '@/components/mikud/NegotiationPack.jsx';
import BorrowerForm from '@/components/mikud/BorrowerForm';


// v2.2
const TODAY_DATE = new Date().toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });

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
  const [currentLeadId, setCurrentLeadId] = useState(null);
  const [caseId] = useState(() => 'MK-' + Math.random().toString(36).substr(2, 5).toUpperCase());
  const [rates, setRates] = useState(DEFAULT_RATES);
  const [ratesLastUpdated, setRatesLastUpdated] = useState(null);

  const [showCreditModal, setShowCreditModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', phone: '', email: '', idNumber: '', birthDate: '', consent: false, creditConsent: false,
    mortgageType: 'purchase_first', loanDuration: '25', seniorBalloon: false, balloonExitStrategy: '',
    propertyPrice: '', loanAmount: '',
    monthlyDebts: '0', monthlyOverdraft: '0', equity: '',
    youngestBorrowerAge: '',
  });

  const defaultBorrower = () => ({
    maritalStatus: 'single',
    childrenUnder18: '0',
    creditHistory: 'clean',
    employmentTypes: ['employee'],
    incomeSources: {},
    youngestBorrowerAge: '',
    borrowerType: 'primary', // primary | additional
  });

  const [borrowers, setBorrowers] = useState([defaultBorrower()]);
  const [activeBorrowerTab, setActiveBorrowerTab] = useState(0);

  const updateBorrower = (index, data) => {
    setBorrowers(prev => prev.map((b, i) => i === index ? data : b));
  };

  const addBorrower = () => {
    setBorrowers(prev => [...prev, { ...defaultBorrower(), borrowerType: 'primary' }]);
    setActiveBorrowerTab(borrowers.length);
  };

  const removeBorrower = (index) => {
    if (borrowers.length <= 1) return;
    setBorrowers(prev => prev.filter((_, i) => i !== index));
    setActiveBorrowerTab(Math.max(0, activeBorrowerTab - 1));
  };

  // fullName computed for display/save
  const fullName = `${formData.firstName || ''} ${formData.lastName || ''}`.trim();

  // wrapper נוח לשימוש ב-component בלי להעביר borrowers בכל פעם
  const getTotalIncome = () => calcTotalIncome(borrowers);

  useEffect(() => {
    const loadRates = async () => {
      try {
        const response = await base44.functions.invoke('getBankOfIsraelRates');
        if (response.data?.success && response.data?.rates) {
          setRates(response.data.rates);
          setRatesLastUpdated(response.data.last_updated);
        }
      } catch (error) {
        console.error('Failed to load rates:', error);
      }
    };
    loadRates();

  }, []);

  const isReverseMortgage = formData.mortgageType === 'reverse_mortgage';
  const isSeniorBankMortgage = formData.mortgageType === 'senior_bank';

  const ALL_PURPOSE_RATES = useMemo(() => ({
    FIXED_UNLINKED: (rates.FIXED_UNLINKED || 0.0505) + 0.004,
    VAR_LINKED: (rates.VAR_LINKED || 0.0361) + 0.003,
    PRIME_CALC: rates.PRIME_CALC || 0.0500,
  }), [rates]);

  const maxTerm = useMemo(() => {
    if (isSeniorBankMortgage && formData.seniorBalloon) return BALLOON_MAX_TERM;
    if (isSeniorBankMortgage) return SENIOR_BANK_MAX_TERM;
    const ageNum = Number(formData.age) || 35;
    return Math.min(30, Math.max(1, 80 - ageNum));
  }, [formData.age, isSeniorBankMortgage, formData.seniorBalloon]);

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: null }));
  };

  const startVerification = () => {
    const errors = {};
    if (!formData.firstName || formData.firstName.trim().length < 2) errors.firstName = "אנא הזן שם פרטי תקין";
    if (!formData.lastName || formData.lastName.trim().length < 2) errors.lastName = "אנא הזן שם משפחה תקין";
    if (!/^05\d{8}$/.test(formData.phone)) errors.phone = "טלפון נייד לא תקין (10 ספרות)";
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email)) errors.email = "נא להזין כתובת אימייל אמיתית ותקינה";
    
    if (!/^\d{9}$/.test(formData.idNumber)) errors.idNumber = "ת.ז לא תקינה (9 ספרות)";
    
    // חישוב גיל מ-input type=date
    if (!formData.birthDate) {
      errors.birthDate = "נא להזין תאריך לידה";
    } else {
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
      if (age < 18 || age > 100) {
        errors.birthDate = "גיל לא תקין (18–100)";
      } else {
        setFormData(prev => ({ ...prev, age: age.toString() }));
      }
    }
    
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
    if (currentStep === 2 && isReverseMortgage && !formData.youngestBorrowerAge) errors.youngestBorrowerAge = "חובה להזין גיל הלווה הצעיר ביותר";
    if (currentStep === 2 && isReverseMortgage && Number(formData.youngestBorrowerAge) < 60) errors.youngestBorrowerAge = "מינימום גיל 60 למשכנתא לגיל הזהב";
    if (currentStep === 3 && !formData.propertyPrice) errors.propertyPrice = "חובה להזין שווי נכס";
    if (currentStep === 3 && !formData.loanAmount) errors.loanAmount = "חובה להזין סכום מבוקש";
    if (currentStep === 4 && !isReverseMortgage && getTotalIncome() <= 0) errors.netIncome = "חובה להזין הכנסה לפחות ללווה אחד";
    if (currentStep === 5 && !isReverseMortgage && !formData.equity) errors.equity = "חובה להזין הון עצמי";
    setFieldErrors(errors);
    return Object.keys(errors).filter(k => errors[k]).length === 0;
  };

  const results = useMemo(() =>
    calculateResults({ formData, borrowers, maxTerm, rates, ALL_PURPOSE_RATES }),
  [formData, borrowers, maxTerm, rates, ALL_PURPOSE_RATES]);

  const generateFullAnalysis = async () => {
    if (!validateStep(6)) return;
    setLoading(true);
    setStep(7);
    
    const borrowersSummary = borrowers.map((b, i) => {
      const types = (b.employmentTypes || []).join(', ');
      const sources = b.incomeSources || {};
      const factor = i > 0 && b.borrowerType === 'additional' ? 0.5 : 1;
      // Breakdown per income type
      const breakdown = Object.entries(sources)
        .filter(([, src]) => src && (src.amount || src.enabled))
        .map(([type, src]) => {
          const amt = Number(String(src.amount || '0').replace(/,/g, ''));
          const sen = src.seniority ? `, ותק: ${src.seniority} שנים` : '';
          const typeLabel = { employee: 'שכיר', self_employed: 'עצמאי', pensioner: 'פנסיה', controlling_shareholder: 'בעל שליטה', foreign_income: 'הכנסה מחו"ל' }[type] || type;
          return `  - ${typeLabel}: ₪${Math.floor(amt)}${sen}`;
        }).join('\n');
      const totalB = Object.values(sources).reduce((acc, src) => acc + Number(String(src?.amount || '0').replace(/,/g, '')), 0);
      return `לווה ${i+1}: ${b.borrowerType === 'additional' ? 'נוסף (50%)' : 'עיקרי'}, סוגי הכנסה: ${types}\n${breakdown}\n  סה"כ מוכר לבנק: ₪${Math.floor(totalB * factor)}`;
    }).join('\n');
    const prompt = `אתה יועץ משכנתאות בכיר בישראל. נתח את תיק המשכנתא הבא באופן מקצועי ומלא:

לקוח: ${fullName}, גיל ${formData.age}
${borrowersSummary}
הכנסה כוללת מוכרת: ₪${Math.floor(getTotalIncome())}
מצב משפחתי: ${formData.maritalStatus}, ילדים מתחת ל-18: ${formData.childrenUnder18}
חובות חודשיים קיימים: ₪${formData.monthlyDebts || 0}
שווי נכס: ₪${formData.propertyPrice}
סכום משכנתא מבוקש: ₪${results.loanAmount}
אחוז מימון (LTV): ${results.ltv.toFixed(1)}%
${results.isReverse ? '' : `יחס החזר (DTI): ${results.dti.toFixed(1)}%`}
תקופת הלוואה: ${formData.loanDuration} שנים
סוג משכנתא: ${formData.mortgageType}
ותק בעבודה: ${formData.employmentSeniority || 'לא צוין'} שנים
היסטוריית אשראי: ${formData.creditHistory === 'clean' ? 'תקינה' : 'עם הערות'}

כתוב ניתוח מקצועי ומפורט הכולל:
1. סיכום כשירות התיק ורמת הסיכון (פרט מדוע)
2. ניתוח יחס ההחזר והמשמעות המעשית עבור הלקוח
3. המלצות אסטרטגיות ספציפיות לשיפור התיק
4. נקודות חוזק של התיק שיש להדגיש מול הבנק
5. אזהרות וסיכונים שהלקוח צריך לדעת

ענה בעברית בלבד, ברורה ומקצועית, ללא Markdown. כל סעיף בשורה נפרדת.`;
    
    const emailPrompt = `צור טיוטת אימייל קצרה ומקצועית לבנקאי עבור לקוח בשם ${fullName} המבקש משכנתא של ₪${formatCurrency(results.loanAmount)} עם LTV ${results.ltv.toFixed(1)}%. ענה בעברית בלבד.`;

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
        fullName,
        loanAmount: results.loanAmount,
        ltv: results.ltv,
        score: results.score,
        aiAnalysis: analysis,
        netIncome: getTotalIncome(),
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
    
    const isPensioner = borrowers.some(b => (b.employmentTypes || []).includes('pensioner'));
    const isSelfEmployed = borrowers.some(b => (b.employmentTypes || []).includes('self_employed'));
    const isEmployee = borrowers.some(b => (b.employmentTypes || []).includes('employee'));
    
    const isSeniorBank = formData.mortgageType === 'senior_bank';

    // Build combined docs list based on ALL income types present
    const buildDocsList = () => {
      if (isSeniorBank) {
        return `רשימת מסמכים נדרשים – משכנתא בנקאית לגיל הזהב (כל מטרה):\n1. תעודת זהות + ספח מעודכן (לכל לווה)\n2. טופס חתימת ילדים/יורשים על מודעות למשכנתא (חובה!)\n3. אישור קצבה/פנסיה חודשית (3 חודשים אחרונים)\n4. דפי בנק 3 חודשים אחרונים\n5. נסח טאבו מעודכן\n6. שמאות נכס (תואם מוסד פיננסי)\n7. אישור BDI / דוח נתוני אשראי${formData.seniorBalloon ? '\n8. הצהרת אסטרטגיית יציאה (בלון) – חתומה' : ''}`;
      }
      if (isReverseMortgage) {
        return `רשימת מסמכים נדרשים למשכנתא הפוכה:\n1. תעודת זהות + ספח מעודכן\n2. נסח טאבו מעודכן\n3. דפי בנק 3 חודשים אחרונים\n4. אישור הסכמת יורשים חתום\n5. אישור קצבה/פנסיה חודשית\n6. שמאות נכס (תואם מוסד פיננסי)`;
      }

      let docNum = 1;
      let docs = `רשימת מסמכים נדרשים – בהתאם לסוגי ההכנסה בתיק:\n`;
      docs += `\n📋 מסמכים בסיסיים (חובה לכולם):\n${docNum++}. תעודת זהות + ספח מעודכן (לכל לווה)\n${docNum++}. דפי בנק 3 חודשים אחרונים\n${docNum++}. נסח טאבו מעודכן\n${docNum++}. חוזה רכישה / הסכם\n${docNum++}. שמאות נכס (תואם מוסד פיננסי)\n${docNum++}. אישור BDI / דוח נתוני אשראי`;

      if (isEmployee) {
        docs += `\n\n👔 כשכיר/ה:\n${docNum++}. 3 תלושי שכר אחרונים\n${docNum++}. אישור מעסיק על המשכת העסקה (ניסיון מעל שנה – יתרון)`;
      }
      if (isSelfEmployed) {
        docs += `\n\n💼 כעצמאי/ת:\n${docNum++}. 2 שנות דוחות מס הכנסה אחרונים (עם אישור רו"ח)\n${docNum++}. דפי בנק 3 חודשים – חשבון עסקי + פרטי\n${docNum++}. אישור ניהול ספרים מרשות המסים\n${docNum++}. אישור תשלום מקדמות מס הכנסה שוטף`;
      }
      if (isPensioner) {
        docs += `\n\n🏦 כפנסיונר/ית:\n${docNum++}. אישור גמלה/פנסיה חודשית (מקרן הפנסיה / ביטוח לאומי)\n${docNum++}. אישור יתרת זכויות קרן הפנסיה`;
      }

      return docs;
    };

    const docsList = buildDocsList();

    const types = {
      roadmap: { label: "אסטרטגיית חיסכון", prompt: `צור 3 טיפים אסטרטגיים מדויקים לחיסכון בריבית ו/או קיצור תקופת משכנתא של ₪${formatCurrency(results.loanAmount)} ל-${formData.loanDuration} שנים. ענה כרשימה ממוספרת נקייה בעברית.` },
      negotiation: { label: "הכנה למשא ומתן", prompt: `צור 3 שאלות חדות ומקצועיות לבנקאי לשיפור תנאי משכנתא של ₪${formatCurrency(results.loanAmount)}, LTV ${results.ltv.toFixed(1)}%. ענה כרשימה ממוספרת בעברית.` },
      documents: { label: "רשימת מסמכים להגשה", prompt: docsList }
    };
    
    try {
      if (type === 'documents') {
        // רשימת מסמכים - קבועה ומדויקת, לא LLM
        setAiInsights({ type: types[type].label, content: types[type].prompt });
        setInsightLoading(false);
        return;
      }
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
    setIsPurchased(true);
    if (currentLeadId) {
      await base44.entities.Lead.update(currentLeadId, { isPurchased: true });
    }
  };

  return (
    <div className="min-h-screen font-sans text-right bg-white overflow-x-hidden" dir="rtl">

      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm backdrop-blur-xl h-28 sm:h-32 px-6 sm:px-10 flex items-center justify-between">
        <div className="flex items-center cursor-pointer group" onClick={() => window.location.reload()}>
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696ca6d05493d178c33e26fd/0c936db5c_Gemini_Generated_Image_ae1zscae1zscae1z.jpg" 
            alt="מיקוד משכנתאות - המטרה שלנו, החיסכון שלכם" 
            className="h-24 sm:h-28 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 flex-col items-center justify-center">
          <div className="flex items-center gap-2">
            <span className="text-[#c9a961] text-lg">✦</span>
            <span className="text-sm font-bold tracking-[0.25em] text-[#c9a961] uppercase">מיקוד משכנתאות</span>
            <span className="text-[#c9a961] text-lg">✦</span>
          </div>
          <div className="flex items-baseline gap-3 mt-0.5">
            <span className="text-2xl font-black text-[#1e3a5f]" style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}>המטרה שלנו</span>
            <span className="w-8 h-px bg-gradient-to-r from-[#1e3a5f] to-[#c9a961] self-center"></span>
            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#c9a961] to-[#d4b975]" style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}>החיסכון שלכם</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-[#1e3a5f] text-[#1e3a5f] font-bold hover:bg-[#1e3a5f] hover:text-white transition-all group"
          >
            <HelpCircle size={18} className="group-hover:rotate-12 transition-transform" />
            <span>שאלות?</span>
          </button>
          <a href="tel:2324" className="bg-[#1e3a5f] text-white px-8 py-3 rounded-full font-bold text-base hover:bg-[#152d47] transition-all shadow-md hover:shadow-lg text-center">
            2324*
          </a>
        </div>
      </nav>

      <BankLogosCarousel />

      <main className="max-w-6xl mx-auto px-4 py-16 flex flex-col items-center">
        {step <= 6 ? (
          <div className="w-full max-w-4xl">
            {/* Hero Section Above Form */}
            {step === 1 && !otpSent && (
              <div className="text-center mb-16 animate-in fade-in slide-in-from-top-8 duration-1000">
                <div className="inline-block mb-4">
                  <div className="bg-gradient-to-r from-[#c9a961] to-[#d4b975] text-white px-6 py-2 rounded-full font-semibold text-xs tracking-wide shadow-sm">
                    מערכת AI לבניית תמהילי משכנתא
                  </div>
                </div>
                <h1 className="text-5xl sm:text-7xl font-bold text-[#1e3a5f] mb-6 leading-tight">
                  המשכנתא הנכונה<br/>
                  <span className="text-[#c9a961]">
                    מתחילה כאן
                  </span>
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-light">
                  קבלו 3 תמהילים אופטימליים תוך 3 דקות, בחינם ובלי התחייבות
                </p>
                <div className="flex justify-center gap-12 mt-10 text-sm">
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-3xl font-bold text-[#1e3a5f]">₪150K</div>
                    <span className="text-gray-500">חיסכון ממוצע</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-3xl font-bold text-[#1e3a5f]">3 דק׳</div>
                    <span className="text-gray-500">זמן תגובה</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-3xl font-bold text-[#1e3a5f]">0₪</div>
                    <span className="text-gray-500">עלות</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12 md:p-16 border-4 border-[#1e3a5f] transition-all duration-700 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#1e3a5f] via-[#c9a961] to-[#1e3a5f]" />
              <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-[#1e3a5f] via-[#c9a961] to-[#1e3a5f]" />
              <div className="flex items-center justify-between mb-12">
              <div className="text-right flex-1">
                <div className="inline-flex items-center gap-3 bg-[#1e3a5f] px-5 py-2.5 rounded-full shadow-sm mb-3">
                  <div className="w-9 h-9 rounded-full bg-[#c9a961] flex items-center justify-center">
                    {step === 1 && <User size={18} className="text-white" />}
                    {step === 2 && <Calendar size={18} className="text-white" />}
                    {step === 3 && <Home size={18} className="text-white" />}
                    {step === 4 && <Coins size={18} className="text-white" />}
                    {step === 5 && <Wallet size={18} className="text-white" />}
                    {step === 6 && <Building2 size={18} className="text-white" />}
                  </div>
                  <div>
                    <h2 className="text-base sm:text-xl font-bold text-white leading-none">
                      {step === 1 && !otpSent && "בואו נכיר"}
                      {step === 1 && otpSent && "אימות זהות"}
                      {step === 2 && "פרופיל אישי"}
                      {step === 3 && "הנכס שלכם"}
                      {step === 4 && "מצב כלכלי"}
                      {step === 5 && "מקורות מימון"}
                      {step === 6 && "העדפות"}
                    </h2>
                    <p className="text-[#c9a961] font-medium text-xs mt-1">שלב {step} מתוך 6</p>
                  </div>
                </div>
              </div>
              
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-gray-200" />
                  <circle cx="40" cy="40" r="36" stroke="#c9a961" strokeWidth="3" fill="transparent" className="transition-all duration-1000" strokeDasharray={226} strokeDashoffset={226 - (226 * step) / 6} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-[#1e3a5f]">{step}</span>
                  <span className="text-xs font-medium text-gray-400">מתוך 6</span>
                </div>
              </div>
              </div>

              <div className="min-h-[300px] relative z-10">
              {step === 1 && !otpSent && (
                <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                  {/* שם פרטי + שם משפחה */}
                  <div className="grid grid-cols-2 gap-3 mb-1">
                    <PremiumInput label="שם פרטי" name="firstName" value={formData.firstName} placeholder="ישראל" icon={User} onChange={handleInputChange} error={fieldErrors.firstName} tooltip="שם פרטי כפי שמופיע בתעודת זהות" />
                    <PremiumInput label="שם משפחה" name="lastName" value={formData.lastName} placeholder="ישראלי" icon={User} onChange={handleInputChange} error={fieldErrors.lastName} tooltip="שם משפחה כפי שמופיע בתעודת זהות" />
                  </div>
                  <PremiumInput label="מספר תעודת זהות" name="idNumber" value={formData.idNumber} placeholder="123456789" icon={BadgeCheck} onChange={handleInputChange} error={fieldErrors.idNumber} tooltip="9 ספרות של תעודת הזהות שלך לאימות זהות" />
                  
                  {/* תאריך לידה - שדה אחד */}
                  <div className="mb-5 text-right w-full">
                    <label className="flex items-center text-[#1e3a5f] font-semibold text-sm mb-2">
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center ml-2">
                        <Calendar size={16} className="text-gray-500" />
                      </div>
                      <span>תאריך לידה</span>
                    </label>
                    <input
                      type="date"
                      min="1924-01-01"
                      max="2007-12-31"
                      className="w-full bg-gradient-to-br from-white to-gray-50 h-14 px-5 border-3 border-[#1e3a5f] rounded-2xl outline-none focus:border-[#c9a961] focus:ring-4 focus:ring-[#c9a961]/20 focus:shadow-xl transition-all text-gray-900 font-semibold text-base text-right shadow-lg"
                      value={formData.birthDate || ''}
                      onChange={(e) => handleInputChange('birthDate', e.target.value)}
                    />
                    {fieldErrors.birthDate && (
                      <div className="mt-3 flex items-center gap-3 bg-red-50 border-3 border-red-500 px-5 py-3 rounded-2xl">
                        <AlertCircle size={20} className="text-red-600" />
                        <p className="text-red-700 text-sm font-bold">{fieldErrors.birthDate}</p>
                      </div>
                    )}
                  </div>

                  <PremiumInput label="טלפון נייד" name="phone" value={formData.phone} placeholder="05XXXXXXXX" icon={Phone} onChange={handleInputChange} error={fieldErrors.phone} tooltip="מספר נייד לקבלת קוד אימות ויצירת קשר מהיועץ" />
                  <PremiumInput label="כתובת דוא״ל" name="email" value={formData.email} placeholder="Office@mikud4me.co.il" icon={Mail} onChange={handleInputChange} type="email" error={fieldErrors.email} tooltip="דוא״ל לקבלת הדוח המפורט והתכתבות עם היועץ" />
                  
                  {/* אישור יצירת קשר */}
                  <div className="mt-4 flex items-start gap-3 p-4 rounded-xl border-2 bg-slate-50 shadow-inner">
                    <input type="checkbox" className="w-5 h-5 mt-0.5 rounded border-slate-300 text-[#001a33] focus:ring-[#001a33] flex-shrink-0" checked={formData.consent} onChange={(e) => handleInputChange('consent', e.target.checked)} />
                    <p className="text-[11px] text-slate-500 font-bold leading-relaxed text-right">אני מאשר ליועץ ממיקוד משכנתאות ליצור איתי קשר לצורך קידום התיק.</p>
                  </div>
                  {fieldErrors.consent && <p className="text-red-600 text-xs font-bold mt-1 text-right">{fieldErrors.consent}</p>}

                  {/* אישור בדיקת חווי אשראי */}
                  <div className="mt-3 flex items-start gap-3 p-4 rounded-xl border-2 bg-amber-50 border-amber-200">
                    <input
                      type="checkbox"
                      className="w-5 h-5 mt-0.5 rounded border-amber-300 text-[#001a33] focus:ring-[#001a33] flex-shrink-0"
                      checked={formData.creditConsent}
                      onChange={(e) => {
                        handleInputChange('creditConsent', e.target.checked);
                        if (e.target.checked) setShowCreditModal(true);
                      }}
                    />
                    <p className="text-[11px] text-amber-800 font-bold leading-relaxed text-right">
                      אני מאשר לבנק לבצע בדיקת חווי אשראי (BDI) במסגרת בחינת הבקשה.{' '}
                      <button type="button" onClick={() => setShowCreditModal(true)} className="underline text-[#1e3a5f] hover:text-[#c9a961]">מה זה אומר?</button>
                    </p>
                  </div>
                </div>
              )}

              {/* מודל הסבר חווי אשראי */}
              {showCreditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowCreditModal(false)}>
                  <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border-4 border-[#1e3a5f] text-right animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-5">
                      <button onClick={() => setShowCreditModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                      <h3 className="text-xl font-black text-[#1e3a5f]">מהי בדיקת חווי אשראי?</h3>
                    </div>
                    <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
                      <p className="font-bold text-[#1e3a5f] text-base">בדיקת BDI (Credit Check) היא בדיקה שגרתית שהבנק מבצע לפני אישור משכנתא.</p>
                      <div className="bg-blue-50 border-r-4 border-blue-500 p-4 rounded-xl">
                        <p className="font-bold text-blue-800 mb-2">מה הבנק בודק?</p>
                        <ul className="space-y-1 text-blue-700 text-xs">
                          <li>• היסטוריית תשלומים (הלוואות, כרטיסי אשראי)</li>
                          <li>• חובות ועיקולים קיימים אם יש</li>
                          <li>• תיקים בהוצאה לפועל אם יש</li>
                          <li>• דירוג האשראי הכללי שלך</li>
                        </ul>
                      </div>
                      <div className="bg-green-50 border-r-4 border-green-500 p-4 rounded-xl">
                        <p className="font-bold text-green-800 mb-1">מה אתה מאשר?</p>
                        <p className="text-green-700 text-xs">אתה מאשר לבנק לפנות לחברת BDI ולקבל דוח אשראי עליך לצורך בחינת הבקשה למשכנתא בלבד. המידע משמש לצורך הערכת כשירות ההלוואה ואינו מועבר לגורם שלישי.</p>
                      </div>
                      <p className="text-xs text-gray-500 font-medium">הבדיקה אינה פוגעת בדירוג האשראי שלך.</p>
                    </div>
                    <button
                      onClick={() => { setShowCreditModal(false); handleInputChange('creditConsent', true); }}
                      className="mt-6 w-full bg-[#1e3a5f] text-white py-3 rounded-2xl font-black text-base hover:bg-[#152d47] transition-all"
                    >
                      הבנתי ומאשר ✓
                    </button>
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
                  {/* טאבים לווים */}
                  <div className="flex gap-2 mb-5 flex-wrap">
                    {borrowers.map((b, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveBorrowerTab(idx)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-sm transition-all border-2 ${activeBorrowerTab === idx ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-[#1e3a5f] border-[#1e3a5f]/30 hover:border-[#1e3a5f]'}`}
                      >
                        <User size={14} />
                        לווה {['א', 'ב', 'ג', 'ד', 'ה'][idx] || (idx + 1)}
                        {idx > 0 && (
                          <span
                            onClick={e => { e.stopPropagation(); removeBorrower(idx); }}
                            className="mr-1 text-red-400 hover:text-red-600 font-black cursor-pointer"
                          >×</span>
                        )}
                      </button>
                    ))}
                    {borrowers.length < 5 && (
                      <button
                        onClick={addBorrower}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-sm border-2 border-dashed border-[#c9a961] text-[#c9a961] hover:bg-[#c9a961]/10 transition-all"
                      >
                        <UserPlus size={14} /> הוסף לווה
                      </button>
                    )}
                  </div>

                  {/* תווית גיל */}
                  <div className="mb-4 p-3 bg-[#1e3a5f]/5 rounded-xl border border-[#1e3a5f]/15 flex items-center gap-2">
                    <User size={16} className="text-[#c9a961]" />
                    <p className="text-sm font-bold text-[#1e3a5f]">
                      לווה {['א', 'ב', 'ג', 'ד', 'ה'][activeBorrowerTab] || (activeBorrowerTab + 1)} – גיל מחושב: <span className="text-[#c9a961]">{formData.age || 'ממלא בשלב 1'}</span>
                    </p>
                  </div>

                  <BorrowerForm
                    key={activeBorrowerTab}
                    borrower={borrowers[activeBorrowerTab]}
                    index={activeBorrowerTab}
                    onChange={(data) => updateBorrower(activeBorrowerTab, data)}
                    isReverseMortgage={isReverseMortgage}
                    errors={fieldErrors}
                    borrowerAge={formData.age}
                  />
                </div>
              )}

              {step === 3 && (
                <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                  <PremiumInput label="סוג ומטרת המשכנתא" name="mortgageType" value={formData.mortgageType} icon={Target} onChange={handleInputChange} 
                    options={[
                      {val:'purchase_first', label:'רכישה - דירה ראשונה (עד 75%)'},
                      {val:'purchase_improve', label:'רכישה - משפרי דיור / חליפית (עד 70%)'},
                      {val:'refinance', label:'מחזור (שיפור תנאים)'},
                      {val:'any_purpose', label:'כל מטרה - סגירת חובות/שיפוץ (עד 50%)'},
                      {val:'reverse_mortgage', label:'משכנתא הפוכה (Reverse Mortgage)'},
                      {val:'senior_bank', label:'משכנתא בנקאית לגיל הזהב – כל מטרה (45% LTV | עד 30 שנה)'}
                    ]} 
                    tooltip="מטרת המשכנתא קובעת את אחוז המימון המקסימלי ותנאי ההלוואה" />
                  
                  {isReverseMortgage && (
                    <div className="mb-5 p-4 bg-amber-50 border-2 border-amber-400 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                      <p className="text-amber-800 font-bold text-sm">משכנתא הפוכה</p>
                      <p className="text-amber-700 text-xs mt-1 leading-relaxed">ללא החזר חודשי חובה. הסכום נפרע מהנכס בסיום. אחוז המימון נקבע לפי גיל הלווה הצעיר ביותר.</p>
                    </div>
                  )}

                  {isSeniorBankMortgage && (
                    <div className="mb-5 p-4 bg-blue-50 border-2 border-blue-500 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                      <p className="text-blue-900 font-black text-sm mb-2">משכנתא בנקאית לגיל הזהב – כל מטרה</p>
                      <ul className="text-blue-800 text-xs space-y-1 list-none">
                        <li>פריסה עד 30 שנה ללא הגבלת גיל עליונה</li>
                        <li>LTV מקסימלי: 45% (עד 50% בבנקים ספציפיים)</li>
                        <li>ללא חובת ביטוח חיים</li>
                        <li>ריביות מחירון "כל מטרה" (All-Purpose)</li>
                        <li className="font-bold">חובת יידוע יורשים וחתימתם</li>
                      </ul>
                    </div>
                  )}

                  <PremiumInput label="שווי הנכס המשוער" name="propertyPrice" value={formData.propertyPrice} placeholder="שווי שוק מוערך" icon={Home} onChange={handleInputChange} error={fieldErrors.propertyPrice} tooltip="שווי הנכס על פי הערכה או חוזה רכישה" />
                  <PremiumInput label="סכום מבוקש" name="loanAmount" value={formData.loanAmount} placeholder="כמה כסף אתם צריכים?" icon={Coins} onChange={handleInputChange} error={fieldErrors.loanAmount} tooltip="הסכום שברצונכם לקבל כמשכנתא" />
                </div>
              )}

              {step === 4 && (
                <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                  {isReverseMortgage && (
                    <div className="mb-5 p-4 bg-blue-50 border-2 border-blue-300 rounded-2xl">
                      <p className="text-blue-800 font-bold text-sm">משכנתא לגיל הזהב — מסלול ייעודי</p>
                      <p className="text-blue-700 text-xs mt-1">אין חובת הוכחת יחס החזר (DTI). הכנסות משמשות לחיזוק התיק בלבד.</p>
                    </div>
                  )}

                  {/* סיכום הכנסות לפי לווה */}
                  <div className="mb-5 p-4 bg-[#1e3a5f]/5 rounded-xl border border-[#1e3a5f]/15">
                    <p className="text-sm font-bold text-[#1e3a5f] mb-3 flex items-center gap-2"><Coins size={16} className="text-[#c9a961]" /> סיכום הכנסות לווים</p>
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
                      <span className="text-[#c9a961]">₪{new Intl.NumberFormat('he-IL').format(Math.floor(getTotalIncome()))}</span>
                    </div>
                  </div>

                  {!isReverseMortgage && (
                    <>
                      <PremiumInput label="החזרי הלוואות חודשיים" name="monthlyDebts" value={formData.monthlyDebts} placeholder="סכום חודשי" icon={TrendingDown} onChange={handleInputChange} tooltip="סכום ההחזרים החודשיים הקיימים (הלוואות, אשראי, ליסינג)" />
                      <PremiumInput label="שכירות חודשית (אם יש)" name="monthlyOverdraft" value={formData.monthlyOverdraft} placeholder="0" icon={TrendingDown} onChange={handleInputChange} tooltip="סכום השכירות החודשית" />
                    </>
                  )}
                </div>
              )}

              {step === 5 && (
                <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                  {!isReverseMortgage && (
                    <PremiumInput label="הון עצמי זמין למשכנתא" name="equity" value={formData.equity} placeholder="סכום הון עצמי" icon={Wallet} onChange={handleInputChange} error={fieldErrors.equity} tooltip="הסכום שיש לכם במזומן/חסכונות למטרת רכישת הנכס" />
                  )}
                  {isReverseMortgage && (
                    <div className="mb-5 p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl">
                      <p className="text-amber-800 font-bold text-sm">מסמכים נדרשים — משכנתא לגיל הזהב</p>
                      <ul className="mt-2 text-amber-700 text-xs space-y-1 list-disc list-inside">
                        <li>תעודת זהות + ספח (לווידוא גיל)</li>
                        <li>אישור הסכמת יורשים (חתום)</li>
                        <li>נסח טאבו מעודכן</li>
                        <li>דפי בנק 3 חודשים אחרונים</li>
                      </ul>
                    </div>
                  )}
                  {borrowers.some(b => (b.employmentTypes || []).includes('pensioner')) && !isReverseMortgage && (
                    <div className="mb-5 p-4 bg-blue-50 border-2 border-blue-300 rounded-2xl">
                      <p className="text-blue-800 font-bold text-sm">מסמכים נדרשים — פנסיונר/ית</p>
                      <ul className="mt-2 text-blue-700 text-xs space-y-1 list-disc list-inside">
                        <li>אישור גמלה/פנסיה (מקרן/ביטוח לאומי)</li>
                        <li>דפי בנק 3 חודשים אחרונים</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {step === 6 && (
                <div className="animate-in fade-in slide-in-from-left-4 duration-500 text-center py-10">
                  <PremiumInput label={isSeniorBankMortgage ? "תקופת הלוואה (עד 30 שנה, ללא הגבלת גיל)" : "תקופת הלוואה רצויה (בשנים)"} name="loanDuration" type="range" value={formData.loanDuration} min={4} max={maxTerm} onChange={handleInputChange} icon={Building2} tooltip="תקופה ארוכה יותר = החזר חודשי נמוך יותר אך ריבית כוללת גבוהה יותר" />

                  {isSeniorBankMortgage && (
                    <div className="mt-6 space-y-4 text-right animate-in slide-in-from-top-2 duration-300">
                      {/* מתג בלון */}
                      <div className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${formData.seniorBalloon ? 'bg-blue-900 border-blue-400 text-white' : 'bg-blue-50 border-blue-300 text-blue-900'}`}
                        onClick={() => {
                          const next = !formData.seniorBalloon;
                          handleInputChange('seniorBalloon', next);
                          if (next) handleInputChange('loanDuration', Math.min(Number(formData.loanDuration), 15).toString());
                        }}>
                        <div className="flex items-center justify-between mb-2">
                          <div className={`w-12 h-6 rounded-full flex items-center px-1 transition-all ${formData.seniorBalloon ? 'bg-blue-400 justify-end' : 'bg-gray-300 justify-start'}`}>
                            <div className="w-4 h-4 rounded-full bg-white shadow" />
                          </div>
                          <p className="font-black text-base">מסלול בלון (ריבית בלבד)</p>
                        </div>
                        <p className={`text-xs leading-relaxed ${formData.seniorBalloon ? 'text-blue-200' : 'text-blue-700'}`}>
                          תשלום חודשי של ריבית בלבד. הקרן נפרעת בתום התקופה. מקסימום 15 שנה.
                          {formData.seniorBalloon && results.loanAmount > 0 && (
                            <span className="block mt-2 font-black text-green-300 text-sm">
                              החזר חודשי בלון: ₪{formatCurrency(Math.floor(results.loanAmount * ALL_PURPOSE_RATES.FIXED_UNLINKED / 12))} | במשכנתא רגילה: ₪{formatCurrency(Math.floor(calculatePayment(results.loanAmount, ALL_PURPOSE_RATES.FIXED_UNLINKED, Number(formData.loanDuration))))} | חיסכון חודשי: ₪{formatCurrency(Math.floor(calculatePayment(results.loanAmount, ALL_PURPOSE_RATES.FIXED_UNLINKED, Number(formData.loanDuration)) - results.loanAmount * ALL_PURPOSE_RATES.FIXED_UNLINKED / 12))}
                            </span>
                          )}
                        </p>
                      </div>

                      {formData.seniorBalloon && (
                        <div className="animate-in slide-in-from-top-2 duration-300">
                          <div className="p-4 bg-red-50 border-2 border-red-400 rounded-xl mb-4">
                            <p className="text-red-800 font-black text-xs">גילוי נאות חובה: מדובר בהלוואת בלון. הקרן אינה נפרעת במהלך התקופה ותשולם במלואה בתום {formData.loanDuration} שנה.</p>
                          </div>
                          <PremiumInput label="אסטרטגיית יציאה – כיצד תפרע הקרן בסיום?" name="balloonExitStrategy" value={formData.balloonExitStrategy} icon={Target} onChange={handleInputChange}
                            options={[
                              {val: '', label: 'בחר אסטרטגיית יציאה...'},
                              {val: 'sell_property', label: 'מכירת הנכס'},
                              {val: 'inheritance', label: 'פירעון מירושה / עזבון'},
                              {val: 'refinance', label: 'מעבר למשכנתא רגילה'},
                              {val: 'savings', label: 'חסכונות / השקעות עתידיות'},
                              {val: 'other', label: 'אחר (יפורט מול יועץ)'},
                            ]}
                            tooltip="שדה חובה: הבנק ידרוש הצהרה מפורשת על אופן פירעון הקרן" />
                        </div>
                      )}

                      {/* מסמך יורשים */}
                      <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-xl text-right">
                        <p className="text-amber-900 font-black text-xs mb-1">מסמך חובה: חתימת ילדים / יורשים</p>
                        <p className="text-amber-700 text-xs">טופס יידוע ואישור יורשים על נטילת המשכנתא יידרש על ידי הבנק ויצורף להגשה.</p>
                      </div>
                    </div>
                  )}
                  <div className="mt-16 w-full text-center">
                    <p className="text-3xl sm:text-4xl font-black text-[#d4af37] italic animate-pulse tracking-tight drop-shadow-md leading-tight">
                      מיד מסיימים ואל תשכחו: <br/> מיקוד משכנתאות - המטרה שלנו, החיסכון שלכם
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-12 flex gap-4 text-right" dir="rtl">
              {step > 1 && (
                <button 
                  onClick={() => {if(step === 1 && otpSent) setOtpSent(false); else if(step > 1) setStep(s => s - 1);}} 
                  className="flex-1 h-14 rounded-full font-bold text-base text-gray-600 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all active:scale-95 text-center group"
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
                className={`h-14 rounded-full font-bold text-lg shadow-md transition-all bg-[#1e3a5f] text-white hover:bg-[#152d47] active:scale-95 text-center group ${step > 1 ? 'flex-[2]' : 'flex-1'}`}
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
          <div className="animate-in fade-in zoom-in-95 duration-1000 max-w-5xl mx-auto text-right px-3 sm:px-4" dir="rtl">
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 relative overflow-hidden">
                {/* פס עליון */}
                <div className="h-2 bg-gradient-to-r from-[#1e3a5f] via-[#c9a961] to-[#1e3a5f]" />

                {/* כותרת הדוח */}
                <div className="bg-gradient-to-br from-[#1e3a5f] to-[#162e4a] px-6 sm:px-10 py-6 sm:py-8 text-right">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <BadgeCheck size={16} className="text-[#c9a961]" />
                        <span className="text-[#c9a961] font-semibold text-xs uppercase tracking-widest">דוח היתכנות משכנתא</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight">{fullName}</h2>
                      <div className="flex flex-wrap items-center gap-4 mt-3">
                        {formData.idNumber && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#c9a961]/70 text-xs">ת.ז:</span>
                            <span className="text-white/90 font-bold text-sm">{formData.idNumber}</span>
                          </div>
                        )}
                        {formData.phone && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#c9a961]/70 text-xs">טל׳:</span>
                            <span className="text-white/90 font-bold text-sm" dir="ltr">{formData.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#c9a961]/70 text-xs">תאריך:</span>
                          <span className="text-white/90 font-bold text-sm">{TODAY_DATE}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/10 border border-white/20 rounded-2xl px-5 py-3 text-center sm:text-right flex-shrink-0">
                      <p className="text-[#c9a961]/80 text-[10px] font-semibold uppercase tracking-wide mb-1">מזהה תיק</p>
                      <p className="text-white font-black text-lg sm:text-xl">{caseId}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-8 md:p-12">

              {/* תעודת כשירות מיקוד */}
              <div className={`p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl border-2 mb-8 sm:mb-12 text-center relative overflow-hidden ${
                results.status.color === 'green' ? 'border-[#1e3a5f]/30 bg-gradient-to-br from-[#1e3a5f]/5 to-[#1e3a5f]/10' : 
                results.status.color === 'yellow' ? 'border-amber-400/40 bg-gradient-to-br from-amber-50/60 to-orange-50/60' : 
                'border-red-400/40 bg-gradient-to-br from-red-50/60 to-rose-50/60'
              }`}>
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#1e3a5f] via-[#c9a961] to-[#1e3a5f]" />
                
                <div className="flex justify-center mb-4 sm:mb-6">
                  {results.status.icon === 'check' && <BadgeCheck size={56} className="sm:w-16 sm:h-16 md:w-20 md:h-20 text-[#1e3a5f]" />}
                  {results.status.icon === 'warning' && <ShieldAlert size={56} className="sm:w-16 sm:h-16 md:w-20 md:h-20 text-amber-500" />}
                  {results.status.icon === 'alert' && <ShieldAlert size={56} className="sm:w-16 sm:h-16 md:w-20 md:h-20 text-red-500" />}
                  {results.status.icon === 'info' && <BadgeCheck size={56} className="sm:w-16 sm:h-16 md:w-20 md:h-20 text-amber-500" />}
                </div>
                
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#1e3a5f] mb-2">{results.status.text}</h2>
                <p className="text-sm sm:text-base md:text-lg font-bold text-gray-600 mb-6">{results.status.subtitle}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-gray-200">
                    {results.isReverse ? (
                      <>
                        <p className="text-xs text-gray-500 font-semibold mb-1">סוג משכנתא</p>
                        <p className="text-lg font-black text-[#c9a961]">גיל הזהב</p>
                        <p className="text-[10px] text-gray-400 mt-1">ללא DTI חובה</p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-gray-500 font-semibold mb-1">יחס החזר (DTI)</p>
                        <p className={`text-2xl font-black ${results.dti > 40 ? 'text-red-600' : results.dti > 35 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {results.dti.toFixed(1)}%
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">תקן: עד 40%</p>
                      </>
                    )}
                  </div>
                  
                  <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-gray-200">
                    <p className="text-xs text-gray-500 font-semibold mb-1">אחוז מימון (LTV)</p>
                    <p className={`text-2xl font-black ${results.ltv > 75 ? 'text-red-600' : results.ltv > 70 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {results.ltv.toFixed(1)}%
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {results.isReverse ? `מקסימום: ${getReverseMortgageMaxLTV(formData.youngestBorrowerAge || formData.age)}%` : results.isSenior ? `תקרה קשיחה: ${SENIOR_BANK_MAX_LTV}%` : 'תקן: עד 75%'}
                    </p>
                  </div>
                  
                  <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-gray-200">
                    <p className="text-xs text-gray-500 font-semibold mb-1">ציון איכות</p>
                    <p className="text-2xl font-black text-[#1e3a5f]">{results.score}</p>
                    <p className="text-[10px] text-gray-400 mt-1">מתוך 100</p>
                  </div>
                </div>
                
                {results.status.action && (
                  <div className={`p-4 sm:p-6 rounded-xl border-2 shadow-sm ${
                    results.status.color === 'red' ? 'bg-red-100 border-red-300' : 'bg-yellow-100 border-yellow-300'
                  }`}>
                    <p className={`font-bold text-sm sm:text-base leading-relaxed ${
                      results.status.color === 'red' ? 'text-red-800' : 'text-yellow-800'
                    }`}>
                      <strong>המלצת מיקוד:</strong> {results.status.action}
                    </p>
                  </div>
                )}
                
                <div className="mt-6 pt-6 border-t-2 border-gray-200">
                  <p className="text-xs sm:text-sm text-gray-500 font-bold italic flex items-center justify-center gap-2">
                    <Sparkles size={14} className="text-[#c9a961]" />
                    מיקוד משכנתאות - המטרה שלנו, החיסכון שלכם
                  </p>
                  <p className="text-[10px] text-gray-400 mt-2">* הדירוג מבוסס על תקני בנק ישראל ונתוני ההצהרה שמילאת</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-10 text-right">
                <div className="p-5 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl bg-[#1e3a5f] text-white">
                  <span className="font-semibold text-[10px] sm:text-xs uppercase tracking-wide text-[#c9a961]">סכום משכנתא מבוקש</span>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold mt-2 sm:mt-3 leading-none break-all">₪{formatCurrency(results.loanAmount)}</div>
                  <div className="mt-2 sm:mt-3 font-medium text-xs sm:text-sm text-gray-300">{results.ltv.toFixed(1)}% מימון מהנכס</div>
                </div>
                <div className="p-5 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#f8f6f0] to-[#f0ede4] border border-[#c9a961]/20">
                  <span className="font-semibold text-[10px] sm:text-xs uppercase tracking-wide text-[#8b7e5c]">החזר חודשי משוער</span>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold mt-2 sm:mt-3 leading-none text-[#1e3a5f]">₪{formatCurrency(Math.floor(results.mixB.total))}</div>
                  <div className="mt-2 sm:mt-3 font-medium text-xs sm:text-sm text-gray-600">{results.isBalloon ? 'בלון — ריבית בלבד' : 'תמהיל מאוזן מומלץ'}</div>
                </div>
              </div>

              {/* פאנל השוואת בלון */}
              {results.isSenior && results.isBalloon && results.balloonMonthly > 0 && (
                <div className="mb-6 sm:mb-10 p-5 sm:p-8 rounded-2xl border-2 border-blue-400 bg-gradient-to-br from-blue-900 to-blue-800 text-white animate-in slide-in-from-bottom-4 duration-700">
                  <h3 className="text-xl font-black mb-5 flex items-center gap-2">השוואת תזרים — מסלול בלון מול משכנתא רגילה</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                    <div className="bg-white/10 rounded-xl p-4 text-center border border-white/20">
                      <p className="text-xs text-blue-300 font-semibold mb-1">בלון – ריבית בלבד</p>
                      <p className="text-3xl font-black text-green-300">₪{formatCurrency(Math.floor(results.balloonMonthly))}</p>
                      <p className="text-[10px] text-blue-300 mt-1">לחודש</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 text-center border border-white/20">
                      <p className="text-xs text-blue-300 font-semibold mb-1">משכנתא רגילה</p>
                      <p className="text-3xl font-black text-white">₪{formatCurrency(Math.floor(results.regularMonthly))}</p>
                      <p className="text-[10px] text-blue-300 mt-1">לחודש</p>
                    </div>
                    <div className="bg-green-500/20 rounded-xl p-4 text-center border border-green-400">
                      <p className="text-xs text-green-300 font-semibold mb-1">תזרים פנוי נוסף</p>
                      <p className="text-3xl font-black text-green-300">₪{formatCurrency(Math.floor(results.regularMonthly - results.balloonMonthly))}</p>
                      <p className="text-[10px] text-green-300 mt-1">לחודש לשימושך האישי</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                      <p className="text-xs text-blue-300 font-semibold mb-2">כרית הון (Equity Buffer)</p>
                      <p className="text-sm text-white leading-relaxed">בהנחת עליית ערך של 3% בשנה, הנכס יהיה שווה כ-₪{formatCurrency(Math.floor(Number(String(formData.propertyPrice).replace(/,/g,'')) * Math.pow(1.03, Number(formData.loanDuration))))} בתום {formData.loanDuration} שנה, כאשר הקרן הנפרעת תהיה ₪{formatCurrency(Math.floor(results.loanAmount))} בלבד.</p>
                    </div>
                    <div className="bg-red-500/20 rounded-xl p-4 border border-red-400">
                      <p className="text-xs text-red-300 font-semibold mb-2">גילוי נאות חובה</p>
                      <p className="text-xs text-red-200 leading-relaxed">הלוואת בלון: הקרן (₪{formatCurrency(Math.floor(results.loanAmount))}) אינה נפרעת במהלך התקופה ותשולם במלואה בתום {formData.loanDuration} שנה לפי אסטרטגיית היציאה שבחרת.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border border-gray-200 mb-6 sm:mb-10 text-right">
                <h3 className="text-lg sm:text-2xl md:text-3xl font-bold text-[#1e3a5f] mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                  <Sparkles size={18} className="sm:w-6 sm:h-6 text-[#c9a961]" /> ניתוח מקצועי מלא
                </h3>
                <div className="text-gray-700 text-sm sm:text-base md:text-lg leading-relaxed font-normal whitespace-pre-line">
                  {loading ? (
                    <div className="flex items-center gap-3 italic text-base sm:text-lg text-right">
                      <Loader2 size={18} className="sm:w-5 sm:h-5 animate-spin text-blue-600" /> המערכת מנתחת את התיק שלכם...
                    </div>
                  ) : aiAnalysis}
                </div>
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-200 text-[10px] sm:text-xs text-slate-400 font-bold italic">
                  * החישוב מבוסס על ריביות עדכניות מבנק ישראל{ratesLastUpdated && ` (עודכן: ${new Date(ratesLastUpdated).toLocaleDateString('he-IL')})`}.
                </div>
              </div>



              {!isPurchased && (
                <div className="mb-6 p-5 rounded-2xl border-2 border-dashed border-[#d4af37] bg-[#1e3a5f]/5 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-right">
                  <Lock size={28} className="text-[#1e3a5f] flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-black text-[#001a33] text-base mb-1">התמהילים המלאים נעולים</h4>
                    <p className="text-slate-600 font-medium text-xs leading-relaxed">הפקת פירוט הריביות והחזרים מדויקים דורשת פתיחת תיק במיקוד משכנתאות.</p>
                  </div>
                  <button onClick={handlePurchaseClick} className="bg-[#1e3a5f] text-white px-6 py-3 rounded-xl font-black text-sm shadow-lg hover:bg-[#d4af37] hover:text-[#001a33] transition-all flex-shrink-0 whitespace-nowrap">
                    רכוש דוח ₪499 + מע"מ
                  </button>
                </div>
              )}

              <div className="mb-6 sm:mb-10">
                <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4 transition-all duration-1000 ${!isPurchased ? 'blur-3xl opacity-20 pointer-events-none' : ''}`}>
                  <MixTable title='תמהיל אסטרטגי משולב' tracks={results.mixB.tracks} totalPmt={results.mixB.total} isRecommended={true} />
                  <MixTable title='תמהיל שמרני' tracks={results.mixA.tracks} totalPmt={results.mixA.total} />
                  <MixTable title='תמהיל פריים' tracks={results.mixC.tracks} totalPmt={results.mixC.total} />
                </div>
              </div>



              {isPurchased && (
                <div className="mt-8 sm:mt-12">
                  <NegotiationPack 
                    formData={formData} 
                    results={results} 
                    selectedMix={results.mixB}
                    fullName={fullName}
                    borrowers={borrowers}
                  />
                </div>
              )}

              </div>{/* סגירת p-4 */}
              </div>{/* סגירת bg-white */}

              <div className="mt-6 sm:mt-10 bg-[#001a33] rounded-xl sm:rounded-[2rem] p-5 sm:p-8 md:p-12 text-white flex flex-col items-center gap-5 sm:gap-8 border-b-4 sm:border-b-8 border-[#d4af37] shadow-2xl text-center">
                <div className="max-w-xl">
                  <h4 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black mb-3 sm:mb-5 leading-tight tracking-tight italic">המטרה שלנו היא<br/>החיסכון הגדול שלכם.</h4>
                  <p className="text-slate-400 text-xs sm:text-sm md:text-base font-bold leading-relaxed italic">הניתוח הוא רק ההתחלה. מומחי מיקוד משכנתאות ישיגו לכם את התנאים המנצחים במערכת הבנקאית.</p>
                </div>
                <div className="flex flex-col items-center gap-3 sm:gap-5">
                  <a href="tel:2324" className="bg-[#d4af37] text-[#001a33] px-12 sm:px-16 md:px-20 py-5 sm:py-6 md:py-7 rounded-[1.5rem] font-black text-4xl sm:text-5xl md:text-6xl shadow-2xl hover:bg-white transition-all transform hover:scale-105 active:scale-95 leading-none">2324*</a>
                  <p className="text-[#d4af37] font-black tracking-widest uppercase text-[9px] sm:text-[10px]">פגישת ייעוץ אישית ללא התחייבות</p>
                </div>
              </div>
          </div>
        )}
      </main>

      <MikoChat formData={formData} results={results} isPurchased={isPurchased} isOpen={isChatOpen} setIsOpen={setIsChatOpen} />
    </div>
  );
}