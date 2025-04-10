'use client';

import { useEffect, useMemo, useState } from 'react';

import type { Transaction, Wallet } from '@/types/database.types';
import { createClient } from '@/utils/supabase/client';

import type { SortField } from './transaction-history';
import { Transactions } from './transactions';

type SortDirection = 'asc' | 'desc';

interface Props {
  treasuryWallet: Wallet;
}

export const TreasuryTransactions = ({ treasuryWallet }: Props) => {
  const [treasuryData, setTreasuryData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    field: SortField;
    direction: SortDirection;
  }>({
    field: 'date',
    direction: 'desc',
  });
  const supabase = createClient();

  const formatData = (data: Transaction[]) => {
    const formatted = data.map((transaction) => ({
      ...transaction,
      created_at: new Date(transaction.created_at).toLocaleString(),
      expanded: false,
      amount: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(transaction.amount)),
      balance: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(transaction.balance)),
    }));

    return formatted.sort((a, b) => {
      if (sortConfig.field === 'date') {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortConfig.field === 'amount') {
        const amountA = parseFloat(a.amount.replace(/[^0-9.-]+/g, ''));
        const amountB = parseFloat(b.amount.replace(/[^0-9.-]+/g, ''));
        return sortConfig.direction === 'asc'
          ? amountA - amountB
          : amountB - amountA;
      } else if (sortConfig.field === 'balance') {
        const amountA = parseFloat(a.balance.replace(/[^0-9.-]+/g, ''));
        const amountB = parseFloat(b.balance.replace(/[^0-9.-]+/g, ''));
        return sortConfig.direction === 'asc'
          ? amountA - amountB
          : amountB - amountA;
      }
      return 0;
    });
  };

  const formattedTreasuryData = useMemo(() => {
    return formatData(treasuryData);
  }, [treasuryData, sortConfig]);

  const updateTransactions = async () => {
    try {
      setLoading(true);
      const treasuryWalletBalance = await (
        await fetch('/api/wallet/balance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletId: treasuryWallet?.circle_wallet_id,
          }),
        })
      ).json();

      const { data: treasuryTransactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('wallet_id', treasuryWallet?.id)
        .order('created_at', { ascending: false });

      const treasuryTransactionsUpdated = await Promise.all(
        (treasuryTransactions ?? []).map(async (transaction: Transaction) => {
          if (transaction.balance == null) {
            const balance = treasuryWalletBalance;
            const parsedBalance = balance.tokenBalances?.find(
              ({ token }: { token: { symbol: string } }) =>
                token.symbol === 'USDC',
            )?.amount;
            transaction.balance = parsedBalance;
            await supabase
              .from('transactions')
              .update({ balance: parseFloat(transaction.balance) })
              .eq('id', transaction.id)
              .select('*')
              .single();
          }
          return transaction;
        }),
      );

      setTreasuryData(treasuryTransactionsUpdated);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const transactionSubscription = supabase
      .channel('transactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `wallet_id=eq.${process.env.NEXT_PUBLIC_TREASURY_WALLET_ID}`,
        },
        () => updateTransactions(),
      )
      .subscribe();

    updateTransactions();

    return () => {
      supabase.removeChannel(transactionSubscription);
    };
  }, []);

  const handleSort = (field: SortField) => {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  return (
    <Transactions
      data={formattedTreasuryData}
      loading={loading}
      sortConfig={sortConfig}
      onSort={handleSort}
    />
  );
};
