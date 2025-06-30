'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { useSession } from '@/app/contexts/SessionContext';
import { ImageGenerationController } from '@/app/controllers/image-generation.controller';
import { useAiGeneration } from '@/app/hooks/useAiGeneration';
import { useChatFunctionality } from '@/app/hooks/useChatFunctionality';
import { AiHistoryPortal } from '@/components/ai/common/ai-history-portal';
import { ChatMessages } from '@/components/ai/common/chat-messages';
import { ChatSidebar } from '@/components/ai/common/chat-sidebar';
import { MainAiSection } from '@/components/ai/common/main-ai-section';
import { PromptSuggestions } from '@/components/ai/common/prompt-suggestions';
import { RightAiSidebar } from '@/components/ai/common/right-ai-sidebar';
import { TextInput } from '@/components/ai/common/text-input';
import WalletIcon from '@/public/digital-wallet.svg';
import SparkIcon from '@/public/spark.svg';
import TrustIcon from '@/public/trust.svg';
import UsdcIcon from '@/public/usdc.svg';
import type { ImageGeneration } from '@/types/database.types';
import { IMAGE_MODEL_PRICING } from '@/utils/constants';
import type { ImageMessage } from '@/utils/types';

import { AiGenerationIntro } from '../common/ai-generation-intro';

const promptSuggestions = [
  { title: 'A global-themed USDC card', icon: WalletIcon },
  { title: 'Floating USDC coins', icon: UsdcIcon },
  { title: 'Surprise me', icon: SparkIcon },
];

interface ImageChatProps {
  currChat: string;
}

export function ImageChat({ currChat }: ImageChatProps) {
  const [provider, setProvider] = useState<string>('flux');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [quality, setQuality] = useState(80);
  const [isEditing, setIsEditing] = useState(false);
  const chatIdRef = useRef<string | null>(null);
  const session = useSession();

  const {
    messages,
    input: chatInput,
    handleInputChange,
    isLoading: isAiInferenceLoading,
    setMessages,
    handleSubmit,
    aiGenerate,
    stop,
    setInput,
  } = useAiGeneration<ImageGeneration, ImageMessage>({
    api: '/api/image-generation/generate',
    body: {
      aspect_ratio: aspectRatio,
      output_quality: quality,
      provider,
      chat_id: chatIdRef.current ?? currChat,
      circle_wallet_id: session.circleWalletId,
    },
    onFinish: async (generation: ImageGeneration) => {
      session.setDemoLimit(session.demoLimit - 1);

      if (chatIdRef.current || currChat) {
        const generateChatData =
          await ImageGenerationController.getInstance().create(
            JSON.stringify({
              prompt: generation.prompt,
              chat_id: chatIdRef.current ?? currChat,
              provider: generation.provider,
              url: generation.url,
            }),
          );

        if (!generateChatData) {
          console.error('Failed to save chat generation');
          return;
        }

        setMessages([
          ...messages,
          {
            id: generateChatData.id + 'user',
            role: 'user',
            prompt: generateChatData.prompt,
            imageUrl: generateChatData.url,
            cost: 0.01,
            provider: generateChatData.provider,
            downloadable: false,
          },
          {
            id: generateChatData.id + 'ai',
            role: 'assistant',
            prompt: generateChatData.prompt,
            imageUrl: generateChatData.url,
            cost: 0.01,
            provider: generateChatData.provider,
            downloadable: true,
          },
        ]);
      }
    },
    onError: (error: string) => {
      toast.error('Failed to generate image');
      console.error('Error:', error);
    },
  });

  useEffect(() => {
    session.setIsAiInferenceLoading(isAiInferenceLoading);
  }, [isAiInferenceLoading]);
  const {
    currChatId,
    chats,
    onSelectChat,
    onDeleteChat,
    onNewChat,
    handleMessageSubmit,
  } = useChatFunctionality<ImageGeneration, ImageMessage>({
    pageBaseUrl: 'image',
    currChat,
    fetchGenerationById: ImageGenerationController.getInstance().fetchById,
    generationToMessages: (chatGenerations: ImageGeneration) => {
      return [
        {
          id: chatGenerations.id + 'user',
          role: 'user',
          prompt: chatGenerations.prompt,
          imageUrl: chatGenerations.url,
          provider: chatGenerations.provider,
          cost: IMAGE_MODEL_PRICING[
            provider as keyof typeof IMAGE_MODEL_PRICING
          ].userBilledPrice,
          downloadable: false,
        },
        {
          id: chatGenerations.id + 'ai',
          role: 'assistant',
          prompt: chatGenerations.prompt,
          imageUrl: chatGenerations.url,
          provider: chatGenerations.provider,
          cost: IMAGE_MODEL_PRICING[
            provider as keyof typeof IMAGE_MODEL_PRICING
          ].userBilledPrice,
          downloadable: true,
        },
      ];
    },
    messages,
    chatInput,
    setMessages,
    handleSubmit: async (e: React.FormEvent<HTMLFormElement>) => {
      if (session.demoLimit > 0 && (session.walletBalance ?? 0) > 0) {
        setMessages([
          ...messages,
          {
            id: `${messages.length}`,
            role: 'user',
            prompt: chatInput,
            imageUrl: '',
            cost: 0.01,
            provider: provider,
            downloadable: false,
          },
        ]);
        await handleSubmit(e);
      } else if (session.demoLimit <= 0) {
        toast.error('Demo limit reached.');
      } else if (
        (session.walletBalance ?? 0) -
          IMAGE_MODEL_PRICING[provider as keyof typeof IMAGE_MODEL_PRICING]
            .userBilledPrice <
        0
      ) {
        toast.error('Insufficient wallet balance.');
      }
    },
    chatIdRef,
  });

  const [trustHovered, setTrustHovered] = useState<boolean>(false);
  const wordsPerToken = 'Each image costs 0.01 USDC';

  return (
    <>
      <div
        className={`${!session.apiKeyStatus.text ? 'flex flex-row items-center justify-center text-white overlay fixed inset-0 bg-gray-800 bg-opacity-80 z-50 pointer-events-auto' : 'hidden'}`}
      >
        This page is not available during the hosted demo.
      </div>
      {/* Left history section */}
      <AiHistoryPortal>
        <ChatSidebar
          chats={chats}
          currentChatId={currChatId}
          onNewChat={onNewChat}
          onSelectChat={onSelectChat}
          onDeleteChat={onDeleteChat}
        />
      </AiHistoryPortal>

      {/* Middle section */}
      <MainAiSection>
        <div className="flex flex-col justify-between h-full py-4 items-center">
          {currChatId ? (
            <>
              <div className="flex flex-row w-[800px]">
                <div className="flex flex-row justify-between space-x-2 w-fit h-fit items-center">
                  <img
                    src={TrustIcon.src}
                    alt="Star with checkmark"
                    className="w-6 h-6"
                    onMouseEnter={() => setTrustHovered(true)}
                    onMouseLeave={() => setTrustHovered(false)}
                  />
                  <div
                    className={`${trustHovered ? 'opacity-100' : 'opacity-0'} cursor-default flex w-fit border border-gray-200 rounded-3xl h-10 justify-center items-center p-4 shadow-md text-sub transition-opacity duration-300`}
                  >
                    {wordsPerToken}
                  </div>
                </div>
              </div>
              <div className="justify-items-center overflow-auto mb-4 h-[calc(100vh-365px)] w-full mt-[30px]">
                <ChatMessages<ImageMessage>
                  messages={messages}
                  handleInputChange={handleInputChange}
                  handleSubmit={handleSubmit}
                  setIsEditing={setIsEditing}
                  aiGenerate={aiGenerate}
                  isAiInferenceLoading={isAiInferenceLoading}
                />
              </div>
            </>
          ) : (
            <AiGenerationIntro
              title="What can you create?"
              description={`Generate images`}
            />
          )}
          <div className="w-full max-w-[800px]">
            <PromptSuggestions
              onSelect={({ title }) => setInput(title)}
              suggestions={promptSuggestions}
            />
            <TextInput
              input={chatInput}
              handleInputChange={handleInputChange}
              handleSubmit={handleMessageSubmit}
              isLoading={isAiInferenceLoading}
              onStopGeneration={stop}
              editingMessage={isEditing}
              maxLength={1000}
            />
          </div>
        </div>
      </MainAiSection>

      {/* Right section with balance and settings */}
      <RightAiSidebar isImageInput={false}>
        <div className="space-y-[20px] mt-4 w-full">
          <div className="flex flex-col">
            <label className="block text-sm text-gray-500 mb-1">
              Model Type
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="border border-gray-200 rounded-lg p-3 bg-white text-body"
            >
              <option value="flux">
                FLUX.1 - ${IMAGE_MODEL_PRICING.flux.userBilledPrice}
              </option>
              <option value="openai">
                Open AI - ${IMAGE_MODEL_PRICING.openai.userBilledPrice}
              </option>
            </select>
          </div>
          {provider === 'flux' && (
            <div className="flex flex-col">
              <label className="block text-sm text-gray-500 mb-1">
                Image Quality
              </label>
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
          )}
        </div>
      </RightAiSidebar>
    </>
  );
}
