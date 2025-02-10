import { NextResponse } from 'next/server';

import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

export async function DELETE(req: Request) {
  try {
    // Get authenticated user
    const token = req.headers.get('Authorization');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token.split(' ')[1]);
    if (error || !user) {
      console.error('Unauthorized', error);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const imageid = url.searchParams.get("imageid");

    if (!imageid) {
      return NextResponse.json({ error: 'Missing image_id' }, { status: 400 });
    }

    const { error: dbError } = await supabase.from('image_generations').delete().eq('id', imageid);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
