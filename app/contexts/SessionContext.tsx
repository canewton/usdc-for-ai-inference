'use client';

import React from 'react';
import { createContext, useContext } from 'react';

type SessionContextType = {
  wallet_id: string | null;
  circle_wallet_id: string | null;
  api_keys: any;
};

export const SessionContext = createContext<SessionContextType>({
  wallet_id: null,
  circle_wallet_id: null,
  api_keys: null,
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
  wallet_id,
  circle_wallet_id,
  api_keys,
}: {
  children: React.ReactNode;
  wallet_id: string | null;
  circle_wallet_id: string | null;
  api_keys: any;
}) {
  return (
    <SessionContext.Provider value={{ wallet_id, circle_wallet_id, api_keys }}>
      {children}
    </SessionContext.Provider>
  );
}
