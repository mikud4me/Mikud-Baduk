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
        <div className="bg-white w-[88vw] sm:w-[320px] h-[450px] mb-4 rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4">
          <div className="bg-[#001a33] p-3 text-white flex justify-between items-center shadow-lg">
            <div className="flex items-center gap-3 font-bold">
              <MikoAvatar className="w-8 h-8" />
              <span className="text-sm">מיקו - מומחה אסטרטגי</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:text-[#d4af37] transition-colors p-1">
              <X size={20}/>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.length === 0 && (
              <p className="text-slate-400 text-[10px] italic text-center mt-8 font-bold">
                שלום רב! הגעתם למיקו. כיצד אוכל לסייע היום?
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`p-3 rounded-2xl max-w-[90%] text-xs shadow-sm ${
                  m.role === 'user' 
                    ? 'bg-slate-200 text-slate-800 rounded-bl-none' 
                    : 'bg-[#001a33] text-white rounded-br-none'
                }`}>
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
          
          <div className="p-3 bg-white border-t flex gap-2">
            <input 
              className="flex-1 bg-slate-100 border-0 rounded-xl px-3 py-2 text-xs outline-none text-right" 
              placeholder="שאל את מיקו..." 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleSend()} 
            />
            <button 
              onClick={handleSend} 
              className="bg-[#001a33] text-white p-2.5 rounded-xl active:scale-95 transition-transform"
            >
              <Send size={14}/>
            </button>
          </div>
        </div>
      )}
      
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-14 h-14 sm:w-16 sm:h-16 shadow-2xl hover:scale-110 transition-all rounded-full overflow-hidden border-4 border-[#001a33] bg-white relative"
      >
        <MikoAvatar className="w-full h-full" />
      </button>
    </div>
  );
}