import { useState } from 'react';

interface AiGenerationHook<G> {
  api: string;
  body: any;
  onFinish?: (generation: G) => Promise<void>;
}

export function useAiGeneration<G, M>({
  api,
  body,
  onFinish,
}: AiGenerationHook<G>) {
  const [messages, setMessages] = useState<M[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const stop = () => {};

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(api, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: input, ...body }),
      });
      const data: G = await response.json();
      if (onFinish) {
        await onFinish(data);
      }
      setInput('');
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
    stop,
    setInput,
  };
}
