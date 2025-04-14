import { createClient } from "@/utils/supabase/server";

export async function checkDemoLimit(
  userId: string,
): Promise<{ canGenerate: boolean; remaining: number }> {
  const supabase = await createClient();

  if (!process.env.NEXT_PUBLIC_VERCEL_URL) {
    return { canGenerate: true, remaining: Infinity };
  }

  // Count all types of generations
  const { data: chatGenerations, error: chatError } = await supabase
    .from("chat_generations")
    .select("id")
    .eq("user_id", userId);

  const { data: imageGenerations, error: imageError } = await supabase
    .from("image_generations")
    .select("id")
    .eq("user_id", userId);

  const { data: modelGenerations, error: modelError } = await supabase
    .from("3d_generations")
    .select("id")
    .eq("user_id", userId);

  if (chatError || imageError || modelError) {
    console.error("Error checking demo limit:", {
      chatError,
      imageError,
      modelError,
    });
    return { canGenerate: true, remaining: 5 }; // Default to allowing if there's an error
  }

  const totalGenerations =
    (chatGenerations?.length || 0) +
    (imageGenerations?.length || 0) +
    (modelGenerations?.length || 0);

  const remaining = Math.max(0, 5 - totalGenerations);
  return { canGenerate: remaining > 0, remaining };
}
