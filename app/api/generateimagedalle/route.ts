import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    const token = req.headers.get("Authorization")?.split("Bearer ")[1];
    
    // Verify user
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Generate image
    const dalleResponse = await openai.images.generate({
      prompt,
      model: "dall-e-3",
      n: 1,
      size: "1024x1024"
    });

    const imageUrl = dalleResponse.data[0].url;
    if (!imageUrl) throw new Error("No image URL returned");

    // Download and store image
    const imageResponse = await fetch(imageUrl);
    const buffer = Buffer.from(await imageResponse.arrayBuffer());
    const fileName = `${user.id}/${Date.now()}.png`;
    
    const { error: uploadError } = await supabase.storage
      .from("user-images")
      .upload(fileName, buffer, { contentType: "image/png" });

    if (uploadError) throw uploadError;

    // Get permanent URL
    const { data: { publicUrl } } = supabase.storage
      .from("user-images")
      .getPublicUrl(fileName);

    // Store metadata
    const { error: dbError } = await supabase.from("image_generations").insert({
      user: user.id,
      prompt,
      url: publicUrl,
      provider: "dall-e"
    });

    if (dbError) throw dbError;

    return NextResponse.json({ imageUrl: publicUrl });
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}