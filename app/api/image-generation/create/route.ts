import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { aiGenerationPayment } from '@/app/utils/aiGenerationPayment';
import { checkDemoLimit } from '@/app/utils/demoLimit';
import { aiModel } from '@/types/ai.types';
import { IMAGE_MODEL_PRICING } from '@/utils/constants';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      console.error('Unauthorized', error);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { canGenerate, remaining } = await checkDemoLimit(user.id);
    if (!canGenerate) {
      return NextResponse.json(
        { error: 'Demo limit reached', remaining },
        { status: 403 },
      );
    }

    const { prompt, chat_id, provider, url } = await request.json();

    const aiProject = await aiGenerationPayment(
      user,
      prompt,
      aiModel.TEXT_TO_IMAGE,
      IMAGE_MODEL_PRICING[provider as keyof typeof IMAGE_MODEL_PRICING]
        .userBilledPrice,
    );

    const { data, error: dbError } = await supabase
      .from('image_generations')
      .insert([
        {
          prompt,
          user_id: user.id,
          url: url,
          provider: provider,
          circle_transaction_id: aiProject.circle_transaction_id,
          chat_id: chat_id,
        },
      ])
      .select('*')
      .single();

    if (dbError) {
      throw new Error(
        `Error inserting record into Supabase: ${dbError.message}`,
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 },
    );
  }
}
