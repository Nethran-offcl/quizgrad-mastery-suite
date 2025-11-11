import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from "@/lib/api";

export interface User {
  id: number;
  email: string;
  username: string | null;
  role: 'admin' | 'quiz_manager' | 'user';
}

interface AuthContextType {
  user: User | null;
  login: (identifier: string, password: string) => Promise<boolean>;
  signup: (email: string, username: string, password: string, role?: 'admin' | 'quiz_manager' | 'user') => Promise<boolean>;
  setAuthUser: (u: User) => void; // for Google sign-in direct set
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('quiz_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (identifier: string, password: string): Promise<boolean> => {
    try {
      const result = await api.auth.login(identifier, password);
      const loggedUser: User = { id: result.userId, email: result.email, username: result.username ?? null, role: result.role };
      setUser(loggedUser);
      localStorage.setItem('quiz_user', JSON.stringify(loggedUser));
      return true;
    } catch (e: any) {
      if (e?.status === 401) return false;
      throw e;
    }
  };

  const signup = async (email: string, username: string, password: string, role: 'admin' | 'quiz_manager' | 'user' = 'user'): Promise<boolean> => {
    await api.auth.signup(email, username, password, role);
    const result = await api.auth.login(email, password);
    const newUser: User = { id: result.userId, email: result.email, username: result.username ?? username, role: result.role };
    setUser(newUser);
    localStorage.setItem('quiz_user', JSON.stringify(newUser));
    return true;
  };

  const setAuthUser = (u: User) => {
    setUser(u);
    localStorage.setItem('quiz_user', JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('quiz_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, setAuthUser, logout, isLoading }}>
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