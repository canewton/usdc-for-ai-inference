'use client';

import React from 'react';
import { createContext, useContext } from 'react';

type SessionContextType = {
  access_token: string;
  api_key_status: any;
};

export const SessionContext = createContext<SessionContextType>({
  access_token: '',
  api_key_status: {},
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
}: {
  children: React.ReactNode;
  access_token: string;
  api_key_status: any;
}) {
  return (
    <SessionContext.Provider value={{ access_token, api_key_status }}>
      {children}
    </SessionContext.Provider>
  );
}
