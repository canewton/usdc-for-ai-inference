'use client';

import { Loader2 } from 'lucide-react';
import { type FunctionComponent, type HTMLProps, useState } from 'react';

import type { WalletTransferRequest } from '@/app/utils/circleWalletTransfer';
import { Button } from '@/components/ui/button';
import { aiModel } from '@/types/ai.types';

interface Props extends HTMLProps<HTMLElement> {
  walletId?: string;
}

export const TransferUSDCButton: FunctionComponent<Props> = ({
  walletId,
  className,
}) => {
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    setLoading(true);
    try {
      const transfer: WalletTransferRequest = {
        circleWalletId: walletId ?? '',
        amount: '0.1',
        projectName: 'Hi',
        aiModel: aiModel.TEXT_TO_TEXT,
      };

      const response = await fetch('/api/wallet/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transfer),
      });

      if (!response.ok) {
        throw new Error('Transfer failed');
      }

      const result = await response.json();
      console.log('Transfer initiated:', result);
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button className={className} disabled={loading} onClick={handleAction}>
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        'Transfer USDC'
      )}
    </Button>
  );
};
