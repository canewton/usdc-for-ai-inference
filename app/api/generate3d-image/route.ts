import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { circleWalletTransfer } from '@/app/(ai)/server/circleWalletTransfer';
import { checkDemoLimit } from '@/app/utils/demoLimit';
import { aiModel } from '@/types/ai.types';
import { MODEL_ASSET_PRICING } from '@/utils/constants';
import { createClient } from '@/utils/supabase/server';

const MESHY_API_URL = 'https://api.meshy.ai/v2/generate/model';
const MESHY_API_KEY = process.env.NEXT_PUBLIC_MESHY_API_KEY;

type MeshyResponse = {
  id: string;
  done: boolean;
  model_urls: {
    glb: string;
    usdz: string;
  };
  images: string[];
};

interface WebhookResponse {
  id: string;
  model_urls: {
    glb: string;
    usdz: string;
  };
}

// returns model url
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get info from request body
    const {
      prompt,
      mode,
      negative_prompt,
      image_file,
      style_id,
      mesh_type,
      mask_file,
      geometry_guidance_scale,
      geometry_steps,
      texture_guidance_scale,
      texture_steps,
      should_remesh,
      should_texture,
      texture_prompt,
    } = await request.json();

    const { canGenerate, remaining } = await checkDemoLimit(user.id);
    if (!canGenerate) {
      return NextResponse.json(
        {
          error:
            'You have reached the limit of free generations. Please upgrade to continue.',
          remaining,
        },
        { status: 403 },
      );
    }

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

    const aiProject = await circleWalletTransfer(
      '3d',
      aiModel.IMAGE_TO_3D,
      wallet.circle_wallet_id,
      `${MODEL_ASSET_PRICING.userBilledPrice}`,
    );

    // Create parameters for API request
    const modelParams = {
      prompt,
      negative_prompt,
      texture_prompt: texture_prompt !== '' ? texture_prompt : prompt,
      texture_guidance_scale,
      texture_steps,
      geometry_guidance_scale,
      geometry_steps,
      width: 512,
      height: 512,
      should_remesh,
      should_texture,
      mesh_type,
      style_id,
    };

    // Make API call
    const response = await fetch(MESHY_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${MESHY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(modelParams),
    });

    const task = (await response.json()) as MeshyResponse;
    let modelUrl: string = task.model_urls.glb;
    let modelResponse = await fetch(modelUrl);
    let modelBlob = await modelResponse.blob();

    // upload .glb (3D model file type) file into supabase storage
    const fileName = `3d-model-${Date.now()}.glb`;
    const { error: uploadError } = await supabase.storage
      .from('user-3d')
      .upload(fileName, modelBlob);

    if (uploadError) {
      return NextResponse.json(
        {
          error: 'Could not upload model',
        },
        { status: 500 },
      );
    }

    const { data: publicURLData } = supabase.storage
      .from('user-3d') // Ensure this bucket exists and has correct policies
      .getPublicUrl(fileName);
    const storedModelUrl = publicURLData.publicUrl;

    // inserting into DB
    const { error: dbError } = await supabase.from('3d_generations').insert([
      {
        image_url: image_file,
        prompt: texture_prompt,
        user_id: user.id,
        url: storedModelUrl,
        provider: 'Meshy',
        mode: should_remesh ? 'Refine' : 'Preview',
        circle_transaction_id: aiProject.circle_transaction_id,
      },
    ]);

    if (dbError) {
      throw new Error(
        `Error inserting record into Supabase: ${dbError.message}`,
      );
    }

    // returns model url -> downloads an interactive 3D model
    return NextResponse.json({ modelUrl: storedModelUrl });
  } catch (error: any) {
    console.error('3D Generation error:', error);
    return NextResponse.json(
      { error: error.message || '3D Generation failed' },
      { status: 500 },
    );
  }
}
