'use client';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import PromptSuggestions from '../components/PromptSuggestions';

export default function ImageGeneratorPage() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showTryAgain, setShowTryAgain] = useState(false);

  const submitPrompt = async (promptToSubmit: string) => {
    if (!promptToSubmit.trim()) return;
    setIsLoading(true);
    setShowTryAgain(false);
    try {
      const response = await fetch('/api/generateimagedalle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptToSubmit }),
      });
      if (!response.ok) throw new Error(await response.text());
      const { imageUrl } = await response.json();
      setImageUrl(imageUrl);
      setShowTryAgain(true);
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await submitPrompt(prompt);
  };

  const handlePromptSelect = async (selectedPrompt: string) => {
    setPrompt(selectedPrompt);
    await submitPrompt(selectedPrompt);
  };

  const handleTryAgain = async () => {
    await submitPrompt(prompt);
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">AI Image Generator</h1>
      <PromptSuggestions onSelect={handlePromptSelect} />
      {imageUrl && (
        <div className="mb-8">
          <img
            src={imageUrl}
            alt="Generated image"
            className="w-full h-auto rounded-lg shadow-lg"
          />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder="Describe the image you want to generate..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full"
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Generating...' : 'Generate Image'}
        </Button>
      </form>

      {showTryAgain && (
        <div
          onClick={handleTryAgain}
          className="w-full mt-4 text-center text-xs hover:underline cursor-pointer"
        >
          Try Again?
        </div>
      )}
    </div>
  );
}
