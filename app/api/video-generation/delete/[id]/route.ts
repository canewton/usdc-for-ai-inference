import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { deleteDatabaseBucketItem } from '@/app/utils/deleteDatabaseBucketItem';
import { createClient } from '@/utils/supabase/server';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { data, error: dbError } = await supabase
      .from('chat_generations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    deleteDatabaseBucketItem(data.video_url);
    deleteDatabaseBucketItem(data.prompt_image_path);

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting video:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}
