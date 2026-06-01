import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom event for auth token changes
const authTokenChangeEvent = new Event('authTokenChange');

export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
  window.dispatchEvent(authTokenChangeEvent);
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('authToken'));
  const [loading] = useState(false);

  useEffect(() => {
    const handleAuthChange = () => {
      setToken(localStorage.getItem('authToken'));
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authToken') {
        setToken(e.newValue);
      }
    };

    window.addEventListener('authTokenChange', handleAuthChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('authTokenChange', handleAuthChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
  }, []);

  const value = useMemo(() => ({ isAuthenticated: !!token, token, logout, loading }), [token, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
