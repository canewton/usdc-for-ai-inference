import { NextResponse, NextRequest } from 'next/server';

import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const token = req.headers.get('Authorization');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token.split(' ')[1]);
    if (authError || !user) {
      console.error('Unauthorized', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse body 
    const { user_text, ai_text } = await req.json();

    // Post text generation
    const { error: dbError } = await supabase.from('chat_generations').insert([
      {
        user_id: user.id,
        user_text: user_text,
        ai_text: ai_text,
      },
    ]);

    if (dbError) {
      throw new Error(
        `Error posting chat: ${dbError.message}`,
      );
    }
    return NextResponse.json({ response: "Chat generation posted successfully" });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
