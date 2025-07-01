import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

import { createDatabaseBucketItem } from '@/app/utils/createDatabaseBucketItem';
import { createClient } from '@/utils/supabase/server';

const NOVITA_API_URL = 'https://api.novita.ai/v3/async/task-result';
const { NOVITA_API_KEY } = process.env;

export async function POST(req: Request) {
  const supabase = await createClient();
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      console.error('Unauthorized', error);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { task_id } = await req.json();

    const response = await fetch(`${NOVITA_API_URL}?task_id=${task_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${NOVITA_API_KEY}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Error from Novita API:', data);

      await supabase
        .from('video_generations')
        .update({
          processing_status: 'error',
          error_message: data.error || 'Error from Novita API',
        })
        .eq('task_id', task_id)
        .eq('user_id', user.id);
      return NextResponse.json(
        { error: 'Error from Novita API' },
        { status: 500 },
      );
    }

    const taskStatus = data.task?.status;
    const videos = data.videos || [];

    if (videos.length > 0) {
      const video = await fetch(videos[0].video_url);
      const videoBlob = await video.blob();

      const imageData = await createDatabaseBucketItem(
        videoBlob,
        'video-gen',
        `videos/${user.id}_${uuidv4()}.mp4`,
        'video/mp4',
        '3600',
      );
      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${imageData?.data?.fullPath}`;

      if (imageData?.data?.fullPath) {
        await supabase
          .from('video_generations')
          .update({
            processing_status: taskStatus.toLowerCase(),
            video_url: publicUrl,
            error_message: null,
          })
          .eq('task_id', task_id)
          .eq('user_id', user.id);
      }
    }
    return NextResponse.json({
      taskStatus,
      videos,
      progressPercent: data.task?.progress_percent,
    });
  } catch (error) {
    console.error('Could not retrieve video:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 },
    );
  }
}
