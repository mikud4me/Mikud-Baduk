import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

// Gates admin-only pages (lead PII, dashboards) behind an authenticated
// user whose base44 profile has role === 'admin'. Renders nothing sensitive
// until that check resolves, since the child isn't mounted otherwise.
export default function AdminOnly({ children }) {
  const { data, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const user = await base44.auth.me();
        return { user, isAuthenticated: true };
      } catch {
        return { user: null, isAuthenticated: false };
      }
    },
  });

  if (isLoading) return <Spinner />;

  if (!data?.isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 text-center px-6" dir="rtl">
        <p className="text-slate-700 font-bold text-lg">האזור מיועד לצוות מיקוד בלבד</p>
        <p className="text-slate-500 text-sm">יש להתחבר עם חשבון מורשה כדי לצפות בעמוד זה.</p>
        <button
          onClick={() => base44.auth.redirectToLogin(window.location.href)}
          className="bg-[#1e3a5f] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#152d47] transition-all"
        >
          התחברות
        </button>
      </div>
    );
  }

  if (data.user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-center px-6" dir="rtl">
        <p className="text-slate-700 font-bold text-lg">אין לך הרשאה לצפות בעמוד זה</p>
      </div>
    );
  }

  return children;
}
