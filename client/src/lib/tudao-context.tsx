import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';

// Roles defined in requirements
export type UserRole = 'provider' | 'consumer' | 'nodeholder' | 'architect';

interface TudaoContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  isLoading: boolean;
}

const TudaoContext = createContext<TudaoContextType | undefined>(undefined);

export function TudaoProvider({ children }: { children: React.ReactNode }) {
  // Default to 'consumer' or 'provider' for demo purposes
  const [role, setRole] = useState<UserRole>('provider');
  const [isLoading, setIsLoading] = useState(true);

  // Simulate some initial loading or role fetching
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <TudaoContext.Provider value={{ role, setRole, isLoading }}>
      {children}
    </TudaoContext.Provider>
  );
}

export function useTudao() {
  const context = useContext(TudaoContext);
  if (context === undefined) {
    throw new Error('useTudao must be used within a TudaoProvider');
  }
  return context;
}
