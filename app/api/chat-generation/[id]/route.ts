import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;
    const { data, error } = await supabase
      .from('chat_generations')
      .select('*')
      .eq('user_id', user.id)
      .eq('chat_id', id);

    if (error) {
      console.error('Error fetching chat generation:', error);
      return NextResponse.json(
        { error: 'Error fetching chat generation' },
        { status: 500 },
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
