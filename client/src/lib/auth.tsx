import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  walletAddress: string;
  emailAddress?: string | null;
  role: string;
  wallet?: {
    address: string;
  };
  email?: {
    address: string;
  };
}

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

  const login = async () => {
    const mockWallet = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
    
    try {
      // Check if user exists in DB
      const response = await fetch(`/api/users/wallet/${mockWallet}`);
      let userData;
      
      if (response.ok) {
        userData = await response.json();
      } else {
        // Create new user
        const createResponse = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: mockWallet,
            email: "demo@tudao.xyz",
            role: "consumer"
          })
        });
        userData = await createResponse.json();
      }
      
      setAuthenticated(true);
      setUser({
        ...userData,
        emailAddress: userData.email,
        wallet: { address: userData.walletAddress },
        email: userData.email ? { address: userData.email } : undefined
      });
    } catch (error) {
      console.error("Login error:", error);
      // Fallback to mock data
      setAuthenticated(true);
      setUser({ 
        id: "mock-id",
        walletAddress: mockWallet,
        emailAddress: "demo@tudao.xyz",
        role: "consumer",
        wallet: { address: mockWallet },
        email: { address: "demo@tudao.xyz" }
      });
    }
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
