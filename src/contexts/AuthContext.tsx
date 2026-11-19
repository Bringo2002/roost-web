import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  login as apiLogin,
  signup as apiSignup,
  signInWithGoogle as apiGoogleSignIn,
  logout as apiLogout,
  isLoggedIn,
  getUserFromToken,
  refreshToken,
} from '../services/auth';
import { getCurrentUser } from '../services/users';
import { setRefreshHandler } from '../services/api';
import type { User } from '../types/user';

interface AuthContextType {
  user: User | null;
  tokenUser: { email?: string; name?: string } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string; isNewUser?: boolean }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const tokenUser = getUserFromToken();
  const isAuthenticated = isLoggedIn();

  const refreshUser = useCallback(async () => {
    if (!isLoggedIn()) {
      setUser(null);
      return;
    }
    try {
      const u = await getCurrentUser();
      setUser(u);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    setRefreshHandler(refreshToken);
    if (isLoggedIn()) {
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const handleLogin = async (email: string, password: string) => {
    const result = await apiLogin(email, password);
    if (result.success) await refreshUser();
    return result;
  };

  const handleSignup = async (name: string, email: string, password: string) => {
    const result = await apiSignup(name, email, password);
    if (result.success) await refreshUser();
    return result;
  };

  const handleGoogleSignIn = async () => {
    const result = await apiGoogleSignIn();
    if (result.success) await refreshUser();
    return result;
  };

  const handleLogout = () => {
    apiLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      tokenUser,
      isAuthenticated,
      isLoading,
      login: handleLogin,
      signup: handleSignup,
      signInWithGoogle: handleGoogleSignIn,
      logout: handleLogout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
