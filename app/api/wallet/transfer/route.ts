import { NextResponse } from 'next/server';

import { circleDeveloperSdk } from '@/utils/developer-controlled-wallets-client';

async function createTransfer(transferRequest: any): Promise<any> {
  const response = await circleDeveloperSdk.createTransaction(transferRequest);
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
