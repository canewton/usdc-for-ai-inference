import { createClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";

const supabase = createClient(
  process.env.SUPABASE_URL as string, 
  process.env.SUPABASE_KEY as string
);

interface RequestBody {
  prompt: string;
  user: string;
}

interface OpenAIResponse {
  data: { url: string }[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { prompt, user } = req.body as RequestBody;

  if (!prompt || !user) {
    return res.status(400).json({ error: "Prompt and user are required" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY as string}`,
      },
      body: JSON.stringify({
        model: "dall-e-2",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
      }),
    });

    const data: OpenAIResponse = await response.json();

    if (response.ok) {
      const imageUrl = data.data[0]?.url;

      // Insert into Supabase table
      const { data: insertData, error } = await supabase
        .from("image_generations")
        .insert([
          {
            user,
            prompt,
            url: imageUrl,
            provider: "dall-e",
          },
        ]);

      if (error) {
        return res.status(500).json({ error: "Error inserting into Supabase" });
      }

      return res.status(200).json({ imageUrl, insertData });
    } else {
      console.error("OpenAI API Error:", data);
      return res.status(500).json({ error: data });
    }
  } catch (error) {
    console.error("Unhandled Error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
