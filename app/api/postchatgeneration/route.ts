import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { circleWalletTransfer } from '@/app/(ai)/server/circleWalletTransfer';
import { aiModel } from '@/types/ai.types';
import { TEXT_MODEL_PRICING } from '@/utils/constants';
import { createClient } from '@/utils/supabase/server';

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

    // Parse body
    const {
      user_text,
      ai_text,
      provider,
      chat_id,
      prompt_tokens,
      completion_tokens,
    } = await request.json();

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
      user_text,
      aiModel.TEXT_TO_TEXT,
      wallet.circle_wallet_id,
      `${Math.max(prompt_tokens * TEXT_MODEL_PRICING[provider].userBilledInputPrice + completion_tokens * TEXT_MODEL_PRICING[provider].userBilledOutputPrice, 0.01).toFixed(2)}`,
    );

    // Post text generation
    const { data, error: dbError } = await supabase
      .from('chat_generations')
      .insert([
        {
          user_id: user.id,
          user_text: user_text,
          ai_text: ai_text,
          provider: provider,
          chat_id: chat_id,
          prompt_tokens: prompt_tokens,
          completion_tokens: completion_tokens,
        },
      ])
      .select('id');

    if (dbError) {
      throw new Error(`Error posting chat: ${dbError.message}`);
    }
    return NextResponse.json({
      response: 'Chat generation posted successfully',
      id: data[0].id,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
