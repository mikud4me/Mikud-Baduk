import React, { useState, useMemo, useEffect } from 'react';
import { 
  User, Home, Briefcase, AlertCircle, ChevronLeft, Loader2, Phone, 
  Wallet, Building2, ShieldCheck, Sparkles, Mail, BadgeCheck, 
  Calendar, Coins, TrendingDown, Rocket, MessageSquareQuote, 
  ClipboardList, Lock, HelpCircle, Smartphone, Key, Target, HeartHandshake, ShieldAlert, X, UserPlus, Trash2
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import {
  DEFAULT_RATES, formatCurrency, calculatePayment, cleanAiText,
  getReverseMortgageMaxLTV, calcTotalIncome, calculateResults, calculateRefinanceResults,
  SENIOR_BANK_MAX_LTV, SENIOR_BANK_MAX_TERM, BALLOON_MAX_TERM,
} from '@/components/mortgage/mortgageUtils';
import PremiumInput from '@/components/mikud/PremiumInput';
import MixComparison from '@/components/mikud/MixComparison';
import MikoChat from '@/components/mikud/MikoChat';
import BankLogosCarousel from '@/components/mikud/BankLogosCarousel';
import NegotiationPack from '@/components/mikud/NegotiationPack.jsx';
import BorrowerForm from '@/components/mikud/BorrowerForm';
import ExistingPropertyForm from '@/components/mikud/ExistingPropertyForm';
import EquityCompletionForm from '@/components/mikud/EquityCompletionForm';
import HowItWorks from '@/components/mikud/HowItWorks';
import SocialProof from '@/components/mikud/SocialProof';
import FooterCTA from '@/components/mikud/FooterCTA';
import BirthDateInput from '@/components/mikud/BirthDateInput';
import FormattedAnalysis from '@/components/mikud/FormattedAnalysis';


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
  const [showSpouseReminderModal, setShowSpouseReminderModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', phone: '', email: '', idNumber: '', birthDate: '', consent: false, creditConsent: false,
    mortgageType: 'purchase_first', loanDuration: '25', seniorBalloon: false, balloonExitStrategy: '',
    propertyPrice: '', loanAmount: '',
    monthlyDebts: '0', monthlyOverdraft: '0', equity: '',
    youngestBorrowerAge: '',
    // שדות מחזור
    refinanceBalance: '', currentMonthlyPayment: '', refinanceRemainingYears: '20', refinanceGoal: 'savings',
    refinanceCanIncreasePayment: 'no', refinanceIncreaseAmount: '',
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
  const [existingProperties, setExistingProperties] = useState([{}]);
  const [equityCompletion, setEquityCompletion] = useState({});

  const updateBorrower = (index, data) => {
    setBorrowers(prev => prev.map((b, i) => i === index ? data : b));
  };

  const handleMaritalChange = (maritalStatus) => {
    const isMarried = maritalStatus === 'married';
    setBorrowers(prev => {
      const hasSpouse = prev.length > 1 && prev[1].isSpouse;
      if (isMarried && !hasSpouse) {
        // הוסף לווה בן/בת זוג אוטומטית
        return [...prev, { ...defaultBorrower(), borrowerType: 'primary', isSpouse: true }];
      } else if (!isMarried && hasSpouse) {
        // הסר לווה בן/בת זוג אוטומטית
        return [prev[0]];
      }
      return prev;
    });
  };

  const addBorrower = () => {
    setBorrowers(prev => [...prev, { ...defaultBorrower(), borrowerType: 'primary' }]);
    setActiveBorrowerTab(borrowers.length);
  };

  const removeBorrower = (index) => {
    if (borrowers.length <= 1) return;
    // אם מסיר בן/בת זוג — עדכן גם מצב משפחתי ללווה ראשון
    if (borrowers[index]?.isSpouse) {
      setBorrowers(prev => {
        const updated = [{ ...prev[0], maritalStatus: 'single' }];
        return updated;
      });
      setActiveBorrowerTab(0);
      return;
    }
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
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000));
        const response = await Promise.race([
          base44.functions.invoke('getBankOfIsraelRates'),
          timeoutPromise
        ]);
        if (response.data?.success && response.data?.rates) {
          setRates(response.data.rates);
          setRatesLastUpdated(response.data.last_updated);
        }
      } catch (error) {
        console.error('Failed to load rates, using defaults:', error);
      }
    };
    loadRates();
  }, []);

  const isReverseMortgage = formData.mortgageType === 'reverse_mortgage';
  const isSeniorBankMortgage = formData.mortgageType === 'senior_bank';

  const ALL_PURPOSE_RATES = useMemo(() => ({
    FIXED_UNLINKED: (rates.FIXED_UNLINKED || 0.0470) + 0.004,
    VAR_LINKED: (rates.VAR_LINKED || 0.0315) + 0.003,
    PRIME_CALC: rates.PRIME_CALC || 0.0490,
  }), [rates]);

  const maxTerm = useMemo(() => {
    if (isSeniorBankMortgage && formData.seniorBalloon) return BALLOON_MAX_TERM;
    if (isSeniorBankMortgage) return SENIOR_BANK_MAX_TERM;
    const ageNum = Number(formData.age) || 35;
    return Math.min(30, Math.max(1, 85 - ageNum));
  }, [formData.age, isSeniorBankMortgage, formData.seniorBalloon]);

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: null }));
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const startVerification = () => {
    const errors = {};
    if (!formData.firstName || formData.firstName.trim().length < 2) errors.firstName = "אנא הזן שם פרטי תקין";
    if (!formData.lastName || formData.lastName.trim().length < 2) errors.lastName = "אנא הזן שם משפחה תקין";
    if (!/^05\d{8}$/.test(formData.phone)) errors.phone = "טלפון נייד לא תקין (10 ספרות)";
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email)) errors.email = "נא להזין כתובת אימייל אמיתית ותקינה";
    
    if (!/^\d{9}$/.test(formData.idNumber)) {
      errors.idNumber = "ת.ז לא תקינה (9 ספרות)";
    } else {
      // אלגוריתם לוהן לבדיקת תקינות ת.ז ישראלית
      let idSum = 0;
      for (let i = 0; i < 9; i++) {
        let d = Number(formData.idNumber[i]) * ((i % 2) + 1);
        if (d > 9) d -= 9;
        idSum += d;
      }
      if (idSum % 10 !== 0) errors.idNumber = "מספר ת.ז לא תקין — אנא הזן ת.ז אמיתית";
    }
    
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
    // קוד דמו קבוע — יוחלף ב-SMS אמיתי עם העלייה לאוויר
    setGeneratedOtp("0000");
    setOtpSent(true);
  };

  const verifyOtp = () => {
    if (userInputOtp === generatedOtp) { 
      setOtpVerified(true); 
      setStep(2);
      scrollToTop();
    } else { 
      setFieldErrors({ otp: "קוד שגוי" }); 
    }
  };

  const validateStep = (currentStep) => {
    const errors = {};
    if (currentStep === 2 && !formData.age) errors.age = "חובה להזין גיל";
    if (currentStep === 2 && isReverseMortgage && !formData.youngestBorrowerAge) errors.youngestBorrowerAge = "חובה להזין גיל הלווה הצעיר ביותר";
    if (currentStep === 2 && isReverseMortgage && Number(formData.youngestBorrowerAge) < 60) errors.youngestBorrowerAge = "מינימום גיל 60 למשכנתא לגיל הזהב";
    if (currentStep === 3 && !isRefinance && !formData.propertyPrice) errors.propertyPrice = "חובה להזין שווי נכס";
    if (currentStep === 3 && !isRefinance && !formData.loanAmount) errors.loanAmount = "חובה להזין סכום מבוקש";
    if (currentStep === 3 && isRefinance && !formData.refinanceBalance) errors.refinanceBalance = "חובה להזין יתרת משכנתא";
    if (currentStep === 3 && isRefinance && !formData.currentMonthlyPayment) errors.currentMonthlyPayment = "חובה להזין החזר חודשי נוכחי";
    if (currentStep === 4 && !isReverseMortgage && getTotalIncome() <= 0) errors.netIncome = "חובה להזין הכנסה לפחות ללווה אחד";
    if (currentStep === 5 && !isReverseMortgage && !isRefinance && !formData.equity) errors.equity = "חובה להזין הון עצמי";
    setFieldErrors(errors);
    return Object.keys(errors).filter(k => errors[k]).length === 0;
  };

  const isRefinance = formData.mortgageType === 'refinance';

  // האם נדרשים נתוני נכס קיים (כל סוג עסקה חוץ מדירה ראשונה ומחזור)
  const needsExistingProperty = !isRefinance && !isReverseMortgage && !isSeniorBankMortgage &&
    ['purchase_improve', 'purchase_additional', 'any_purpose'].includes(formData.mortgageType);

  // נכס קיים ראשון (backward compat לטפסים שמשתמשים ב-existingProperty יחיד)
  const existingProperty = existingProperties[0] || {};
  const setExistingProperty = (val) => setExistingProperties(prev => [val, ...prev.slice(1)]);

  // סה"כ החזרים חודשיים של נכסים קיימים (ללא הסכם מכירה)
  const totalExistingMortgagePayments = existingProperties.reduce((acc, prop) => {
    if (prop.hasExistingMortgage === 'yes' && prop.existingMortgagePayment && prop.hasSaleAgreement !== 'yes') {
      return acc + Number(String(prop.existingMortgagePayment || '0').replace(/,/g, ''));
    }
    return acc;
  }, 0);

  const addExistingProperty = () => setExistingProperties(prev => [...prev, {}]);
  const removeExistingProperty = (idx) => setExistingProperties(prev => prev.filter((_, i) => i !== idx));
  const updateExistingProperty = (idx, val) => setExistingProperties(prev => prev.map((p, i) => i === idx ? val : p));

  // סך הון עצמי = הון עצמי בסיסי + סכום השלמה ממקורות נוספים
  const totalEquity = useMemo(() => {
    const base = Number(String(equityCompletion.equity || formData.equity || '0').replace(/,/g, ''));
    const completion = Number(String(equityCompletion.completionAmount || '0').replace(/,/g, ''));
    return base + completion;
  }, [equityCompletion.equity, equityCompletion.completionAmount, formData.equity]);

  // חישוב פער השלמת עסקה
  const equityGap = useMemo(() => {
    if (isRefinance || isReverseMortgage) return 0;
    const price = Number(String(formData.propertyPrice || '0').replace(/,/g, ''));
    const loan = Number(String(formData.loanAmount || '0').replace(/,/g, ''));
    if (!price || !loan) return 0;
    return Math.max(0, price - loan - totalEquity);
  }, [formData.propertyPrice, formData.loanAmount, totalEquity, isRefinance, isReverseMortgage]);

  const results = useMemo(() => {
    try {
      // צרף את ההחזרים על נכסים קיימים (ללא הסכם מכירה) לחובות החודשיים
      const adjustedDebts = Number(String(formData.monthlyDebts || '0').replace(/,/g, '')) + totalExistingMortgagePayments;
      const adjustedFormData = needsExistingProperty && totalExistingMortgagePayments > 0
        ? { ...formData, monthlyDebts: String(adjustedDebts) }
        : formData;
      if (isRefinance) {
        return calculateRefinanceResults({ formData: adjustedFormData, borrowers, rates });
      }
      // שלב את סך ההון העצמי (כולל השלמות) לחישוב
      const formDataWithTotalEquity = totalEquity > 0
        ? { ...adjustedFormData, equity: String(totalEquity) }
        : adjustedFormData;
      return calculateResults({ formData: formDataWithTotalEquity, borrowers, maxTerm, rates, ALL_PURPOSE_RATES });
    } catch (e) {
      console.error('results calculation error:', e);
      return { loanAmount: 0, ltv: 0, dti: 0, score: 0, status: { color: 'green', text: '', subtitle: '', action: null, icon: 'check' }, mixA: { tracks: [], total: 0 }, mixB: { tracks: [], total: 0 }, mixC: { tracks: [], total: 0 }, actualDuration: 25, isReverse: false, isSenior: false, isBalloon: false };
    }
  }, [formData, borrowers, maxTerm, rates, ALL_PURPOSE_RATES, isRefinance, totalExistingMortgagePayments, needsExistingProperty, totalEquity]);

  const generateFullAnalysis = async () => {
    if (!isRefinance && !validateStep(6)) return;
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
    const isRefinanceFlow = isRefinance;

    // פרופיל הלווים המפורט
    const primaryBorrower = borrowers[0] || {};
    const maritalLabel = { single: 'רווק/ה', married: 'נשוי/אה', divorced: 'גרוש/ה', widowed: 'אלמן/ה' }[primaryBorrower.maritalStatus] || '';
    const creditLabel = primaryBorrower.creditHistory === 'clean' ? 'תקינה ללא הערות' : primaryBorrower.creditHistory === 'minor_issues' ? 'עם הערות קלות' : 'עם בעיות בעבר';
    const empTypes = (primaryBorrower.employmentTypes || []).join(', ');

    const prompt = isRefinanceFlow
      ? `אתה יועץ משכנתאות ותיק עם 20 שנות ניסיון בישראל. לפניך בקשת מחזור משכנתא מפורטת. כתוב ניתוח מקצועי שיועיל ללקוח וגם לבנקאי שיקרא אותו.

===פרטי הלקוח===
שם: ${fullName} | גיל: ${formData.age} | מצב משפחתי: ${maritalLabel}
היסטוריית אשראי: ${creditLabel}
${borrowersSummary}
הכנסה כוללת מוכרת לבנק: ₪${Math.floor(getTotalIncome()).toLocaleString()}

===נתוני משכנתא קיימת===
יתרת קרן: ₪${results.balance?.toLocaleString()}
החזר חודשי נוכחי: ₪${results.currentMonthly?.toLocaleString()}
ריבית ממוצעת קיימת (משוערת): ${results.impliedRate?.toFixed(2)}%
שנים שנותרו: ${results.remainingYears}

===תוצאות ניתוח המחזור===
חיסכון חודשי בתמהיל המומלץ: ₪${results.monthlySaving?.toLocaleString()}
חיסכון כולל לאורך הקופה: ₪${results.totalSaving?.toLocaleString()}
נקודת האיזון (break-even): ${results.breakEvenMonths ? results.breakEvenMonths + ' חודשים' : 'מיידי'}
${results.canIncrease && results.increaseAmount > 0 ? `הלקוח מעוניין להגדיל החזר ב-₪${results.increaseAmount} לחודש לקיצור תקופה` : ''}

כתוב ניתוח בפורמט הבא (ללא כוכביות, ללא Markdown):
1. המלצת מחזור — כן או לא ומדוע (2-3 משפטים)
2. ניתוח ריבית קיימת מול שוק — האם הלקוח משלם יותר מהמקובל?
3. השוואת 3 תמהילים: א) קבועה מלאה ב) מאוזן ג) ${results.canIncrease && results.increaseAmount > 0 ? 'הגדלת החזר לקיצור תקופה' : 'פריים+קבועה'}
4. פרופיל סיכון הלקוח וההמלצה האסטרטגית
5. שלבי ביצוע מעשיים (3-4 נקודות)
ענה בעברית בלבד, שפה מקצועית אך ברורה ללקוח.`
      : `אתה יועץ משכנתאות ותיק עם 20 שנות ניסיון בישראל. לפניך תיק לקוח מלא לניתוח. הניתוח ישמש גם את הלקוח להבנה וגם את הבנקאי לאישור — כתוב בהתאם.

===פרטי הלקוח===
שם: ${fullName} | גיל: ${formData.age} | מצב משפחתי: ${maritalLabel}
ילדים מתחת ל-18: ${primaryBorrower.childrenUnder18 || 0}
היסטוריית אשראי: ${creditLabel}
סוג תעסוקה: ${empTypes}
${borrowersSummary}
הכנסה כוללת מוכרת לבנק: ₪${Math.floor(getTotalIncome()).toLocaleString()}

===פרטי הנכס והמשכנתא===
שווי נכס: ₪${Number(String(formData.propertyPrice||0).replace(/,/g,'')).toLocaleString()}
סכום מבוקש: ₪${results.loanAmount?.toLocaleString()}
הון עצמי: ₪${Number(String(formData.equity||0).replace(/,/g,'')).toLocaleString()}
LTV: ${results.ltv?.toFixed(1)}%
${!results.isReverse ? `DTI: ${results.dti?.toFixed(1)}% (תקן בנק ישראל: עד 40%)` : 'משכנתא הפוכה — ללא חובת DTI'}
תקופה: ${formData.loanDuration} שנים
סוג עסקה: ${formData.mortgageType}
חובות חודשיים קיימים: ₪${formData.monthlyDebts || 0}

===ציון האיכות של התיק===
${results.score}/100

כתוב ניתוח מקצועי בפורמט הבא בדיוק (ללא כוכביות, ללא Markdown):
1. סיכום כשירות — [2-3 משפטים על עמידה בתקני בנק ישראל ורמת סיכון]
2. ניתוח DTI ו-LTV — [פרשנות המספרים ומשמעותם הכלכלית]
3. נקודות חוזק — [רשום את כל הנקודות החיוביות בתוך אותה פסקה, מופרדות בנקודה-פסיק. לפחות 3 נקודות. אל תממספר אותן בנפרד]
4. נקודות לשיפור — [רשום את כל ההמלצות לשיפור בתוך אותה פסקה, מופרדות בנקודה-פסיק. אל תממספר אותן בנפרד]
5. אסטרטגיית הגשה — [איך להציג את התיק, מה להדגיש, מה לא]
6. תחזית סיכוי אישור — [נמוך/בינוני/גבוה ומדוע]

חשוב מאוד: כל סעיף חייב להכיל את כל התוכן שלו בשורה אחת רציפה מתחת לכותרת. אין לפצל נקודות לשורות ממוספרות נפרדות.
ענה בעברית בלבד, שפה מקצועית אך ברורה ללקוח הממוצע.`;
    
    const emailPrompt = isRefinanceFlow
      ? `כתוב מכתב פנייה מקצועי לבנקאי עבור לקוח בשם ${fullName}, גיל ${formData.age}, המבקש מחזור משכנתא.
יתרה קיימת: ₪${formatCurrency(results.balance)} | ריבית קיימת: ${results.impliedRate?.toFixed(2)}% | חיסכון צפוי: ₪${formatCurrency(results.monthlySaving)} לחודש.
המכתב צריך: פנייה רשמית, פרטי התיק בטבלה, נקודות חוזק הלקוח, בקשה להצעת ריבית.
ענה בעברית בלבד, פורמט מכתב עסקי.`
      : `כתוב מכתב פנייה מקצועי לבנקאי עבור לקוח בשם ${fullName}, גיל ${formData.age}, ${maritalLabel}.
סכום: ₪${formatCurrency(results.loanAmount)} | LTV: ${(results.ltv || 0).toFixed(1)}% | DTI: ${(results.dti || 0).toFixed(1)}% | ציון תיק: ${results.score}/100.
הכנסה: ₪${Math.floor(getTotalIncome()).toLocaleString()} | היסטוריית אשראי: ${creditLabel}.
המכתב צריך: פנייה רשמית, פרטי התיק בטבלה, 3 נקודות חוזק, בקשה לאישור עקרוני.
ענה בעברית בלבד, פורמט מכתב עסקי מלא.`;

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
      
      // בניית פרטי לווים נוספים לשמירה
      const additionalBorrowersData = borrowers.slice(1).map(b => ({
        fullName: `${b.firstName || ''} ${b.lastName || ''}`.trim(),
        idNumber: b.idNumber || '',
        phone: b.phone || '',
        isSpouse: b.isSpouse || false,
      })).filter(b => b.fullName || b.idNumber);

      const lead = await base44.entities.Lead.create({
        fullName,
        phone: formData.phone,
        email: formData.email,
        idNumber: formData.idNumber,
        birthDate: formData.birthDate,
        age: formData.age ? Number(formData.age) : undefined,
        mortgageType: formData.mortgageType,
        loanDuration: isRefinance ? results.remainingYears : (formData.loanDuration ? Number(formData.loanDuration) : undefined),
        loanAmount: isRefinance ? results.balance : results.loanAmount,
        propertyPrice: isRefinance ? undefined : (formData.propertyPrice ? Number(String(formData.propertyPrice).replace(/,/g,'')) : undefined),
        equity: isRefinance ? undefined : (formData.equity ? Number(String(formData.equity).replace(/,/g,'')) : undefined),
        monthlyDebts: formData.monthlyDebts ? Number(String(formData.monthlyDebts).replace(/,/g,'')) : 0,
        ltv: isRefinance ? 0 : results.ltv,
        score: results.score,
        aiAnalysis: analysis,
        netIncome: getTotalIncome(),
        // שדות מחזור
        ...(isRefinance ? {
          refinanceBalance: results.balance,
          currentMonthlyPayment: results.currentMonthly,
          refinanceRemainingYears: results.remainingYears,
        } : {}),
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
          <a href={createPageUrl('AdminDashboard')} className="hidden sm:block text-[#1e3a5f] border-2 border-[#1e3a5f]/30 px-4 py-2 rounded-full font-bold text-xs hover:bg-[#1e3a5f] hover:text-white transition-all">
            פאנל ניהול
          </a>
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
                    {step === 5 && <Coins size={18} className="text-white" />}
                    {step === 6 && <Building2 size={18} className="text-white" />}
                  </div>
                  <div>
                    <h2 className="text-base sm:text-xl font-bold text-white leading-none">
                      {step === 1 && !otpSent && "בואו נכיר"}
                      {step === 1 && otpSent && "אימות זהות"}
                      {step === 2 && "פרופיל אישי"}
                      {step === 3 && "הנכס שלכם"}
                      {step === 4 && "מצב כלכלי"}
                      {step === 5 && "הון עצמי והשלמת עסקה"}
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
                  
                  {/* תאריך לידה - 3 שדות נפרדים */}
                  <BirthDateInput
                    value={formData.birthDate || ''}
                    onChange={(val) => handleInputChange('birthDate', val)}
                    error={fieldErrors.birthDate}
                  />

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

              {/* מודל תזכורת למלא פרטי בן/בת זוג */}
              {showSpouseReminderModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowSpouseReminderModal(false)}>
                  <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 border-4 border-[#c9a961] text-right animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-5">
                      <button onClick={() => setShowSpouseReminderModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                      <h3 className="text-xl font-black text-[#1e3a5f]">שכחת למלא פרטי בן/בת זוג</h3>
                    </div>
                    <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 mb-6 text-center">
                      <div className="text-4xl mb-3">👫</div>
                      <p className="text-amber-800 font-bold text-sm leading-relaxed">
                        זיהינו שאתה נשוי/אה — הוספנו לווה ב' (בן/בת זוג) אוטומטית.
                      </p>
                      <p className="text-amber-700 text-xs mt-2 leading-relaxed">
                        כדי לקבל חישוב מדויק, יש להזין את פרטי ההכנסה של בן/בת הזוג. זה יכול להגדיל משמעותית את סכום המשכנתא המאושרת.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          setShowSpouseReminderModal(false);
                          setActiveBorrowerTab(1);
                        }}
                        className="py-3 px-4 rounded-2xl bg-[#1e3a5f] text-white font-black text-sm hover:bg-[#152d47] transition-all"
                      >
                        למלא פרטים →
                      </button>
                      <button
                        onClick={() => {
                          setShowSpouseReminderModal(false);
                          setStep(s => s + 1);
                        }}
                        className="py-3 px-4 rounded-2xl border-2 border-gray-300 font-bold text-sm text-gray-600 hover:bg-gray-50 transition-all"
                      >
                        המשך בלי זה
                      </button>
                    </div>
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
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-800 font-bold text-center">
                    מצב הדגמה — הקוד הוא <span className="text-[#1e3a5f] text-base">0000</span>
                  </div>
                  <PremiumInput label="הזן קוד" name="otp" value={userInputOtp} onChange={(n, v) => setUserInputOtp(v)} placeholder="0000" icon={Key} error={fieldErrors.otp} />
                </div>
              )}

              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                  {/* טאבים לווים */}
                  <div className="flex gap-2 mb-5 flex-wrap">
                    {borrowers.map((b, idx) => {
                      const bIncome = Object.values(b.incomeSources || {}).reduce((acc, src) => {
                        return acc + (src?.amount ? Number(String(src.amount).replace(/,/g,'')) : 0);
                      }, 0);
                      const needsAttention = idx > 0 && bIncome === 0;
                      return (
                      <button
                        key={idx}
                        onClick={() => setActiveBorrowerTab(idx)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-sm transition-all border-2 ${activeBorrowerTab === idx ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : needsAttention ? 'bg-amber-50 text-amber-700 border-amber-400 animate-pulse' : 'bg-white text-[#1e3a5f] border-[#1e3a5f]/30 hover:border-[#1e3a5f]'}`}
                      >
                        <User size={14} />
                        לווה {['א', 'ב', 'ג', 'ד', 'ה'][idx] || (idx + 1)}
                        {needsAttention && <span className="text-amber-500 text-xs font-black">!</span>}
                        {idx > 0 && (
                          <span
                            onClick={e => { e.stopPropagation(); removeBorrower(idx); }}
                            className="mr-1 text-red-400 hover:text-red-600 font-black cursor-pointer"
                          >×</span>
                        )}
                      </button>
                      );
                    })}
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
                    onMaritalChange={activeBorrowerTab === 0 ? handleMaritalChange : undefined}
                  />
                </div>
              )}

              {step === 3 && (
                <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                  <PremiumInput label="סוג ומטרת המשכנתא" name="mortgageType" value={formData.mortgageType} icon={Target} onChange={handleInputChange} 
                    options={[
                    {val:'purchase_first', label:'רכישה - דירה ראשונה (עד 75%)'},
                    {val:'purchase_improve', label:'רכישה - משפרי דיור / חליפית (עד 70%)'},
                    {val:'purchase_additional', label:'רכישה - נכס נוסף / דירה להשקעה (עד 50%)'},
                    {val:'refinance', label:'מחזור משכנתא (שיפור תנאים)'},
                    {val:'any_purpose', label:'כל מטרה - סגירת חובות/שיפוץ (עד 50%)'},
                    {val:'reverse_mortgage', label:'משכנתא הפוכה (Reverse Mortgage)'},
                    {val:'senior_bank', label:'משכנתא בנקאית לגיל הזהב – כל מטרה (45% LTV | עד 30 שנה)'}
                    ]} 
                    tooltip="מטרת המשכנתא קובעת את אחוז המימון המקסימלי ותנאי ההלוואה" />
                  
                  {isRefinance && (
                    <div className="animate-in fade-in duration-300">
                      <div className="mb-5 p-4 bg-blue-50 border-2 border-blue-400 rounded-2xl">
                        <p className="text-blue-900 font-black text-sm">מחזור משכנתא — שיפור תנאים</p>
                        <p className="text-blue-700 text-xs mt-1 leading-relaxed">נחשב כמה תחסכו על המשכנתא הקיימת שלכם ונציג 3 תמהילים חדשים.</p>
                      </div>
                      <PremiumInput label="יתרת משכנתא קיימת" name="refinanceBalance" value={formData.refinanceBalance} placeholder="כמה נשאר לשלם?" icon={Coins} onChange={handleInputChange} error={fieldErrors.refinanceBalance} tooltip="הסכום שנשאר לכם לשלם על המשכנתא הנוכחית" />
                      <PremiumInput label="החזר חודשי נוכחי" name="currentMonthlyPayment" value={formData.currentMonthlyPayment} placeholder="כמה משלמים היום?" icon={TrendingDown} onChange={handleInputChange} error={fieldErrors.currentMonthlyPayment} tooltip="הסכום שאתם משלמים כרגע כל חודש" />
                      <PremiumInput label="תקופה שנשארה (שנים)" name="refinanceRemainingYears" value={formData.refinanceRemainingYears} type="range" min={1} max={30} icon={Building2} onChange={handleInputChange} tooltip="כמה שנים נשארו במשכנתא הנוכחית" />
                      <PremiumInput label="האם תוכלו להגדיל את ההחזר החודשי?" name="refinanceCanIncreasePayment" value={formData.refinanceCanIncreasePayment} icon={Target} onChange={handleInputChange}
                        options={[
                          {val:'no', label:'לא — נשאר על אותו החזר חודשי'},
                          {val:'yes', label:'כן — אני יכול לשלם יותר בחודש'},
                        ]} />
                      {formData.refinanceCanIncreasePayment === 'yes' && (
                        <PremiumInput label="בכמה תוכלו להגדיל? (₪ לחודש)" name="refinanceIncreaseAmount" value={formData.refinanceIncreaseAmount} placeholder="לדוגמה: 500 או 1000" icon={Coins} onChange={handleInputChange} tooltip="הגדלת ההחזר מקצרת את התקופה וחוסכת ריבית רבה" />
                      )}
                    </div>
                  )}

                  {isReverseMortgage && (
                    <div className="mb-5 p-4 bg-amber-50 border-2 border-amber-400 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                      <p className="text-amber-800 font-bold text-sm">משכנתא הפוכה</p>
                      <p className="text-amber-700 text-xs mt-1 leading-relaxed">ללא החזר חודשי חובה. הסכום נפרע מהנכס בסיום. אחוז המימון נקבע לפי גיל הלווה הצעיר ביותר.</p>
                    </div>
                  )}

                  {formData.mortgageType === 'purchase_additional' && (
                    <div className="mb-5 p-4 bg-orange-50 border-2 border-orange-400 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                      <p className="text-orange-900 font-black text-sm mb-2">⚠️ נכס נוסף / דירה להשקעה — 50% מימון בלבד</p>
                      <ul className="text-orange-800 text-xs space-y-1 list-none">
                        <li>• לפי תקנות בנק ישראל — מקסימום 50% LTV על נכס שאינו יחיד</li>
                        <li>• <strong>מס רכישה: 8% על הנכס הנוסף</strong> (יש לקחת בחשבון בהון העצמי)</li>
                        <li>• מס שבח ישולם בעת מכירה עתידית</li>
                        <li>• מומלץ להתייעץ עם עורך דין נדל"ן לפני הרכישה</li>
                      </ul>
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

                  {!isRefinance && (
                    <>
                      <PremiumInput label="שווי הנכס המשוער" name="propertyPrice" value={formData.propertyPrice} placeholder="שווי שוק מוערך" icon={Home} onChange={handleInputChange} error={fieldErrors.propertyPrice} tooltip="שווי הנכס על פי הערכה או חוזה רכישה" />
                      <PremiumInput label="סכום מבוקש" name="loanAmount" value={formData.loanAmount} placeholder="כמה כסף אתם צריכים?" icon={Coins} onChange={handleInputChange} error={fieldErrors.loanAmount} tooltip="הסכום שברצונכם לקבל כמשכנתא" />
                    </>
                  )}

                  {/* נתוני נכסים קיימים — רק למשפרי דיור / נכס נוסף / כל מטרה */}
                  {needsExistingProperty && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="h-px flex-1 bg-[#1e3a5f]/20" />
                        <span className="text-xs font-bold text-[#1e3a5f] px-3 py-1 bg-[#1e3a5f]/5 rounded-full">
                          נכסים קיימים בבעלותך ({existingProperties.length})
                        </span>
                        <div className="h-px flex-1 bg-[#1e3a5f]/20" />
                      </div>

                      {existingProperties.map((prop, idx) => (
                        <div key={idx} className="mb-6">
                          {existingProperties.length > 1 && (
                            <div className="flex items-center justify-between mb-3">
                              <button
                                onClick={() => removeExistingProperty(idx)}
                                className="flex items-center gap-1 text-red-500 hover:text-red-700 text-xs font-bold"
                              >
                                <Trash2 size={13} /> הסר נכס
                              </button>
                              <span className="text-sm font-black text-[#1e3a5f]">נכס קיים #{idx + 1}</span>
                            </div>
                          )}
                          <ExistingPropertyForm
                            data={prop}
                            onChange={(val) => updateExistingProperty(idx, val)}
                            errors={fieldErrors}
                          />
                          {idx < existingProperties.length - 1 && (
                            <div className="mt-4 border-t-2 border-dashed border-[#1e3a5f]/20" />
                          )}
                        </div>
                      ))}

                      {existingProperties.length < 5 && (
                        <button
                          onClick={addExistingProperty}
                          className="w-full mt-2 py-3 rounded-2xl border-2 border-dashed border-[#c9a961] text-[#c9a961] font-bold text-sm hover:bg-[#c9a961]/10 transition-all flex items-center justify-center gap-2"
                        >
                          <Building2 size={15} /> + הוסף נכס קיים נוסף
                        </button>
                      )}
                    </div>
                  )}
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
                      const isSpouse = b.isSpouse === true;
                      const factor = idx > 0 && b.borrowerType === 'additional' && !isSpouse ? 0.5 : 1;
                      const totalB = Object.values(sources).reduce((acc, src) => {
                        if (!src || (!src.amount && !src.enabled)) return acc;
                        return acc + Number(String(src.amount || '0').replace(/,/g, ''));
                      }, 0);
                      return (
                        <div key={idx} className="flex justify-between items-center py-1.5 border-b border-gray-200 last:border-0 text-sm">
                          <span className="text-gray-600 font-medium">
                            לווה {['א','ב','ג','ד','ה'][idx] || idx+1}
                            {isSpouse ? <span className="text-green-600 text-xs"> (בן/בת זוג - 100%)</span> : idx > 0 && b.borrowerType === 'additional' ? <span className="text-amber-600 text-xs"> (נוסף - 50%)</span> : ''}
                          </span>
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

                  {/* אזהרה כשיש משכנתאות קיימות בלי הסכם מכירה */}
                  {needsExistingProperty && totalExistingMortgagePayments > 0 && (
                    <div className="mt-3 p-4 bg-red-50 border-2 border-red-400 rounded-2xl animate-in fade-in duration-300">
                      <div className="flex items-start gap-3">
                        <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-black text-red-700 text-sm">⚠️ משכנתאות קיימות יחושבו ב-DTI שלך!</p>
                          <p className="text-xs text-red-600 mt-1 leading-relaxed">
                            הבנק יוסיף סה"כ ₪{totalExistingMortgagePayments.toLocaleString()} לחודש לחישוב יחס ההחזר שלך.
                            כדי לנטרל זאת — יש להציג <strong>הסכם מכירה חתום</strong> על הנכסים הרלוונטיים.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 5 && (
                <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                  {!isReverseMortgage && !isRefinance && (
                    <EquityCompletionForm
                      data={{ ...equityCompletion, equity: equityCompletion.equity || formData.equity }}
                      onChange={(d) => {
                        setEquityCompletion(d);
                        if (d.equity !== undefined) handleInputChange('equity', d.equity);
                      }}
                      errors={fieldErrors}
                      gap={equityGap}
                    />
                  )}
                  {isRefinance && (
                    <div className="p-6 bg-blue-50 border-2 border-blue-400 rounded-2xl text-right">
                      <p className="text-blue-900 font-black text-base mb-3">📋 מסמכים נדרשים למחזור</p>
                      <ul className="text-blue-800 text-sm space-y-2">
                        <li>• תעודת זהות + ספח מעודכן (לכל לווה)</li>
                        <li>• יתרת סילוק משכנתא מהבנק (מסמך רשמי)</li>
                        <li>• 3 תלושי שכר אחרונים (לכל לווה שכיר)</li>
                        <li>• דפי בנק 3 חודשים אחרונים</li>
                        <li>• נסח טאבו מעודכן</li>
                        <li>• אישור BDI / דוח נתוני אשראי</li>
                      </ul>
                      <p className="text-blue-600 text-xs mt-3 font-bold">* המסמכים יוגשו לאחר הפגישה עם יועץ מיקוד</p>
                    </div>
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

              {step === 6 && !isRefinance && (
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
                  onClick={() => { if(step === 1 && otpSent) setOtpSent(false); else if(step > 1) setStep(s => s - 1); }} 
                  className="flex-1 h-14 rounded-full font-bold text-base text-gray-600 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all active:scale-95 text-center group"
                >
                  <span className="group-hover:-translate-x-1 inline-block transition-transform">← חזור</span>
                </button>
              )}
              <button 
                onClick={() => {
                  if (step === 1 && !otpSent) startVerification();
                  else if (step === 1 && otpSent) verifyOtp();
                  else if (validateStep(step)) {
                    // אם בשלב 2 ויש לווה ב' (בן/בת זוג) שלא מילא הכנסות - הזכר למלא
                    if (step === 2 && borrowers.length > 1) {
                      const spouseBorrower = borrowers[1];
                      const spouseIncome = Object.values(spouseBorrower.incomeSources || {}).reduce((acc, src) => {
                        if (src?.amount) return acc + Number(String(src.amount).replace(/,/g,''));
                        if (src?.enabled && src?.amount) return acc + Number(String(src.amount).replace(/,/g,''));
                        return acc;
                      }, 0);
                      if (spouseIncome === 0 && activeBorrowerTab === 0) {
                        setShowSpouseReminderModal(true);
                        return;
                      }
                    }
                    // מחזור: דלג על שלב 5 (הון עצמי) ושלב 6 (תקופה) — לא רלוונטיים
                    if (isRefinance && step === 4) { generateFullAnalysis(); scrollToTop(); }
                    else if (step === 6) { generateFullAnalysis(); scrollToTop(); }
                    else { setStep(s => s + 1); }
                  }
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

              {/* באנר פער מימון — מוצג כשהסכום המבוקש עולה על המקסימום */}
              {!isRefinance && results.excessAmount > 0 && (
                <div className="mb-6 p-5 rounded-2xl border-2 border-amber-400 bg-amber-50 text-right animate-in slide-in-from-top-4 duration-500">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl flex-shrink-0">⚠️</div>
                    <div>
                      <p className="font-black text-amber-900 text-base mb-1">
                        הבנק יאשר עד ₪{formatCurrency(results.loanAmount)} — לא את הסכום המבוקש
                      </p>
                      <p className="text-amber-800 text-sm font-bold leading-relaxed mb-3">
                        ביקשת ₪{formatCurrency(results.requestedLoanAmount)}, אך לפי תקנות בנק ישראל ניתן לקבל עד{" "}
                        ₪{formatCurrency(results.loanAmount)}.<br/>
                        <span className="text-amber-900">פער של ₪{formatCurrency(results.excessAmount)} לא מכוסה על ידי הבנק.</span>
                      </p>
                      <div className="bg-amber-100 border border-amber-300 rounded-xl p-4 space-y-1">
                        <p className="font-black text-amber-900 text-sm mb-2">אפשרויות לכיסוי הפער:</p>
                        <p className="text-amber-800 text-xs">🏦 מימון חוץ-בנקאי — ריביות 8%–18%, ללא הגבלת LTV</p>
                        <p className="text-amber-800 text-xs">📈 מימון עד 85% — בתנאים מיוחדים, ריביות גבוהות יותר</p>
                        <p className="text-amber-800 text-xs">💰 הגדלת הון עצמי — מחסכונות, קרן השתלמות או עזרת משפחה</p>
                        <p className="text-red-700 text-xs font-bold mt-2">⚡ מומלץ להתייעץ עם יועץ לפני התחייבות לכל מסלול חוץ-בנקאי.</p>
                      </div>
                      <p className="text-amber-700 text-xs mt-3 italic">* הניתוח הבא מתבצע על הסכום הבנקאי המאושר: ₪{formatCurrency(results.loanAmount)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* תעודת כשירות / תוצאת מחזור */}
              {isRefinance ? (
                <div className="mb-8 sm:mb-12">
                  {/* כרטיס חיסכון ראשי */}
                  <div className={`p-6 sm:p-10 rounded-2xl sm:rounded-3xl border-2 text-center relative overflow-hidden mb-6 ${results.isWorthwhile ? 'border-green-400/40 bg-gradient-to-br from-green-50 to-emerald-50' : 'border-amber-400/40 bg-gradient-to-br from-amber-50 to-orange-50'}`}>
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#1e3a5f] via-[#c9a961] to-[#1e3a5f]" />
                    <div className="flex justify-center mb-4">
                      {results.isWorthwhile ? <BadgeCheck size={56} className="text-green-600" /> : <ShieldAlert size={56} className="text-amber-500" />}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-[#1e3a5f] mb-2">
                      {results.isWorthwhile ? 'כדאי למחזר!' : 'כדאיות נמוכה'}
                    </h2>
                    <p className="text-gray-600 font-bold text-sm mb-6">
                      {results.isWorthwhile ? `חיסכון צפוי של ₪${formatCurrency(results.totalSaving)} לאורך כל התקופה` : 'החיסכון הצפוי נמוך יחסית לעלויות המחזור'}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div className="bg-white/70 p-4 rounded-xl border border-gray-200">
                        <p className="text-xs text-gray-500 font-semibold mb-1">חיסכון חודשי</p>
                        <p className={`text-2xl font-black ${results.monthlySaving > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {results.monthlySaving > 0 ? '+' : ''}₪{formatCurrency(Math.abs(results.monthlySaving))}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">לחודש</p>
                      </div>
                      <div className="bg-white/70 p-4 rounded-xl border border-gray-200">
                        <p className="text-xs text-gray-500 font-semibold mb-1">חיסכון כולל</p>
                        <p className={`text-2xl font-black ${results.totalSaving > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          ₪{formatCurrency(Math.abs(results.totalSaving))}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">סה"כ לאורך התקופה</p>
                      </div>
                      <div className="bg-white/70 p-4 rounded-xl border border-gray-200">
                        <p className="text-xs text-gray-500 font-semibold mb-1">break-even</p>
                        <p className="text-2xl font-black text-[#1e3a5f]">
                          {results.breakEvenMonths ? `${results.breakEvenMonths} חודש` : '—'}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">עד שהמחזור משתלם</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 mt-2 font-bold italic">
                      * על בסיס יתרה ₪{formatCurrency(results.balance)} | החזר נוכחי ₪{formatCurrency(results.currentMonthly)} | ריבית משוערת {results.impliedRate?.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ) : (
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
                    {(() => {
                       const isFirst = formData.mortgageType === 'purchase_first';
                       const isImprove = formData.mortgageType === 'purchase_improve';
                       const isAdditional = formData.mortgageType === 'purchase_additional';
                       const isAnyPurpose = formData.mortgageType === 'any_purpose';
                       const maxLTV = results.isReverse ? getReverseMortgageMaxLTV(formData.youngestBorrowerAge || formData.age) : results.isSenior ? SENIOR_BANK_MAX_LTV : isFirst ? 75 : isImprove ? 70 : isAdditional || isAnyPurpose ? 50 : 75;
                      return (
                        <>
                          <p className={`text-2xl font-black ${results.ltv > maxLTV ? 'text-red-600' : results.ltv > maxLTV * 0.93 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {results.ltv.toFixed(1)}%
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1">תקרה: עד {maxLTV}%</p>
                        </>
                      );
                    })()}
                  </div>
                  
                  <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-gray-200">
                    <p className="text-xs text-gray-500 font-semibold mb-1">ציון כשירות</p>
                    <p className={`text-2xl font-black ${results.score >= 80 ? 'text-green-600' : results.score >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>{results.score}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{results.score >= 80 ? 'כשיר מצוין' : results.score >= 60 ? 'כשיר טוב' : 'דורש שיפור'}</p>
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
              )}
              
              {/* כרטיס תשלום מינימלי + הכנסה נדרשת */}
              {!isRefinance && results.minMix && (
                <div className="mb-6 sm:mb-8 p-5 sm:p-7 rounded-2xl border-2 border-emerald-500 bg-white text-right animate-in slide-in-from-bottom-4 duration-500" style={{boxShadow: '0 4px 20px rgba(16,185,129,0.15)'}}>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingDown size={18} className="text-emerald-600" />
                    <h3 className="text-base font-black text-emerald-800">תשלום מינימלי אפשרי + הכנסה נדרשת</h3>
                  </div>
                  <p className="text-emerald-700 text-xs mb-4 leading-relaxed font-medium">
                    תמהיל: ⅓ קבועה צמודה + ⅔ משתנה צמודה | תקופה מקסימלית: {results.minMix.term} שנים
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="bg-emerald-50 rounded-xl p-4 text-center border-2 border-emerald-200">
                      <p className="text-emerald-700 text-xs font-semibold mb-1">תשלום חודשי מינימלי</p>
                      <p className="text-3xl font-black text-emerald-700">₪{formatCurrency(Math.floor(results.minMix.minMonthlyPayment))}</p>
                      <p className="text-emerald-500 text-[10px] mt-1">לחודש (DTI 40%)</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4 text-center border-2 border-blue-200">
                      <p className="text-blue-700 text-xs font-semibold mb-1">הכנסה נדרשת לאישור</p>
                      <p className="text-3xl font-black text-blue-700">₪{formatCurrency(Math.floor(results.minMix.requiredIncome))}</p>
                      <p className="text-blue-500 text-[10px] mt-1">נטו לחודש (תשלום / 40%)</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    {results.minMix.tracks.map((t, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200">
                        <span className="text-gray-700 text-xs font-bold">{t.name}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-gray-500 text-[10px]">{(t.rate * 100).toFixed(2)}% | {t.years} שנ'</span>
                          <span className="text-emerald-700 font-black text-sm">₪{formatCurrency(Math.floor(t.pmt))}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {results.totalIncome > 0 && (
                    <div className={`rounded-xl p-3 border-2 text-center ${
                      results.totalIncome >= results.minMix.requiredIncome
                        ? 'border-emerald-400 bg-emerald-50'
                        : 'border-red-400 bg-red-50'
                    }`}>
                      <p className="text-xs font-bold text-gray-600 mb-1">הכנסה נוכחית מול נדרשת</p>
                      <p className={`text-base font-black ${
                        results.totalIncome >= results.minMix.requiredIncome ? 'text-emerald-700' : 'text-red-600'
                      }`}>
                        ₪{formatCurrency(Math.floor(results.totalIncome))} {results.totalIncome >= results.minMix.requiredIncome ? '✓ עומד בדרישה' : '✗ לא עומד — חסר ₪' + formatCurrency(Math.floor(results.minMix.requiredIncome - results.totalIncome))}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-10 text-right">
                <div className="p-5 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl bg-[#1e3a5f] text-white">
                  <span className="font-semibold text-[10px] sm:text-xs uppercase tracking-wide text-[#c9a961]">{isRefinance ? 'יתרת משכנתא קיימת' : 'סכום משכנתא מבוקש'}</span>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold mt-2 sm:mt-3 leading-none break-all">₪{formatCurrency(isRefinance ? results.balance : results.loanAmount)}</div>
                  <div className="mt-2 sm:mt-3 font-medium text-xs sm:text-sm text-gray-300">{isRefinance ? `ריבית קיימת משוערת: ${results.impliedRate?.toFixed(2)}%` : `${results.ltv.toFixed(1)}% מימון מהנכס`}</div>
                </div>
                <div className={`p-5 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border-2 ${!isRefinance && results.dti > 40 ? 'bg-red-50 border-red-500' : 'bg-gradient-to-br from-[#f8f6f0] to-[#f0ede4] border-[#c9a961]/20'}`}>
                  <span className="font-semibold text-[10px] sm:text-xs uppercase tracking-wide text-[#8b7e5c]">{isRefinance ? 'החזר חודשי חדש' : 'החזר חודשי משוער'}</span>
                  <div className={`text-2xl sm:text-3xl md:text-4xl font-bold mt-2 sm:mt-3 leading-none ${!isRefinance && results.dti > 40 ? 'text-red-600' : 'text-[#1e3a5f]'}`}>₪{formatCurrency(Math.floor(results.mixB.total))}</div>
                  <div className="mt-2 sm:mt-3 font-medium text-xs sm:text-sm text-gray-600">{isRefinance ? `חיסכון: ₪${formatCurrency(results.monthlySaving)} לחודש` : results.isBalloon ? 'בלון — ריבית בלבד' : !isRefinance && results.dti > 40 ? <span className="text-red-600 font-bold">⚠️ חורג מכושר ההחזר ({results.dti.toFixed(1)}%)</span> : 'תמהיל מאוזן מומלץ'}</div>
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
                <div className="text-gray-700 text-sm sm:text-base leading-relaxed font-normal">
                  {loading ? (
                    <div className="flex items-center gap-3 italic text-base sm:text-lg text-right">
                      <Loader2 size={18} className="sm:w-5 sm:h-5 animate-spin text-blue-600" /> המערכת מנתחת את התיק שלכם...
                    </div>
                  ) : aiAnalysis ? (
                    <FormattedAnalysis text={aiAnalysis} />
                  ) : null}
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

              <div className={`mb-6 sm:mb-10 transition-all duration-1000 ${!isPurchased ? 'blur-sm opacity-50 pointer-events-none select-none' : ''}`}>
                <MixComparison
                  mixA={results.mixA}
                  mixB={results.mixB}
                  mixC={results.mixC}
                  loanAmount={isRefinance ? results.balance : results.loanAmount}
                  durationYears={isRefinance ? results.mixC_duration : results.actualDuration}
                  isRefinance={isRefinance}
                  isPurchased={isPurchased}
                  isDeclarationApprovalPossible={results.isDeclarationApprovalPossible}
                  minMix={results.minMix}
                  totalIncome={results.totalIncome}
                  aiTip={aiAnalysis ? `על בסיס הניתוח המלא — ${isRefinance ? `חיסכון צפוי של ₪${new Intl.NumberFormat('he-IL').format(results.monthlySaving || 0)} לחודש` : `ציון התיק שלך: ${results.score}/100. התמהיל האסטרטגי מחושב לפי פרופיל הגיל, ה-DTI וה-LTV שלך.`}` : null}
                />
              </div>



              {isPurchased && (
                <div className="mt-8 sm:mt-12">
                  <NegotiationPack 
                    formData={{ ...formData, completionAmount: equityCompletion.completionAmount, completionSources: equityCompletion.completionSources }} 
                    results={{ ...results, aiAnalysis }}
                    selectedMix={results.mixB}
                    fullName={fullName}
                    borrowers={borrowers}
                  />
                </div>
              )}

              {/* כפתור התחלה מחדש */}
              <div className="px-4 sm:px-8 md:px-12 pb-6 flex justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2 px-8 py-3 rounded-full border-2 border-[#1e3a5f] text-[#1e3a5f] font-bold text-sm hover:bg-[#1e3a5f] hover:text-white transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                  בדיקה נוספת / לקוח חדש
                </button>
              </div>

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

      <MikoChat formData={formData} results={results} isPurchased={isPurchased} isOpen={isChatOpen} setIsOpen={setIsChatOpen} rates={rates} />

      {/* סקשנים תחתונים — מוצגים רק בשלב 1 לפני מילוי */}
      {step === 1 && !otpSent && (
        <>
          <HowItWorks />
          <SocialProof />
        </>
      )}

      <FooterCTA />
    </div>
  );
}