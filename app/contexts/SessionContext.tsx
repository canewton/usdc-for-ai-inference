'use client';

import React from 'react';
import { createContext, useContext } from 'react';

type SessionContextType = {
  wallet_id: string;
  circle_wallet_id: string;
};

export const SessionContext = createContext<SessionContextType>({
  wallet_id: '',
  circle_wallet_id: '',
});

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

export function SessionProvider({
  children,
  access_token,
  wallet_id,
  circle_wallet_id,
}: {
  children: React.ReactNode;
  access_token: string;
  wallet_id: string;
  circle_wallet_id: string;
}) {
  return (
    <SessionContext.Provider value={{ wallet_id, circle_wallet_id }}>
      {children}
    </SessionContext.Provider>
  );
}
