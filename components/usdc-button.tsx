'use client';

import { Loader2 } from 'lucide-react';
import { type FunctionComponent, type HTMLProps, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useWalletTokenId } from '@/app/hooks/useWalletTokenId';

interface Props extends HTMLProps<HTMLElement> {
  mode: 'BUY' | 'SELL' | 'TRANSFER';
  walletAddress?: string;
}



export const USDCButton: FunctionComponent<Props> = ({
  mode,
  walletAddress,
  className,
}) => {
  const [loading, setLoading] = useState(false);

  
  const { tokenId, tokenLoading, refreshTokenId } = useWalletTokenId(walletAddress || '');


  const handleAction = async () => {
    setLoading(true);
    try {
      if (mode === 'TRANSFER') {
        const transfer = {
          walletId: walletAddress, 
          tokenId: tokenId, 
          destinationAddress: '0x211cd52130a35916fcbac5a267ee400b6583011c', 
          amounts: ['0.1'],
          fee: {
            type: 'level',
            config: {
              feeLevel: 'MEDIUM'
            }
        }
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
