import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: number;
  email: string;
  role: 'admin' | 'quiz_manager' | 'user';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, role?: 'admin' | 'quiz_manager' | 'user') => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import { api } from "@/lib/api";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on app load
    const storedUser = localStorage.getItem('quiz_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await api.auth.login(email, password);
      const loggedUser: User = { id: result.userId, email, role: result.role };
      setUser(loggedUser);
      localStorage.setItem('quiz_user', JSON.stringify(loggedUser));
      return true;
    } catch (e: any) {
      if (e?.status === 401) return false;
      throw e;
    }
  };

  const signup = async (email: string, password: string, role: 'admin' | 'quiz_manager' | 'user' = 'user'): Promise<boolean> => {
    await api.auth.signup(email, password, role);
    const result = await api.auth.login(email, password);
    const newUser: User = { id: result.userId, email, role: result.role };
    setUser(newUser);
    localStorage.setItem('quiz_user', JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('quiz_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};