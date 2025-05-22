import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

import { aiGenerationPayment } from '@/app/utils/aiGenerationPayment';
import { createDatabaseBucketItem } from '@/app/utils/createDatabaseBucketItem';
import { aiModel } from '@/types/ai.types';
import { MODEL_ASSET_PRICING } from '@/utils/constants';
import { createClient } from '@/utils/supabase/server';

const MESHY_API_KEY = process.env.MESHY_API_KEY!;
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
  const { taskId, title } = await request.json();
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
      const aiProject = await aiGenerationPayment(
        user,
        title,
        aiModel.IMAGE_TO_3D,
        MODEL_ASSET_PRICING.userBilledPrice,
      );

      if (!taskData.model_urls?.glb) {
        throw new Error('model URL missing.');
      }
      const modelUrl: string = taskData.model_urls.glb;
      const modelResponse = await fetch(modelUrl);
      const modelBlob = await modelResponse.blob();

      const imageData = await createDatabaseBucketItem(
        modelBlob,
        'user-3d',
        `${user.id}_${uuidv4()}.glb`,
        'model/gltf-binary',
      );
      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${imageData?.data?.fullPath}`;

      const { data, error: dbError } = await supabase
        .from('3d_generations')
        .update({
          url: publicUrl,
          circle_transaction_id: aiProject.circle_transaction_id,
          status: taskData.status,
        })
        .eq('task_id', taskId)
        .eq('user_id', user.id)
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
