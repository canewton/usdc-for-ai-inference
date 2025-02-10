import { NextRequest, NextResponse } from 'next/server';

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

    // Optional comma separated list of ids 
    const url = new URL(req.url);
    const imageids = url.searchParams.get("imageids");
    console.log(req.url)

    // Fetch user's images
    if (imageids) {
      const ids = imageids.split(",");
      const { data: images, error } = await supabase
      .from('image_generations')
      .select('id, url, prompt, created_at')
      .eq('user_id', user.id)
      .in('id', ids); 

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch images' },
          { status: 500 },
        );
      }
  
      return NextResponse.json({ images: images }, { status: 200 });
    } else {
      const { data: images, error } = await supabase
      .from('image_generations')
      .select('id, url, prompt, created_at')
      .eq('user_id', user.id); 

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch images' },
          { status: 500 },
        );
      }
  
      return NextResponse.json({ images: images }, { status: 200 });
    }
     
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
