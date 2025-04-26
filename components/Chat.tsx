'use client';

import { useState } from 'react';

import { useSession } from '@/app/contexts/SessionContext';
import { useChatHistory } from '@/app/hooks/useChatHistory';
import AiHistoryPortal from '@/components/AiHistoryPortal';
import { ChatMessages } from '@/components/ChatMessages';
import { ChatSidebar } from '@/components/ChatSidebar';
import MainAiSection from '@/components/MainAiSection';
import PromptSuggestions from '@/components/PromptSuggestions';
import RightAiSidebar from '@/components/RightAiSidebar';
import { TextInput } from '@/components/TextInput';
import { Slider } from '@/components/ui/slider';
import Blurs from '@/public/blurs.svg';
import WalletIcon from '@/public/digital-wallet.svg';
import SparkIcon from '@/public/spark.svg';
import TrustIcon from '@/public/trust.svg';
import UsdcIcon from '@/public/usdc.svg';
import { TEXT_MODEL_PRICING } from '@/utils/constants';

const promptSuggestions = [
  { title: 'Explain how to load my wallet', icon: WalletIcon },
  { title: 'Tell me about USDC security', icon: UsdcIcon },
  { title: 'Surprise me', icon: SparkIcon },
];

interface ChatProps {
  currChat: string;
}

export function Chat({ currChat }: ChatProps) {
  const [model, setModel] = useState('gpt-4o-mini');
  const [maxTokens, setMaxTokens] = useState(2000);
  const {
    chatId,
    chats,
    showLimitError,
    onSelectChat,
    onDeleteChat,
    onNewChat,
    handleMessageSubmit,
    handlePromptSelect,
    stopGeneration,
    isLoading,
    messages,
    input,
    handleInputChange,
    handleEditMessage,
    submitEditedMessage,
    cancelEdit,
    editingMessageId,
    editedContent,
    setEditedContent,
  } = useChatHistory('/api/generatetext', currChat, model, {
    maxTokens: maxTokens,
  });
  const [trustHovered, setTrustHovered] = useState<boolean>(false);
  const session = useSession();

  const wordsPerToken = `Each word is around 3 tokens ≡ $${(TEXT_MODEL_PRICING[model].userBilledInputPrice * 3).toFixed(5)}`;

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
          currentChatId={chatId}
          onNewChat={onNewChat}
          onSelectChat={onSelectChat}
          onDeleteChat={onDeleteChat}
        />
      </AiHistoryPortal>

      {/* Middle section */}
      <MainAiSection>
        <div className="flex flex-col justify-between h-full py-4 items-center">
          {chatId ? (
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
                <ChatMessages
                  messages={messages}
                  isLoading={isLoading}
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
          <div>
            <PromptSuggestions
              onSelect={handlePromptSelect}
              suggestions={promptSuggestions}
            />
            <TextInput
              input={input}
              handleInputChange={handleInputChange}
              handleSubmit={handleMessageSubmit}
              isLoading={isLoading}
              onStopGeneration={stopGeneration}
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
          <div className="flex flex-col space-y-[4px]">
            <div className="text-sub m-1">Max Tokens</div>
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
                maxTokens * TEXT_MODEL_PRICING[model].userBilledOutputPrice
              ).toFixed(2)}
            </div>
          </div>

          <div className="flex flex-col">
            <div className="text-sub mb-1">Model Type</div>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
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
}
