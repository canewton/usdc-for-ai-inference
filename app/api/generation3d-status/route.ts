import { NextResponse } from 'next/server';

import { circleWalletTransfer } from '@/app/(ai)/server/circleWalletTransfer';
import { aiModel } from '@/types/ai.types';
import { MODEL_ASSET_PRICING } from '@/utils/constants';
import { createClient } from '@/utils/supabase/server';

const MESHY_API_KEY = process.env.MESHY_API!;
const MESHY_API_URL =
  process.env.MESHY_BASE_URL || 'https://api.meshy.ai/openapi/v1/image-to-3d';

const HEADERS = {
  Authorization: `Bearer ${MESHY_API_KEY}`,
  'Content-Type': 'application/json',
};

interface TaskStatusResponse {
  status: string;
  progress: number;
  model_urls?: { glb: string };
}

export async function POST(request: Request) {
  const { taskId, texture_prompt, image_url, title } = await request.json();
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  try {
    const response = await fetch(`${MESHY_API_URL}/${taskId}`, {
      method: 'GET',
      headers: HEADERS,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch task status: ${response.statusText}`);
    }

    if (!user || error) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taskData: TaskStatusResponse = await response.json();

    if (taskData.status === 'SUCCEEDED') {
      let profile: any = null;
      let wallet: any = null;
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();
      profile = profileData;

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

      const aiProject = await circleWalletTransfer(
        texture_prompt,
        aiModel.IMAGE_TO_3D,
        wallet.circle_wallet_id,
        `${MODEL_ASSET_PRICING.userBilledPrice}`,
      );

      if (!taskData.model_urls?.glb) {
        throw new Error('model URL missing.');
      }
      let modelUrl: string = taskData.model_urls.glb;
      let modelResponse = await fetch(modelUrl);
      let modelBlob = await modelResponse.blob();

      // upload .glb (3D model file type) file into supabase storage
      const fileName = `3d-model-${Date.now()}.glb`;
      const { error: storageError } = await supabase.storage
        .from('user-3d')
        .upload(fileName, modelBlob, {
          contentType: 'model/gltf-binary',
        });

      if (storageError) {
        throw new Error(
          `Error uploading model to Supabase: ${storageError.message}`,
        );
      }

      const { data: publicURLData } = supabase.storage
        .from('user-3d')
        .getPublicUrl(fileName);
      const storedModelUrl = publicURLData.publicUrl;

      // inserting into DB
      const { data, error: dbError } = await supabase
        .from('3d_generations')
        .insert([
          {
            image_url,
            prompt: texture_prompt,
            user_id: user.id,
            url: storedModelUrl,
            provider: 'Meshy',
            mode: 'Preview',
            circle_transaction_id: aiProject.circle_transaction_id,
            status: taskData.status,
            title: title,
          },
        ])
        .select('*')
        .single();

      if (dbError) {
        throw new Error(
          `Error inserting record into Supabase: ${dbError.message}`,
        );
      }

      return NextResponse.json(data, { status: 200 });
    } else if (taskData.status === 'FAILED') {
      throw new Error('Meshy AI task failed.');
    } else {
      return NextResponse.json(
        {
          status: taskData.status,
          progress: taskData.progress,
        },
        { status: 200 },
      );
    }
  } catch (error: any) {
    console.error('3D Generation error:', error);
    return NextResponse.json(
      { error: error.message || '3D Generation failed' },
      { status: 500 },
    );
  }
}
