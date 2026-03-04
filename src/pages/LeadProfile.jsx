import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import {
  User, Phone, Mail, Home, Coins, TrendingDown, Wallet,
  BadgeCheck, ShieldCheck, Download, ChevronRight, Sparkles,
  Clock, CheckCircle, ArrowLeft, Building2, FileJson, Send
} from 'lucide-react';

const formatCurrency = (n) =>
  n ? '₪' + new Intl.NumberFormat('he-IL').format(Math.floor(n)) : '—';

const STATUS_LABELS = {
  new: { label: 'חדש', color: 'bg-blue-100 text-blue-800' },
  contacted: { label: 'נוצר קשר', color: 'bg-yellow-100 text-yellow-800' },
  in_process: { label: 'בתהליך', color: 'bg-purple-100 text-purple-800' },
  approved: { label: 'מאושר', color: 'bg-green-100 text-green-800' },
  closed: { label: 'סגור', color: 'bg-gray-100 text-gray-700' },
};

function InfoRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-gray-500 text-sm font-medium">{label}</span>
      <span className="font-bold text-[#1e3a5f] text-sm">{value}</span>
    </div>
  );
}

function Section({ title, icon: SectionIcon, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="font-black text-[#1e3a5f] text-base mb-4 flex items-center gap-2">
        <SectionIcon size={18} className="text-[#c9a961]" />
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function LeadProfile() {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('new');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) { setLoading(false); return; }
    base44.entities.Lead.filter({ id }).then(results => {
      const found = results?.[0];
      if (found) { setLead(found); setStatus(found.status || 'new'); }
      setLoading(false);
    });
  }, []);

  const updateStatus = async (newStatus) => {
    setStatus(newStatus);
    await base44.entities.Lead.update(lead.id, { status: newStatus });
  };

  const exportJson = () => {
    if (!lead) return;
    const exportData = {
      mikud_case_id: lead.id,
      exported_at: new Date().toISOString(),
      source_system: 'מיקוד משכנתאות — מערכת 1',
      version: '1.0',
      personal: {
        fullName: lead.fullName,
        idNumber: lead.idNumber,
        birthDate: lead.birthDate,
        age: lead.age,
        phone: lead.phone,
        email: lead.email,
        maritalStatus: lead.maritalStatus,
        childrenUnder18: lead.childrenUnder18,
      },
      financial: {
        netIncome: lead.netIncome,
        monthlyDebts: lead.monthlyDebts,
        monthlyOverdraft: lead.monthlyOverdraft,
        equity: lead.equity,
        propertyPrice: lead.propertyPrice,
        loanAmount: lead.loanAmount,
        loanDuration: lead.loanDuration,
        ltv: lead.ltv,
      },
      analysis: {
        score: lead.score,
        isPurchased: lead.isPurchased,
        status: lead.status,
        aiAnalysis: lead.aiAnalysis,
      },
      next_step: 'העבר למערכת 2 — העלאת מסמכים והגשה לבנק',
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mikud_case_${lead.fullName?.replace(/\s/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyId = () => {
    if (lead?.id) {
      navigator.clipboard.writeText(lead.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
      <p className="text-gray-500 font-bold">טוען תיק לקוח...</p>
    </div>
  );

  if (!lead) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans" dir="rtl">
      <div className="text-center">
        <p className="text-gray-500 font-bold mb-4">הליד לא נמצא</p>
        <a href={createPageUrl('AdminDashboard')} className="text-[#1e3a5f] underline">חזור לפאנל</a>
      </div>
    </div>
  );

  const statusInfo = STATUS_LABELS[status] || STATUS_LABELS.new;

  return (
    <div className="min-h-screen bg-gray-50 font-sans" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-[#1e3a5f] to-[#162e4a] px-6 py-5 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href={createPageUrl('AdminDashboard')} className="flex items-center gap-1 text-white/70 hover:text-white text-sm transition-colors">
              <ArrowLeft size={16} /> חזור לפאנל
            </a>
            <div className="w-px h-5 bg-white/20" />
            <div>
              <h1 className="text-white font-black text-xl">{lead.fullName}</h1>
              <p className="text-[#c9a961] text-xs font-semibold">תיק לקוח מלא</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
            <button
              onClick={exportJson}
              className="flex items-center gap-2 bg-[#c9a961] text-[#1e3a5f] px-4 py-2 rounded-xl font-black text-sm hover:bg-[#d4b975] transition-all"
            >
              <FileJson size={16} /> ייצוא JSON למערכת 2
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Case ID + Transfer Banner */}
        <div className="bg-gradient-to-l from-[#1e3a5f]/10 to-[#c9a961]/10 border-2 border-[#c9a961]/40 rounded-2xl p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">מזהה תיק — להעברה למערכת 2</p>
            <p className="font-black text-[#1e3a5f] text-lg font-mono">{lead.id}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={copyId}
              className="flex items-center gap-2 bg-white border-2 border-[#1e3a5f] text-[#1e3a5f] px-4 py-2 rounded-xl font-bold text-sm hover:bg-[#1e3a5f] hover:text-white transition-all"
            >
              {copied ? <CheckCircle size={15} /> : <BadgeCheck size={15} />}
              {copied ? 'הועתק!' : 'העתק ID'}
            </button>
            <button
              onClick={exportJson}
              className="flex items-center gap-2 bg-[#1e3a5f] text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-[#152d47] transition-all"
            >
              <Send size={15} /> שלח למערכת 2
            </button>
          </div>
        </div>

        {/* Score + Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'ציון איכות', value: lead.score, suffix: '/100', color: lead.score >= 80 ? 'text-green-600' : 'text-yellow-600' },
            { label: 'LTV', value: lead.ltv?.toFixed(1), suffix: '%', color: lead.ltv > 75 ? 'text-red-600' : 'text-green-600' },
            { label: 'סכום משכנתא', value: formatCurrency(lead.loanAmount), suffix: '', color: 'text-[#1e3a5f]' },
            { label: 'הכנסה מוכרת', value: formatCurrency(lead.netIncome), suffix: '', color: 'text-[#1e3a5f]' },
          ].map((m, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
              <p className={`text-2xl font-black ${m.color}`}>{m.value}<span className="text-sm">{m.suffix}</span></p>
              <p className="text-xs text-gray-500 font-semibold mt-1">{m.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

          {/* Personal */}
          <Section title="פרטים אישיים" icon={User}>
            <InfoRow label="שם מלא" value={lead.fullName} />
            <InfoRow label="ת.ז" value={lead.idNumber} />
            <InfoRow label="תאריך לידה" value={lead.birthDate} />
            <InfoRow label="גיל" value={lead.age ? `${lead.age} שנים` : null} />
            <InfoRow label="טלפון" value={lead.phone} />
            <InfoRow label="אימייל" value={lead.email} />
            <InfoRow label="מצב משפחתי" value={lead.maritalStatus} />
            <InfoRow label="ילדים מתחת 18" value={lead.childrenUnder18 != null ? lead.childrenUnder18 : null} />
          </Section>

          {/* Financial */}
          <Section title="נתונים פיננסיים" icon={Coins}>
            <InfoRow label="הכנסה נטו מוכרת" value={formatCurrency(lead.netIncome)} />
            <InfoRow label="חובות חודשיים" value={formatCurrency(lead.monthlyDebts)} />
            <InfoRow label="שכירות חודשית" value={formatCurrency(lead.monthlyOverdraft)} />
            <InfoRow label="הון עצמי" value={formatCurrency(lead.equity)} />
            <InfoRow label="שווי נכס" value={formatCurrency(lead.propertyPrice)} />
            <InfoRow label="סכום מבוקש" value={formatCurrency(lead.loanAmount)} />
            <InfoRow label="תקופה" value={lead.loanDuration ? `${lead.loanDuration} שנים` : null} />
            <InfoRow label="אחוז מימון LTV" value={lead.ltv ? `${lead.ltv?.toFixed(1)}%` : null} />
          </Section>
        </div>

        {/* AI Analysis */}
        {lead.aiAnalysis && (
          <Section title="ניתוח AI מלא" icon={Sparkles}>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{lead.aiAnalysis}</p>
          </Section>
        )}

        {/* Status Update */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
          <h3 className="font-black text-[#1e3a5f] mb-4 flex items-center gap-2">
            <Clock size={18} className="text-[#c9a961]" /> עדכון סטטוס תיק
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(STATUS_LABELS).map(([val, { label, color }]) => (
              <button
                key={val}
                onClick={() => updateStatus(val)}
                className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                  status === val
                    ? 'border-[#1e3a5f] bg-[#1e3a5f] text-white'
                    : `border-transparent ${color} hover:border-[#1e3a5f]/30`
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Export CTA */}
        <div className="mt-6 bg-gradient-to-l from-[#1e3a5f] to-[#162e4a] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-right">
          <div>
            <h3 className="text-white font-black text-lg">מוכן להעברה למערכת 2?</h3>
            <p className="text-[#c9a961] text-sm mt-1">ייצא את תיק הלקוח המלא והעבר למערכת העלאת המסמכים וההגשה</p>
          </div>
          <button
            onClick={exportJson}
            className="flex items-center gap-3 bg-[#c9a961] text-[#1e3a5f] px-8 py-4 rounded-2xl font-black text-base hover:bg-[#d4b975] transition-all shadow-lg flex-shrink-0"
          >
            <Download size={20} /> ייצוא תיק מלא
          </button>
        </div>

      </div>
    </div>
  );
}