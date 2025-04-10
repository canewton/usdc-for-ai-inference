import { TreasuryTransactions } from '@/components/usdc-insights/treasury-transactions';
import { createClient } from '@/utils/supabase/server';

export default async function TreasuryWalletPage() {
  const supabase = await createClient();

  const { data: treasuryWallet } = await supabase
    .schema('public')
    .from('wallets')
    .select()
    .eq('circle_wallet_id', process.env.NEXT_PUBLIC_TREASURY_WALLET_ID)
    .single();

  return (
    <div className="m-20">
      <TreasuryTransactions treasuryWallet={treasuryWallet} />
    </div>
  );
}
