import { useState } from 'react';

interface AiGenerationHook<G> {
  api: string;
  body: any;
  onFinish?: (generation: G) => Promise<void>;
  onError?: (error: string) => void;
}

export function useAiGeneration<G, M>({
  api,
  body,
  onFinish,
  onError,
}: AiGenerationHook<G>) {
  const [messages, setMessages] = useState<M[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const stop = () => {};

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await aiGenerate(input);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const aiGenerate = async (input: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(api, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: input, ...body }),
      });

      if (!response.ok) {
        setIsLoading(false);
        if (onError) {
          onError('Failed to generate image');
        }
      } else {
        const data: G = await response.json();
        if (onFinish) {
          await onFinish(data);
        }
        setInput('');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    input,
    isLoading,
    handleInputChange,
    setMessages,
    handleSubmit,
    aiGenerate,
    stop,
    setInput,
  };
}
