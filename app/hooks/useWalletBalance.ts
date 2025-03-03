'use client';

import type { RealtimePostgresUpdatePayload } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { createClient } from '@/utils/supabase/client';

interface UseWalletBalanceResult {
  balance: number;
  loading: boolean;
  refreshBalance: () => Promise<void>;
}

const supabase = createClient();

export function useWalletBalance(walletId: string): UseWalletBalanceResult {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchBalance = useCallback(async () => {
    try {
      setLoading(true);
      const balanceResponse = await fetch('/api/wallet/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletId }),
      });

      const response = await balanceResponse.json();
      const parsedBalance = response.tokenBalances?.find(
        ({ token }: { token: { symbol: string } }) => token.symbol === 'USDC',
      )?.amount;

      if (response.error) {
        console.error('Error fetching wallet balance:', response.error);
        toast.error('Error fetching wallet balance', {
          description: parsedBalance.error,
        });
        return;
      }

      if (parsedBalance === null || parsedBalance === undefined) {
        console.log('Wallet has no balance');
        toast.info('Wallet has no balance');
        setBalance(0);
        return;
      }

      setBalance(parsedBalance);
    } catch (error) {
      console.error('Error fetching balance:', error);
      toast.error('Failed to fetch balance');
    } finally {
      setLoading(false);
    }
  }, [walletId]);

  const updateWalletBalance = useCallback(
    (
      payload: RealtimePostgresUpdatePayload<Record<string, string>>,
      currentBalance: number,
    ) => {
      const stringifiedBalance = currentBalance.toString();
      const shouldUpdateBalance = payload.new.balance !== stringifiedBalance;

      if (shouldUpdateBalance) {
        toast.info('Wallet balance updated');
        setBalance(Number(payload.new.balance));
      }
    },
    [],
  );

  async function createWalletChannels() {
    const { data: existingWallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('circle_wallet_id', walletId)
      .single();
  }

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  useEffect(() => {
    const walletChangeSubscription = supabase
      .channel('wallet')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wallets',
          filter: `circle_wallet_id=eq.${walletId}`,
        },
        (payload) => updateWalletBalance(payload, balance),
      )
      .subscribe();

    const walletTransactionSubscription = supabase
      .channel('wallet')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
        },
        () => fetchBalance(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(walletChangeSubscription);
      supabase.removeChannel(walletTransactionSubscription);
    };
  }, [supabase, walletId, balance, updateWalletBalance]);

  return {
    balance,
    loading,
    refreshBalance: fetchBalance,
  };
}
