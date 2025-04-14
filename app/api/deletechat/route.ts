import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export async function DELETE(req: Request) {
  try {
    // Get authenticated user
    const token = req.headers.get("Authorization");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token.split(" ")[1]);
    if (error || !user) {
      console.error("Unauthorized", error);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const { error: dbError } = await supabase
      .from("chats")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Chat deleted successfully" });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
