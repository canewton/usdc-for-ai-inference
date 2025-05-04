'use client';

import React, { useState } from 'react';
import { createContext, useContext } from 'react';

type SessionContextType = {
  wallet_id: string | null;
  circle_wallet_id: string | null;
  api_keys_status: any;
  is_ai_inference_loading: boolean;
  update_is_ai_inference_loading: (loading: boolean) => void;
  demo_limit: number;
  update_demo_limit: (limit: number) => void;
};

export const SessionContext = createContext<SessionContextType>({
  wallet_id: null,
  circle_wallet_id: null,
  api_keys_status: null,
  is_ai_inference_loading: false,
  update_is_ai_inference_loading: () => {},
  demo_limit: 0,
  update_demo_limit: () => {},
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
  api_keys_status,
}: {
  children: React.ReactNode;
  wallet_id: string | null;
  circle_wallet_id: string | null;
  api_keys_status: any;
}) {
  const [is_ai_inference_loading, update_is_ai_inference_loading] =
    useState(false);
  const [demo_limit, update_demo_limit] = useState(0);

  return (
    <SessionContext.Provider
      value={{
        wallet_id,
        circle_wallet_id,
        api_keys_status,
        is_ai_inference_loading,
        update_is_ai_inference_loading,
        demo_limit,
        update_demo_limit,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
