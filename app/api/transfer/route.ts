import { NextResponse } from 'next/server';

interface TransferRequest {
  walletId: string;
  tokenId: string;
  destinationAddress: string;
  amounts: string[];
  feeLevel: any;
}

interface TransferResponse {
  id: string;
  status: 'PENDING' | 'COMPLETE' | 'FAILED';
  walletId: string;
  entityId: string;
  destinationAddress: string;
  tokenId: string;
  state: string;
  amounts: string[];
  transactionHash?: string;
  errorMessage?: string;
  createDate: string;
  updateDate: string;
}

import { circleDeveloperSdk } from '@/utils/developer-controlled-wallets-client';

async function createTransfer(transferRequest: any): Promise<any> {

  const response = await circleDeveloperSdk.createTransaction({
    walletId: transferRequest.walletId,
    tokenId: transferRequest.tokenId,
    destinationAddress: transferRequest.destinationAddress,
    amount: transferRequest.amounts[0],
    fee: transferRequest.feeLevel
  });

  console.log(response);
  if (!response.data) {
    throw new Error('Transfer failed: No response received');
  }
  console.log(response.data);

  return response;
}

export async function POST(request: Request) {
  try {
    const transferRequest = await request.json();
    const result = await createTransfer(transferRequest);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Transfer failed:', error);
    return NextResponse.json(
      { error: 'Transfer failed' },
      { status: 500 }
    );
  }
} 