import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import MikoAvatar from './MikoAvatar';
import { base44 } from '@/api/base44Client';

const QUICK_QUESTIONS = [
  "מה התמהיל הכי מומלץ לי?",
  "איך משפרים את DTI?",
  "מה הפריים עכשיו?",
  "אילו מסמכים צריך?",
];

const WELCOME_MSG = {
  role: 'ai',
  text: `שלום! 👋 אני מיקו, המומחה הדיגיטלי של מיקוד משכנתאות.

אני כאן לעזור לך להבין את תיק המשכנתא שלך, לענות על שאלות, ולהכין אותך למשא ומתן מול הבנקים.

שאל אותי כל דבר — אני לא נושך 😄`,
};

export default function MikoChat({ formData, results, isPurchased, isOpen, setIsOpen }) {
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', text }]);
    setLoading(true);

    const isGreeting = /(שלום|היי|הלו|בוקר טוב|אהלן|מי זה|מי אתה|מה שלומך)/i.test(text);
    const isThanks = /(תודה|ביי|להתראות|סיימתי|שיהיה)/i.test(text);
    const aboutMikud = /(מיקוד משכנתאות|מיקוד|החברה|מי אתם|מה אתם עושים)/i.test(text);

    if (isGreeting) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'ai',
          text: `היי! 😊 שמח שפנית אליי. אני מיקו — מומחה משכנתאות AI של מיקוד משכנתאות.\n\n${isPurchased ? 'אני רואה את כל נתוני התיק שלך ואשמח לנתח ולייעץ בכל שאלה ספציפית!' : 'אשמח לענות על שאלות כלליות. לניתוח מעמיק ומדויק של התיק האישי שלך — כדאי לרכוש את הדוח המקצועי.'}\n\nמה תרצה לדעת?`
        }]);
        setLoading(false);
      }, 600);
      return;
    }

    if (isThanks) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'ai',
          text: `תודה לך! 🙏 היה לי תענוג לעזור.\n\nזכור — אנחנו כאן בשבילך בכל שלב בדרך לבית החדש. המטרה שלנו, החיסכון שלכם! 🏡\n\nלכל שאלה נוספת: 2324*`
        }]);
        setLoading(false);
      }, 500);
      return;
    }

    if (aboutMikud) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'ai',
          text: `מיקוד משכנתאות היא חברת ייעוץ משכנתאות מקצועית עם ניסיון עשיר ומסלול הצלחות מוכח. 🎯\n\n✅ בניית תמהילים אופטימליים\n✅ משא ומתן מקצועי מול הבנקים\n✅ ליווי אישי עד לחתימה\n✅ ממוצע חיסכון של ₪150,000 לתיק\n\nרוצה לדבר עם יועץ אנושי? 📞 2324*`
        }]);
        setLoading(false);
      }, 700);
      return;
    }

    // LLM response
    const loanInfo = results?.loanAmount
      ? `נתוני תיק הלקוח: משכנתא ${results.loanAmount?.toLocaleString('he-IL')}₪, מימון ${results.ltv?.toFixed(1)}%${!results.isReverse ? `, DTI ${results.dti?.toFixed(1)}%` : ''}, תקופה ${results.actualDuration} שנים, החזר חודשי מומלץ ~₪${Math.floor(results.mixB?.total || 0).toLocaleString('he-IL')}. תמהיל מומלץ: 33% פריים + 33% קל"צ + 34% משתנה צמודה.`
      : `הלקוח מילא: שווי נכס ${formData.propertyPrice || 'לא צוין'}₪, הון עצמי ${formData.equity || 'לא צוין'}₪.`;

    const systemPrompt = isPurchased
      ? `אתה מיקו — יועץ משכנתאות AI חמים, מקצועי ואנושי של מיקוד משכנתאות. ${loanInfo} ענה על שאלת הלקוח בצורה ברורה, ממוקדת ואישית — התייחס לנתונים הספציפיים שלו. השתמש בעברית נקייה, קצרה ומעשית (עד 4 משפטים). אם רלוונטי — המלץ לפנות ליועץ אנושי ב-2324*.`
      : `אתה מיקו — יועץ משכנתאות AI חמים ומקצועי של מיקוד משכנתאות. ${loanInfo} ענה תשובה כללית מועילה ומדויקת (עד 3 משפטים). אל תמציא נתונים ספציפיים שאינך יודע. בסוף הזכר בעדינות שלניתוח מדויק של התיק האישי — כדאי לרכוש את הדוח המלא או לפנות ל-2324*.`;

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${systemPrompt}\n\nשאלת הלקוח: "${text}"`,
        add_context_from_internet: false
      });
      const reply = (response?.output || response || "").replace(/[*#_]/g, '').trim();
      setMessages(prev => [...prev, { role: 'ai', text: reply || "אשמח לעזור! פנה ליועץ שלנו ב-2324* לכל שאלה." }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'ai',
        text: "מצטער, נתקלתי בתקלה טכנית קטנה. 😅 לכל שאלה ניתן לפנות ליועץ האנושי שלנו ב-2324*"
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-[300] flex flex-col items-start" dir="rtl">
      {isOpen && (
        <div className="bg-white w-[85vw] sm:w-[340px] h-[480px] mb-3 rounded-2xl shadow-2xl border border-[#d4af37]/30 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#001a33] to-[#003d66] p-3 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MikoAvatar className="w-9 h-9 ring-2 ring-[#d4af37] rounded-full" />
              <div>
                <span className="text-sm font-bold block">מיקו AI</span>
                <span className="text-[10px] text-[#d4af37] block">זמין עכשיו ✨</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:text-[#d4af37] transition-colors p-1.5 hover:bg-white/10 rounded-lg">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`px-4 py-3 rounded-2xl max-w-[85%] text-sm leading-relaxed whitespace-pre-line ${
                  m.role === 'user'
                    ? 'bg-white text-slate-800 rounded-br-none border border-slate-200 shadow-sm'
                    : 'bg-gradient-to-br from-[#001a33] to-[#1e3a5f] text-white rounded-bl-none shadow-md'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-end">
                <div className="bg-[#001a33] rounded-2xl rounded-bl-none px-4 py-3 flex gap-1 items-center">
                  <span className="w-2 h-2 bg-[#d4af37] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-[#d4af37] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-[#d4af37] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick questions */}
          {messages.length <= 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5 bg-slate-50 border-t border-slate-100 pt-2">
              {QUICK_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="text-[11px] bg-white border border-[#d4af37]/50 text-[#1e3a5f] font-semibold px-2.5 py-1 rounded-full hover:bg-[#d4af37]/10 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
            <input
              className="flex-1 bg-slate-50 border border-slate-200 focus:border-[#d4af37] rounded-xl px-3 py-2 text-sm outline-none text-right font-medium transition-all"
              placeholder="שאל את מיקו..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              className="bg-[#d4af37] text-[#001a33] p-2.5 rounded-xl active:scale-95 transition-all disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 sm:w-20 sm:h-20 shadow-2xl hover:scale-110 transition-all rounded-full overflow-hidden border-4 border-[#d4af37] bg-white relative group"
      >
        <MikoAvatar className="w-full h-full" />
        {!isOpen && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>
    </div>
  );
}