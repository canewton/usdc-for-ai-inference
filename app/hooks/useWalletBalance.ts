'use client';

import type { RealtimePostgresUpdatePayload } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { createClient } from '@/utils/supabase/client';

import { useSession } from '../contexts/SessionContext';

interface UseWalletBalanceResult {
  balance: number | null;
  refreshBalance: () => Promise<void>;
  error: string | null;
}

const supabase = createClient();

export function useWalletBalance(
  walletId: string,
  circleWalletId: string,
): UseWalletBalanceResult {
  const session = useSession();
  const [balance, setBalance] = useState(session.walletBalance);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBalance(session.walletBalance);
  }, [session.walletBalance]);

  const fetchBalance = useCallback(async () => {
    try {
      const balanceResponse = await fetch('/api/wallet/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletId: circleWalletId }),
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
        setError('Error fetching wallet balance');
        return;
      }

      setError(null);

      if (parsedBalance === null || parsedBalance === undefined) {
        console.log('Wallet has no balance');
        session.setWalletBalance(0);
        return;
      }

      session.setWalletBalance(parsedBalance);
    } catch (error) {
      console.error('Error fetching balance:', error);
      toast.error('Failed to fetch balance');
      setError('Failed to fetch balance');
    }
  }, [circleWalletId]);

  const updateWalletBalance = useCallback(
    (
      payload: RealtimePostgresUpdatePayload<Record<string, string>>,
      currentBalance: number | null,
    ) => {
      const stringifiedBalance = currentBalance?.toString();
      const shouldUpdateBalance = payload.new.balance !== stringifiedBalance;

      if (shouldUpdateBalance) {
        session.setWalletBalance(Number(payload.new.balance));
      }
    },
    [],
  );

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  useEffect(() => {
    const walletChangeSubscription = supabase
      .channel('wallet-change:' + walletId)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wallets',
          filter: `circle_wallet_id=eq.${circleWalletId}`,
        },
        (payload) => updateWalletBalance(payload, balance),
      )
      .subscribe();

    const walletTransactionSubscription = supabase
      .channel('wallet-transaction:' + walletId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `wallet_id=eq.${walletId}`,
        },
        () => fetchBalance(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(walletChangeSubscription);
      supabase.removeChannel(walletTransactionSubscription);
    };
  }, [supabase, circleWalletId, updateWalletBalance]);

  return {
    balance,
    error,
    refreshBalance: fetchBalance,
  };
}
