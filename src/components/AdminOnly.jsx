import { useQuery } from '@tanstack/react-query';
import { getCurrentUser, isAdmin } from '@/lib/supabaseAuth';
import { useAuth } from '@/lib/AuthContext';

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-mist-50">
    <div className="w-8 h-8 border-4 border-mist-200 border-t-mist-800 rounded-full animate-spin"></div>
  </div>
);

// Gates admin-only pages (lead PII, dashboards) behind an authenticated
// user whose profile has role === 'admin'. Renders nothing sensitive
// until that check resolves, since the child isn't mounted otherwise.
export default function AdminOnly({ children }) {
  const { navigateToLogin } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const user = await getCurrentUser();
        return { user, isAuthenticated: Boolean(user), isAdmin: await isAdmin(user) };
      } catch {
        return { user: null, isAuthenticated: false };
      }
    },
  });

  if (isLoading) return <Spinner />;

  if (!data?.isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-mist-50 text-center px-6" dir="rtl">
        <p className="text-mist-700 font-bold text-lg">האזור מיועד לצוות מיקוד בלבד</p>
        <p className="text-mist-500 text-sm">יש להתחבר עם חשבון מורשה כדי לצפות בעמוד זה.</p>
        <button
          onClick={navigateToLogin}
          className="bg-[#0C084A] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#0153F4] transition-all"
        >
          התחברות
        </button>
      </div>
    );
  }

  if (!data.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mist-50 text-center px-6" dir="rtl">
        <p className="text-mist-700 font-bold text-lg">אין לך הרשאה לצפות בעמוד זה</p>
      </div>
    );
  }

  return children;
}
