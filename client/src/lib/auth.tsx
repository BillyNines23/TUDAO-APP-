import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  walletAddress: string;
  emailAddress?: string | null;
  role: string | null;
  isExistingUser?: boolean;
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
    const mockWallet = "0x91ab951ab5c31a0d475d3539099c09d7fc307a75";
    
    try {
      // Check if user exists in DB
      const response = await fetch(`/api/users/wallet/${mockWallet}`);
      let userData;
      let isExisting = false;
      
      if (response.ok) {
        // Existing user - return with their saved role
        userData = await response.json();
        isExisting = true;
      } else {
        // New user - check if architect whitelist
        const archResponse = await fetch(`/api/auth/check-architect/${mockWallet}`);
        const archData = await archResponse.json();
        
        // Create new user with architect role if whitelisted, otherwise no role
        const createResponse = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: mockWallet,
            email: "demo@tudao.xyz",
            role: archData.isAuthorized ? "architect" : null
          })
        });
        userData = await createResponse.json();
        isExisting = false;
      }
      
      setAuthenticated(true);
      setUser({
        ...userData,
        emailAddress: userData.email,
        isExistingUser: isExisting,
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
        role: null,
        isExistingUser: false,
        wallet: { address: mockWallet },
        email: { address: "demo@tudao.xyz" }
      });
    }
  };

  // Removed auto-login - users must click "Log In" button

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
