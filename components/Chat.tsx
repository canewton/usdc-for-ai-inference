'use client';

import { useChat } from '@ai-sdk/react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { useSession } from '@/app/contexts/SessionContext';
import { useDemoLimit } from '@/app/hooks/useDemoLimit';
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
  const { remaining, loading: demoLimitLoading } = useDemoLimit();
  const [model, setModel] = useState('gpt-4o-mini');
  const [maxTokens, setMaxTokens] = useState(2000);
  const [chatId, setChatId] = useState(currChat || '');
  const [chats, setChats] = useState<
    { id: string; title: string; created_at: string }[]
  >([]);
  const chatIdRef = useRef<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [trustHovered, setTrustHovered] = useState<boolean>(false);
  const [showLimitError, setShowLimitError] = useState(false);

  const session = useSession();
  const router = useRouter();

  const wordsPerToken = `Each word is around 3 tokens ≡ $${(TEXT_MODEL_PRICING[model].userBilledInputPrice * 3).toFixed(5)}`;

  const {
    messages,
    input,
    handleInputChange,
    isLoading,
    setMessages,
    handleSubmit,
    stop,
    setInput,
  } = useChat({
    api: '/api/generatetext',
    body: {
      model: model,
      maxTokens: maxTokens,
    },
    onFinish: async (message: any, { usage }: any) => {
      if (chatIdRef.current || chatId) {
        const generateChatData = await postChatGeneration(message, usage);
        setMessages((prevMsgs: any) => [
          ...prevMsgs.slice(0, -2),
          {
            id: generateChatData.id + 'user',
            role: 'user',
            content: input,
            promptTokens: usage.promptTokens,
            completionTokens: usage.completionTokens,
            provider: model,
          },
          {
            id: generateChatData.id + 'ai',
            role: 'assistant',
            content: message.content,
            promptTokens: usage.promptTokens,
            completionTokens: usage.completionTokens,
            provider: model,
          },
        ]);
      }
    },
  });

  const postChatGeneration = async (message: any, usage: any) => {
    try {
      const response = await fetch('/api/postchatgeneration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_text: input,
          ai_text: message.content,
          provider: model,
          chat_id: chatIdRef.current || chatId,
          prompt_tokens: usage.promptTokens,
          completion_tokens: usage.completionTokens,
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      else {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error('Error saving chat:', error);
    }
  };

  const getChatMessages = async (id: string) => {
    if (!id.trim()) return;
    try {
      const response = await fetch(`/api/getchatgenerations?id=${id}`, {
        method: 'GET',
      });
      const data = await response.json();

      // Check if the response is successful
      if (response.ok) {
        // Rearrange the chats to individual messages
        const msgs = data.chats.map((obj: any) => [
          {
            id: obj.id + 'user',
            role: 'user',
            content: obj.user_text,
            promptTokens: obj.prompt_tokens,
            completionTokens: obj.completion_tokens,
            provider: obj.provider,
          },
          {
            id: obj.id + 'ai',
            role: 'assistant',
            content: obj.ai_text,
            promptTokens: obj.prompt_tokens,
            completionTokens: obj.completion_tokens,
            provider: obj.provider,
          },
        ]);
        // Store the fetched messages
        setMessages(msgs.flat());
      } else {
        console.error('Error fetching messages:', data.error);
      }
    } catch (error) {
      console.error('Fetch chat messages error:', error);
    }
  };

  const onSelectChat = async (id: string) => {
    await getChatMessages(id);
    setChatId(id);
    chatIdRef.current = id;
    window.history.replaceState(null, '', `/chat/${id}`);
  };

  const onDeleteChat = (id: string) => {
    const deleteChat = async (id: string) => {
      try {
        const response = await fetch(`/api/deletechat?id=${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();
        if (response.ok) {
          // Remove deleted chat from state
          setChats((prevChats) => prevChats.filter((chat) => chat.id !== id));
        } else {
          console.error('Error deleting chat:', result.error);
        }
      } catch (error) {
        console.error('Delete request failed:', error);
      }
    };
    if (session) {
      deleteChat(id);
      setMessages([]);
      router.push('/chat/');
    }
  };

  const onNewChat = () => {
    setChats((prevChats) => [
      {
        id: '',
        title: '',
        created_at: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
      },
      ...prevChats,
    ]);
    setChatId('');
    setMessages([]);
  };

  const fetchChats = async () => {
    try {
      const response = await fetch(`/api/getchats`, {
        method: 'GET',
      });
      const data = await response.json();
      // Check if the response is successful
      if (response.ok) {
        // Store the fetched chats
        setChats(data.chats);
      } else {
        console.error('Error fetching chat:', data.error);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  const createNewChat = async (title: string) => {
    try {
      const response = await fetch('/api/postchat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        return data;
      } else {
        console.error('Error posting chat:', data.error);
      }
    } catch (error) {
      console.error('Error saving chat:', error);
    }
  };

  const handleMessageSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (remaining === 0) {
      setShowLimitError(true);
      return;
    }
    setShowLimitError(false);
    if (!chatId) {
      // Post new chat
      const chatData = await createNewChat(input);
      if (chatData.id) {
        setChatId(chatData.id);
        chatIdRef.current = chatData.id;
        window.history.replaceState(null, '', `/chat/${chatData.id}`);
        // Update chats
        if (chats[0].id === '') {
          setChats((prevChats) => [
            {
              id: chatData.id,
              title: chatData.title,
              created_at: chatData.created_at,
            },
            ...prevChats.slice(1),
          ]);
        } else {
          setChats((prevChats) => [
            {
              id: chatData.id,
              title: chatData.title,
              created_at: chatData.created_at,
            },
            ...prevChats,
          ]);
        }
      } else {
        console.error('Failed to create new chat');
      }
    }

    // Generate text
    try {
      handleSubmit(e, {
        body: {
          model: model,
          maxTokens: maxTokens,
        },
      });
    } catch (error) {
      console.error('Error in message submission:', error);
    }
  };

  const handlePromptSelect = (selectedPrompt: any) => {
    setInput(selectedPrompt.title);
  };

  const stopGeneration = () => {
    stop();
  };

  const handleEditMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditedContent(content);
  };

  const submitEditedMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editedContent.trim()) return;
    // Get original message
    const originalMessage = messages.find((msg) => msg.id === editingMessageId);
    if (!originalMessage || originalMessage.role !== 'user') return;

    // Find the next assistant message (if any)
    const messageIndex = messages.findIndex(
      (msg) => msg.id === editingMessageId,
    );

    // Remove user message and all subsequent messages
    setMessages(messages.slice(0, messageIndex));

    const chatGenerationId = editingMessageId?.slice(0, -4);
    try {
      const response = await fetch(
        `/api/deletechatgenerations?id=${chatGenerationId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const result = await response.json();
      if (response.ok) {
        // Remove deleted chat from state
        console.log(result);
      } else {
        console.error('Error deleting chat generations:', result.error);
      }
    } catch (error) {
      console.error('Delete request failed:', error);
    }

    // Submit the edited message to generate a new response
    try {
      handleSubmit(e, {
        body: {
          messages: [
            {
              role: 'user',
              content: editedContent,
            },
          ],
          model: model,
          maxTokens: maxTokens,
        },
      });
    } catch (error) {
      console.error('Error in message submission:', error);
    }

    // Reset editing state
    setEditingMessageId(null);
    setEditedContent('');
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditedContent('');
  };

  useEffect(() => {
    // Get all user's chats
    fetchChats();
  }, []);

  useEffect(() => {
    // Get messages if chat changes
    getChatMessages(chatId);
  }, [chatId]);

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
