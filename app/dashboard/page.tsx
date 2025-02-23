import { DollarSign } from 'lucide-react';
import { redirect } from 'next/navigation';

import { RequestUsdcButton } from '@/components/request-usdc-button';
import { TransactionHistory } from '@/components/transaction-history';
import { USDCButton } from '@/components/usdc-button';
import { WalletBalance } from '@/components/wallet-balance';
import { WalletInformationDialog } from '@/components/wallet-information-dialog';
import { createClient } from '@/utils/supabase/server';

export default async function ProtectedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/sign-in');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  const { data: wallet } = await supabase
    .schema('public')
    .from('wallets')
    .select()
    .eq('profile_id', profile?.id)
    .single();

  return (
    <div className="px-20">
      {/* Wallet Card */}
      <h1 className="text-xl font-medium mb-6">Wallet Balance</h1>

      {/* Balance Display */}
      <div className="flex items-center justify-between mb-20">
        <div className="flex items-center gap-2">
          <h2 className="text-5xl font-bold">
            <WalletBalance walletId={wallet?.circle_wallet_id} />
          </h2>
          <DollarSign className="w-6 h-6 text-blue-500" />
        </div>
        <div className="flex gap-4">
          {process.env.NODE_ENV === 'development' && (
            <RequestUsdcButton walletAddress={wallet?.wallet_address} />
          )}
          <USDCButton
            className="flex-1"
            mode="BUY"
            walletAddress={wallet?.wallet_address}
          />
          <WalletInformationDialog wallet={wallet} />
        </div>
      </div>

      {/* Transactions Section */}
      <TransactionHistory wallet={wallet} profile={profile} />
    </div>
  );
}
