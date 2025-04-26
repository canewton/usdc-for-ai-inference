'use client';

import { useChat } from '@ai-sdk/react';
import type { Message } from 'ai';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import type { Chat as AiChat, ChatGeneration } from '@/types/database.types';

import { useSession } from '../contexts/SessionContext';
import { ChatController } from '../controllers/chat.controller';
import { ChatGenerationController } from '../controllers/chat-generation.controller';
import { useDemoLimit } from './useDemoLimit';

export function useChatHistory(
  api: string,
  currChat: string,
  model: string,
  modelOptionalParams: Object,
) {
  const { remaining } = useDemoLimit();
  const [chatId, setChatId] = useState(currChat || '');
  const [chats, setChats] = useState<AiChat[]>([]);
  const chatIdRef = useRef<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [showLimitError, setShowLimitError] = useState(false);

  const session = useSession();
  const router = useRouter();

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
    api,
    body: {
      model: model,
      ...modelOptionalParams,
    },
    onFinish: async (message: any, { usage }: any) => {
      if (chatIdRef.current || chatId) {
        const generateChatData =
          await ChatGenerationController.getInstance().create(
            JSON.stringify({
              user_text: input,
              ai_text: message.content,
              provider: model,
              chat_id: chatIdRef.current || chatId,
              prompt_tokens: usage.promptTokens,
              completion_tokens: usage.completionTokens,
            }),
          );

        if (!generateChatData) {
          console.error('Failed to save chat generation');
          return;
        }

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

  const formatChatMessages = (chatGenerations: ChatGeneration[]) => {
    const messages: Message[][] = chatGenerations.map((obj: any) => [
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

    return messages.flat();
  };

  const onSelectChat = async (id: string) => {
    const messages = await ChatGenerationController.getInstance().fetch(id);

    if (!messages) {
      console.error('Failed to fetch chat messages');
      return;
    }

    setMessages(formatChatMessages(messages));
    setChatId(id);
    chatIdRef.current = id;
    window.history.replaceState(null, '', `/chat/${id}`);
  };

  const onDeleteChat = (id: string) => {
    if (session) {
      ChatController.getInstance()
        .delete(id)
        .then((deletedChat) => {
          if (!deletedChat) {
            console.error('Failed to delete chat');
            return;
          }
          setChats((prevChats) => prevChats.filter((chat) => chat.id !== id));
          setMessages([]);
          setChatId('');
          router.push('/chat/');
        });
    }
  };

  const onNewChat = () => {
    router.push('/chat/');
    setChatId('');
    setMessages([]);
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
      const chatData = await ChatController.getInstance().create(input);
      if (!chatData) {
        console.error('Failed to create new chat');
        return;
      }

      if (chatData.id) {
        setChatId(chatData.id);
        chatIdRef.current = chatData.id;
        window.history.replaceState(null, '', `/chat/${chatData.id}`);
        // Update chats
        if (chats[0].id === '') {
          setChats((prevChats) => [chatData, ...prevChats.slice(1)]);
        } else {
          setChats((prevChats) => [chatData, ...prevChats]);
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
          ...modelOptionalParams,
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
          ...modelOptionalParams,
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
    ChatController.getInstance()
      .fetch()
      .then((chats) => {
        if (!chats) {
          console.error('Failed to fetch chats');
          return;
        }
        setChats(chats);
      });
  }, []);

  useEffect(() => {
    // Get messages if chat changes
    if (!chatId) return;
    ChatGenerationController.getInstance()
      .fetch(chatId)
      .then((messages) => {
        if (!messages) {
          console.error('Failed to fetch chat messages');
          return;
        }

        setMessages(formatChatMessages(messages));
      });
  }, [chatId]);

  return {
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
  };
}
