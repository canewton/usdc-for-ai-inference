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

async function createTransfer(transferRequest: TransferRequest): Promise<TransferResponse> {
  const response = await fetch('https://api.circle.com/v1/w3s/developer/transactions/transfer', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CIRCLE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(transferRequest)
  });

  if (!response.ok) {
    throw new Error(`Transfer failed: ${response.statusText}`);
  }

  return response.json();
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