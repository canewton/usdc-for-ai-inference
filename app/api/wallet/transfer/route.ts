import { NextResponse } from 'next/server';

import { circleDeveloperSdk } from '@/utils/developer-controlled-wallets-client';

async function buildTransfer(
  circleWalletId: string,
  amount: string,
): Promise<any> {
  try {
    const balanceResponse = await circleDeveloperSdk.getWalletTokenBalance({
      id: circleWalletId,
      includeAll: true,
    });
    const parsedTokenId = balanceResponse.data?.tokenBalances?.find(
      ({ token }: { token: { symbol?: string } }) => token.symbol === 'USDC',
    )?.token?.id;

    const transfer = {
      walletId: circleWalletId,
      tokenId: parsedTokenId,
      destinationAddress: process.env.NEXT_PUBLIC_TREASURY_WALLET_ADDRESS,
      amounts: [amount],
      fee: {
        type: 'level',
        config: {
          feeLevel: 'MEDIUM',
        },
      },
    };

    console.log('transfer', transfer);

    return transfer;
  } catch (error) {
    console.error('Error building transfer:', error);
    return null;
  }
}

async function createTransfer(transferRequest: any): Promise<any> {
  console.log('transferRequest', transferRequest);
  const transfer = await buildTransfer(
    transferRequest.circleWalletId,
    transferRequest.amount,
  );
  if (!transfer) {
    throw new Error('Transfer failed: Invalid transfer request');
  }

  const response = await circleDeveloperSdk.createTransaction(transfer);

  if (!response.data) {
    throw new Error('Transfer failed: No response received');
  }
  return response.data;
}

export async function POST(request: Request) {
  try {
    const transferRequest = await request.json();
    const result = await createTransfer(transferRequest);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Transfer failed:', error);
    return NextResponse.json(
      { error: `Transfer failed with error: ${error}` },
      { status: 500 },
    );
  }
}
