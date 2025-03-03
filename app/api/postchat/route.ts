import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

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
    const { title } = await req.json();

    // Post text generation
    const { data, error: dbError } = await supabase
      .from('chats')
      .insert([
        {
          user_id: user.id,
          title: title,
        },
      ])
      .select('id');

    if (dbError) {
      throw new Error(`Error posting chat: ${dbError.message}`);
    }
    return NextResponse.json({
      response: 'Chat posted successfully',
      id: data[0].id,
      title: title,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
