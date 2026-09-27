import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Role } from '../types';
import { authApi } from '../api/auth.api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: Role | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isSupportRoute =
    typeof window !== 'undefined' && window.location.pathname.startsWith('/support');

  const [user, setUser] = useState<User | null>(() => {
    if (isSupportRoute && localStorage.getItem('support_user')) {
      try {
        return JSON.parse(localStorage.getItem('support_user')!);
      } catch {}
    }
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    if (isSupportRoute && localStorage.getItem('support_token')) {
      return localStorage.getItem('support_token');
    }
    return localStorage.getItem('token');
  });

  // Verify token storage on mount and when token changes:
  // Re-fetch GET /api/auth/me to verify against cached user state, ensuring a stale token or tab switch does not misrepresent user roles.
  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    const verifySession = async () => {
      try {
        const freshUser = await authApi.getMe();
        if (!isMounted) return;

        setUser((prev) => {
          if (
            !prev ||
            prev.id !== freshUser.id ||
            prev.isDemoAccount !== freshUser.isDemoAccount ||
            prev.role !== freshUser.role ||
            prev.sellerStatus !== freshUser.sellerStatus
          ) {
            if (freshUser.role === 'SUPPORT' || freshUser.role === 'ADMIN') {
              localStorage.setItem('support_user', JSON.stringify(freshUser));
            }
            localStorage.setItem('user', JSON.stringify(freshUser));
            return freshUser;
          }
          return { ...prev, ...freshUser };
        });
      } catch (err: any) {
        if (err?.response?.status === 401 || err?.friendlyMessage?.includes('Unauthorized')) {
          logout();
        }
      }
    };

    verifySession();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // Handle multi-tab storage synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'user' || e.key === 'support_token' || e.key === 'support_user') {
        const currentToken = isSupportRoute
          ? localStorage.getItem('support_token') || localStorage.getItem('token')
          : localStorage.getItem('token');
        const currentUserStr = isSupportRoute
          ? localStorage.getItem('support_user') || localStorage.getItem('user')
          : localStorage.getItem('user');

        setToken(currentToken);
        try {
          setUser(currentUserStr ? JSON.parse(currentUserStr) : null);
        } catch {
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isSupportRoute]);

  useEffect(() => {
    if (token) {
      if (user?.role === 'SUPPORT' || user?.role === 'ADMIN') {
        localStorage.setItem('support_token', token);
      }
      localStorage.setItem('token', token);
    } else {
      if (isSupportRoute) {
        localStorage.removeItem('support_token');
      } else {
        localStorage.removeItem('token');
      }
    }
  }, [token, user?.role, isSupportRoute]);

  useEffect(() => {
    if (user) {
      if (user.role === 'SUPPORT' || user.role === 'ADMIN') {
        localStorage.setItem('support_user', JSON.stringify(user));
      }
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      if (isSupportRoute) {
        localStorage.removeItem('support_user');
      } else {
        localStorage.removeItem('user');
      }
    }
  }, [user, isSupportRoute]);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = (newUser: User, newToken: string) => {
    if (newUser.role === 'SUPPORT' || newUser.role === 'ADMIN') {
      localStorage.setItem('support_token', newToken);
      localStorage.setItem('support_user', JSON.stringify(newUser));
    }
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
    setToken(newToken);
  };

  const logout = () => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/support')) {
      localStorage.removeItem('support_user');
      localStorage.removeItem('support_token');
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    setUser(null);
    setToken(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const role = user?.role || null;
  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isAuthenticated,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
