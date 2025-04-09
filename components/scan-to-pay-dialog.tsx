import type { FunctionComponent } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { WalletQRCode } from '@/components/wallet-qr-code';
import type { Wallet } from '@/types/database.types';

interface Props {
  wallet: Wallet;
}

export const ScanToPayDialog: FunctionComponent<Props> = (props) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="ml-auto">Scan to Pay</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Scan to Pay</DialogTitle>
        </DialogHeader>
        <div className="grid py-4">
          <p className="text-center text-muted-foreground mb-4">
            Scan this QR code to copy the wallet ID
          </p>
          <WalletQRCode walletId={props.wallet.circle_wallet_id} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
