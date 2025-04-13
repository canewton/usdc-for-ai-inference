import { NextResponse } from 'next/server';

import { createClient } from '@/utils/supabase/client';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const token = authHeader.split(' ')[1];
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const modelids = url.searchParams.get('modelids');

    if (modelids) {
      const ids = JSON.parse(modelids);
      const { data: models, error } = await supabase
        .from('3d_generations')
        .select('id, url, prompt, created_at')
        .eq('user_id', user.id)
        .in('id', ids)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch models' },
          { status: 500 },
        );
      }

      return NextResponse.json({ models: models }, { status: 200 });
    } else {
      const { data: models, error } = await supabase
        .from('3d_generations')
        .select('id, url, prompt, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch models' },
          { status: 500 },
        );
      }

      return NextResponse.json({ models: models }, { status: 200 });
    }
  } catch (error: any) {
    console.error('Model get error: ', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get models' },
      { status: 500 },
    );
  }
}
