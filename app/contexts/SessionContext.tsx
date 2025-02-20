'use client';

import React from 'react';
import { createContext, useContext } from 'react';

type SessionContextType = {
  access_token: string;
};

export const SessionContext = createContext<SessionContextType>({
  access_token: '',
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
}: {
  children: React.ReactNode;
  access_token: string;
}) {
  return (
    <SessionContext.Provider value={{ access_token }}>
      {children}
    </SessionContext.Provider>
  );
}
