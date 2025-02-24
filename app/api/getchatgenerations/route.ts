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

    // Fetch all of user's chat generations
    const { data: chats, error } = await supabase
    .from('chat_generations')
    .select('id, user_text, ai_text, created_at')
    .eq('user_id', user.id)
    .order('created_at', {ascending: true});

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch chat generations' },
        { status: 500 },
      );
    }

    return NextResponse.json({ chats: chats }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
