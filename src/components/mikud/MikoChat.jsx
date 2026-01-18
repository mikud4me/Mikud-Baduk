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
    
    const isGreeting = /(שלום|היי|הלו|בוקר טוב|אהלן|מי זה|מי אתה)/i.test(userMsg);
    const isThanks = /(תודה|ביי|להתראות|סיימתי)/i.test(userMsg);

    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    if (isGreeting && messages.length <= 1) {
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'ai', 
          text: `שלום רב! הגעתם למיקו, מומחה ה-AI של מיקוד משכנתאות. ${isPurchased ? 'אני מכיר את התיק שלכם היטב, איך אוכל לעזור?' : 'אני יכול לענות לך על שאלות כלליות, אבל לא אוכל לנתח את התיק האישי שלך עד שלא תרכוש את התמהילים המקצועיים.'}` 
        }]);
        setLoading(false);
      }, 600);
      return;
    }

    if (!isPurchased && !isGreeting) {
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'ai', 
          text: "ברגע שתקנה את התמהילים אוכל לענות על שאלות לגבי התיק ולבצע ניתוח עומק. בנתיים, אני ממליץ לדבר עם יועץ אנושי בטלפון 2324*." 
        }]);
        setLoading(false);
      }, 700);
      return;
    }

    if (isThanks) {
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'ai', 
          text: "בשמחה רבה! שמחנו לעזור לך במיקוד משכנתאות. שיהיה המון בהצלחה!" 
        }]);
        setLoading(false);
      }, 500);
      return;
    }

    const context = isPurchased ? `תיק: משכנתא ${results?.loanAmount}₪, הכנסה ${results?.totalIncome}₪, מימון ${results?.ltv?.toFixed(1)}%.` : "לקוח טרם רכש.";
    const sys = "שמך מיקו, מומחה AI של מיקוד משכנתאות. ענה קצר מאוד (עד 2 משפטים). אם הלקוח מבקש עזרה, הפנה ל-2324*.";
    
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${context} שאלה: ${userMsg}`,
        add_context_from_internet: false
      });
      
      const reply = response?.output || response || "מצטער, יש לי קושי קטן בחיבור כרגע.";
      setMessages(prev => [...prev, { role: 'ai', text: reply.replace(/[*#]/g, '').trim() }]);
    } catch (e) {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: "סליחה, יש לי תקלה קלה בחיבור. נסה שוב או חייג 2324*?" 
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
        <div className="bg-gradient-to-br from-white via-slate-50 to-white w-[88vw] sm:w-[380px] h-[550px] mb-4 rounded-[2rem] shadow-2xl border-4 border-[#d4af37]/30 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 backdrop-blur-xl">
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