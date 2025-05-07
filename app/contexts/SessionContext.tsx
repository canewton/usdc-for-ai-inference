'use client';

import React, { useState } from 'react';
import { createContext, useContext } from 'react';

import type {
  Ai3dGeneration,
  Chat,
  VideoGeneration,
} from '@/types/database.types';

type SessionContextType = {
  walletId: string | null;
  circleWalletId: string | null;
  apiKeyStatus: any;
  isAiInferenceLoading: boolean;
  setIsAiInferenceLoading: (loading: boolean) => void;
  demoLimit: number;
  setDemoLimit: (limit: number) => void;
  ai3dGenerations: Ai3dGeneration[];
  setAi3dGenerations: (generations: Ai3dGeneration[]) => void;
  imageChats: Chat[];
  setImageChats: (chats: Chat[]) => void;
  videoGenerations: VideoGeneration[];
  setVideoGenerations: (generations: VideoGeneration[]) => void;
  textChats: Chat[];
  setTextChats: (chats: Chat[]) => void;
  walletBalance: number | null;
  setWalletBalance: (balance: number | null) => void;
};

export const SessionContext = createContext<SessionContextType>({
  walletId: null,
  circleWalletId: null,
  apiKeyStatus: null,
  isAiInferenceLoading: false,
  setIsAiInferenceLoading: () => {},
  demoLimit: 0,
  setDemoLimit: () => {},
  ai3dGenerations: [],
  setAi3dGenerations: () => {},
  imageChats: [],
  setImageChats: () => {},
  videoGenerations: [],
  setVideoGenerations: () => {},
  textChats: [],
  setTextChats: () => {},
  walletBalance: null,
  setWalletBalance: () => {},
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
  const [ai3dGenerations, setAi3dGenerations] = useState<Ai3dGeneration[]>([]);
  const [imageChats, setImageChats] = useState<Chat[]>([]);
  const [videoGenerations, setVideoGenerations] = useState<VideoGeneration[]>(
    [],
  );
  const [textChats, setTextChats] = useState<Chat[]>([]);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

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
        ai3dGenerations,
        setAi3dGenerations,
        imageChats,
        setImageChats,
        videoGenerations,
        setVideoGenerations,
        textChats,
        setTextChats,
        walletBalance,
        setWalletBalance,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
