import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import { setAccessToken, setLogoutHandler } from '../services/api';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessTokenState, setAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    } finally {
      setUser(null);
      setAccessTokenState(null);
      setAccessToken(null);
    }
  };

  useEffect(() => {
    setLogoutHandler(() => {
      setUser(null);
      setAccessTokenState(null);
    });

    // Attempt silent restore of session from HttpOnly refresh cookie on application load
    const restoreSession = async () => {
      try {
        const { user: restoredUser, accessToken: restoredToken } = await authService.refresh();
        setUser(restoredUser);
        setAccessTokenState(restoredToken);
        setAccessToken(restoredToken);
      } catch {
        // No active session or expired
        setUser(null);
        setAccessTokenState(null);
        setAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { user: loggedInUser, accessToken: token } = await authService.login(email, password);
      setUser(loggedInUser);
      setAccessTokenState(token);
      setAccessToken(token);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await handleLogout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken: accessTokenState,
        isLoading,
        login,
        logout,
        setUser,
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
