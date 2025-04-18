import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

import { circleWalletTransfer } from '@/app/(ai)/server/circleWalletTransfer';
import { aiModel } from '@/types/ai.types';
import { createClient as createSupabaseBrowserClient } from '@/utils/supabase/client'; // Keep browser client for storage uploads
import { createClient } from '@/utils/supabase/server';

const NOVITA_API_URL = 'https://api.novita.ai/v3/async/img2video';
const NOVITA_API_KEY = process.env.NEXT_PUBLIC_NOVITA_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (!user || error) {
      console.error(error);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestBody = await request.json();

    const { model_name, image_file, seed, prompt } = requestBody;

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
      model_name === 'SVD-XT' ? '0.20' : '0.15',
    );

    // Generate a unique file name with uuid
    const fileName = `${uuidv4()}.webp`;

    // Convert the base64 data to buffer
    const fileData = image_file.split(',')[1];
    const base64Data = fileData.split(';base64,').pop();
    const fileBuffer = Buffer.from(base64Data, 'base64');

    const supabaseStorageClient = createSupabaseBrowserClient(); // Use browser client for storage upload
    const { error: storageError } = await supabaseStorageClient.storage
      .from('video-prompts') // Ensure this bucket exists and policies are correct
      .upload(fileName, fileBuffer, {
        contentType: 'image/webp',
        cacheControl: '3600',
      });

    if (storageError) {
      console.error('Storage error:', storageError);
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 },
      );
    }

    const { data: publicUrlData } = supabaseStorageClient.storage
      .from('video-prompts') // Use same bucket name
      .getPublicUrl(fileName);

    if (!publicUrlData.publicUrl) {
      return NextResponse.json(
        { error: 'Failed to get image URL' },
        { status: 500 },
      );
    }

    const task_id = uuidv4();

    const input = {
      task_id,
      model_name,
      image_url: publicUrlData.publicUrl,
      seed: parseInt(seed),
      prompt,
      motion_bucket_id: 127,
      guidance_scale: 7.5,
      input_enhancement: true,
      enable_frame_interpolation: true,
    };

    const novitaResponse = await fetch(NOVITA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Novita-API-Key': NOVITA_API_KEY as string,
      },
      body: JSON.stringify(input),
    });

    const data = await novitaResponse.json();
    if (!novitaResponse.ok) {
      console.error('Error from Novita API:', data);
      return NextResponse.json(
        { error: 'Error from Novita API' },
        { status: 500 },
      );
    }

    if (!data.task_id) {
      return NextResponse.json(
        { error: 'No task ID returned from Novita API' },
        { status: 500 },
      );
    }

    // store this video generation in our database
    const { error: generationError } = await storeVideoGeneration({
      user_id: user.id,
      prompt,
      model_name,
      task_id,
      processing_status: 'pending',
    });

    if (generationError) {
      throw new Error('Failed to store video generation');
    }

    return NextResponse.json({ task_id });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 },
    );
  }
}

// Store video generation in database
interface VideoGenerationParams {
  user_id: string;
  prompt: string;
  model_name: string;
  task_id: string;
  processing_status: string;
  error_message?: string | null;
  video_url?: string | null;
}

async function storeVideoGeneration({
  user_id,
  prompt,
  model_name,
  task_id,
  processing_status,
  error_message = null,
  video_url = null,
}: VideoGenerationParams) {
  const supabase = createSupabaseBrowserClient(); // Or server if context allows, but browser client often simpler here if called from within the route handler
  try {
    const { error } = await supabase.from('video_generations').insert({
      user_id,
      prompt,
      model_name,
      task_id,
      processing_status,
      error_message,
      video_url,
    });

    return { error };
  } catch (error) {
    console.error('Error storing video generation:', error);
    return { error };
  }
}
