import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { deleteDatabaseBucketItem } from '@/app/utils/deleteDatabaseBucketItem';
import { createClient } from '@/utils/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      console.error('Unauthorized', error);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { data, error: dbError } = await supabase
      .from('3d_generations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    await deleteDatabaseBucketItem(data.url);
    await deleteDatabaseBucketItem(data.image_url);

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('3D Generation error:', error);
    return NextResponse.json(
      { error: error.message || '3D Generation failed' },
      { status: 500 },
    );
  }
}
