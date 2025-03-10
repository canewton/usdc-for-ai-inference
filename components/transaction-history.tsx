'use client';

import { ArrowDownUp, Search, SlidersHorizontal, X } from 'lucide-react';
import { type FunctionComponent, useEffect, useMemo, useState } from 'react';

import type { Wallet } from '@/types/database.types';
import { createClient } from '@/utils/supabase/client';

import { Transactions } from './transactions';
import { WalletBalance } from './wallet-balance';

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

const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
  ? process.env.NEXT_PUBLIC_VERCEL_URL
  : 'http://localhost:3000';

const supabase = createClient();

type SortField = 'date' | 'amount';
type SortDirection = 'asc' | 'desc';

export const TransactionHistory: FunctionComponent<Props> = (props) => {
  const [activeTab, setActiveTab] = useState('transactions');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    field: SortField;
    direction: SortDirection;
  }>({
    field: 'date',
    direction: 'desc',
  });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Transaction[]>([]);
  const [treasuryData, setTreasuryData] = useState<Transaction[]>([]);

  const formattedData = useMemo(
    () =>
      data.map((transaction) => ({
        ...transaction,
        created_at: new Date(transaction.created_at).toLocaleString(),
        expanded: false,
        amount: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(Number(transaction.amount)),
      })),
    [data],
  );

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
      })),
    [treasuryData],
  );

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

      setData(transactionsUpdated);
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

    return () => {
      supabase.removeChannel(transactionSubscription);
      supabase.removeChannel(walletTransactionSubscription);
    };
  }, []);

  const transactionTypes = [...new Set(data.map((t) => t.transaction_type))];

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const clearFilters = () => {
    setSelectedTypes([]);
    setSearchQuery('');
  };

  const handleSort = (field: SortField) => {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = formattedData;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (t) =>
          t.transaction_type
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          t.amount.toString().includes(searchQuery),
      );
    }

    // Apply type filters
    if (selectedTypes.length > 0) {
      filtered = filtered.filter((t) =>
        selectedTypes.includes(t.transaction_type),
      );
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      if (sortConfig.field === 'date') {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
      } else {
        return sortConfig.direction === 'asc'
          ? parseFloat(a.amount.replace(/[$,]/g, '')) -
              parseFloat(b.amount.replace(/[$,]/g, ''))
          : parseFloat(b.amount.replace(/[$,]/g, '')) -
              parseFloat(a.amount.replace(/[$,]/g, ''));
      }
    });
  }, [data, searchQuery, selectedTypes, sortConfig]);

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
                activeTab === 'treasury'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500'
              }`}
              onClick={() => setActiveTab('treasury')}
            >
              Treasury Wallet
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center justify-between mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors ${showFilterMenu ? 'bg-gray-50' : ''}`}
                onClick={() => {
                  setShowFilterMenu(!showFilterMenu);
                  setShowSortMenu(false);
                }}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filter By
                {selectedTypes.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">
                    {selectedTypes.length}
                  </span>
                )}
              </button>
              {showFilterMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium">Filter Transactions</h3>
                      {selectedTypes.length > 0 && (
                        <button
                          onClick={clearFilters}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {transactionTypes.map((type) => (
                        <label
                          key={type}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTypes.includes(type)}
                            onChange={() => toggleType(type)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors ${showSortMenu ? 'bg-gray-50' : ''}`}
                onClick={() => {
                  setShowSortMenu(!showSortMenu);
                  setShowFilterMenu(false);
                }}
              >
                <ArrowDownUp className="w-4 h-4" />
                Sort By
              </button>
              {showSortMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <div className="p-2">
                    <button
                      className={`w-full text-left px-4 py-2 text-sm rounded-md hover:bg-gray-50 ${
                        sortConfig.field === 'date'
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-700'
                      }`}
                      onClick={() => handleSort('date')}
                    >
                      Date{' '}
                      {sortConfig.field === 'date' &&
                        (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </button>
                    <button
                      className={`w-full text-left px-4 py-2 text-sm rounded-md hover:bg-gray-50 ${
                        sortConfig.field === 'amount'
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-700'
                      }`}
                      onClick={() => handleSort('amount')}
                    >
                      Amount{' '}
                      {sortConfig.field === 'amount' &&
                        (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {(selectedTypes.length > 0 || searchQuery) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedTypes.map((type) => (
              <span
                key={type}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm"
              >
                {type}
                <button
                  onClick={() => toggleType(type)}
                  className="hover:bg-blue-100 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm">
                Search: {searchQuery}
                <button
                  onClick={() => setSearchQuery('')}
                  className="hover:bg-blue-100 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Transaction Table */}
        {activeTab !== 'treasury' && (
          <Transactions
            data={filteredAndSortedTransactions}
            loading={loading}
          />
        )}
        {activeTab == 'treasury' && (
          <>
            <span>
              Treasury Wallet Balance:{' '}
              <WalletBalance
                circleWalletId={
                  process.env.NEXT_PUBLIC_TREASURY_WALLET_ID ?? ''
                }
                walletId={process.env.NEXT_PUBLIC_TREASURY_WALLET_DB_ID ?? ''}
              />
            </span>
            <Transactions data={formattedTreasuryData} loading={loading} />
          </>
        )}
      </div>
    </div>
  );
};
