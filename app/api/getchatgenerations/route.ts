import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

export async function GET(req: NextRequest) {
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

    // Parse query param
    const url = new URL(req.url);
    const chat_id = url.searchParams.get('id');
    if (chat_id) {
      const { data: chats, error } = await supabase
        .from('chat_generations')
        .select(
          'id, user_text, ai_text, created_at, prompt_tokens, completion_tokens, provider',
        )
        .eq('user_id', user.id)
        .eq('chat_id', chat_id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch chat generations' },
          { status: 500 },
        );
      }
      return NextResponse.json({ chats: chats }, { status: 200 });
    } else {
      return NextResponse.json(
        { error: 'Missing id parameter' },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
