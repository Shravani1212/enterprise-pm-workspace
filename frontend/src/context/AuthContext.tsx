import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthResponse } from '../types';
import apiClient from '../services/apiClient';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (authData: AuthResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // On mount, check if user session is active via HttpOnly cookie
  useEffect(() => {
    apiClient
      .get('/auth/me')
      .then((res) => {
        if (res.data.success && res.data.data) {
          setUser(res.data.data);
          localStorage.setItem('user', JSON.stringify(res.data.data));
        }
      })
      .catch(() => {
        setUser(null);
        localStorage.removeItem('user');
      });
  }, []);

  const login = (authData: AuthResponse) => {
    localStorage.setItem('user', JSON.stringify(authData.user));
    setUser(authData.user);
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      // Ignore logout API errors
    } finally {
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
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
