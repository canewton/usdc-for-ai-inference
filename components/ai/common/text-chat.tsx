'use client';

import type { Message } from '@ai-sdk/react';
import { useChat } from '@ai-sdk/react';
import type { UIMessage } from 'ai';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { useSession } from '@/app/contexts/SessionContext';
import { ChatGenerationController } from '@/app/controllers/chat-generation.controller';
import { useChatFunctionality } from '@/app/hooks/useChatFunctionality';
import { AiHistoryPortal } from '@/components/ai/common/ai-history-portal';
import { ChatMessages } from '@/components/ai/common/chat-messages';
import { ChatSidebar } from '@/components/ai/common/chat-sidebar';
import { MainAiSection } from '@/components/ai/common/main-ai-section';
import { PromptSuggestions } from '@/components/ai/common/prompt-suggestions';
import { RightAiSidebar } from '@/components/ai/common/right-ai-sidebar';
import { TextInput } from '@/components/ai/common/text-input';
import { Slider } from '@/components/ui/slider';
import WalletIcon from '@/public/digital-wallet.svg';
import SparkIcon from '@/public/spark.svg';
import TrustIcon from '@/public/trust.svg';
import UsdcIcon from '@/public/usdc.svg';
import type { ChatGeneration } from '@/types/database.types';
import { TEXT_MODEL_PRICING } from '@/utils/constants';

import { AiGenerationIntro } from './ai-generation-intro';
import { ChatController } from '@/app/controllers/chat.controller';

const promptSuggestions = [
  { title: 'What are the benefits of USDC', icon: WalletIcon },
  { title: 'Tell me about USDC security', icon: UsdcIcon },
  { title: 'Surprise me', icon: SparkIcon },
];

interface ChatProps {
  currChat: string;
}

export const TextChat = ({ currChat }: ChatProps) => {
  const [provider, setProvider] = useState('gpt-4o-mini');
  const [maxTokens, setMaxTokens] = useState(2000);
  const chatIdRef = useRef<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const session = useSession();

  const {
    messages,
    input: chatInput,
    handleInputChange,
    isLoading: isAiInferenceLoading,
    setMessages,
    handleSubmit,
    stop,
    setInput,
  } = useChat({
    api: '/api/chat-generation/generate',
    body: {
      provider: provider,
      max_tokens: maxTokens,
      circle_wallet_id: session.circleWalletId,
    },
    onFinish: async (message: any, { usage }: any) => {
      session.setDemoLimit(session.demoLimit - 1);

      if (chatIdRef.current || currChat) {
        const generateChatData =
          await ChatGenerationController.getInstance().create(
            JSON.stringify({
              user_text: chatInput,
              ai_text: message.content,
              provider: provider,
              chat_id: chatIdRef.current ?? currChat,
              prompt_tokens: usage.promptTokens,
              completion_tokens: usage.completionTokens,
            }),
          );

        if (!generateChatData) {
          console.error('Failed to save chat generation');
          return;
        }

        setMessages((prevMsgs) => [
          ...prevMsgs.slice(0, -2),
          {
            id: generateChatData.id + 'user',
            role: 'user',
            content: generateChatData.user_text,
            promptTokens: generateChatData.prompt_tokens,
            completionTokens: generateChatData.completion_tokens,
            provider: generateChatData.provider,
          },
          {
            id: generateChatData.id + 'ai',
            role: 'assistant',
            content: generateChatData.ai_text,
            promptTokens: generateChatData.prompt_tokens,
            completionTokens: generateChatData.completion_tokens,
            provider: generateChatData.provider,
          },
        ]);
      }
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
  } = useChatFunctionality<ChatGeneration, Message>({
    pageBaseUrl: 'chat',
    currChat,
    fetchGenerationById: ChatGenerationController.getInstance().fetchById,
    generationToMessages: (chatGenerations: ChatGeneration) => {
      return [
        {
          id: chatGenerations.id + 'user',
          role: 'user',
          content: chatGenerations.user_text,
          promptTokens: chatGenerations.prompt_tokens,
          completionTokens: chatGenerations.completion_tokens,
          provider: chatGenerations.provider,
        },
        {
          id: chatGenerations.id + 'ai',
          role: 'assistant',
          content: chatGenerations.ai_text,
          promptTokens: chatGenerations.prompt_tokens,
          completionTokens: chatGenerations.completion_tokens,
          provider: chatGenerations.provider,
        },
      ];
    },
    messages,
    chatInput,
    setMessages,
    handleSubmit: async (e: React.FormEvent<HTMLFormElement>) => {
      if (session.demoLimit > 0 && (session.walletBalance ?? 0) > 0) {
        await handleSubmit(e, {
          body: {
            provider: provider,
            maxTokens: maxTokens,
          },
        });
      } else if (session.demoLimit <= 0) {
        toast.error('Demo limit reached.');
      } else if (
        (session.walletBalance ?? 0) -
          maxTokens * TEXT_MODEL_PRICING[provider].userBilledInputPrice <
        0
      ) {
        toast.error('Insufficient wallet balance.');
      }
    },
    chatIdRef,
  });

  const [trustHovered, setTrustHovered] = useState<boolean>(false);
  const wordsPerToken = `Each word is around 3 tokens ≡ $${(TEXT_MODEL_PRICING[provider].userBilledInputPrice * 3).toFixed(5)}`;

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
                <ChatMessages<UIMessage>
                  messages={messages}
                  handleInputChange={handleInputChange}
                  setIsEditing={setIsEditing}
                  handleSubmit={handleSubmit}
                  isAiInferenceLoading={isAiInferenceLoading}
                />
              </div>
            </>
          ) : (
            <AiGenerationIntro
              title="What do you need?"
              description="Ask our AI chatbot about anything"
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
          <div className="flex flex-col space-y-[4px]">
            <label className="block text-sm text-gray-500 mb-1">
              Max Tokens
            </label>
            <div className="flex w-full h-8 border border-gray-200 items-center justify-center rounded-3xl p-2">
              <Slider
                defaultValue={[maxTokens]}
                min={200}
                max={10000}
                step={100}
                onValueChange={(val) => setMaxTokens(val[0])}
              />
            </div>
            <div className="text-sub mr-auto w-full text-end">
              {maxTokens} tokens ≡ $
              {(
                maxTokens * TEXT_MODEL_PRICING[provider].userBilledOutputPrice
              ).toFixed(2)}
            </div>
          </div>

          <div className="flex flex-col">
            <label className="block text-sm text-gray-500 mb-1">
              Model Type
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="border border-gray-200 rounded-lg p-3 bg-white text-body w-full"
            >
              <option value={'gpt-4o-mini'}>gpt-4o-mini</option>
              <option value={'gpt-4o'}>gpt-4o</option>
            </select>
          </div>
        </div>
      </RightAiSidebar>
    </>
  );
};
