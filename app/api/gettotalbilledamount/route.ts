import { NextResponse } from 'next/server';

import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

export async function GET(req: Request) {
  try {
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
    
    const url = new URL(req.url)
    const table = url.searchParams.get('table')

    if (!table || !['3d_generations', 'image_generations'].includes(table)) {
      return NextResponse.json({ error: "Invalid table name" }, {status: 400});
    }

    const { data, error } = await supabase
      .from(table)
      .select('user_billed_amount')
      .eq('user_id', user.id);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch billed amount' },
        { status: 500 },
      );
    }

    const totalBilledAmount = data.reduce(
      (sum, record) => sum + record.user_billed_amount,
      0,
    );

    return NextResponse.json({ totalBilledAmount }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
