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
    const { title } = await request.json();

    // Post text generation
    const { data, error: dbError } = await supabase
      .from("chats")
      .insert([
        {
          user_id: user.id,
          title: title,
        },
      ])
      .select("id, created_at");

    if (dbError) {
      throw new Error(`Error posting chat: ${dbError.message}`);
    }
    return NextResponse.json({
      response: "Chat posted successfully",
      id: data[0].id,
      title: title,
      created_at: data[0].created_at,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
