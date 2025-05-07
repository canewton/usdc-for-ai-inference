import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@/utils/supabase/server';

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('id');

    if (!videoId) {
      return NextResponse.json({ error: 'Missing video ID' }, { status: 400 });
    }

    // Fetch video generation to validate ownership and storage path
    const { data: videoData, error: fetchError } = await supabase
      .from('video_generations')
      .select('id, user_id, video_url')
      .eq('id', videoId)
      .single();

    if (fetchError || !videoData || videoData.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Video not found or unauthorized' },
        { status: 404 },
      );
    }

    // Delete associated storage file if available
    if (videoData.video_url) {
      const filePath = videoData.video_url.split(
        '/storage/v1/object/public/video-gen/',
      )[1];
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from('video-gen')
          .remove([filePath]);
        if (storageError) {
          console.warn('Storage file deletion failed:', storageError.message);
        }
      }
    }

    // Delete the database record
    const { error: deleteError } = await supabase
      .from('video_generations')
      .delete()
      .eq('id', videoId)
      .eq('user_id', user.id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ message: 'Video deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting video:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}
