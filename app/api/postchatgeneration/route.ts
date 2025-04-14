import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Unauthorized", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse body
    const {
      user_text,
      ai_text,
      provider,
      chat_id,
      prompt_tokens,
      completion_tokens,
    } = await request.json();

    // Post text generation
    const { data, error: dbError } = await supabase
      .from("chat_generations")
      .insert([
        {
          user_id: user.id,
          user_text: user_text,
          ai_text: ai_text,
          provider: provider,
          chat_id: chat_id,
          prompt_tokens: prompt_tokens,
          completion_tokens: completion_tokens,
        },
      ])
      .select("id");

    if (dbError) {
      throw new Error(`Error posting chat: ${dbError.message}`);
    }
    return NextResponse.json({
      response: "Chat generation posted successfully",
      id: data[0].id,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
