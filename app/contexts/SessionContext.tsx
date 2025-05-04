'use client';

import React, { useState } from 'react';
import { createContext, useContext } from 'react';

type SessionContextType = {
  walletId: string | null;
  circleWalletId: string | null;
  apiKeyStatus: any;
  isAiInferenceLoading: boolean;
  setIsAiInferenceLoading: (loading: boolean) => void;
  demoLimit: number;
  setDemoLimit: (limit: number) => void;
};

export const SessionContext = createContext<SessionContextType>({
  walletId: null,
  circleWalletId: null,
  apiKeyStatus: null,
  isAiInferenceLoading: false,
  setIsAiInferenceLoading: () => {},
  demoLimit: 0,
  setDemoLimit: () => {},
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
  walletId,
  circleWalletId,
  apiKeyStatus,
}: {
  children: React.ReactNode;
  walletId: string | null;
  circleWalletId: string | null;
  apiKeyStatus: any;
}) {
  const [isAiInferenceLoading, setIsAiInferenceLoading] = useState(false);
  const [demoLimit, setDemoLimit] = useState(0);

  return (
    <SessionContext.Provider
      value={{
        walletId,
        circleWalletId,
        apiKeyStatus,
        isAiInferenceLoading,
        setIsAiInferenceLoading,
        demoLimit,
        setDemoLimit,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
