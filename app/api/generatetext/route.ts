import { openai } from '@ai-sdk/openai';
import { streamText} from "ai"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {

  // Parse req body
  const { messages } = await req.json();

  // Get result
  const result = streamText({
    model: openai('gpt-4o-mini'),
    messages,
  }); 

  // Return result
  return result.toDataStreamResponse();
  
}