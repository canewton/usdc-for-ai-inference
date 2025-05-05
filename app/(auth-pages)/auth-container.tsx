'use client';

import type { PropsWithChildren } from 'react';

import { useSession } from '../contexts/SessionContext';

export const AuthContainer = ({ children }: PropsWithChildren) => {
  const session = useSession();
  session.setAi3dGenerations([]);
  session.setImageChats([]);
  session.setTextChats([]);
  session.setWalletBalance(null);
  session.setDemoLimit(0);
  session.setIsAiInferenceLoading(false);
  return <>{children}</>;
};
