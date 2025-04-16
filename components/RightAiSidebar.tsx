'use client';

import Image from 'next/image';
import React from 'react';

import { useSession } from '@/app/contexts/SessionContext';

import { WalletBalance } from './usdc-insights/wallet-balance';

interface RightAiSidebarProps {
  children: React.ReactNode;
  isImageInput: boolean;
  refreshTrigger?: number; // Add optional refresh trigger prop
}

interface Wallet {
  id: string;
  circle_wallet_id: string;
}

export default function RightAiSidebar({
  children,
  refreshTrigger = 0,
}: RightAiSidebarProps) {
  const session = useSession();
  return (
    <aside
      className={`flex w-1/3 min-w-[300px] flex-col items-center p-6 border border-gray-200 rounded-l-3xl bg-section h-[calc(100vh-85px)] overflow-y-auto space-y-[20px]`}
    >
      <div className="px-4 py-3 border border-gray-200 rounded-lg bg-white mb-4 w-full">
        {session.circle_wallet_id && session.wallet_id ? (
          <>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 relative bg-blue-50 rounded-full flex items-center justify-center">
                <Image
                  src="/usdc-circle.svg"
                  alt="Circle USDC"
                  width={50}
                  height={50}
                />
              </div>
              <div className="flex flex-col">
                <WalletBalance
                  circleWalletId={session.circle_wallet_id}
                  walletId={session.wallet_id}
                  key={`balance-${refreshTrigger}`}
                />
                <div className="text-xs text-gray-500">USDC Balance</div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-sm text-gray-500">
            Wallet not found
          </div>
        )}
      </div>

      {children}
    </aside>
  );
}
