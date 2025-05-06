import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const videoId = body.videoId;

    if (!videoId) {
      return NextResponse.json(
        { error: 'Missing required parameter: videoId' },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      console.error('Unauthorized', error);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to find the video by id first (primary key)
    let { data: videoGeneration, error: dbError } = await supabase
      .from('video_generations')
      .select('*')
      .eq('id', videoId)
      .eq('user_id', user.id)
      .single();

    // If not found by id, try to find by task_id as fallback
    if (dbError && dbError.code === 'PGRST116') {
      const { data: videoByTask, error: taskError } = await supabase
        .from('video_generations')
        .select('*')
        .eq('task_id', videoId)
        .eq('user_id', user.id)
        .single();
      
      if (!taskError) {
        videoGeneration = videoByTask;
        dbError = null;
      }
    }

    if (dbError) {
      console.error('Error fetching video generation:', dbError);
      return NextResponse.json(
        { error: 'Video generation not found or access denied' },
        { status: dbError.code === 'PGRST116' ? 404 : 500 },
      );
    }

    return NextResponse.json(videoGeneration);
  } catch (error) {
    console.error('Error retrieving video details:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve video details',
      },
      { status: 500 },
    );
  }
}