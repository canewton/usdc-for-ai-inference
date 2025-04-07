'use client';

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { WalletBalance } from "./wallet-balance";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from 'next/navigation';

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
  isImageInput,
  refreshTrigger = 0,
}: RightAiSidebarProps) {
  const router = useRouter();

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    let isMounted = true;
    
    async function fetchWalletData() {
      if (!isMounted) return;
      setIsLoading(true);
      
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/sign-in');
          return;
        }
        
        // Get profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('auth_user_id', user.id)
          .single();
        
        if (profile && isMounted) {
          // Get wallet
          const { data: walletData } = await supabase
            .schema('public')
            .from('wallets')
            .select()
            .eq('profile_id', profile.id)
            .single();
          
          if (isMounted) {
            setWallet(walletData);
          }
        }
      } catch (error) {
        console.error('Error fetching wallet data:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    
    fetchWalletData();
    
    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]); // Add refreshTrigger as dependency
  
  // Show loading state
  if (isLoading) {
    return (
      <aside 
        className={`flex w-1/3 flex-col items-center p-6 border border-gray-200 rounded-l-3xl h-screen bg-section`}
      >
        <div className="p-4 border border-gray-200 rounded-lg bg-white mb-4 w-full">
          <div className="text-center py-2">Loading...</div>
        </div>
        {children}
      </aside>
    );
  }
  
  return (
    <aside
      className={`flex w-1/3 flex-col items-center p-6 border border-gray-200 rounded-l-3xl h-screen bg-section`}
    >
      <div className="px-4 py-3 border border-gray-200 rounded-lg bg-white mb-4 w-full">
        {wallet ? (
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
                  circleWalletId={wallet.circle_wallet_id} 
                  walletId={wallet.id}
                  key={`balance-${refreshTrigger}`} 
                />
                <div className="text-xs text-gray-500">USDC Balance</div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-sm text-gray-500">Wallet not found</div>
        )}
      </div>

      {children}
    </aside>
  );
}