'use client';

import React from 'react';
import { createContext, useContext } from 'react';

type SessionContextType = {
  access_token: string;
  api_key_status: any;
  wallet_id: string;
  circle_wallet_id: string;
};

export const SessionContext = createContext<SessionContextType>({
  access_token: '',
  api_key_status: {},
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
  api_key_status,
  wallet_id,
  circle_wallet_id,
}: {
  children: React.ReactNode;
  access_token: string;
  api_key_status: any;
  wallet_id: string;
  circle_wallet_id: string;
}) {
  return (
    <SessionContext.Provider
      value={{ access_token, api_key_status, wallet_id, circle_wallet_id }}
    >
      {children}
    </SessionContext.Provider>
  );
}
