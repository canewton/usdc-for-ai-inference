'use client';

import { useRef, useState } from 'react';

import { useSession } from '@/app/contexts/SessionContext';
import { ImageGenerationController } from '@/app/controllers/image-generation.controller';
import { useAiGeneration } from '@/app/hooks/useAiGeneration';
import { useChatFunctionality } from '@/app/hooks/useChatFunctionality';
import AiHistoryPortal from '@/components/AiHistoryPortal';
import { ChatMessages } from '@/components/ChatMessages';
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
import type { ImageGeneration } from '@/types/database.types';
import { IMAGE_MODEL_PRICING } from '@/utils/constants';
import type { ImageMessage } from '@/utils/types';

const promptSuggestions = [
  { title: 'A global-themed USDC card', icon: WalletIcon },
  { title: 'Floating USDC coins', icon: UsdcIcon },
  { title: 'Surprise me', icon: SparkIcon },
];

interface ImageChatProps {
  currChat: string;
}

export function ImageChat({ currChat }: ImageChatProps) {
  const [provider, setProvider] = useState('flux-schnell');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [quality, setQuality] = useState(80);
  const chatIdRef = useRef<string | null>(null);

  const {
    messages,
    input: chatInput,
    handleInputChange,
    isLoading: isAiInferenceLoading,
    setMessages,
    handleSubmit,
    stop,
    setInput,
  } = useAiGeneration<ImageGeneration, ImageMessage>({
    api: '/api/generateimage',
    body: {
      aspect_ratio: aspectRatio,
      output_quality: quality,
      provider,
      chat_id: chatIdRef.current ?? currChat,
    },
    onFinish: async (generation: ImageGeneration) => {
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
            content: generateChatData.prompt,
            cost: 0.01,
            provider: generateChatData.provider,
          },
          {
            id: generateChatData.id + 'ai',
            role: 'assistant',
            content: generateChatData.url,
            cost: 0.01,
            provider: generateChatData.provider,
          },
        ]);
      }
    },
  });

  const {
    currChatId,
    chats,
    showLimitError,
    onSelectChat,
    onDeleteChat,
    onNewChat,
    handleMessageSubmit,
    handleEditMessage,
    submitEditedMessage,
    cancelEdit,
    editingMessageId,
    editedContent,
    setEditedContent,
  } = useChatFunctionality<ImageGeneration, ImageMessage>({
    pageBaseUrl: 'image',
    currChat,
    fetchGeneration: ImageGenerationController.getInstance().fetch,
    generationToMessages: (chatGenerations: ImageGeneration) => {
      return [
        {
          id: chatGenerations.id + 'user',
          role: 'user',
          content: chatGenerations.prompt,
          provider: chatGenerations.provider,
          cost: IMAGE_MODEL_PRICING.userBilledPrice,
        },
        {
          id: chatGenerations.id + 'ai',
          role: 'assistant',
          content: chatGenerations.url,
          provider: chatGenerations.provider,
          cost: IMAGE_MODEL_PRICING.userBilledPrice,
        },
      ];
    },
    messages,
    chatInput,
    setMessages,
    handleSubmit: async (e: React.FormEvent<HTMLFormElement>) => {
      setMessages([
        ...messages,
        {
          id: `${messages.length}`,
          role: 'user',
          content: chatInput,
          cost: 0.01,
          provider: provider,
        },
      ]);
      await handleSubmit(e);
    },
    chatIdRef,
  });

  const [trustHovered, setTrustHovered] = useState<boolean>(false);
  const session = useSession();

  const wordsPerToken = 'Indicative cost or info...';

  return (
    <>
      <div
        className={`${!session.api_keys_status.text ? 'flex flex-row items-center justify-center text-white overlay fixed inset-0 bg-gray-800 bg-opacity-80 z-50 pointer-events-auto' : 'hidden'}`}
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
              <div className="justify-items-center overflow-auto mb-4 h-[calc(100vh-365px)] w-full max-w-[800px] mt-[30px]">
                <ChatMessages
                  messages={messages}
                  isLoading={isAiInferenceLoading}
                  editingMessageId={editingMessageId}
                  editedContent={editedContent}
                  setEditedContent={setEditedContent}
                  onEditMessage={handleEditMessage}
                  onCancelEdit={cancelEdit}
                  onSubmitEdit={submitEditedMessage}
                  handleInputChange={handleInputChange}
                />
              </div>
            </>
          ) : (
            <div className="relative w-full h-full">
              <img
                src={Blurs.src}
                alt="blur background"
                className="w-1/2 object-contain mx-auto"
              />
              <div className="inset-0 flex items-center justify-center absolute">
                <div className="flex flex-col items-center justify-center w-1/3 text-center">
                  <h1 className="text-5xl text-body mb-2">What do you need?</h1>
                  <p className="text-xl text-sub">
                    Ask our AI chatbot about anything
                  </p>
                </div>
              </div>
            </div>
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
              editingMessage={editingMessageId !== null}
              maxLength={1000}
            />
            {showLimitError && (
              <p className="text-red-500 text-sm mt-2 text-center">
                Demo limit reached. Please upgrade to continue.
              </p>
            )}
          </div>
        </div>
      </MainAiSection>

      {/* Right section with balance and settings */}
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
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
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
