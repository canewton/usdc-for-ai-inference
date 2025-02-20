'use client';

import { Loader2 } from 'lucide-react';
import { type FunctionComponent, type HTMLProps, useState } from 'react';

import { Button } from '@/components/ui/button';

interface Props extends HTMLProps<HTMLElement> {
  mode: 'BUY' | 'SELL' | 'TRANSFER';
  walletAddress: string;
  walletId?: string;
}

export const USDCButton: FunctionComponent<Props> = ({
  mode,
  walletAddress,
  walletId,
  className,
}) => {
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    setLoading(true);
    try {
      if (mode === 'TRANSFER') {
        const transfer = {
          walletId: walletId,
          tokenId: /*idk what to add her */'', 
          destinationAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', 
          amounts: ['1000000000'],
          feeLevel: 'MEDIUM' as const
        };

        const response = await fetch('/api/transfer', {
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
      } else {
        const usdcAccessResponse = await fetch(`/api/usdc/${mode.toLowerCase()}`, {
          method: 'POST',
          body: JSON.stringify({
            wallet_address: walletAddress,
          }),
        });

        const parsedUsdcAccessResponse = await usdcAccessResponse.json();
        window.open(parsedUsdcAccessResponse.url, 'popup', 'width=500,height=600');
      }
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
      ) : mode === 'BUY' ? (
        'Deposit'
      ) : mode === 'SELL' ? (
        'Withdraw'
      ) : (
        'Transfer'
      )}
    </Button>
  );
};
