import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import authService from '../services/authService';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  login: (data: { email: string; password: string }) => Promise<void>;
  register: (data: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
  updateAuthState: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [user, setUser] = useState(authService.getUser());

  const updateAuthState = () => {
    const authStatus = authService.isAuthenticated();
    const userData = authService.getUser();
    setIsAuthenticated(authStatus);
    setUser(userData);
  };

  useEffect(() => {
    updateAuthState();

    // Escutar mudanças no localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === '@PomodoroTasks:token' || e.key === '@PomodoroTasks:user') {
        updateAuthState();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  const login = async (data: { email: string; password: string }) => {
    await authService.login(data);
    updateAuthState();
  };

  const register = async (data: { name: string; email: string; password: string }) => {
    await authService.register(data);
    updateAuthState();
  };

  const logout = () => {
    authService.logout();
    updateAuthState();
  };
  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      login,
      register,
      logout,
      updateAuthState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
