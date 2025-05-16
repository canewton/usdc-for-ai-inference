import { NextResponse } from 'next/server';

import type { WalletTransferRequest } from '@/app/utils/circleWalletTransfer';
import { circleWalletTransfer } from '@/app/utils/circleWalletTransfer';

export async function POST(request: Request) {
  try {
    const transferRequest: WalletTransferRequest = await request.json();
    const response = await circleWalletTransfer(
      transferRequest.projectName,
      transferRequest.aiModel,
      transferRequest.circleWalletId,
      transferRequest.amount,
    );

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Transfer failed:', error);
    return NextResponse.json(
      { error: `Transfer failed with error: ${error}` },
      { status: 500 },
    );
  }
}
