import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

import { aiGenerationPayment } from '@/app/utils/aiGenerationPayment';
import { createDatabaseBucketItem } from '@/app/utils/createDatabaseBucketItem';
import { aiModel } from '@/types/ai.types';
import { createClient } from '@/utils/supabase/server';

const NOVITA_API_URL = 'https://api.novita.ai/v3/async/img2video';
const NOVITA_API_KEY = process.env.NEXT_PUBLIC_NOVITA_API_KEY;

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

    const { model_name, image_file, seed, prompt, image_file_resize_mode } =
      await req.json();

    await aiGenerationPayment(
      user,
      prompt,
      aiModel.IMAGE_TO_VIDEO,
      model_name === 'SVD-XT' ? 0.02 : 0.1,
    );

    const base64Data = image_file.split(';base64,').pop();
    const fileBuffer = Buffer.from(base64Data, 'base64');
    const imageData = await createDatabaseBucketItem(
      fileBuffer,
      'video-prompts',
      `${user.id}_${uuidv4()}.webp`,
      'image/webp',
      '3600',
    );
    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${imageData?.data?.fullPath}`;

    const input = {
      model_name: model_name,
      image_file: image_file,
      frames_num: model_name === 'SVD-XT' ? 25 : 14,
      frames_per_second: 6,
      image_file_resize_mode,
      steps: 20,
      seed: seed || Math.floor(Math.random() * 1000000),
      motion_bucket_id: 1,
      cond_aug: 1,
      enable_frame_interpolation: true,
    };

    const response = await fetch(NOVITA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${NOVITA_API_KEY}`,
      },
      body: JSON.stringify(input),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Error from Novita API:', data);
      return NextResponse.json(
        { error: 'Error from Novita API' },
        { status: 500 },
      );
    }

    const { task_id } = data;

    const promptInput = prompt || 'Test';

    const { data: dbData, error: dbError } = await supabase
      .from('video_generations')
      .insert({
        user_id: user.id,
        prompt: promptInput,
        model_name,
        seed: input.seed,
        prompt_image_path: publicUrl,
        task_id,
        processing_status: 'pending',
      })
      .select('*')
      .single();

    if (dbError) {
      console.error('Error saving video generation:', dbError);
      return NextResponse.json(
        { error: 'Error saving video generation' },
        { status: 500 },
      );
    }

    return NextResponse.json(dbData, { status: 200 });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 },
    );
  }
}
