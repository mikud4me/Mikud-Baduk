import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import MikoAvatar from './MikoAvatar';
import { base44 } from '@/api/base44Client';

export default function MikoChat({ formData, results, isPurchased, isOpen, setIsOpen }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput("");
    
    const isGreeting = /(שלום|היי|הלו|בוקר טוב|אהלן|מי זה|מי אתה|מה שלומך)/i.test(userMsg);
    const isThanks = /(תודה|ביי|להתראות|סיימתי|שיהיה בהצלחה)/i.test(userMsg);
    const aboutMikud = /(מיקוד משכנתאות|מיקוד|החברה|על החברה|מי אתם|מה אתם עושים)/i.test(userMsg);

    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    // ברכת פתיחה
    if (isGreeting && messages.length <= 1) {
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'ai', 
          text: `שלום וברוכים הבאים! 🎯 אני מיקו, העוזר הדיגיטלי החכם של מיקוד משכנתאות - החברה המובילה בארץ לייעוץ משכנתאות מקצועי. ${isPurchased ? 'אני מכיר לעומק את התיק שלך ואשמח לעזור בכל שאלה!' : 'אשמח לענות על שאלות כלליות על משכנתאות. לניתוח מלא של התיק האישי שלך, מומלץ לרכוש את הדוח המקצועי.'} איך אוכל לסייע?` 
        }]);
        setLoading(false);
      }, 600);
      return;
    }

    // מידע על מיקוד משכנתאות
    if (aboutMikud) {
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'ai', 
          text: `מיקוד משכנתאות היא החברה המובילה בישראל לייעוץ משכנתאות מקצועי! 🎯 המטרה שלנו - החיסכון הגדול שלכם. אנחנו מתמחים בבניית תמהילי משכנתא אופטימליים, משא ומתן מול הבנקים, וליווי מלא עד לאישור סופי. הצלחנו לחסוך ללקוחותינו ממוצע של ₪150,000 לכל תיק! רוצה לדבר עם יועץ אנושי? חייג 2324*` 
        }]);
        setLoading(false);
      }, 700);
      return;
    }

    // פרידה
    if (isThanks) {
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'ai', 
          text: "תודה רבה שבחרת במיקוד משכנתאות! 🙏 אנחנו כאן בשבילך תמיד. המטרה שלנו - החיסכון שלכם! שיהיה בהצלחה והמון ברכה בדרך לבית החדש 🏡✨" 
        }]);
        setLoading(false);
      }, 500);
      return;
    }

    // לקוח שלא רכש - ייעוץ מוגבל
    if (!isPurchased) {
      const context = `לקוח טרם רכש דוח מלא. נתוני בסיס: נכס ${formData.propertyPrice || 0}₪, הון עצמי ${formData.equity || 0}₪, הכנסה ${formData.netIncome || 0}₪.`;
      try {
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `אתה מיקו מומחה משכנתאות של מיקוד משכנתאות. ${context} שאלת לקוח: "${userMsg}". תן תשובה כללית מועילה (עד 3 משפטים), הפנה לרכישת דוח מלא לניתוח מדויק, ולייעוץ אישי ב-2324*.`,
          add_context_from_internet: true
        });
        const reply = response?.output || response || "אשמח לעזור! לניתוח מדויק של התיק שלך מומלץ לרכוש את הדוח המלא או לדבר עם יועץ ב-2324*.";
        setMessages(prev => [...prev, { role: 'ai', text: reply.replace(/[*#]/g, '').trim() }]);
      } catch (e) {
        setMessages(prev => [...prev, { role: 'ai', text: "לניתוח מדויק של התיק שלך מומלץ לרכוש את הדוח המקצועי או לחייג ליועץ אנושי ב-2324*" }]);
      } finally { 
        setLoading(false); 
      }
      return;
    }

    // לקוח שרכש - ניתוח מלא
    const fullContext = `תיק מלא: משכנתא ${results?.loanAmount}₪ (${results?.ltv?.toFixed(1)}% מימון), הכנסה כוללת ${results?.totalIncome}₪, DTI ${results?.dti?.toFixed(1)}%, תקופה ${results?.actualDuration} שנים. תמהיל A: קבועה 100%, תמהיל B (מומלץ): 33% פריים + 33% קבועה + 34% משתנה צמודה, תמהיל C: 50% פריים + 50% קבועה. החזר חודשי תמהיל B: ₪${Math.floor(results?.mixB?.total || 0)}.`;
    
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `אתה מיקו, מומחה משכנתאות AI של מיקוד משכנתאות - החברה המובילה בארץ. ${fullContext} שאלת לקוח: "${userMsg}". תן ייעוץ ממוקד ומקצועי (2-4 משפטים), התייחס לנתונים הספציפיים שלו, המלץ על התמהיל המתאים ביותר, והסבר למה. אם צריך מידע חיצוני השתמש בו. סיים בעידוד ליצור קשר עם יועץ אנושי ב-2324* להמשך.`,
        add_context_from_internet: true
      });
      
      const reply = response?.output || response || "בהתבסס על התיק שלך, אני ממליץ על תמהיל B המאוזן. לדיון מעמיק צור קשר עם יועץ ב-2324*.";
      setMessages(prev => [...prev, { role: 'ai', text: reply.replace(/[*#]/g, '').trim() }]);
    } catch (e) {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: "בהתבסס על התיק שלך, התמהיל המומלץ מאוזן ומגונן. ליווי מלא ומשא ומתן מול הבנקים - חייג 2324* 🎯" 
      }]);
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); 
  }, [messages]);

  return (
    <div className="fixed bottom-4 left-4 z-[300] flex flex-col items-start" dir="rtl">
      {isOpen && (
        <div className="bg-gradient-to-br from-white via-slate-50 to-white w-[80vw] sm:w-[320px] h-[420px] mb-3 rounded-2xl shadow-2xl border-2 border-[#d4af37]/30 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 backdrop-blur-xl">
          <div className="bg-gradient-to-r from-[#001a33] to-[#003d66] p-4 text-white flex justify-between items-center shadow-xl">
            <div className="flex items-center gap-3 font-bold">
              <MikoAvatar className="w-12 h-12 ring-2 ring-[#d4af37]" />
              <div>
                <span className="text-base block">מיקו AI</span>
                <span className="text-xs text-[#d4af37] block">המומחה הדיגיטלי שלך</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:text-[#d4af37] transition-colors p-2 hover:bg-white/10 rounded-xl">
              <X size={22}/>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-br from-slate-50 to-white">
            {messages.length === 0 && (
              <div className="text-center mt-12">
                <div className="bg-gradient-to-r from-[#d4af37]/10 to-[#f4d03f]/10 border-2 border-[#d4af37]/20 rounded-2xl p-6">
                  <p className="text-slate-600 text-sm font-bold leading-relaxed">
                    👋 שלום! אני מיקו, המומחה הדיגיטלי שלך.<br/>
                    כיצד אוכל לסייע לך היום?
                  </p>
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'} animate-in slide-in-from-bottom-2`}>
                <div className={`p-4 rounded-2xl max-w-[85%] text-sm shadow-lg ${
                  m.role === 'user' 
                    ? 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-800 rounded-br-none border-2 border-slate-300' 
                    : 'bg-gradient-to-r from-[#001a33] to-[#003d66] text-white rounded-bl-none border-2 border-[#d4af37]/30'
                } font-medium leading-relaxed`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-center">
                <Loader2 size={16} className="animate-spin text-[#d4af37]" />
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          
          <div className="p-4 bg-gradient-to-r from-slate-50 to-white border-t-2 border-slate-200 flex gap-3">
            <input 
              className="flex-1 bg-white border-2 border-slate-200 focus:border-[#d4af37] rounded-2xl px-5 py-3 text-sm outline-none text-right font-medium shadow-sm transition-all" 
              placeholder="שאל את מיקו כל שאלה..." 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleSend()} 
            />
            <button 
              onClick={handleSend} 
              className="bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#001a33] p-3 rounded-2xl active:scale-95 transition-all shadow-lg hover:shadow-xl"
            >
              <Send size={18}/>
            </button>
          </div>
        </div>
      )}
      
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-16 h-16 sm:w-20 sm:h-20 shadow-2xl hover:scale-110 transition-all rounded-full overflow-hidden border-4 border-[#d4af37] bg-gradient-to-br from-white to-slate-100 relative group"
      >
        <MikoAvatar className="w-full h-full" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {!isOpen && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>
    </div>
  );
}