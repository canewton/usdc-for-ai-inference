'use client';

import { type FunctionComponent, useEffect, useMemo, useState } from 'react';

import type { Wallet } from '@/types/database.types';
import { createClient } from '@/utils/supabase/client';

import { Billing, type BillingTransaction } from './billing';
import { TransactionGraphs } from './transaction-graphs';
import { Transactions } from './transactions';

interface Transaction {
  id: string;
  wallet_id: string;
  profile_id: string;
  status: string;
  created_at: string;
  circle_transaction_id: string;
  transaction_type: string;
  amount: string;
  balance: string;
  currency: string;
  description: string;
  circle_contact_address: string;
}

interface Props {
  wallet: Wallet;
  treasuryWallet: Wallet;
  profile: {
    id: any;
  } | null;
}

const supabase = createClient();

export type SortField = 'date' | 'amount' | 'status' | 'balance' | 'name';
type SortDirection = 'asc' | 'desc';

export const TransactionHistory: FunctionComponent<Props> = (props) => {
  const [activeTab, setActiveTab] = useState('transactions');
  const [loading, setLoading] = useState(false);
  const [transactionData, setTransactionData] = useState<Transaction[]>([]);
  const [treasuryData, setTreasuryData] = useState<Transaction[]>([]);
  const [billingData, setBillingData] = useState<BillingTransaction[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    field: SortField;
    direction: SortDirection;
  }>({
    field: 'date',
    direction: 'desc',
  });

  const formattedTransactionData = useMemo(() => {
    const formatted = transactionData.map((transaction) => ({
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
  }, [transactionData, sortConfig]);

  const formattedBillingData = useMemo(() => {
    const formatted = billingData.map((transaction) => ({
      ...transaction,
      created_at: new Date(transaction.created_at).toLocaleString(),
      expanded: false,
      amount: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(transaction.amount)),
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
      } else if (sortConfig.field === 'name') {
        return sortConfig.direction === 'asc'
          ? a.project_name?.localeCompare(b.project_name)
          : b.project_name?.localeCompare(a.project_name);
      }
      return 0;
    });
  }, [billingData, sortConfig]);

  const formattedTreasuryData = useMemo(
    () =>
      treasuryData.map((transaction) => ({
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
      })),
    [treasuryData],
  );

  const handleSort = (field: SortField) => {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const updateTransactions = async () => {
    try {
      setLoading(true);

      console.log('Fetching wallet balance', props.wallet);
      console.log('Fetching wallet balance', props.treasuryWallet);

      const walletBalance = await (
        await fetch('/api/wallet/balance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ walletId: props.wallet?.circle_wallet_id }),
        })
      ).json();

      const treasuryWalletBalance = await (
        await fetch('/api/wallet/balance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletId: props.treasuryWallet?.circle_wallet_id,
          }),
        })
      ).json();

      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('wallet_id', props.wallet?.id)
        .eq('transaction_type', 'INBOUND')
        .order('created_at', { ascending: false });

      const transactionsUpdated = await Promise.all(
        (transactions ?? []).map(async (transaction: Transaction) => {
          if (transaction.balance == null) {
            const balance = walletBalance;
            const parsedBalance = balance.tokenBalances?.find(
              ({ token }: { token: { symbol: string } }) =>
                token.symbol === 'USDC',
            )?.amount;
            transaction.balance = parsedBalance;
            console.log(
              'Updating transaction:',
              parseFloat(transaction.balance),
            );
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

      const { data: treasuryTransactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('wallet_id', props.treasuryWallet?.id)
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
            supabase
              .from('transactions')
              .update({ balance: parseFloat(transaction.balance) })
              .eq('id', transaction.id)
              .select('*')
              .single();
          }
          return transaction;
        }),
      );

      setTransactionData(transactionsUpdated);
      setTreasuryData(treasuryTransactionsUpdated);
      updateBillingTransactions();
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBillingTransactions = async () => {
    try {
      setLoading(true);

      const { data: projects } = await supabase
        .from('ai_projects')
        .select('*')
        .eq('circle_wallet_id', props.wallet?.circle_wallet_id)
        .order('created_at', { ascending: false });

      var hasNull = false;

      const circleTransactionIds = (projects ?? []).map(
        (p) => p.circle_transaction_id,
      );

      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .in('circle_transaction_id', circleTransactionIds);

      const transactionMap = new Map(
        (transactions ?? []).map((tx) => [tx.circle_transaction_id, tx]),
      );

      const billingTransactions: BillingTransaction[] = (projects ?? []).map(
        (project) => {
          const transaction = transactionMap.get(project.circle_transaction_id);

          if (!transaction) {
            hasNull = true;
          }

          return {
            id: project.id,
            ai_model: project.ai_model,
            project_name: project.project_name,
            transaction_type: transaction?.transaction_type,
            amount: transaction?.amount,
            status: transaction?.status,
            created_at: project.created_at,
            expanded: false,
          };
        },
      );

      if (!hasNull) {
        setBillingData(billingTransactions);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  useEffect(() => {
    const billingSubscription = supabase
      .channel('ai-projects')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_projects',
          filter: `circle_wallet_id=eq.${props.wallet?.circle_wallet_id}`,
        },
        () => updateBillingTransactions(),
      )
      .subscribe();

    const transactionSubscription = supabase
      .channel('transactions')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transactions',
          filter: `profile_id=eq.${props.profile?.id}`,
        },
        () => updateTransactions(),
      )
      .subscribe();

    const walletTransactionSubscription = supabase
      .channel('wallet-history')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `wallet_id=eq.${props.wallet?.id}`,
        },
        () => updateTransactions(),
      )
      .subscribe();

    updateTransactions();
    updateBillingTransactions();

    return () => {
      supabase.removeChannel(transactionSubscription);
      supabase.removeChannel(walletTransactionSubscription);
      supabase.removeChannel(billingSubscription);
    };
  }, []);

  return (
    <div className="min-h-screen">
      <div className="mx-auto">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-8">
            <button
              className={`pb-4 px-1 ${
                activeTab === 'transactions'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500'
              }`}
              onClick={() => setActiveTab('transactions')}
            >
              Transaction History
            </button>
            <button
              className={`pb-4 px-1 ${
                activeTab === 'billing'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500'
              }`}
              onClick={() => setActiveTab('billing')}
            >
              Billing History
            </button>
            <button
              className={`pb-4 px-1 ${
                activeTab === 'usage'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500'
              }`}
              onClick={() => setActiveTab('usage')}
            >
              Usage
            </button>
          </div>
        </div>

        {/* Transaction Table */}
        {activeTab == 'transactions' && (
          <Transactions
            data={formattedTransactionData}
            loading={loading}
            sortConfig={sortConfig}
            onSort={handleSort}
          />
        )}
        {activeTab == 'billing' && (
          <Billing
            data={formattedBillingData}
            loading={loading}
            sortConfig={sortConfig}
            onSort={handleSort}
          />
        )}
        {activeTab == 'usage' && <TransactionGraphs data={billingData} />}
      </div>
    </div>
  );
};
