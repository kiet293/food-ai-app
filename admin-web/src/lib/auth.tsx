import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { adminApi, AdminProfile, ApiError, tokenStorage } from './api';

interface AuthContextValue {
  admin: AdminProfile | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const verifySession = useCallback(async () => {
    const token = tokenStorage.get();
    if (!token) {
      setAdmin(null);
      setLoading(false);
      return;
    }
    try {
      const profile = await adminApi.getMe();
      setAdmin(profile);
    } catch {
      tokenStorage.clear();
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  const login = async (username: string, password: string) => {
    const { access_token } = await adminApi.login(username, password);
    tokenStorage.set(access_token);
    try {
      const profile = await adminApi.getMe();
      setAdmin(profile);
    } catch (err) {
      tokenStorage.clear();
      setAdmin(null);
      if (err instanceof ApiError && err.status === 403) {
        throw new ApiError('Tài khoản này không có quyền quản trị viên (is_admin=false).', 403);
      }
      throw err;
    }
  };

  const logout = () => {
    tokenStorage.clear();
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
