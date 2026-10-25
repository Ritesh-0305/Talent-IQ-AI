import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserSession {
  userId: number;
  email: string;
  roles: string[];
}

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  login: (data: { accessToken: string; refreshToken: string; userId: number; email: string; roles: string[] }) => void;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('talentiq_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('accessToken'));

  const login = (data: { accessToken: string; refreshToken: string; userId: number; email: string; roles: string[] }) => {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    const sessionUser = { userId: data.userId, email: data.email, roles: data.roles };
    localStorage.setItem('talentiq_user', JSON.stringify(sessionUser));
    setToken(data.accessToken);
    setUser(sessionUser);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('talentiq_user');
    setToken(null);
    setUser(null);
  };

  const hasRole = (role: string) => {
    return user?.roles.includes(role) ?? false;
  };

  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem('talentiq_user');
      setUser(saved ? JSON.parse(saved) : null);
      setToken(localStorage.getItem('accessToken'));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
