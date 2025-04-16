'use client';

import { useEffect, useRef, useState } from 'react';

import { useSession } from '@/app/contexts/SessionContext';
import { useDemoLimit } from '@/app/hooks/useDemoLimit';
import AiHistoryPortal from '@/components/AiHistoryPortal';
import { ChatSidebar } from '@/components/ChatSidebar';
import MainAiSection from '@/components/MainAiSection';
import PromptSuggestions from '@/components/PromptSuggestions';
import RightAiSidebar from '@/components/RightAiSidebar';
import { TextInput } from '@/components/TextInput';
import Blurs from '@/public/blurs.svg';
import WalletIcon from '@/public/digital-wallet.svg';
import SparkIcon from '@/public/spark.svg';
import TrustIcon from '@/public/trust.svg';
import UsdcIcon from '@/public/usdc.svg';
import { aiModel } from '@/types/ai.types';
import { IMAGE_MODEL_PRICING } from '@/utils/constants';

import type { WalletTransferRequest } from '../server/circleWalletTransfer';

interface ConversationItem {
  type: 'prompt' | 'response';
  content: string;
}

interface ImageHistoryItem {
  id: string;
  url: string;
  prompt: string;
  created_at: string;
}

const promptSuggestions = [
  { title: 'A global-themed USDC card', icon: WalletIcon },
  { title: 'Floating USDC coins', icon: UsdcIcon },
  { title: 'Surprise me', icon: SparkIcon },
];

export default function Page() {
  const { remaining, loading: demoLimitLoading } = useDemoLimit();
  const [prompt, setPrompt] = useState('');
  const [conversation, setConversation] = useState<ConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showTryAgain, setShowTryAgain] = useState(false);
  const [showLimitError, setShowLimitError] = useState(false);

  const [history, setHistory] = useState<ImageHistoryItem[]>([]);
  const [currentImageId, setCurrentImageId] = useState('');

  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [quality, setQuality] = useState(80);
  const [model, setModel] = useState('flux-schnell');

  const [trustHovered, setTrustHovered] = useState<boolean>(false);
  const wordsPerToken = 'Indicative cost or info...';

  const session = useSession();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop =
          chatContainerRef.current.scrollHeight;
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [conversation]);

  const fetchImages = async () => {
    try {
      const response = await fetch('/api/getgeneratedimages', {
        method: 'GET',
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

  useEffect(() => {
    fetchImages();
  }, []);

  const generateImage = async (promptToSubmit: string) => {
    if (!promptToSubmit.trim()) return;
    if (remaining === 0) {
      setShowLimitError(true);
      return;
    }
    setShowLimitError(false);
    setIsLoading(true);
    setShowTryAgain(false);

    setConversation((prev) => [
      ...prev,
      { type: 'prompt', content: promptToSubmit },
    ]);

    try {
      const response = await fetch('/api/generateimagedalle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: promptToSubmit,
          aspect_ratio: aspectRatio,
          output_quality: quality,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          setShowLimitError(true);
        } else {
          throw new Error(errorData.error || 'Failed to generate image');
        }
      }

      const { imageUrl } = await response.json();
      // Add generated image to conversation
      setConversation((prev) => [
        ...prev,
        { type: 'response', content: imageUrl },
      ]);

      // Refresh billing info & history
      await fetchImages();

      setShowTryAgain(true);

      // Transfer balance
      const transfer: WalletTransferRequest = {
        circleWalletId: session.wallet_id ?? '',
        amount: IMAGE_MODEL_PRICING.userBilledPrice.toString(),
        projectName: 'Hi',
        aiModel: aiModel.TEXT_TO_IMAGE,
      };

      const transferResponse = await fetch('/api/wallet/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transfer),
      });

      if (!transferResponse.ok) {
        throw new Error('Transfer failed');
      }

      const result = await transferResponse.json();
      console.log('Transfer initiated:', result);
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (prompt.trim() && prompt.length <= 300) {
      await generateImage(prompt);
      setPrompt('');
    }
  };

  const handleTryAgain = async () => {
    await generateImage(prompt);
  };

  const handlePromptSelect = (selectedPrompt: any) => {
    setPrompt(selectedPrompt.title);
  };

  const stopGeneration = () => {};

  const onSelectChat = (id: string) => {
    setCurrentImageId(id);
    setConversation([]);
  };

  const onNewChat = () => {
    setCurrentImageId('');
    setConversation([]);
  };

  const onDeleteChat = async (id: string) => {
    try {
      const response = await fetch(`/api/deleteimage?imageid=${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (response.ok) {
        // Remove from local state
        setHistory((prev) => prev.filter((img) => img.id !== id));
        // Clear conversation if we deleted the currently viewed image
        if (id === currentImageId) {
          setCurrentImageId('');
          setConversation([]);
        }
      } else {
        console.error('Error deleting image:', data.error);
      }
    } catch (error) {
      console.error('Delete request failed:', error);
    }
  };

  return (
    <>
      {/* Temporarily commented out overlay
      <div
        className={`${!session?.api_key_status?.image ? 'flex flex-row items-center justify-center text-white overlay fixed inset-0 bg-gray-800 bg-opacity-80 z-50 pointer-events-auto' : 'hidden'}`}
      >
        <div className="flex flex-col items-center">
          <div className="mb-4">
            This page is not available during the hosted demo.
          </div>
          <Link href="/dashboard">
            <button className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-md text-zinc-300 border-[0.5px] border-zinc-600 transition-colors">
              Go Back
            </button>
          </Link>
        </div>
      </div>
      */}
      {/* LEFT SIDEBAR (history) */}
      <AiHistoryPortal>
        <ChatSidebar
          chats={history.map((img) => ({
            id: img.id,
            title: img.prompt,
            created_at: img.created_at,
          }))}
          currentChatId={currentImageId}
          onNewChat={onNewChat}
          onSelectChat={onSelectChat}
          onDeleteChat={onDeleteChat}
        />
      </AiHistoryPortal>

      {/* MIDDLE SECTION */}
      <MainAiSection>
        {/* Trust icon + tooltip */}
        <div className="flex flex-row justify-between space-x-2 w-fit h-fit items-center">
          <img
            src={TrustIcon.src}
            alt="Star with checkmark"
            className="w-6 h-6"
            onMouseEnter={() => setTrustHovered(true)}
            onMouseLeave={() => setTrustHovered(false)}
          />
          <div
            className={`${
              trustHovered ? 'opacity-100' : 'opacity-0'
            } cursor-default flex w-fit border border-gray-200 rounded-3xl h-10 justify-center items-center p-4 shadow-md text-body transition-opacity duration-300`}
          >
            {wordsPerToken}
          </div>
          {!demoLimitLoading && remaining !== null && (
            <div className="text-sm text-gray-500">
              {remaining === 0
                ? 'Demo limit reached'
                : `${remaining} generations remaining`}
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col justify-between h-full">
          {/* Conversation Display */}
          {conversation.length === 0 ? (
            <div className="relative w-full h-full">
              <img
                src={Blurs.src}
                alt="blur background"
                className="w-1/2 object-contain mx-auto"
              />
              <div className="inset-0 flex items-center justify-center absolute">
                <div className="flex flex-col items-center justify-center w-1/3 text-center">
                  <h1 className="text-5xl text-body mb-2">
                    What can you create?
                  </h1>
                  <p className="text-xl text-sub">Generate images</p>
                </div>
              </div>
            </div>
          ) : (
            <div
              ref={chatContainerRef}
              className="h-full overflow-y-auto space-y-4 pr-2"
            >
              {conversation.map((item, index) => {
                if (item.type === 'prompt') {
                  return (
                    <div key={index} className="flex justify-end">
                      <div className="bg-blue-500 text-white px-4 py-3 rounded-lg max-w-[70%]">
                        {item.content}
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div key={index} className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg p-2 max-w-[70%]">
                        <img
                          src={item.content}
                          alt="Generated"
                          className="rounded-md shadow-sm max-w-[300px] max-h-[300px] object-contain"
                        />
                      </div>
                    </div>
                  );
                }
              })}
              {isLoading && (
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

          {/* Bottom input area */}
          <div>
            <PromptSuggestions
              onSelect={handlePromptSelect}
              suggestions={promptSuggestions}
            />
            <TextInput
              input={prompt}
              handleInputChange={(e) => setPrompt(e.target.value)}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              onStopGeneration={stopGeneration}
              editingMessage={false}
              maxLength={300}
            />
            {showLimitError && (
              <p className="text-red-500 text-sm mt-2 text-center">
                Demo limit reached. Please upgrade to continue.
              </p>
            )}
            {showTryAgain && (
              <div
                onClick={handleTryAgain}
                className="mt-3 text-center text-xs text-gray-700 hover:underline cursor-pointer"
              >
                Try Again?
              </div>
            )}
          </div>
        </div>
      </MainAiSection>

      {/* RIGHT SIDEBAR */}
      <RightAiSidebar isImageInput={false}>
        <div className="space-y-[20px] mt-4 w-full">
          <div className="flex flex-col space-x-2">
            <div className="text-sub mb-1">Aspect Ratio</div>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="border border-gray-200 rounded-lg p-3 bg-white text-body"
            >
              <option value="1:1">1:1</option>
              <option value="3:2">3:2</option>
              <option value="4:3">4:3</option>
              <option value="16:9">16:9</option>
              <option value="21:9">21:9</option>
            </select>
          </div>
          <div className="flex flex-col space-x-2">
            <div className="text-sub mb-1">Image Quality</div>
            <select
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="border border-gray-200 rounded-lg p-3 bg-white text-body"
            >
              <option value={50}>Low</option>
              <option value={80}>Medium</option>
              <option value={100}>High</option>
            </select>
          </div>
          <div className="flex flex-col space-x-2">
            <div className="text-sub mb-1">Model Type</div>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="border border-gray-200 rounded-lg p-3 bg-white text-body"
            >
              <option value="flux-schnell">FLUX.1</option>
            </select>
          </div>
        </div>
      </RightAiSidebar>
    </>
  );
}
