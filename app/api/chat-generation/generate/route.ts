import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import console from 'console';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { checkDemoLimit } from '@/app/utils/demoLimit';
import { TEXT_MODEL_PRICING } from '@/utils/constants';
import { circleDeveloperSdk } from '@/utils/developer-controlled-wallets-client';
import { createClient } from '@/utils/supabase/server';

// Allow streaming responses up to 120 seconds
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Unauthorized', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { canGenerate, remaining } = await checkDemoLimit(user.id);
    if (!canGenerate) {
      return NextResponse.json(
        { error: 'Demo limit reached', remaining },
        { status: 403 },
      );
    }

    // Parse req body
    const { messages, provider, max_tokens, circle_wallet_id } =
      await request.json();

    const response = await circleDeveloperSdk.getWalletTokenBalance({
      id: circle_wallet_id,
      includeAll: true,
    });

    const parsedAmount = response.data?.tokenBalances?.find(
      ({ token }: { token: { symbol?: string } }) => token.symbol === 'USDC',
    )?.amount;

    if (
      !parsedAmount ||
      parseInt(parsedAmount) -
        TEXT_MODEL_PRICING[provider].userBilledInputPrice <
        0
    ) {
      console.log('Insufficient wallet balance');
      return NextResponse.json(
        { error: 'Insufficient wallet balance' },
        { status: 400 },
      );
    }

    // Get result
    const result = streamText({
      model: openai(provider),
      messages,
      maxTokens: max_tokens,
    });

    // Return result
    return result.toDataStreamResponse();
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate text' },
      { status: 500 },
    );
  }
}
