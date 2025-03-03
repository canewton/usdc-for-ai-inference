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
import { WalletBalance } from '@/components/wallet-balance';
import type { Wallet } from '@/types/database.types';

interface Props {
  wallet: Wallet;
}

export const WalletInformationDialog: FunctionComponent<Props> = (props) => {
  const formattedBalance = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(props.wallet.balance));

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="ml-auto">Wallet Information</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Wallet information</DialogTitle>
        </DialogHeader>
        <div className="grid py-4">
          <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mb-2">
            Balance
          </h4>
          <div className="text-xl text-muted-foreground cursor-pointer mb-4">
            <WalletBalance walletId={props.wallet.id} circleWalletId={props.wallet.circle_wallet_id} />
          </div>
          <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mb-2">
            ID
          </h4>
          <div className="flex w-full items-center mb-4">
            <Input disabled value={props.wallet.circle_wallet_id} />
            <CopyButton text={props.wallet.circle_wallet_id} />
          </div>
          <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mb-2">
            Address
          </h4>
          <div className="flex w-full items-center mb-4">
            <Input disabled value={props.wallet.wallet_address} />
            <CopyButton text={props.wallet.wallet_address} />
          </div>
          <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mb-2">
            Blockchain
          </h4>
          <p className="text-xl text-muted-foreground cursor-pointer">
            {props.wallet.blockchain || 'No wallet found'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
