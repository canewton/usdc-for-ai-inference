import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { checkDemoLimit } from '@/app/utils/demoLimit';
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
