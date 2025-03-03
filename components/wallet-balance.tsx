'use client';

import { useWalletBalance } from '@/app/hooks/useWalletBalance';

import { Skeleton } from './ui/skeleton';

interface WalletBalanceProps {
  circleWalletId: string;
  walletId: string;
}

export function WalletBalance({ walletId, circleWalletId }: WalletBalanceProps) {
  const { balance, loading } = useWalletBalance(walletId, circleWalletId);

  if (balance == 0 && loading) {
    return <Skeleton className="w-[103px] h-[28px] rounded-full" />;
  }

  const formattedBalance = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(balance);

  return formattedBalance;
}
