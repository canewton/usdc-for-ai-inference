import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

import { circleWalletTransfer } from '@/app/(ai)/server/circleWalletTransfer';
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

    const requestBody = await req.json();

    const { model_name, image_file, seed, prompt, image_file_resize_mode } =
      requestBody;

    let profile: any = null;
    let wallet: any = null;
    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();
      profile = profileData;
    }

    if (profile) {
      // Get wallet
      const { data: walletData } = await supabase
        .schema('public')
        .from('wallets')
        .select()
        .eq('profile_id', profile.id)
        .single();
      wallet = walletData;
    }

    await circleWalletTransfer(
      prompt,
      aiModel.IMAGE_TO_VIDEO,
      wallet.circle_wallet_id,
      model_name === 'SVD-XT' ? '0.02' : '0.1',
    );

    const fileData = image_file;
    const fileName = `${user.id}_${uuidv4()}.webp`;

    const base64Data = fileData.split(';base64,').pop();
    const fileBuffer = Buffer.from(base64Data, 'base64');

    const { error: storageError } = await supabase.storage
      .from('video-prompts')
      .upload(fileName, fileBuffer, {
        contentType: 'image/webp',
        cacheControl: '3600',
      });

    if (storageError) {
      console.error('Error uploading to Supabase:', storageError);
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 },
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from('video-prompts')
      .getPublicUrl(fileName);

    if (!publicUrlData.publicUrl) {
      throw new Error('Failed to retrieve public URL for image');
    }

    const { publicUrl } = publicUrlData;

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

    await saveVideoGeneration({
      user_id: user.id,
      prompt: promptInput,
      model_name,
      seed: input.seed,
      prompt_image_path: publicUrl,
      task_id,
      processing_status: 'pending',
    });

    return NextResponse.json({ task_id });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 },
    );
  }
}

interface VideoGenerationParams {
  user_id: string;
  prompt: string;
  model_name: string;
  seed: number;
  prompt_image_path: string;
  task_id: string;
  processing_status: string;
  error_message?: string | null;
  video_url?: string | null;
}

async function saveVideoGeneration({
  user_id,
  prompt,
  model_name,
  seed,
  prompt_image_path,
  task_id,
  processing_status,
  error_message = null,
  video_url = null,
}: VideoGenerationParams) {
  const supabase = await createClient();
  try {
    const { error } = await supabase.from('video_generations').insert({
      user_id,
      prompt,
      model_name,
      seed,
      prompt_image_path,
      task_id,
      processing_status,
      error_message,
      video_url,
    });

    if (error) {
      console.error('Error saving video generation:', error);
    }
  } catch (err) {
    console.error('Exception saving video generation:', err);
  }
}
