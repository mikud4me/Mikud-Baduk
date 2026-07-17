import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import AdminOnly from '@/components/AdminOnly';
import {
  Users, CheckCircle, Clock, Search, Filter, Download, BadgeCheck, Eye, RefreshCw, AlertCircle
} from 'lucide-react';

const STATUS_LABELS = {
  partial: { label: 'לא הושלם', color: 'bg-orange-100 text-orange-800' },
  new: { label: 'חדש', color: 'bg-blue-100 text-blue-800' },
  contacted: { label: 'נוצר קשר', color: 'bg-yellow-100 text-yellow-800' },
  in_process: { label: 'בתהליך', color: 'bg-purple-100 text-purple-800' },
  approved: { label: 'מאושר', color: 'bg-green-100 text-green-800' },
  closed: { label: 'סגור', color: 'bg-gray-100 text-gray-700' },
};

const formatCurrency = (n) =>
  n ? '₪' + new Intl.NumberFormat('he-IL').format(Math.floor(n)) : '—';

export default function AdminDashboard() {
  return (
    <AdminOnly>
      <AdminDashboardContent />
    </AdminOnly>
  );
}

function AdminDashboardContent() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  const loadLeads = async () => {
    setLoading(true);
    const data = await base44.entities.Lead.list('-created_date', 100);
    setLeads(data);
    setLoading(false);
  };

  useEffect(() => { loadLeads(); }, []);

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    await base44.entities.Lead.update(id, { status });
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    setUpdatingId(null);
  };

  const exportLead = (lead) => {
    const exportData = {
      mikud_case_id: lead.id,
      exported_at: new Date().toISOString(),
      system: 'מיקוד משכנתאות — מערכת 1',
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
        // שדות מחזור
        ...(lead.mortgageType === 'refinance' ? {
          refinanceBalance: lead.refinanceBalance,
          currentMonthlyPayment: lead.currentMonthlyPayment,
          refinanceRemainingYears: lead.refinanceRemainingYears,
          refinanceGoal: lead.refinanceGoal,
        } : {}),
      },
      analysis: {
        score: lead.score,
        aiAnalysis: lead.aiAnalysis,
      }
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mikud_lead_${lead.fullName?.replace(/\s/g,'_')}_${lead.id?.slice(-5)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = leads.filter(l => {
    const matchSearch = !search ||
      l.fullName?.includes(search) ||
      l.phone?.includes(search) ||
      l.email?.includes(search);
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: leads.length,
    partial: leads.filter(l => l.status === 'partial').length,
    new: leads.filter(l => l.status === 'new').length,
    purchased: leads.filter(l => l.isPurchased).length,
    approved: leads.filter(l => l.status === 'approved').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-[#1e3a5f] to-[#162e4a] px-6 py-5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696ca6d05493d178c33e26fd/0c936db5c_Gemini_Generated_Image_ae1zscae1zscae1z.jpg"
            alt="מיקוד" className="h-12 w-auto object-contain" style={{ mixBlendMode: 'screen' }}
          />
          <div>
            <h1 className="text-white font-black text-xl">פאנל ניהול</h1>
            <p className="text-[#c9a961] text-xs font-semibold">מיקוד משכנתאות — מערכת 1</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadLeads} className="flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors">
            <RefreshCw size={15} /> רענן
          </button>
          <a href={createPageUrl('MortgageCalculator')} className="text-[#c9a961] text-sm font-bold hover:underline">
            ← שאלון לקוח
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'סה"כ לידים', value: stats.total, icon: Users, color: 'text-blue-600' },
            { label: 'לא הושלמו', value: stats.partial, icon: AlertCircle, color: 'text-orange-600' },
            { label: 'לידים חדשים', value: stats.new, icon: Clock, color: 'text-yellow-600' },
            { label: 'רכשו דוח', value: stats.purchased, icon: BadgeCheck, color: 'text-green-600' },
            { label: 'מאושרים', value: stats.approved, icon: CheckCircle, color: 'text-purple-600' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
              <s.icon size={28} className={s.color} />
              <div>
                <p className="text-2xl font-black text-[#1e3a5f]">{s.value}</p>
                <p className="text-xs text-gray-500 font-semibold">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="חיפוש לפי שם, טלפון, אימייל..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pr-9 pl-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-[#1e3a5f] outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-[#1e3a5f] outline-none"
            >
              <option value="all">כל הסטטוסים</option>
              {Object.entries(STATUS_LABELS).map(([val, { label }]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          <p className="text-sm text-gray-500 font-semibold">{filtered.length} לידים</p>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-20 text-gray-400 font-bold">טוען נתונים...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400 font-bold">לא נמצאו לידים</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-[#1e3a5f] text-white">
                  <tr>
                    {['שם לקוח', 'טלפון', 'סכום', 'LTV', 'ציון', 'סטטוס', 'דוח', 'פעולות'].map(h => (
                      <th key={h} className="px-4 py-3 font-bold text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((lead, i) => {
                    const status = STATUS_LABELS[lead.status] || STATUS_LABELS.new;
                    return (
                      <tr key={lead.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                        <td className="px-4 py-3">
                          <p className="font-bold text-[#1e3a5f]">{lead.fullName}</p>
                          <p className="text-gray-400 text-xs">{lead.email}</p>
                          {lead.mortgageType === 'refinance' && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded">מחזור</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium" dir="ltr">{lead.phone}</td>
                        <td className="px-4 py-3 font-bold text-[#1e3a5f]">
                          {formatCurrency(lead.loanAmount)}
                          {lead.mortgageType === 'refinance' && <p className="text-[10px] text-blue-500 font-medium">יתרה</p>}
                        </td>
                        <td className="px-4 py-3">
                          {lead.mortgageType === 'refinance' ? (
                            <span className="text-blue-600 font-bold text-xs">מחזור</span>
                          ) : (
                            <span className={`font-bold ${lead.ltv > 75 ? 'text-red-600' : lead.ltv > 65 ? 'text-yellow-600' : 'text-green-600'}`}>
                              {lead.ltv?.toFixed(1)}%
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-black text-lg ${lead.score >= 80 ? 'text-green-600' : lead.score >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>
                            {lead.score}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={lead.status || 'new'}
                            onChange={e => updateStatus(lead.id, e.target.value)}
                            disabled={updatingId === lead.id}
                            className={`text-xs font-bold px-2 py-1 rounded-lg border-0 outline-none cursor-pointer ${status.color}`}
                          >
                            {Object.entries(STATUS_LABELS).map(([val, { label }]) => (
                              <option key={val} value={val}>{label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          {lead.isPurchased ? (
                            <span className="flex items-center gap-1 text-green-600 font-bold text-xs">
                              <CheckCircle size={13} /> שולם
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <a
                              href={createPageUrl(`LeadProfile?id=${lead.id}`)}
                              className="flex items-center gap-1 bg-[#1e3a5f] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#152d47] transition-colors"
                            >
                              <Eye size={13} /> צפה
                            </a>
                            <button
                              onClick={() => exportLead(lead)}
                              className="flex items-center gap-1 bg-[#c9a961] text-[#1e3a5f] px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#d4b975] transition-colors"
                            >
                              <Download size={13} /> ייצוא
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}