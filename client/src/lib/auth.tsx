import React, { createContext, useContext, useState, useEffect } from 'react';

// Mock User Interface
export interface User {
  wallet?: {
    address: string;
  };
  email?: {
    address: string;
  };
}

// Mock Context Interface
interface PrivyContextType {
  login: () => void;
  logout: () => void;
  authenticated: boolean;
  user: User | null;
  ready: boolean;
}

const PrivyContext = createContext<PrivyContextType | null>(null);

export const usePrivy = () => {
  const context = useContext(PrivyContext);
  if (!context) {
    throw new Error('usePrivy must be used within a PrivyProvider');
  }
  return context;
};

export const PrivyProvider = ({ children, appId, config }: any) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Auto-login simulation for demo purposes
  useEffect(() => {
    const timer = setTimeout(() => {
        // Simulate a connected state for better UX in demo
        // setAuthenticated(true);
        // setUser({ wallet: { address: "0x123...abc" } });
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const login = () => {
    setAuthenticated(true);
    setUser({ 
        wallet: { address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F" },
        email: { address: "demo@tudao.xyz" }
    });
  };

  const logout = () => {
    setAuthenticated(false);
    setUser(null);
  };

  return (
    <PrivyContext.Provider value={{ login, logout, authenticated, user, ready: true }}>
      {children}
    </PrivyContext.Provider>
  );
};
