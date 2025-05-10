import { WalletIcon } from 'lucide-react';
import type { FunctionComponent } from 'react';

import { CopyButton } from '@/components/copy-button';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { WalletBalance } from '@/components/usdc-wallet/wallet-balance';
import type { Wallet } from '@/types/database.types';

interface Props {
  wallet: Wallet;
}

export const WalletInformationDialog: FunctionComponent<Props> = ({
  wallet,
}) => {
  if (!wallet) {
    return <div />;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 bg-white hover:bg-gray-50 text-blue-500 px-4 py-2 rounded-lg border border-gray-200 transition-colors">
          <WalletIcon />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] p-10">
        <DialogHeader>
          <DialogTitle>Wallet information</DialogTitle>
        </DialogHeader>
        <div className="grid py-4">
          <h4 className="scroll-m-20 text-xl tracking-tight mb-2">Balance</h4>
          <div className="text-xl text-muted-foreground cursor-pointer mb-4">
            <WalletBalance
              walletId={wallet.id}
              circleWalletId={wallet.circle_wallet_id}
            />
          </div>
          <h4 className="scroll-m-20 text-xl tracking-tight mb-2">ID</h4>
          <div className="flex w-full items-center mb-4">
            <Input disabled value={wallet.circle_wallet_id} />
            <CopyButton text={wallet.circle_wallet_id} />
          </div>
          <h4 className="scroll-m-20 text-xl tracking-tight mb-2">Address</h4>
          <div className="flex w-full items-center mb-4">
            <Input disabled value={wallet.wallet_address} />
            <CopyButton text={wallet.wallet_address} />
          </div>
          <h4 className="scroll-m-20 text-xl tracking-tight mb-2">
            Blockchain
          </h4>
          <p className="text-xl text-muted-foreground cursor-pointer">
            {wallet.blockchain || 'No wallet found'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
