import { NextResponse } from 'next/server';

import { circleDeveloperSdk } from '@/utils/developer-controlled-wallets-client';
import { createClient } from '@/utils/supabase/server';

export interface WalletTransferRequest {
  circleWalletId: string;
  amount: string;
  projectName: string;
  aiModel: string;
}

export async function circleWalletTransfer(
  projectName: string,
  aiModel: string,
  circleWalletId: string,
  amount: string,
) {
  async function createTransfer(
    transferRequest: WalletTransferRequest,
  ): Promise<any> {
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

      return transfer;
    } catch (error) {
      console.error('Error building transfer:', error);
      return null;
    }
  }

  const supabase = await createClient();
  try {
    const transferRequest: WalletTransferRequest = {
      projectName,
      aiModel,
      circleWalletId,
      amount: amount,
    };
    const result = await createTransfer(transferRequest);
    const { data: response, error } = await supabase
      .schema('public')
      .from('ai_projects')
      .insert({
        project_name: projectName,
        ai_model: aiModel,
        circle_wallet_id: circleWalletId,
        circle_transaction_id: result.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving transaction:', error);
      return NextResponse.json(
        { error: 'Transfer succeeded but could not save transaction' },
        { status: 500 },
      );
    }

    return response;
  } catch (error) {
    console.error('Transfer failed:', error);
    return NextResponse.json(
      { error: `Transfer failed with error: ${error}` },
      { status: 500 },
    );
  }
}
