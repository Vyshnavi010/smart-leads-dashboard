import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types/index';
import api from '../services/api';


interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  registerUser: (name: string, email: string, password: string, role: 'Admin' | 'Sales User') => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/auth/profile');
          if (response.data.success) {
            setUser({
              id: response.data.data._id,
              name: response.data.data.name,
              email: response.data.data.email,
              role: response.data.data.role,
            });
          } else {
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Failed to restore authentication session:', error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.success) {
      const { token, user: userData } = response.data.data;
      localStorage.setItem('token', token);
      setUser(userData);
    }
  };

  const registerUser = async (name: string, email: string, password: string, role: 'Admin' | 'Sales User') => {
    const response = await api.post('/auth/register', { name, email, password, role });
    if (response.data.success) {
      const { token, user: userData } = response.data.data;
      localStorage.setItem('token', token);
      setUser(userData);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, registerUser, logout }}>
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
