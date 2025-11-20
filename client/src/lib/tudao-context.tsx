import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePrivy } from '@/lib/auth';

export type UserRole = 'provider' | 'consumer' | 'nodeholder' | 'architect';

interface TudaoContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  isLoading: boolean;
  userId: string | null;
}

const TudaoContext = createContext<TudaoContextType | undefined>(undefined);

export function TudaoProvider({ children }: { children: React.ReactNode }) {
  const { user, authenticated } = usePrivy();
  const [role, setRoleState] = useState<UserRole>('provider');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authenticated && user) {
      setRoleState(user.role as UserRole);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [user, authenticated]);

  const setRole = async (newRole: UserRole) => {
    setRoleState(newRole);
    
    // Update role in database
    if (user?.id) {
      try {
        await fetch(`/api/users/${user.id}/role`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: newRole })
        });
      } catch (error) {
        console.error("Failed to update role:", error);
      }
    }
  };

  return (
    <TudaoContext.Provider value={{ role, setRole, isLoading, userId: user?.id || null }}>
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
