import { TreasuryTransactions } from "@/components/usdc-insights/treasury-transactions";
import { WalletBalance } from "@/components/usdc-insights/wallet-balance";
import { createClient } from "@/utils/supabase/server";

import { USDCIcon } from "../../icons/USDCIcon";

export default async function TreasuryWalletPage() {
  const supabase = await createClient();

  const { data: treasuryWallet } = await supabase
    .schema("public")
    .from("wallets")
    .select()
    .eq("circle_wallet_id", process.env.NEXT_PUBLIC_TREASURY_WALLET_ID)
    .single();

  return (
    <div className="m-20">
      <h1 className="text-xl font-light mb-4">Treasury Wallet Balance</h1>

      {/* Balance Display */}
      <div className="flex items-center gap-2 mb-10">
        <h2 className="text-5xl font-bold">
          <WalletBalance
            circleWalletId={treasuryWallet?.circle_wallet_id}
            walletId={treasuryWallet?.id}
          />
        </h2>
        <div className="bg-[#F1F8FF] rounded-full p-3 flex items-center justify-center">
          <USDCIcon className="text-blue-500" />
        </div>
      </div>
      <TreasuryTransactions treasuryWallet={treasuryWallet} />
    </div>
  );
}
