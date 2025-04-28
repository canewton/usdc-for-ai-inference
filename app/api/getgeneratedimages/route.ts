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

    // Parse JSON array from query param
    const url = new URL(request.url);
    const chat_id = url.searchParams.get('imageids');

    console.log('imageids', chat_id);

    // Fetch images by id
    if (chat_id) {
      const { data: images, error } = await supabase
        .from('image_generations')
        .select('*')
        .eq('user_id', user.id)
        .eq('chat_id', chat_id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch images' },
          { status: 500 },
        );
      }

      return NextResponse.json(images, { status: 200 });
    } else {
      // Fetch all of user's images
      const { data: images, error } = await supabase
        .from('image_generations')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch images' },
          { status: 500 },
        );
      }

      return NextResponse.json(images, { status: 200 });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
