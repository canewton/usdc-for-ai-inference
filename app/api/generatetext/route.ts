import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { NextResponse } from "next/server";

import { checkDemoLimit } from "@/app/utils/demoLimit";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // Get authenticated user
    const token = req.headers.get("Authorization");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error("Unauthorized", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { canGenerate, remaining } = await checkDemoLimit(user.id);
    if (!canGenerate) {
      return NextResponse.json(
        { error: "Demo limit reached. Please upgrade to continue." },
        { status: 429 },
      );
    }

    // Parse req body
    const { messages, model, maxTokens } = await req.json();

    // Get result
    const result = streamText({
      model: openai(model),
      messages,
      maxTokens,
    });

    // Return result
    return result.toDataStreamResponse();
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate text" },
      { status: 500 },
    );
  }
}
