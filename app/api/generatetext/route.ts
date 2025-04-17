import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { circleWalletTransfer } from '@/app/(ai)/server/circleWalletTransfer';
import { checkDemoLimit } from '@/app/utils/demoLimit';
import { aiModel } from '@/types/ai.types';
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
    const { messages, model, maxTokens } = await request.json();

    let profile: any = null;
    let wallet: any = null;
    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();
      profile = profileData;
    }

    if (profile) {
      // Get wallet
      const { data: walletData } = await supabase
        .schema('public')
        .from('wallets')
        .select()
        .eq('profile_id', profile.id)
        .single();
      wallet = walletData;
    }

    await circleWalletTransfer(
      '3d',
      aiModel.IMAGE_TO_3D,
      wallet.circle_wallet_id,
      '0.03',
    );

    // Get result
    const result = streamText({
      model: openai(model),
      messages,
      maxTokens,
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
