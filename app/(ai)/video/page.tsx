'use client';
import { useSession } from '@/app/contexts/SessionContext';
import { aiModel } from '@/types/ai.types';
import { WalletTransferRequest } from '../server/circleWalletTransfer';

export default function ImageToVideoPage() {
  const session = useSession();

  const handleSubmit = async () => {
    
      try {
        // Transfer balance 
        // TODO: update amount
        const transfer: WalletTransferRequest = {
          circleWalletId: session.wallet_id ?? '',
          amount: (0).toString(),
          projectName: 'Hi',
          aiModel: aiModel.IMAGE_TO_VIDEO,
        };
  
        const transferResponse = await fetch('/api/wallet/transfer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transfer),
        });
  
        if (!transferResponse.ok) {
          throw new Error('Transfer failed');
        }
  
        const result = await transferResponse.json();
        console.log('Transfer initiated:', result);
      } catch (error) {
        console.error('Error generating image:', error);
      }
    };

  return (
    <>
      <div className={`${!session.api_key_status.video ? 'flex flex-row items-center justify-center text-white overlay fixed inset-0 bg-gray-800 bg-opacity-80 z-50 pointer-events-auto' : 'hidden'}`}>
        This page is not available during the hosted demo.
      </div>
    </>
  )
}