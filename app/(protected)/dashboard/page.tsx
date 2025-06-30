import { redirect } from 'next/navigation';

import { USDCIcon } from '@/app/icons/USDCIcon';
import { TransactionHistory } from '@/components/usdc-insights/transaction-history';
import { ScanToPayDialog } from '@/components/usdc-wallet/scan-to-pay-dialog';
import { TransferUSDCButton } from '@/components/usdc-wallet/transfer-usdc-button';
import { USDCButton } from '@/components/usdc-wallet/usdc-button';
import { WalletBalance } from '@/components/usdc-wallet/wallet-balance';
import { WalletInformationDialog } from '@/components/usdc-wallet/wallet-information-dialog';
import { createClient } from '@/utils/supabase/server';

export default async function Dashboard() {
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
    <div className="px-20 pt-20">
      {/* Wallet Card */}
      <h1 className="text-xl font-light mb-4">Wallet Balance</h1>

      {/* Balance Display */}
      <div className="flex items-center justify-between mb-20">
        <div className="flex items-center gap-2">
          <h2 className="text-5xl font-bold">
            <WalletBalance
              circleWalletId={wallet?.circle_wallet_id}
              walletId={wallet?.id}
            />
          </h2>
          <div className="bg-[#F1F8FF] rounded-full p-3 flex items-center justify-center">
            <USDCIcon className="text-blue-500" />
          </div>
        </div>
        <div className="flex gap-4">
          {process.env.NODE_ENV === 'development' && (
            <TransferUSDCButton
              className="flex-1"
              walletId={wallet?.circle_wallet_id}
            />
          )}
          {/* <RequestUsdcButton walletAddress={wallet?.wallet_address} /> */}
          {/* Buy USDC Button functionality is being deprecated */}
          <USDCButton
            className="flex-1"
            mode="BUY"
            walletAddress={wallet?.wallet_address}
          />
          <ScanToPayDialog wallet={wallet} />
          <WalletInformationDialog wallet={wallet} />
        </div>
      </div>

      {/* Transactions Section */}
      <TransactionHistory wallet={wallet} profile={profile} />
    </div>
  );
}
