import { NextResponse } from 'next/server';

import { createClient } from '@/utils/supabase/server';

const NOVITA_API_URL = 'https://api.novita.ai/v3/async/task-result';
const NOVITA_API_KEY = process.env.NEXT_PUBLIC_NOVITA_API_KEY;
console.log('NOVITA_API_KEY', NOVITA_API_KEY);

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

    const { data: videoGeneration, error: dbError } = await supabase
      .from('video_generations')
      .select('*')
      .eq('task_id', task_id)
      .eq('user_id', user.id);

    if (dbError) {
      console.error('Error fetching video generation:', dbError);
      return NextResponse.json(
        { error: 'Video generation not found' },
        { status: 404 },
      );
    }

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
        .eq('task_id', task_id);
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

      const fileName = `${Date.now()}-novita.mp4`;
      const filePath = `videos/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('video-gen')
        .upload(filePath, videoBlob, {
          cacheControl: '3600',
          upsert: false,
        });

      let publicUrlData;
      if (!uploadError) {
        const { data } = supabase.storage
          .from('video-gen')
          .getPublicUrl(uploadData?.path);
        publicUrlData = data;
      }

      if (publicUrlData) {
        await supabase
          .from('video_generations')
          .update({
            processing_status: taskStatus.toLowerCase(),
            video_url: publicUrlData.publicUrl,
            error_message: null,
          })
          .eq('task_id', task_id)
          .eq('user_id', user.id);
      }
    }
    return NextResponse.json({ taskStatus, videos });
  } catch (error) {
    console.error('Could not retrieve video:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 },
    );
  }
}