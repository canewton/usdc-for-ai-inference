import { NextResponse } from 'next/server';

import { circleWalletTransfer } from '@/app/(ai)/server/circleWalletTransfer';
import { checkDemoLimit } from '@/app/utils/demoLimit';
import { aiModel } from '@/types/ai.types';
import { MODEL_ASSET_PRICING } from '@/utils/constants';
import { createClient } from '@/utils/supabase/server';

const supabase = createClient();

// -------------------------------------------
// WORKING API KEY - LIMITED NUMBER OF TOKENS
// -------------------------------------------
const MESHY_API_KEY = process.env.MESHY_API!;
const MESHY_API_URL =
  process.env.MESHY_BASE_URL || 'https://api.meshy.ai/openapi/v1/image-to-3d';

const HEADERS = {
  Authorization: `Bearer ${MESHY_API_KEY}`,
  'Content-Type': 'application/json',
};

interface MeshyResponse {
  result: string;
}

interface TaskStatusResponse {
  status: string;
  progress: number;
  model_urls?: { glb: string };
}

// returns model url
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    /**
     * INPUT PARAMETERS:
     *
     * image_url         : string
     *    Public image URL or a base64 data URI. (Required)
     *
     * enable_pbr        : boolean (default: false)
     *    Indicates whether to generate Physically Based Rendering (PBR) maps in addition to the base color.
     *
     * should_remesh     : boolean (default: true)
     *    Determines whether to disregard existing topology and target polycount during remeshing.
     *
     * should_texture    : boolean (default: true)
     *    Specifies whether to add texturing to the 3D model.
     *    - false: incurs a cost of 5 tokens.
     *    - true: incurs a cost of 15 tokens.
     *
     * texture_prompt    : string
     *    Descriptive prompt detailing the desired model texture. (Required)
     */
    const {
      image_url,
      enable_pbr,
      should_remesh,
      should_texture,
      texture_prompt,
    } = await req.json();

    const { canGenerate, remaining } = await checkDemoLimit(user.id);
    if (!canGenerate) {
      return NextResponse.json(
        { error: 'Demo limit reached. Please upgrade to continue.' },
        { status: 429 },
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

    const generatePreviewResponse = await fetch(MESHY_API_URL, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        image_url,
        enable_pbr,
        should_remesh,
        should_texture,
        texture_prompt,
      }),
    });

    if (!generatePreviewResponse.ok) {
      throw new Error('Failed to create preview model.');
    }

    const aiProject = await circleWalletTransfer(
      texture_prompt,
      aiModel.IMAGE_TO_3D,
      wallet.circle_wallet_id,
      `${MODEL_ASSET_PRICING.userBilledPrice}`,
    );

    const data: MeshyResponse = await generatePreviewResponse.json();
    const taskId: string = data.result;
    console.log('Preview task created. Task ID:', taskId);

    // poll preview task to keep track of generation progress
    const task = await pollTaskStatus(taskId);

    if (!task.model_urls?.glb) {
      throw new Error('model URL missing.');
    }
    let modelUrl: string = task.model_urls.glb;
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
    const { error: dbError } = await supabase.from('3d_generations').insert([
      {
        image_url,
        prompt: texture_prompt,
        user_id: user.id,
        url: storedModelUrl,
        provider: 'Meshy',
        mode: should_remesh ? 'Refine' : 'Preview',
        circle_transaction_id: aiProject.circle_transaction_id,

        // can delete
        replicate_billed_amount: MODEL_ASSET_PRICING.replicatePrice,
        user_billed_amount: MODEL_ASSET_PRICING.userBilledPrice,
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

// helper to incrementally generate task statuses
async function pollTaskStatus(taskId: string): Promise<TaskStatusResponse> {
  while (true) {
    const response = await fetch(`${MESHY_API_URL}/${taskId}`, {
      method: 'GET',
      headers: HEADERS,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch task status: ${response.statusText}`);
    }

    const taskData: TaskStatusResponse = await response.json();
    console.log(
      `Task status: ${taskData.status}, Progress: ${taskData.progress}`,
    );

    if (taskData.status === 'SUCCEEDED') {
      return taskData;
    } else if (taskData.status === 'FAILED') {
      throw new Error('Meshy AI task failed.');
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}
