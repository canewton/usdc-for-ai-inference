'use client';

import { Loader2 } from 'lucide-react';
import { type FunctionComponent, type HTMLProps, useState } from 'react';

import { USDCIcon } from '@/app/icons/USDCIcon';
import { Button } from '@/components/ui/button';

interface Props extends HTMLProps<HTMLElement> {
  mode: 'BUY' | 'SELL' | 'TRANSFER';
  walletAddress?: string;
}

export const USDCButton: FunctionComponent<Props> = ({
  mode,
  walletAddress,
}) => {
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    setLoading(true);
    try {
      const usdcAccessResponse = await fetch(
        `/api/usdc/${mode.toLowerCase()}`,
        {
          method: 'POST',
          body: JSON.stringify({
            wallet_address: walletAddress,
          }),
        },
      );

      const parsedUsdcAccessResponse = await usdcAccessResponse.json();
      window.open(
        parsedUsdcAccessResponse.url,
        'popup',
        'width=500,height=600',
      );
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
      disabled={loading}
      onClick={handleAction}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : mode === 'BUY' ? (
        <>
          <USDCIcon />
          <span> Wire Transfer</span>
        </>
      ) : (
        'Withdraw'
      )}
    </Button>
  );
};
