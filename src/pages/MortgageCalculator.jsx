import React, { useState, useMemo, useEffect } from 'react';
import { 
  User, Home, Briefcase, AlertCircle, ChevronLeft, Loader2, Phone, 
  Wallet, Building2, ShieldCheck, Sparkles, Mail, BadgeCheck, 
  Calendar, Coins, TrendingDown, Rocket, MessageSquareQuote, 
  ClipboardList, Lock, HelpCircle, Smartphone, Key, Target, HeartHandshake, ShieldAlert, X, UserPlus, Trash2
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PremiumInput from '@/components/mikud/PremiumInput';
import MixTable from '@/components/mikud/MixTable';
import MikoChat from '@/components/mikud/MikoChat';
import BankLogosCarousel from '@/components/mikud/BankLogosCarousel';
import NegotiationPack from '@/components/mikud/NegotiationPack';
import BorrowerForm from '@/components/mikud/BorrowerForm';


// v2.1
const TODAY_DATE = new Date().toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });

const DEFAULT_RATES = {
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
  const [currentLeadId, setCurrentLeadId] = useState(null);
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

  // חישוב הכנסה כוללת מכל הלווים (לווה נוסף = 50% בלבד)
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

  // חוק ה-30 שנה - ללא הגבלת גיל + LTV Max 45%
  const SENIOR_BANK_MAX_LTV = 45;
  const SENIOR_BANK_MAX_TERM = 30;
  const BALLOON_MAX_TERM = 15;

  const isReverseMortgage = formData.mortgageType === 'reverse_mortgage';
  const isSeniorBankMortgage = formData.mortgageType === 'senior_bank';

  // ריביות "כל מטרה" - ALL_PURPOSE_RATES (גבוהות מעט מדיור רגיל)
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

  // חישוב LTV מקסימלי למשכנתא הפוכה לפי גיל
  const getReverseMortgageMaxLTV = (age) => {
    const a = Number(age) || 60;
    if (a >= 80) return 50;
    if (a >= 75) return 40;
    if (a >= 70) return 30;
    if (a >= 65) return 25;
    return 20; // גיל 60-64
  };

  const validateStep = (currentStep) => {
    const errors = {};
    if (currentStep === 2 && !formData.age) errors.age = "חובה להזין גיל";
    if (currentStep === 2 && isReverseMortgage && !formData.youngestBorrowerAge) errors.youngestBorrowerAge = "חובה להזין גיל הלווה הצעיר ביותר";
    if (currentStep === 2 && isReverseMortgage && Number(formData.youngestBorrowerAge) < 60) errors.youngestBorrowerAge = "מינימום גיל 60 למשכנתא לגיל הזהב";
    if (currentStep === 3 && !formData.propertyPrice) errors.propertyPrice = "חובה להזין שווי נכס";
    if (currentStep === 3 && !formData.loanAmount) errors.loanAmount = "חובה להזין סכום מבוקש";
    if (currentStep === 4 && !formData.netIncome && !isReverseMortgage) errors.netIncome = "חובה להזין הכנסה";
    if (currentStep === 5 && !isReverseMortgage && !formData.equity) errors.equity = "חובה להזין הון עצמי";
    setFieldErrors(errors);
    return Object.keys(errors).filter(k => errors[k]).length === 0;
  };

  const results = useMemo(() => {
    const price = Number(String(formData.propertyPrice).replace(/,/g, '')) || 0;
    const eq = Number(String(formData.equity).replace(/,/g, '')) || 0;
    const duration = Math.min(maxTerm, Number(formData.loanDuration) || maxTerm);
    const requestedLoan = Number(String(formData.loanAmount || '').replace(/,/g, '')) || 0;
    const loanAmount = requestedLoan > 0 ? requestedLoan : Math.max(0, price - eq);
    const ltv = price > 0 ? (loanAmount / price) : 0;
    const totalInc = calcTotalIncome();
    const debts = Number(String(formData.monthlyDebts).replace(/,/g, '')) || 0;
    const freeIncome = Math.max(1, totalInc - debts);
    const isReverse = formData.mortgageType === 'reverse_mortgage';
    const isSenior = formData.mortgageType === 'senior_bank';
    const isBalloon = formData.seniorBalloon === true;

    // בחירת ריביות: משכנתא בנקאית לגיל הזהב = ALL_PURPOSE_RATES
    const activeRates = isSenior ? ALL_PURPOSE_RATES : rates;

    // חישוב החזר: בלון = ריבית בלבד (principal * rate / 12)
    const calcPmt = (principal, rate, years) => {
      if (isSenior && isBalloon) return principal * rate / 12;
      return calculatePayment(principal, rate, years);
    };

    const mixB_T1 = { 
      name: "פריים (Prime)", 
      amount: loanAmount * 0.33, 
      rate: activeRates.PRIME_CALC, 
      years: duration, 
      pmt: calcPmt(loanAmount * 0.33, activeRates.PRIME_CALC, duration), 
      desc: isSenior && isBalloon ? "ריבית בלבד" : "P-0.5%" 
    };
    const mixB_T2 = { 
      name: "קבועה לא צמודה (קל\"צ)", 
      amount: loanAmount * 0.33, 
      rate: activeRates.FIXED_UNLINKED, 
      years: duration, 
      pmt: calcPmt(loanAmount * 0.33, activeRates.FIXED_UNLINKED, duration), 
      desc: isSenior && isBalloon ? "ריבית בלבד" : "החזר קבוע" 
    };
    const mixB_T3 = { 
      name: "משתנה כל 5 שנים צמודה", 
      amount: loanAmount * 0.34, 
      rate: activeRates.VAR_LINKED, 
      years: duration, 
      pmt: calcPmt(loanAmount * 0.34, activeRates.VAR_LINKED, duration), 
      desc: isSenior && isBalloon ? "ריבית בלבד" : "משתנה צמודה" 
    };
    const pmtB = mixB_T1.pmt + mixB_T2.pmt + mixB_T3.pmt;

    // בלון: חישוב DTI על ריבית בלבד
    const balloonInterestOnly = isSenior && isBalloon ? loanAmount * activeRates.FIXED_UNLINKED / 12 : null;
    const dtiBase = isSenior && isBalloon ? balloonInterestOnly : pmtB;
    const dti = (isReverse || isSenior) ? 0 : (dtiBase / freeIncome) * 100;
    const ltvPercent = ltv * 100;
    const youngestAge = Number(formData.youngestBorrowerAge) || Number(formData.age) || 60;
    const maxReverseLTV = isReverse ? getReverseMortgageMaxLTV(youngestAge) : 75;
    
    // קביעת סטטוס כשירות
    let status = { 
      color: 'green', 
      text: isReverse ? 'כשיר למשכנתא לגיל הזהב' : isSenior ? 'כשיר - משכנתא בנקאית לגיל הזהב' : 'כשיר להגשה לבנק', 
      subtitle: isReverse ? `אחוז מימון מקסימלי לגילך: ${maxReverseLTV}%` : isSenior ? `מקסימום ${SENIOR_BANK_MAX_LTV}% מימון | עד 30 שנה | ללא ביטוח חיים חובה` : 'התיק עומד בתקני בנק ישראל',
      action: null,
      icon: 'check'
    };
    
    if (isReverse) {
      if (ltvPercent > maxReverseLTV) {
        const excessLoan = loanAmount - (price * maxReverseLTV / 100);
        status = {
          color: 'red',
          text: 'דורש התאמה',
          subtitle: `אחוז מימון ${ltvPercent.toFixed(1)}% חורג מהמותר לגילך`,
          action: `יש להקטין את הסכום המבוקש ב-₪${formatCurrency(Math.floor(excessLoan))} (מקסימום ${maxReverseLTV}% מימון בגיל ${youngestAge}).`,
          icon: 'alert'
        };
      }
    } else if (isSenior) {
      // בדיקת LTV קשיחה: מקסימום 45%
      if (ltvPercent > SENIOR_BANK_MAX_LTV) {
        const excessLoan = loanAmount - (price * SENIOR_BANK_MAX_LTV / 100);
        status = { 
          color: 'red', 
          text: 'דורש התאמה', 
          subtitle: `אחוז מימון ${ltvPercent.toFixed(1)}% חורג מהמותר (מקסימום ${SENIOR_BANK_MAX_LTV}%)`,
          action: `יש להקטין את הסכום המבוקש ב-₪${formatCurrency(Math.floor(excessLoan))} להורדת המימון ל-${SENIOR_BANK_MAX_LTV}%.`,
          icon: 'alert'
        };
      }
    } else {
      if (dti > 45) {
        const excessPayment = pmtB - (freeIncome * 0.40);
        status = { color: 'red', text: 'דורש התאמת נתונים', subtitle: `יחס החזר ${dti.toFixed(1)}% חורג מהמותר`, action: `יש להקטין את ההחזר החודשי ב-₪${formatCurrency(Math.floor(excessPayment))} או להגדיל הכנסות.`, icon: 'alert' };
      } else if (ltvPercent > 75) {
        const excessLoan = loanAmount - (price * 0.75);
        status = { color: 'red', text: 'דורש התאמת נתונים', subtitle: `אחוז מימון ${ltvPercent.toFixed(1)}% חורג מהמותר`, action: `נדרש הון עצמי נוסף של ₪${formatCurrency(Math.floor(excessLoan))} להורדת אחוז המימון ל-75%.`, icon: 'alert' };
      } else if (dti > 40) {
        status = { color: 'yellow', text: 'דורש אישור מיוחד', subtitle: `יחס החזר ${dti.toFixed(1)}% גבולי`, action: 'מומלץ להאריך תקופת הלוואה, לצמצם הלוואות קיימות, או להגדיל הכנסות.', icon: 'warning' };
      } else if (dti > 35) {
        status = { color: 'yellow', text: 'כשיר עם המלצה לשיפור', subtitle: `יחס החזר ${dti.toFixed(1)}% טוב`, action: 'תיק תקין. ניתן לשפר ע"י הארכת תקופה או תמהיל אסטרטגי לחיסכון בריבית.', icon: 'info' };
      }
    }
    
    const qualityScore = isReverse 
      ? Math.min(100, Math.max(0, 100 - (ltvPercent > maxReverseLTV ? (ltvPercent - maxReverseLTV) * 3 : 0)))
      : isSenior
        ? Math.min(100, Math.max(0, 100 - (ltvPercent > SENIOR_BANK_MAX_LTV ? (ltvPercent - SENIOR_BANK_MAX_LTV) * 3 : 0)))
        : Math.min(100, Math.max(0, 100 - (dti > 35 ? (dti - 35) * 4 : 0) - (ltvPercent > 70 ? (ltvPercent - 70) * 2 : 0)));

    // בלון: החזר ריבית בלבד (למסך השוואה)
    const balloonMonthly = isSenior && isBalloon ? loanAmount * activeRates.FIXED_UNLINKED / 12 : null;
    const regularMonthly = isSenior ? calculatePayment(loanAmount, activeRates.FIXED_UNLINKED, duration) : null;

    return {
      loanAmount, ltv: ltvPercent, totalIncome: totalInc, dti, actualDuration: duration,
      status, score: qualityScore, isReverse, isSenior, isBalloon,
      balloonMonthly, regularMonthly,
      mixA: { 
        tracks: [{ name: isSenior ? "100% קבועה לא צמודה (כל מטרה)" : "100% קבועה לא צמודה", amount: loanAmount, rate: activeRates.FIXED_UNLINKED, years: duration, pmt: calcPmt(loanAmount, activeRates.FIXED_UNLINKED, duration), desc: isSenior && isBalloon ? "⚠️ בלון - ריבית בלבד" : "הגנה מלאה" }], 
        total: calcPmt(loanAmount, activeRates.FIXED_UNLINKED, duration) 
      },
      mixB: { tracks: [mixB_T1, mixB_T2, mixB_T3], total: pmtB },
      mixC: { 
        tracks: [
          { name: "50% פריים (Prime)", amount: loanAmount * 0.5, rate: activeRates.PRIME_CALC, years: duration, pmt: calcPmt(loanAmount*0.5, activeRates.PRIME_CALC, duration), desc: isSenior && isBalloon ? "ריבית בלבד" : "ניצול שוק" }, 
          { name: isSenior ? "50% קבועה (כל מטרה)" : "50% קבועה (קל\"צ)", amount: loanAmount * 0.5, rate: activeRates.FIXED_UNLINKED, years: duration, pmt: calcPmt(loanAmount*0.5, activeRates.FIXED_UNLINKED, duration), desc: isSenior && isBalloon ? "ריבית בלבד" : "עוגן יציבות" }
        ], 
        total: calcPmt(loanAmount*0.5, activeRates.PRIME_CALC, duration) + calcPmt(loanAmount*0.5, activeRates.FIXED_UNLINKED, duration)
      }
    };
  }, [formData, maxTerm, rates, ALL_PURPOSE_RATES, isSeniorBankMortgage]);

  const generateFullAnalysis = async () => {
    if (!validateStep(6)) return;
    setLoading(true);
    setStep(7);
    
    const incomeTypes = (formData.employmentTypes || ['employee']).join(', ');
    const prompt = `אתה יועץ משכנתאות בכיר בישראל. נתח את תיק המשכנתא הבא באופן מקצועי ומלא:

לקוח: ${fullName}, גיל ${formData.age}
סוג הכנסה: ${incomeTypes}
הכנסה חודשית נטו: ₪${formData.netIncome}${formData.partnerNetIncome && formData.partnerNetIncome !== '0' ? ` + ₪${formData.partnerNetIncome} (לווה ב')` : ''}
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
    
    const isPensioner = (formData.employmentTypes || []).includes('pensioner');
    const isSelfEmployed = (formData.employmentTypes || []).includes('self_employed');
    
    const isSeniorBank = formData.mortgageType === 'senior_bank';
    const docsList = isSeniorBank
      ? `רשימת מסמכים נדרשים – משכנתא בנקאית לגיל הזהב (כל מטרה):\n1. תעודת זהות + ספח מעודכן (לכל לווה)\n2. טופס חתימת ילדים/יורשים על מודעות למשכנתא (חובה!)\n3. אישור קצבה/פנסיה חודשית (3 חודשים אחרונים)\n4. דפי בנק 3 חודשים אחרונים\n5. נסח טאבו מעודכן\n6. שמאות נכס (תואם מוסד פיננסי)\n7. אישור BDI / דוח נתוני אשראי${formData.seniorBalloon ? '\n8. הצהרת אסטרטגיית יציאה (בלון) – חתומה' : ''}`
      : isReverseMortgage 
      ? `רשימת מסמכים נדרשים למשכנתא הפוכה:\n1. תעודת זהות + ספח מעודכן\n2. נסח טאבו מעודכן\n3. דפי בנק 3 חודשים אחרונים\n4. אישור הסכמת יורשים חתום\n5. אישור קצבה/פנסיה חודשית\n6. שמאות נכס (תואם מוסד פיננסי)`
      : isPensioner 
        ? `רשימת מסמכים נדרשים - פנסיונר/ית:\n1. תעודת זהות + ספח מעודכן\n2. אישור גמלה/פנסיה חודשית (מקרן הפנסיה / ביטוח לאומי)\n3. דפי בנק 3 חודשים אחרונים\n4. נסח טאבו מעודכן\n5. חוזה רכישה / הסכם\n6. שמאות נכס (תואם מוסד פיננסי)`
        : isSelfEmployed
          ? `רשימת מסמכים נדרשים - עצמאי/ת:\n1. תעודת זהות + ספח מעודכן\n2. 2 שנות דוחות מס הכנסה אחרונים (עם אישור רו"ח)\n3. דפי בנק 3 חודשים אחרונים (עסקי + פרטי)\n4. נסח טאבו מעודכן\n5. חוזה רכישה / הסכם\n6. שמאות נכס (תואם מוסד פיננסי)\n7. אישור ניהול ספרים מרשות המסים`
          : `רשימת מסמכים נדרשים - שכיר/ה:\n1. תעודת זהות + ספח מעודכן\n2. 3 תלושי שכר אחרונים\n3. דפי בנק 3 חודשים אחרונים\n4. נסח טאבו מעודכן\n5. חוזה רכישה / הסכם\n6. שמאות נכס (תואם מוסד פיננסי)`;

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
        <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-3 px-8 py-3 rounded-full bg-gradient-to-r from-[#1e3a5f]/5 via-[#c9a961]/10 to-[#1e3a5f]/5 backdrop-blur-sm border border-[#c9a961]/20 shadow-lg">
          <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#1e3a5f] via-[#c9a961] to-[#1e3a5f] tracking-tight animate-gradient" style={{ fontFamily: 'Georgia, serif', textShadow: '0 2px 20px rgba(201, 169, 97, 0.3)' }}>
            המטרה שלנו
          </div>
          <div className="text-xl font-bold text-[#c9a961]">—</div>
          <div className="text-3xl font-black text-[#1e3a5f] tracking-wide relative" style={{ fontFamily: 'Georgia, serif', textShadow: '0 2px 15px rgba(30, 58, 95, 0.2)' }}>
            החיסכון שלכם
            <span className="absolute -top-1 -right-8 text-[#c9a961] text-2xl animate-bounce">✨</span>
            <span className="absolute -bottom-1 -left-6 text-[#c9a961] text-xl">!!!</span>
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
                  <div className="mb-6 p-4 bg-[#1e3a5f]/5 rounded-xl border-2 border-[#1e3a5f]/20">
                    <h3 className="text-base font-bold text-[#1e3a5f] mb-1">לווה א' - פרטים אישיים</h3>
                    <p className="text-xs text-gray-500">הגיל שלך: <span className="font-bold text-[#c9a961]">{formData.age || 'טרם חושב'}</span></p>
                  </div>
                  
                  <PremiumInput label="מצב משפחתי" name="maritalStatus" value={formData.maritalStatus} icon={User} onChange={handleInputChange} options={[{val:'single', label:'רווק/ה'}, {val:'married', label:'נשוי/אה'}, {val:'divorced', label:'גרוש/ה'}, {val:'widowed', label:'אלמן/ה'}]} tooltip="מצב המשפחתי משפיע על יכולת ההחזר והתאמת התמהיל" />
                  <PremiumInput label="מספר ילדים מתחת לגיל 18" name="childrenUnder18" value={formData.childrenUnder18} icon={User} onChange={handleInputChange} placeholder="0" tooltip="מספר הילדים מתחת לגיל 18 משפיע על חישוב ההוצאות החודשיות" />
                  {/* סוג הכנסה - checkboxes */}
                  <div className="mb-5 text-right w-full">
                    <label className="flex items-center text-[#1e3a5f] font-semibold text-sm mb-3">
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center ml-2">
                        <Briefcase size={16} className="text-gray-500" />
                      </div>
                      <span>סוג הכנסה (ניתן לסמן יותר מאחד)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        {val:'employee', label:'שכיר/ה'},
                        {val:'self_employed', label:'עצמאי/ת'},
                        {val:'controlling_shareholder', label:'בעל שליטה'},
                        {val:'foreign_income', label:'הכנסה מחו"ל'},
                        {val:'pensioner', label:'פנסיונר/ית'},
                      ].map(opt => {
                        const checked = (formData.employmentTypes || []).includes(opt.val);
                        return (
                          <label key={opt.val} className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${checked ? 'border-[#c9a961] bg-[#c9a961]/10' : 'border-gray-200 bg-white hover:border-[#1e3a5f]/40'}`}>
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded accent-[#1e3a5f]"
                              checked={checked}
                              onChange={(e) => {
                                const cur = formData.employmentTypes || [];
                                const next = e.target.checked ? [...cur, opt.val] : cur.filter(v => v !== opt.val);
                                handleInputChange('employmentTypes', next.length ? next : ['employee']);
                              }}
                            />
                            <span className="text-sm font-semibold text-gray-800">{opt.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* שדה גיל לווה צעיר - מופיע רק לפנסיונר + משכנתא הפוכה */}
                  {(formData.employmentTypes || []).includes('pensioner') && isReverseMortgage && (
                    <div className="animate-in slide-in-from-top-2 duration-300">
                      <PremiumInput label="גיל הלווה הצעיר ביותר" name="youngestBorrowerAge" value={formData.youngestBorrowerAge} placeholder="גיל מינימלי (60+)" icon={Calendar} onChange={handleInputChange} error={fieldErrors.youngestBorrowerAge} tooltip="לצורך חישוב אחוז המימון המקסימלי במשכנתא הפוכה" />
                      <div className="p-3 bg-amber-50 border-r-4 border-amber-500 rounded-xl text-right text-xs text-amber-800 font-medium mb-4">
                        💡 אחוז המימון המקסימלי עולה עם הגיל: גיל 60-64 = 20%, גיל 65-69 = 25%, גיל 70-74 = 30%, גיל 75-79 = 40%, גיל 80+ = 50%
                      </div>
                    </div>
                  )}
                  
                  <div className="mb-5 text-right w-full">
                    <label className="flex items-center text-[#1e3a5f] font-semibold text-sm mb-2">
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center ml-2">
                        <Briefcase size={16} className="text-gray-500" />
                      </div>
                      <span>תאריך התחלת עבודה נוכחית</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <input 
                        type="number" 
                        placeholder="יום"
                        min="1"
                        max="31"
                        className="bg-gradient-to-br from-white to-gray-50 h-14 px-5 border-3 border-[#1e3a5f] rounded-2xl outline-none focus:border-[#c9a961] focus:ring-4 focus:ring-[#c9a961]/20 focus:shadow-xl transition-all text-gray-900 font-semibold text-base text-center"
                        value={formData.workStartDay || ''}
                        onChange={(e) => {
                          handleInputChange('workStartDay', e.target.value);
                          if (formData.workStartMonth && formData.workStartYear && e.target.value) {
                            const startDate = new Date(formData.workStartYear, formData.workStartMonth - 1, e.target.value);
                            const today = new Date();
                            const years = (today - startDate) / (1000 * 60 * 60 * 24 * 365.25);
                            handleInputChange('employmentSeniority', Math.max(0, years.toFixed(1)));
                          }
                        }}
                      />
                      <input 
                        type="number" 
                        placeholder="חודש"
                        min="1"
                        max="12"
                        className="bg-gradient-to-br from-white to-gray-50 h-14 px-5 border-3 border-[#1e3a5f] rounded-2xl outline-none focus:border-[#c9a961] focus:ring-4 focus:ring-[#c9a961]/20 focus:shadow-xl transition-all text-gray-900 font-semibold text-base text-center"
                        value={formData.workStartMonth || ''}
                        onChange={(e) => {
                          handleInputChange('workStartMonth', e.target.value);
                          if (formData.workStartDay && formData.workStartYear && e.target.value) {
                            const startDate = new Date(formData.workStartYear, e.target.value - 1, formData.workStartDay);
                            const today = new Date();
                            const years = (today - startDate) / (1000 * 60 * 60 * 24 * 365.25);
                            handleInputChange('employmentSeniority', Math.max(0, years.toFixed(1)));
                          }
                        }}
                      />
                      <input 
                        type="number" 
                        placeholder="שנה"
                        min="1960"
                        max="2026"
                        className="bg-gradient-to-br from-white to-gray-50 h-14 px-5 border-3 border-[#1e3a5f] rounded-2xl outline-none focus:border-[#c9a961] focus:ring-4 focus:ring-[#c9a961]/20 focus:shadow-xl transition-all text-gray-900 font-semibold text-base text-center"
                        value={formData.workStartYear || ''}
                        onChange={(e) => {
                          handleInputChange('workStartYear', e.target.value);
                          if (formData.workStartDay && formData.workStartMonth && e.target.value) {
                            const startDate = new Date(e.target.value, formData.workStartMonth - 1, formData.workStartDay);
                            const today = new Date();
                            const years = (today - startDate) / (1000 * 60 * 60 * 24 * 365.25);
                            handleInputChange('employmentSeniority', Math.max(0, years.toFixed(1)));
                          }
                        }}
                      />
                    </div>
                    {formData.employmentSeniority && (
                      <div className="mt-3 p-3 bg-green-50 border-2 border-green-300 rounded-xl text-center">
                        <p className="text-green-800 font-bold text-sm">ותק: {formData.employmentSeniority} שנים</p>
                      </div>
                    )}
                  </div>
                  
                  <PremiumInput label="דירוג אשראי BDI" name="creditHistory" value={formData.creditHistory} icon={ShieldCheck} onChange={handleInputChange} options={[{val:'clean', label:'תקין לחלוטין (ירוק)'}, {val:'issues', label:'מורכב (היו עיכובים)'}]} tooltip="דירוג האשראי שלך משפיע על הסיכוי לאישור ועל תנאי המשכנתא" />
                  
                  {formData.maritalStatus === 'married' && (
                    <div className="mt-8 p-5 bg-gradient-to-br from-[#c9a961]/10 to-[#c9a961]/5 rounded-2xl border-2 border-[#c9a961]/30 animate-in slide-in-from-top-4 duration-500">
                      <h3 className="text-base font-bold text-[#1e3a5f] mb-4 flex items-center gap-2">
                        <HeartHandshake size={20} className="text-[#c9a961]" />
                        לווה ב' - פרטים אישיים (בן/בת זוג)
                      </h3>
                      
                      <PremiumInput label="שם מלא לווה ב'" name="partnerFullName" value={formData.partnerFullName} placeholder="שם מלא" icon={User} onChange={handleInputChange} />
                      <PremiumInput label="מספר תעודת זהות לווה ב'" name="partnerIdNumber" value={formData.partnerIdNumber} placeholder="123456789" icon={BadgeCheck} onChange={handleInputChange} />
                      
                      <div className="mb-5 text-right w-full">
                        <label className="flex items-center text-[#1e3a5f] font-semibold text-sm mb-2">
                          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center ml-2">
                            <Calendar size={16} className="text-gray-500" />
                          </div>
                          <span>תאריך לידה לווה ב'</span>
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          <input 
                            type="number" 
                            placeholder="יום"
                            min="1"
                            max="31"
                            className="bg-gradient-to-br from-white to-gray-50 h-14 px-5 border-3 border-[#1e3a5f] rounded-2xl outline-none focus:border-[#c9a961] focus:ring-4 focus:ring-[#c9a961]/20 focus:shadow-xl transition-all text-gray-900 font-semibold text-base text-center"
                            value={formData.partnerBirthDay || ''}
                            onChange={(e) => {
                              handleInputChange('partnerBirthDay', e.target.value);
                              if (formData.partnerBirthMonth && formData.partnerBirthYear && e.target.value) {
                                const birthDate = new Date(formData.partnerBirthYear, formData.partnerBirthMonth - 1, e.target.value);
                                const today = new Date();
                                let age = today.getFullYear() - birthDate.getFullYear();
                                const monthDiff = today.getMonth() - birthDate.getMonth();
                                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
                                handleInputChange('partnerAge', age.toString());
                              }
                            }}
                          />
                          <input 
                            type="number" 
                            placeholder="חודש"
                            min="1"
                            max="12"
                            className="bg-gradient-to-br from-white to-gray-50 h-14 px-5 border-3 border-[#1e3a5f] rounded-2xl outline-none focus:border-[#c9a961] focus:ring-4 focus:ring-[#c9a961]/20 focus:shadow-xl transition-all text-gray-900 font-semibold text-base text-center"
                            value={formData.partnerBirthMonth || ''}
                            onChange={(e) => {
                              handleInputChange('partnerBirthMonth', e.target.value);
                              if (formData.partnerBirthDay && formData.partnerBirthYear && e.target.value) {
                                const birthDate = new Date(formData.partnerBirthYear, e.target.value - 1, formData.partnerBirthDay);
                                const today = new Date();
                                let age = today.getFullYear() - birthDate.getFullYear();
                                const monthDiff = today.getMonth() - birthDate.getMonth();
                                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
                                handleInputChange('partnerAge', age.toString());
                              }
                            }}
                          />
                          <input 
                            type="number" 
                            placeholder="שנה"
                            min="1920"
                            max="2008"
                            className="bg-gradient-to-br from-white to-gray-50 h-14 px-5 border-3 border-[#1e3a5f] rounded-2xl outline-none focus:border-[#c9a961] focus:ring-4 focus:ring-[#c9a961]/20 focus:shadow-xl transition-all text-gray-900 font-semibold text-base text-center"
                            value={formData.partnerBirthYear || ''}
                            onChange={(e) => {
                              handleInputChange('partnerBirthYear', e.target.value);
                              if (formData.partnerBirthDay && formData.partnerBirthMonth && e.target.value) {
                                const birthDate = new Date(e.target.value, formData.partnerBirthMonth - 1, formData.partnerBirthDay);
                                const today = new Date();
                                let age = today.getFullYear() - birthDate.getFullYear();
                                const monthDiff = today.getMonth() - birthDate.getMonth();
                                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
                                handleInputChange('partnerAge', age.toString());
                              }
                            }}
                          />
                        </div>
                        {formData.partnerAge && (
                          <div className="mt-3 p-3 bg-green-50 border-2 border-green-300 rounded-xl text-center">
                            <p className="text-green-800 font-bold text-sm">גיל: {formData.partnerAge}</p>
                          </div>
                        )}
                      </div>
                      
                      <PremiumInput label="סטטוס תעסוקתי לווה ב'" name="partnerEmploymentStatus" value={formData.partnerEmploymentStatus} icon={Briefcase} onChange={handleInputChange} options={[{val:'employee', label:'שכיר/ה'}, {val:'self_employed', label:'עצמאי/ת'}, {val:'both', label:'גם וגם'}]} />
                      
                      <div className="mb-5 text-right w-full">
                        <label className="flex items-center text-[#1e3a5f] font-semibold text-sm mb-2">
                          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center ml-2">
                            <Briefcase size={16} className="text-gray-500" />
                          </div>
                          <span>תאריך התחלת עבודה לווה ב'</span>
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          <input 
                            type="number" 
                            placeholder="יום"
                            min="1"
                            max="31"
                            className="bg-gradient-to-br from-white to-gray-50 h-14 px-5 border-3 border-[#1e3a5f] rounded-2xl outline-none focus:border-[#c9a961] focus:ring-4 focus:ring-[#c9a961]/20 focus:shadow-xl transition-all text-gray-900 font-semibold text-base text-center"
                            value={formData.partnerWorkStartDay || ''}
                            onChange={(e) => {
                              handleInputChange('partnerWorkStartDay', e.target.value);
                              if (formData.partnerWorkStartMonth && formData.partnerWorkStartYear && e.target.value) {
                                const startDate = new Date(formData.partnerWorkStartYear, formData.partnerWorkStartMonth - 1, e.target.value);
                                const today = new Date();
                                const years = (today - startDate) / (1000 * 60 * 60 * 24 * 365.25);
                                handleInputChange('partnerEmploymentSeniority', Math.max(0, years.toFixed(1)));
                              }
                            }}
                          />
                          <input 
                            type="number" 
                            placeholder="חודש"
                            min="1"
                            max="12"
                            className="bg-gradient-to-br from-white to-gray-50 h-14 px-5 border-3 border-[#1e3a5f] rounded-2xl outline-none focus:border-[#c9a961] focus:ring-4 focus:ring-[#c9a961]/20 focus:shadow-xl transition-all text-gray-900 font-semibold text-base text-center"
                            value={formData.partnerWorkStartMonth || ''}
                            onChange={(e) => {
                              handleInputChange('partnerWorkStartMonth', e.target.value);
                              if (formData.partnerWorkStartDay && formData.partnerWorkStartYear && e.target.value) {
                                const startDate = new Date(formData.partnerWorkStartYear, e.target.value - 1, formData.partnerWorkStartDay);
                                const today = new Date();
                                const years = (today - startDate) / (1000 * 60 * 60 * 24 * 365.25);
                                handleInputChange('partnerEmploymentSeniority', Math.max(0, years.toFixed(1)));
                              }
                            }}
                          />
                          <input 
                            type="number" 
                            placeholder="שנה"
                            min="1960"
                            max="2026"
                            className="bg-gradient-to-br from-white to-gray-50 h-14 px-5 border-3 border-[#1e3a5f] rounded-2xl outline-none focus:border-[#c9a961] focus:ring-4 focus:ring-[#c9a961]/20 focus:shadow-xl transition-all text-gray-900 font-semibold text-base text-center"
                            value={formData.partnerWorkStartYear || ''}
                            onChange={(e) => {
                              handleInputChange('partnerWorkStartYear', e.target.value);
                              if (formData.partnerWorkStartDay && formData.partnerWorkStartMonth && e.target.value) {
                                const startDate = new Date(e.target.value, formData.partnerWorkStartMonth - 1, formData.partnerWorkStartDay);
                                const today = new Date();
                                const years = (today - startDate) / (1000 * 60 * 60 * 24 * 365.25);
                                handleInputChange('partnerEmploymentSeniority', Math.max(0, years.toFixed(1)));
                              }
                            }}
                          />
                        </div>
                        {formData.partnerEmploymentSeniority && (
                          <div className="mt-3 p-3 bg-green-50 border-2 border-green-300 rounded-xl text-center">
                            <p className="text-green-800 font-bold text-sm">ותק: {formData.partnerEmploymentSeniority} שנים</p>
                          </div>
                        )}
                      </div>
                      
                      <PremiumInput label="דירוג אשראי BDI לווה ב'" name="partnerCreditHistory" value={formData.partnerCreditHistory} icon={ShieldCheck} onChange={handleInputChange} options={[{val:'clean', label:'תקין לחלוטין (ירוק)'}, {val:'issues', label:'מורכב (היו עיכובים)'}]} />
                    </div>
                  )}
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
                      <p className="text-amber-800 font-bold text-sm">🏛️ משכנתא הפוכה</p>
                      <p className="text-amber-700 text-xs mt-1 leading-relaxed">ללא החזר חודשי חובה. הסכום נפרע מהנכס בסיום. אחוז המימון נקבע לפי גיל הלווה הצעיר ביותר.</p>
                    </div>
                  )}

                  {isSeniorBankMortgage && (
                    <div className="mb-5 p-4 bg-blue-50 border-2 border-blue-500 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                      <p className="text-blue-900 font-black text-sm mb-2">🏦 משכנתא בנקאית לגיל הזהב – כל מטרה</p>
                      <ul className="text-blue-800 text-xs space-y-1 list-none">
                        <li>✅ פריסה עד 30 שנה ללא הגבלת גיל עליונה</li>
                        <li>✅ LTV מקסימלי: 45% (עד 50% בבנקים ספציפיים)</li>
                        <li>✅ ללא חובת ביטוח חיים</li>
                        <li>✅ ריביות מחירון "כל מטרה" (All-Purpose)</li>
                        <li>⚠️ חובת יידוע יורשים וחתימתם</li>
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
                      <p className="text-blue-800 font-bold text-sm">💡 משכנתא לגיל הזהב - מסלול ייעודי</p>
                      <p className="text-blue-700 text-xs mt-1">אין חובת הוכחת יחס החזר (DTI). הכנסות משמשות לחיזוק התיק בלבד.</p>
                    </div>
                  )}
                  <PremiumInput label={(formData.employmentTypes || []).includes('pensioner') ? 'גמלה/פנסיה חודשית נטו' : 'נטו לווה א\' (ממוצע 3 חודשים)'} name="netIncome" value={formData.netIncome} icon={Coins} onChange={handleInputChange} error={fieldErrors.netIncome} tooltip="ההכנסה החודשית נטו - ממוצע 3 חודשים אחרונים" />
                  <PremiumInput label="נטו לווה ב' (אם קיים)" name="partnerNetIncome" value={formData.partnerNetIncome} icon={Coins} onChange={handleInputChange} tooltip="הכנסת בן/בת הזוג נטו" />
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
                      <p className="text-amber-800 font-bold text-sm">📋 מסמכים נדרשים - משכנתא לגיל הזהב</p>
                      <ul className="mt-2 text-amber-700 text-xs space-y-1 list-disc list-inside">
                        <li>תעודת זהות + ספח (לווידוא גיל)</li>
                        <li>אישור הסכמת יורשים (חתום)</li>
                        <li>נסח טאבו מעודכן</li>
                        <li>דפי בנק 3 חודשים אחרונים</li>
                      </ul>
                    </div>
                  )}
                  {(formData.employmentTypes || []).includes('pensioner') && !isReverseMortgage && (
                    <div className="mb-5 p-4 bg-blue-50 border-2 border-blue-300 rounded-2xl">
                      <p className="text-blue-800 font-bold text-sm">📋 מסמכים נדרשים - פנסיונר/ית</p>
                      <ul className="mt-2 text-blue-700 text-xs space-y-1 list-disc list-inside">
                        <li>אישור גמלה/פנסיה (מקרן/ביטוח לאומי)</li>
                        <li>דפי בנק 3 חודשים אחרונים</li>
                      </ul>
                    </div>
                  )}
                  <div className="space-y-4">
                    <PremiumInput label="הכנסות נוספות (מחוץ לתלוש/קצבה)" name="additionalIncomeType" value={formData.additionalIncomeType} icon={HeartHandshake} onChange={handleInputChange} 
                      options={[
                        {val:'none', label:'אין הכנסות נוספות'}, 
                        {val:'rent', label:'שכירות נכנסת'}, 
                        {val:'national_insurance', label:'קצבת ביטוח לאומי'}, 
                        {val:'disability', label:'קצבת נכות'}, 
                        {val:'child_allowance', label:'קצבאות ילדים'}, 
                        {val:'second_job', label:'עבודה נוספת'}, 
                        {val:'other', label:'אחר'}
                      ]} tooltip="הכנסות נוספות יכולות לחזק את התיק (בכפוף לאישור הבנק)" />

                    {formData.additionalIncomeType !== 'none' && (
                      <div className="animate-in slide-in-from-top-2 duration-300">
                        <PremiumInput label="סכום חודשי נוסף" name="additionalIncomeAmount" value={formData.additionalIncomeAmount} icon={Coins} onChange={handleInputChange} tooltip="סכום ההכנסה החודשית הנוספת" />
                        <div className="p-4 bg-blue-50 border-r-4 border-blue-600 rounded-xl text-right">
                          <p className="text-blue-900 font-bold text-sm mb-1">💡 מקור ההכנסה: {
                            formData.additionalIncomeType === 'rent' ? 'שכירות נכנסת (דורש דיווח רשמי)' :
                            formData.additionalIncomeType === 'national_insurance' ? 'קצבת ביטוח לאומי' :
                            formData.additionalIncomeType === 'disability' ? 'קצבת נכות' :
                            formData.additionalIncomeType === 'child_allowance' ? 'קצבאות ילדים' :
                            formData.additionalIncomeType === 'second_job' ? 'עבודה נוספת' :
                            'הכנסה נוספת'
                          }</p>
                          <p className="text-blue-700 text-xs leading-relaxed">
                            {formData.additionalIncomeType === 'rent' && 'הבנק יכיר רק בהכנסה מתועדת ומדווחת רשמית למס הכנסה'}
                            {formData.additionalIncomeType === 'national_insurance' && 'קצבת ביטוח לאומי מוכרת כהכנסה קבועה על ידי הבנקים'}
                            {formData.additionalIncomeType === 'disability' && 'קצבת נכות מוכרת כהכנסה קבועה - יש לצרף אישור'}
                            {formData.additionalIncomeType === 'child_allowance' && 'קצבאות ילדים מוכרות בדרך כלל על ידי רוב הבנקים'}
                            {formData.additionalIncomeType === 'second_job' && 'יש לצרף תלושי שכר/אישור הכנסה'}
                            {formData.additionalIncomeType === 'other' && 'יש לפרט את מקור ההכנסה ליועץ'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
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
                          <p className="font-black text-base">🎈 מסלול בלון (ריבית בלבד)</p>
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
                            <p className="text-red-800 font-black text-xs">⚠️ גילוי נאות חובה: מדובר בהלוואת בלון. הקרן אינה נפרעת במהלך התקופה ותשולם במלואה בתום {formData.loanDuration} שנה.</p>
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
                        <p className="text-amber-900 font-black text-xs mb-1">📋 מסמך חובה: חתימת ילדים/יורשים</p>
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
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-8 md:p-12 border border-gray-100 relative">
                <div className="mb-6 sm:mb-10 pb-4 sm:pb-8 border-b border-gray-200 flex flex-col gap-3 text-right">
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-[#c9a961] font-semibold text-[10px] sm:text-xs uppercase tracking-wide">
                      <BadgeCheck size={16} className="sm:w-[18px] sm:h-[18px]"/>דוח היתכנות משכנתא
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1e3a5f] leading-tight break-words">{fullName}</h2>
                    <p className="text-gray-400 font-medium text-xs sm:text-sm mt-2">{TODAY_DATE}</p>
                  </div>
                <div className="bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200 text-left w-fit">
                  <p className="text-[10px] sm:text-xs text-gray-400 font-medium mb-1">מזהה תיק</p>
                  <p className="text-base sm:text-lg font-bold text-[#1e3a5f]">MK-{Math.random().toString(36).substr(2, 5).toUpperCase()}</p>
                </div>
              </div>

              {/* תעודת כשירות מיקוד */}
              <div className={`p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl border-4 mb-8 sm:mb-12 text-center relative overflow-hidden ${
                results.status.color === 'green' ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50' : 
                results.status.color === 'yellow' ? 'border-yellow-500 bg-gradient-to-br from-yellow-50 to-amber-50' : 
                'border-red-500 bg-gradient-to-br from-red-50 to-rose-50'
              }`}>
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#1e3a5f] via-[#c9a961] to-[#1e3a5f]" />
                
                <div className="flex justify-center mb-4 sm:mb-6">
                  {results.status.icon === 'check' && <BadgeCheck size={56} className="sm:w-16 sm:h-16 md:w-20 md:h-20 text-green-600" />}
                  {results.status.icon === 'warning' && <ShieldAlert size={56} className="sm:w-16 sm:h-16 md:w-20 md:h-20 text-yellow-600" />}
                  {results.status.icon === 'alert' && <ShieldAlert size={56} className="sm:w-16 sm:h-16 md:w-20 md:h-20 text-red-600" />}
                  {results.status.icon === 'info' && <BadgeCheck size={56} className="sm:w-16 sm:h-16 md:w-20 md:h-20 text-yellow-600" />}
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
                      💡 <strong>המלצת מיקוד:</strong> {results.status.action}
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
                  <div className="mt-2 sm:mt-3 font-medium text-xs sm:text-sm text-gray-600">{results.isBalloon ? '🎈 בלון – ריבית בלבד' : 'תמהיל מאוזן מומלץ'}</div>
                </div>
              </div>

              {/* פאנל השוואת בלון */}
              {results.isSenior && results.isBalloon && results.balloonMonthly > 0 && (
                <div className="mb-6 sm:mb-10 p-5 sm:p-8 rounded-2xl border-2 border-blue-400 bg-gradient-to-br from-blue-900 to-blue-800 text-white animate-in slide-in-from-bottom-4 duration-700">
                  <h3 className="text-xl font-black mb-5 flex items-center gap-2">🎈 השוואת תזרים – מסלול בלון vs. משכנתא רגילה</h3>
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
                      <p className="text-xs text-green-300 font-semibold mb-1">✅ תזרים פנוי נוסף</p>
                      <p className="text-3xl font-black text-green-300">₪{formatCurrency(Math.floor(results.regularMonthly - results.balloonMonthly))}</p>
                      <p className="text-[10px] text-green-300 mt-1">לחודש לשימושך האישי</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                      <p className="text-xs text-blue-300 font-semibold mb-2">🏠 כרית הון (Equity Buffer)</p>
                      <p className="text-sm text-white leading-relaxed">בהנחת עליית ערך של 3% בשנה, הנכס יהיה שווה כ-₪{formatCurrency(Math.floor(Number(String(formData.propertyPrice).replace(/,/g,'')) * Math.pow(1.03, Number(formData.loanDuration))))} בתום {formData.loanDuration} שנה, כאשר הקרן הנפרעת תהיה ₪{formatCurrency(Math.floor(results.loanAmount))} בלבד.</p>
                    </div>
                    <div className="bg-red-500/20 rounded-xl p-4 border border-red-400">
                      <p className="text-xs text-red-300 font-semibold mb-2">⚠️ גילוי נאות חובה</p>
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

              <div className="text-center mb-4 sm:mb-6">
                <h4 className="text-sm sm:text-base md:text-xl font-black text-[#001a33] italic px-2 leading-tight">לחצו כאן לקבלת חומרים ואסטרטגיות נוספות ממיקו ה-AI</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-10 text-right">
                <button onClick={() => getAiInsight('roadmap')} className={`p-3 sm:p-5 md:p-6 rounded-xl sm:rounded-[1.5rem] font-black flex items-center justify-center sm:justify-between shadow-xl transition-all active:scale-95 group border-b-4 ${isPurchased ? 'bg-[#001a33] text-white border-[#d4af37] cursor-pointer' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'}`} disabled={!isPurchased}>
                  <div className="flex items-center gap-2 text-xs sm:text-sm md:text-base"><Rocket size={18} className="sm:w-5 sm:h-5 text-[#d4af37]" /><span>✨ אסטרטגיה</span></div>
                  <ChevronLeft size={14} className="hidden sm:block sm:w-4 sm:h-4" />
                </button>
                <button onClick={() => getAiInsight('negotiation')} className={`p-3 sm:p-5 md:p-6 rounded-xl sm:rounded-[1.5rem] font-black flex items-center justify-center sm:justify-between shadow-xl transition-all active:scale-95 group border-b-4 ${isPurchased ? 'bg-[#001a33] text-white border-[#d4af37] cursor-pointer' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'}`} disabled={!isPurchased}>
                  <div className="flex items-center gap-2 text-xs sm:text-sm md:text-base"><MessageSquareQuote size={18} className="sm:w-5 sm:h-5 text-[#d4af37]" /><span>✨ מו"מ</span></div>
                  <ChevronLeft size={14} className="hidden sm:block sm:w-4 sm:h-4" />
                </button>
                <button onClick={() => getAiInsight('documents')} className={`p-3 sm:p-5 md:p-6 rounded-xl sm:rounded-[1.5rem] font-black flex items-center justify-center sm:justify-between shadow-xl transition-all active:scale-95 group border-b-4 ${isPurchased ? 'bg-[#001a33] text-white border-[#d4af37] cursor-pointer' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'}`} disabled={!isPurchased}>
                  <div className="flex items-center gap-2 text-xs sm:text-sm md:text-base"><ClipboardList size={18} className="sm:w-5 sm:h-5 text-[#d4af37]" /><span>✨ מסמכים</span></div>
                  <ChevronLeft size={14} className="hidden sm:block sm:w-4 sm:h-4" />
                </button>
              </div>

              {aiInsights && (
                <div className="bg-[#FDF9F0] p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-[2rem] border-2 border-[#EAD9B5] mb-6 sm:mb-10 animate-in slide-in-from-bottom-4 duration-500 text-right shadow-sm">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-[#EAD9B5]/30">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#785C28]" />
                    <h4 className="text-sm sm:text-base md:text-lg font-black text-[#785C28] uppercase tracking-wide italic">{aiInsights.type}</h4>
                  </div>
                  <div className="text-[#785C28] text-xs sm:text-sm md:text-base font-medium leading-relaxed whitespace-pre-wrap">
                    {insightLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin" />
                        <span>מייצר ניתוח...</span>
                      </div>
                    ) : String(aiInsights.content)}
                  </div>
                </div>
              )}

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
                <div className={`space-y-4 sm:space-y-8 transition-all duration-1000 ${!isPurchased ? 'blur-3xl opacity-20 pointer-events-none' : ''}`}>
                  <MixTable title='תמהיל אסטרטגי משולב (מומלץ)' tracks={results.mixB.tracks} totalPmt={results.mixB.total} isRecommended={true} />
                  <MixTable title='תמהיל שמרני (100% קבועה)' tracks={results.mixA.tracks} totalPmt={results.mixA.total} />
                  <MixTable title='תמהיל פריים weighted' tracks={results.mixC.tracks} totalPmt={results.mixC.total} />
                </div>
              </div>

              <div className={`p-4 sm:p-6 md:p-8 bg-[#001a33] rounded-xl sm:rounded-[2rem] mb-6 sm:mb-10 text-white shadow-xl transition-all duration-1000 ${!isPurchased ? 'opacity-30 blur-md pointer-events-none' : ''}`}>
                <div className="flex flex-col items-center mb-4 sm:mb-6 gap-2 sm:gap-3 text-center">
                  <h4 className="text-lg sm:text-xl md:text-2xl font-black flex items-center gap-2 sm:gap-3 leading-none">
                    <Mail size={20} className="sm:w-6 sm:h-6 text-[#d4af37]" /> ✨ טיוטת פנייה לבנק
                  </h4>
                  <p className="text-slate-400 text-[10px] sm:text-xs font-bold italic">מיקו יצר עבורכם את המייל המקצועי ביותר להגשה לבנקאי.</p>
                </div>
                <div className="bg-white/5 p-3 sm:p-5 md:p-6 rounded-xl border border-white/10 shadow-inner font-bold text-xs sm:text-sm md:text-base text-slate-100 leading-relaxed text-right whitespace-pre-wrap overflow-x-auto">
                  {bankerEmail || "הטיוטה תופיע כאן לאחר רכישת הדוח..."}
                </div>
              </div>

              {isPurchased && (
                <div className="mt-8 sm:mt-12">
                  <NegotiationPack 
                    formData={formData} 
                    results={results} 
                    selectedMix={results.mixB}
                  />
                </div>
              )}

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
          </div>
        )}
      </main>

      <MikoChat formData={formData} results={results} isPurchased={isPurchased} isOpen={isChatOpen} setIsOpen={setIsChatOpen} />
    </div>
  );
}