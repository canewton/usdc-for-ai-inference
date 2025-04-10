'use client';
import { useSession } from '@/app/contexts/SessionContext';
import { useWalletBalance } from '@/app/hooks/useWalletBalance';
import USDC from '@/public/usdc-circle.svg';

import { Card, CardContent } from './ui/card';

interface UsdcBalanceCardProps {
  direction: 'row' | 'column';
}

export default function UsdcBalanceCard({ direction }: UsdcBalanceCardProps) {
  const session = useSession();
  const { balance, loading } = useWalletBalance(
    session.wallet_id,
    session.circle_wallet_id,
  );

  return (
    <Card className="w-full h-fit bg-white border-[#eaeaec]">
      <CardContent
        className={`flex p-5 ${direction === 'column' && 'flex-col'}`}
      >
        <img src={USDC.src} className="w-12 h-12 mr-4" alt="USDC Icon" />
        <div className="overflow-hidden">
          <h3 className="[font-family:'SF_Pro-Regular',Helvetica] font-normal text-gray-900 text-xl tracking-[-0.22px] leading-[30px] truncate">
            ${balance.toFixed(2)}
          </h3>
          <p className="[font-family:'SF_Pro-Regular',Helvetica] font-normal text-gray-500 text-sm tracking-[-0.15px] leading-[21px] truncate">
            USDC Balance
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
