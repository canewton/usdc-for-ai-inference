import { createClient } from '@/utils/supabase/server';

export async function checkDemoLimit(
  userId: string,
): Promise<{ canGenerate: boolean; remaining: number }> {
  const supabase = await createClient();

  // Count all types of generations
  const { data: chatGenerations, error: chatError } = await supabase
    .from('chat_generations')
    .select('id')
    .eq('user_id', userId);

  const { data: imageGenerations, error: imageError } = await supabase
    .from('image_generations')
    .select('id')
    .eq('user_id', userId);

  const { data: modelGenerations, error: modelError } = await supabase
    .from('3d_generations')
    .select('id')
    .eq('user_id', userId);

  const { data: videoGenerations, error: videoError } = await supabase
    .from('video_generations')
    .select('id')
    .eq('user_id', userId);

  if (chatError || imageError || modelError || videoError) {
    console.error('Error checking demo limit:', {
      chatError,
      imageError,
      modelError,
      videoError,
    });
    return { canGenerate: true, remaining: 5 }; // Default to allowing if there's an error
  }

  const totalGenerations =
    (chatGenerations?.length || 0) +
    (imageGenerations?.length || 0) +
    (modelGenerations?.length || 0) +
    (videoGenerations?.length || 0);

  const remaining = Math.max(
    0,
    parseInt(process.env.USER_AI_GENERATION_LIMIT ?? '5') - totalGenerations,
  );
  return { canGenerate: true, remaining };
}
