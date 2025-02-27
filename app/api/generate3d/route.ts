import { NextResponse } from 'next/server';

import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

// currently using meshy's test api key - the result 'should' always be the same regardless of prompt
const MESHY_API_KEY = process.env.MESHY_TEST_API!;
const MESHY_API_URL =
  process.env.MESHY_BASE_URL || 'https://api.meshy.ai/openapi/v2/text-to-3d';

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
    const token = req.headers.get('Authorization');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token.split(' ')[1]);
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    /**
     * INPUTS
     * Two Modes (Defaults to 'preview') -> String:
     *    'preview' - base mesh with no texture applied
     *    'refine' - preview mesh with texuture applied, based on text prompt
     *  Prompt -> String: required
     *  Negative_prompt -> String, Art_style -> String, Should_remesh -> Bool: optional
     */
    const { mode, prompt, negative_prompt, art_style, should_remesh } =
      await req.json();

    // always need to generate preview response first
    // we can only generate refined model after fetching preview model
    const generatePreviewResponse = await fetch(MESHY_API_URL, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        mode: 'preview',
        prompt,
        negative_prompt,
        art_style,
        should_remesh,
      }),
    });

    if (!generatePreviewResponse.ok) {
      throw new Error('Failed to create preview model.');
    }

    const previewData: MeshyResponse = await generatePreviewResponse.json();
    const previewTaskId: string = previewData.result;
    console.log('Preview task created. Task ID:', previewTaskId);

    // poll preview task to keep track of generation progress
    const previewTask = await pollTaskStatus(previewTaskId);

    if (!previewTask.model_urls?.glb) {
      throw new Error('Preview model URL missing.');
    }
    let modelUrl: string = previewTask.model_urls.glb;
    let modelResponse = await fetch(modelUrl);
    let modelBlob = await modelResponse.blob();

    // if model type is 'refine', reprocess preview model
    if (mode === 'refine') {
      const generateRefinedResponse = await fetch(MESHY_API_URL, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({
          mode: 'refine',
          preview_task_id: previewTaskId,
        }),
      });

      if (!generateRefinedResponse.ok) {
        throw new Error('Failed to request refined model.');
      }

      const refinedData: MeshyResponse = await generateRefinedResponse.json();
      const refinedTaskId: string = refinedData.result;
      console.log('Refined task created. Task ID:', refinedTaskId);

      const refinedTask = await pollTaskStatus(refinedTaskId);

      if (!refinedTask.model_urls?.glb) {
        throw new Error('Refined model URL missing.');
      }

      // udpate url, response, and blob accordingly
      modelUrl = refinedTask.model_urls.glb;
      modelResponse = await fetch(modelUrl);
      modelBlob = await modelResponse.blob();
    }

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
        prompt,
        user_id: user.id,
        url: storedModelUrl,
        provider: 'Meshy',
        mode,
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
