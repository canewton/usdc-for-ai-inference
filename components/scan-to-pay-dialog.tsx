import type { FunctionComponent } from 'react';

import { ScanIcon } from '@/app/icons/ScanIcon';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { WalletQRCode } from '@/components/wallet-qr-code';
import type { Wallet } from '@/types/database.types';

import { Button } from './ui/button';

interface Props {
  wallet: Wallet;
}

export const ScanToPayDialog: FunctionComponent<Props> = (props) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 bg-white hover:bg-gray-50 text-blue-500 rounded-lg transition-colors border border-gray-200">
          <ScanIcon />
          Scan to Fund
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Scan to Fund</DialogTitle>
        </DialogHeader>
        <div className="grid py-4">
          <p className="text-center text-muted-foreground mb-4">
            Scan this QR code to copy the wallet ID
          </p>
          <WalletQRCode walletId={props.wallet?.wallet_address} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
