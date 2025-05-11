import { data } from 'autoprefixer';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
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

    const url = new URL(request.url);
    const chat_type = url.searchParams.get('chat_type');

    if (!chat_type) {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching chats:', error);
        return NextResponse.json(
          { error: 'Error fetching chats' },
          { status: 500 },
        );
      }

      return NextResponse.json(data, { status: 200 });
    } else {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id)
        .eq('chat_type', chat_type);

      if (error) {
        console.error('Error fetching chats:', error);
        return NextResponse.json(
          { error: 'Error fetching chats' },
          { status: 500 },
        );
      }

      return NextResponse.json(data, { status: 200 });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
