import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '@/components/refinance/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  const checkUserAuth = useCallback(async () => {
    if (!supabase) {
      setIsLoadingAuth(false);
      return;
    }
    const { data: { user: currentUser }, error } = await supabase.auth.getUser();
    setUser(currentUser ?? null);
    setAuthError(error ? { type: 'unknown', message: error.message } : null);
    setIsLoadingAuth(false);
  }, []);

  useEffect(() => {
    checkUserAuth();
    const { data: { subscription } } = supabase?.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoadingAuth(false);
    }) || { data: { subscription: null } };
    return () => subscription?.unsubscribe();
  }, [checkUserAuth]);

  const logout = () => supabase?.auth.signOut();
  const navigateToLogin = async () => {
    const email = window.prompt('כתובת אימייל להתחברות');
    if (!email || !supabase) return;
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.href } });
    if (error) setAuthError({ type: 'unknown', message: error.message });
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: Boolean(user),
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError,
      appPublicSettings: null,
      logout,
      navigateToLogin,
      checkAppState: checkUserAuth,
      checkUserAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
