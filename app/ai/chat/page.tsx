'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef, useState } from 'react';

import { ChatInput } from '@/app/components/ChatInput';
import { ChatMessages } from '@/app/components/ChatMessages';
import { ChatSidebar } from '@/app/components/ChatSidebar';
import { useSession } from '@/app/contexts/SessionContext';

interface ChatProps {
  currChat: string;
}

export function Chat({ currChat }: ChatProps) {
  const [model, setModel] = useState('gpt-4o-mini');
  const [chatId, setChatId] = useState(currChat || '');
  const [chats, setChats] = useState<{ id: string; title: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatIdRef = useRef<string | null>(null);

  const session = useSession();

  const {
    messages,
    input,
    handleInputChange,
    isLoading,
    setMessages,
    handleSubmit,
  } = useChat({
    api: '/api/generatetext',
    headers: {
      Authorization: session.access_token,
    },
    body: {
      model: model,
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
            tokens: usage.promptTokens,
          },
          {
            id: generateChatData.id + 'ai',
            role: 'assistant',
            content: message.content,
            tokens: usage.completionTokens,
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
          Authorization: `Bearer ${session.access_token}`,
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
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
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
            tokens: obj.prompt_tokens,
          },
          {
            id: obj.id + 'ai',
            role: 'assistant',
            content: obj.ai_text,
            tokens: obj.completion_tokens,
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
    window.history.replaceState(null, '', `/ai/chat/${id}`);
  };

  const onDeleteChat = (id: string) => {
    const deleteChat = async (id: string) => {
      try {
        const response = await fetch(`/api/deletechat?id=${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
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
    }
  };

  const onNewChat = () => {
    setChats((prevChats) => [{ id: '', title: '' }, ...prevChats]);
    setChatId('');
    setMessages([]);
  };

  const fetchChats = async () => {
    if (!session) return;
    try {
      const response = await fetch(`/api/getchats`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
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
          Authorization: `Bearer ${session.access_token}`,
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
    if (!chatId) {
      // Post new chat
      const chatData = await createNewChat(input);
      if (chatData.id) {
        setChatId(chatData.id);
        chatIdRef.current = chatData.id;
        window.history.replaceState(null, '', `/ai/chat/${chatData.id}`);
        // Update chats
        if (chats[0].id === '') {
          setChats((prevChats) => [
            { id: chatData.id, title: chatData.title },
            ...prevChats.slice(1),
          ]);
        } else {
          setChats((prevChats) => [
            { id: chatData.id, title: chatData.title },
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
        },
      });
    } catch (error) {
      console.error('Error in message submission:', error);
    }
  };

  useEffect(() => {
    // Get all user's chats
    fetchChats();
  }, [session]);

  useEffect(() => {
    // Scroll to bottom of messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Get messages if chat changes
    getChatMessages(chatId);
  }, [chatId]);

  return (
    <div className="w-full mx-auto">
      <h1 className="text-2xl font-bold">Chat Generator</h1>
      <div className="flex w-full justify-between space-x-6">
        <div className="flex w-64 h-96 flex flex-col border-r-2 border-gray">
          <ChatSidebar
            chats={chats}
            currentChatId={chatId}
            onNewChat={onNewChat}
            onSelectChat={onSelectChat}
            onDeleteChat={onDeleteChat}
          />
        </div>
        <div className="flex w-full h-full">
          <div className="flex flex-col h-[500px] w-full">
            <div className="flex-1 overflow-y-auto p-4">
              <ChatMessages messages={messages} isLoading={isLoading} />
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 space-y-6">
              <ChatInput
                input={input}
                handleInputChange={handleInputChange}
                handleSubmit={handleMessageSubmit}
                isLoading={isLoading}
              />
              <div className="flex items-center space-x-2">
                <span className="font-medium">Model:</span>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="border rounded p-2"
                >
                  <option value={'gpt-4o-mini'}>gpt-4o-mini</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return <Chat currChat={''} />;
}
