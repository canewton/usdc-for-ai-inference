'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import { ArrowDownUp, Search, SlidersHorizontal, X } from 'lucide-react';
import { type FunctionComponent, useEffect, useMemo, useState } from 'react';

import type { WalletTransactionsResponse } from '@/app/api/wallet/transactions/route';
import type { Wallet } from '@/types/database.types';
import { createClient } from '@/utils/supabase/client';

import { Transactions } from './transactions';

interface Transaction {
  id: string;
  status: string;
  created_at: string;
  circle_transaction_id: string;
  transaction_type: string;
  amount: string;
}

interface CircleTransaction {
  id: string;
  transactionType: string;
  amount: string[];
  status: string;
  description?: string;
  circle_contract_address?: string;
}

interface Props {
  wallet: Wallet;
  profile: {
    id: any;
  } | null;
}

interface CircleTransaction {
  id: string;
  transactionType: string;
  amount: string[];
  status: string;
  description?: string;
  circle_contract_address?: string;
}

interface Props {
  wallet: Wallet;
  profile: {
    id: any;
  } | null;
}

const ITEMS_PER_PAGE = 5;

async function syncTransactions(
  supabase: SupabaseClient,
  walletId: string,
  profileId: string,
  circleWalletId: string,
) {
  // 1. Fetch transactions from Circle API
  const transactionsResponse = await fetch(
    `${baseUrl}/api/wallet/transactions`,
    {
      method: 'POST',
      body: JSON.stringify({
        walletId: circleWalletId,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  const parsedTransactions: WalletTransactionsResponse =
    await transactionsResponse.json();

  if (parsedTransactions.error || !parsedTransactions.transactions) {
    return [];
  }

  // 2. Get existing transactions from database
  const { data: existingTransactions } = await supabase
    .from('transactions')
    .select('circle_transaction_id')
    .eq('wallet_id', walletId);

  const existingTransactionIds = new Set(
    existingTransactions?.map((t: any) => t.circle_transaction_id) || [],
  );

  // 3. Filter out transactions that already exist
  const newTransactions = parsedTransactions.transactions.filter(
    (transaction: any) => !existingTransactionIds.has(transaction.id),
  );

  // 4. Insert new transactions into the database
  if (newTransactions.length > 0) {
    const transactionsToInsert = newTransactions.map(
      (transaction: CircleTransaction) => {
        if (
          !transaction.id ||
          !transaction.transactionType ||
          !transaction.amount
        ) {
          throw new Error(
            `Invalid transaction structure: ${JSON.stringify(transaction)}`,
          );
        }

        return {
          wallet_id: walletId,
          profile_id: profileId,
          circle_transaction_id: transaction.id,
          transaction_type: transaction.transactionType,
          amount: parseFloat(transaction.amount[0]?.replace(/[$,]/g, '')) || 0,
          currency: 'USDC',
          status: transaction.status,
        };
      },
    );

    const { error } = await supabase
      .from('transactions')
      .insert(transactionsToInsert);

    if (error) {
      console.error('Error inserting transactions:', error);
    }
  }

  // 5. Return all transactions from database
  const { data: allTransactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('wallet_id', walletId)
    .order('created_at', { ascending: false });

  // Filter out duplicates keeping only the latest transaction for each circle_transaction_id
  const uniqueTransactions =
    allTransactions?.reduce((acc, current) => {
      const existingTransaction = acc.find(
        (item: { circle_transaction_id: any }) =>
          item.circle_transaction_id === current.circle_transaction_id,
      );
      if (!existingTransaction) {
        acc.push(current);
      }
      return acc;
    }, []) || [];

  return uniqueTransactions;
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

  const formattedData = useMemo(
    () =>
      data.map((transaction) => ({
        ...transaction,
        created_at: new Date(transaction.created_at).toLocaleString(),
        amount: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(Number(transaction.amount)),
      })),
    [data],
  );

  const updateTransactions = async () => {
    try {
      setLoading(true);

      // Sync and get transactions
      const transactions = await syncTransactions(
        supabase,
        props.wallet?.id,
        props.profile?.id,
        props.wallet?.circle_wallet_id,
      );

      setData(transactions);
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

    updateTransactions();

    return () => {
      supabase.removeChannel(transactionSubscription);
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
      <div className="max-w-5xl mx-auto">
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
        <Transactions data={filteredAndSortedTransactions} loading={loading} />
      </div>
    </div>
  );
};
