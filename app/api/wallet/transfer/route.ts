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
  console.log('Creating transfer:', transferRequest);
  const response = await circleDeveloperSdk.createTransaction(transferRequest);
  console.log('circle response:', response.data);
  if (!response.data) {
    throw new Error('Transfer failed: No response received');
  }
  return response.data;
}

export async function POST(request: Request) {
  try {
    const transferRequest = await request.json();
    console.log('Transfer request:', transferRequest);
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
