'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import React from 'react';

import { useSession } from '@/app/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import SendIcon from '@/public/plane.svg';

import PromptSuggestions from '../../components/PromptSuggestions';

const allSuggestions = [
  'A sleek, futuristic USDC crypto debit card with neon blue accents and a cyber-inspired design',
  'A premium black metal USDC debit card with engraved details and a brushed finish',
  'A dynamic 3D render of a non-custodial crypto wallet with a glowing USDC logo and secure encryption visuals',
  'A futuristic digital bank vault storing USDC securely, with glowing security layers and blockchain encryption',
  'An abstract visualization of decentralized finance with floating USDC coins, blockchain connections, and liquidity pools.',
  'A futuristic stock photo of a person making a seamless cross-border payment using USDC via a mobile wallet',
  'A global-themed USDC card with a world map, blockchain icons, and futuristic typography',
  'A luxury-tier USDC card with holographic details and a cutting-edge, Web3-inspired look',
];

const CustomInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>((props, ref) => {
  return (
    <input
      {...props}
      ref={ref}
      className={cn(
        'flex-1 border-0 bg-transparent text-base w-full focus:ring-0 focus:outline-none',
        props.className,
      )}
    />
  );
});
CustomInput.displayName = 'CustomInput';

export default function ImageGeneratorPage() {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [quality, setQuality] = useState(80);
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showTryAgain, setShowTryAgain] = useState(false);
  const [model, setModel] = useState('flux-schnell');
  const [history, setHistory] = useState<
    { id: string; url: string; prompt: string; created_at: string }[]
  >([]);
  const [totalBilledAmount, setTotalBilledAmount] = useState(0);
  const [conversation, setConversation] = useState<
    Array<{ type: 'prompt' | 'response'; content: string }>
  >([]);
  const [generatingImageId, setGeneratingImageId] = useState<number | null>(
    null,
  );
  const router = useRouter();
  const session = useSession();

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const fetchTotalBilledAmount = async () => {
    if (!session) return;
    const sessionToken = session.access_token;
    try {
      const response = await fetch(`/api/gettotalbilledamount?table=image_generations`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setTotalBilledAmount(data.totalBilledAmount);
      } else {
        console.error('Error fetching billed amount:', data.error);
      }
    } catch (error) {
      console.error('Error fetching billed amount:', error);
    }
  };

  // Fetch user's images
  useEffect(() => {
    const fetchImages = async () => {
      if (!session) return;
      const sessionToken = session.access_token;
      try {
        const response = await fetch(`/api/getgeneratedimages`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setHistory(data.images);
        } else {
          console.error('Error fetching images:', data.error);
        }
      } catch (error) {
        console.error('Error fetching images:', error);
      }
    };
    if (session) {
      fetchImages();
      fetchTotalBilledAmount();
    }
  }, [session, imageUrl]);

  useEffect(() => {
    // Add a small delay to ensure the DOM has updated
    const timer = setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop =
          chatContainerRef.current.scrollHeight;
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [conversation]);

  const submitPrompt = async (promptToSubmit: string) => {
    if (!promptToSubmit.trim()) return;
    setIsLoading(true);
    setShowTryAgain(false);

    const newConversationLength = conversation.length;
    setConversation((prev) => [
      ...prev,
      { type: 'prompt', content: promptToSubmit },
    ]);

    setGeneratingImageId(newConversationLength + 1);

    try {
      const response = await fetch('/api/generateimagedalle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          prompt: promptToSubmit,
          aspect_ratio: aspectRatio,
          output_quality: quality,
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      const { imageUrl } = await response.json();
      setImageUrl(imageUrl);

      setConversation((prev) => [
        ...prev,
        { type: 'response', content: imageUrl },
      ]);

      setShowTryAgain(true);
      await fetchTotalBilledAmount();
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setIsLoading(false);
      setGeneratingImageId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (prompt.trim()) {
      await submitPrompt(prompt);
      setPrompt('');
    }
  };

  const handlePromptSelect = async (selectedPrompt: string) => {
    await submitPrompt(selectedPrompt);
    setPrompt('');
  };

  const handleTryAgain = async () => {
    await submitPrompt(prompt);
  };

  const handleDeleteImage = (image_id: string) => {
    const deleteImage = async (image_id: string) => {
      try {
        const response = await fetch(`/api/deleteimage?imageid=${image_id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        const result = await response.json();
        if (response.ok) {
          setHistory((prevImages) =>
            prevImages.filter((img) => img.id !== image_id),
          );
        } else {
          console.error('Error deleting image:', result.error);
        }
      } catch (error) {
        console.error('Delete request failed:', error);
      }
    };
    if (session) {
      deleteImage(image_id);
    }
  };

  const handleImageClick = (image_id: string) => {
    router.push(`/ai/image/${image_id}`);
  };

  return (
    <div className="min-h-screen w-full bg-white text-black flex">
      {/* Left Sidebar: History */}
      <aside className="w-60 border-r border-gray-300 p-4 bg-white">
        <h2 className="text-xl font-semibold mb-4">History</h2>
        <div className="space-y-4 overflow-y-auto h-[80vh]">
          {history.map((image) => (
            <div
              key={image.id}
              className="p-2 rounded-md hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-200"
            >
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium">{image.prompt}</p>
                <button
                  onClick={() => handleDeleteImage(image.id)}
                  className="text-xs border border-gray-300 text-black rounded-md px-1 hover:bg-gray-100"
                >
                  Delete
                </button>
              </div>
              <img
                src={image.url}
                alt={image.prompt}
                className="mt-2 rounded-md"
                onClick={() => handleImageClick(image.id)}
              />
            </div>
          ))}
        </div>
      </aside>

      {/* Center Content */}
      <main className="flex-1 flex flex-col bg-white relative">
        <div className="flex-1 overflow-hidden">
          {conversation.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-180px)]">
              <h1 className="text-4xl font-bold text-black mb-2">
                What can you create?
              </h1>
              <p className="text-xl text-gray-600">Generate images</p>
            </div>
          ) : (
            <div
              ref={chatContainerRef}
              className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-180px)]"
            >
              {conversation.map((item, index) => (
                <div
                  key={index}
                  className={`flex ${item.type === 'prompt' ? 'justify-end' : 'justify-start'}`}
                >
                  {item.type === 'prompt' ? (
                    <div className="bg-blue-500 text-white px-4 py-3 rounded-lg max-w-[70%]">
                      {item.content}
                    </div>
                  ) : (
                    <div className="bg-gray-100 rounded-lg p-2 max-w-[70%]">
                      <img
                        src={item.content}
                        alt="Generated Image"
                        className="rounded-md shadow-sm max-w-[300px] max-h-[300px] object-contain"
                      />
                    </div>
                  )}
                </div>
              ))}

              {/* Show generating indicator */}
              {generatingImageId !== null && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-4 max-w-[70%]">
                    <div className="flex items-center space-x-2">
                      <div className="animate-pulse h-2 w-2 bg-gray-400 rounded-full"></div>
                      <div className="animate-pulse h-2 w-2 bg-gray-400 rounded-full animation-delay-200"></div>
                      <div className="animate-pulse h-2 w-2 bg-gray-400 rounded-full animation-delay-400"></div>
                      <span className="text-gray-500 ml-1">Generating...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input area at the bottom */}
        <div className="border-t border-gray-200 bg-white p-6">
          <div className="mb-2">
            <PromptSuggestions
              onSelect={handlePromptSelect}
              suggestions={allSuggestions}
            />
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex items-center space-x-2 border border-gray-300 rounded-full px-4 py-3"
          >
            <input
              type="text"
              placeholder="Describe the image you want to generate..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1 border-0 bg-transparent text-base w-full focus:outline-none"
              style={{ outline: 'none', boxShadow: 'none' }}
            />
            <Button
              type="submit"
              disabled={isLoading}
              className="border-none bg-transparent text-black font-medium rounded-md px-6 py-2 hover:bg-transparent focus:outline-none"
            >
              {isLoading ? (
                'Generating...'
              ) : (
                <img src={SendIcon.src} alt="Send" className="h-6 w-6" />
              )}
            </Button>
          </form>

          {showTryAgain && (
            <div
              onClick={handleTryAgain}
              className="mt-3 text-center text-xs text-gray-700 hover:underline cursor-pointer"
            >
              Try Again?
            </div>
          )}
        </div>
      </main>

      <aside className="w-60 border-l border-gray-300 p-4 bg-white">
        <div className="text-sm flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-medium">Aspect Ratio:</label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="border border-gray-300 rounded-md px-2 py-1 bg-white text-black"
            >
              <option value="1:1">1:1</option>
              <option value="3:2">3:2</option>
              <option value="4:3">4:3</option>
              <option value="16:9">16:9</option>
              <option value="21:9">21:9</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <label className="font-medium">Image Quality:</label>
            <select
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-2 py-1 bg-white text-black"
            >
              <option value={50}>Low</option>
              <option value={80}>Medium</option>
              <option value={100}>High</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <label className="font-medium">Model:</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="border border-gray-300 rounded-md px-2 py-1 bg-white text-black"
            >
              <option value="flux-schnell">FLUX.1</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium">Total Billed:</span>
            <span className="ml-2">${totalBilledAmount.toFixed(4)}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
