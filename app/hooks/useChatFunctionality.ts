'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import type { Chat as AiChat } from '@/types/database.types';

import { useSession } from '../contexts/SessionContext';
import { ChatController } from '../controllers/chat.controller';
import { useAiGeneration } from './useAiGeneration';
import { useDemoLimit } from './useDemoLimit';

interface ChatFunctionalityProps<G, M> {
  api: string;
  pageBaseUrl: string;
  currChat: string;
  model: string;
  modelParams: Object;
  createGeneration: (
    message: any,
    chatInput: string,
    chatId: string,
    usage: any,
  ) => Promise<G | null>;
  fetchGeneration: (id: string) => Promise<G[] | null>;
  generationToMessages: (generation: G) => M[];
}

export function useChatFunctionality<G, M>({
  api,
  pageBaseUrl,
  currChat,
  model,
  modelParams,
  createGeneration,
  fetchGeneration,
  generationToMessages,
}: ChatFunctionalityProps<G, M>) {
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
    textStreamMessages: messages,
    chatInput,
    handleInputChange,
    isAiInferenceLoading,
    setAiMessages: setMessages,
    handleSubmit,
    stop,
    setInput,
  } = useAiGeneration<M>({
    api,
    body: {
      model: model,
      ...modelParams,
    },
    onFinish: async (message: any, { usage }: any) => {
      if (chatIdRef.current || chatId) {
        const generateChatData = await createGeneration(
          message,
          chatInput,
          chatIdRef.current || chatId,
          usage,
        );

        if (!generateChatData) {
          console.error('Failed to save chat generation');
          return;
        }

        setMessages((prevMsgs: M[]) => [
          ...prevMsgs.slice(0, -2),
          ...generationToMessages(generateChatData),
        ]);
      }
    },
  });

  const onSelectChat = async (id: string) => {
    const messages = await fetchGeneration(id);

    if (!messages) {
      console.error('Failed to fetch chat messages');
      return;
    }

    setMessages(messages.map((obj: any) => generationToMessages(obj)).flat());
    setChatId(id);
    chatIdRef.current = id;
    window.history.replaceState(null, '', `${pageBaseUrl}/${id}`);
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
          router.push(`${pageBaseUrl}/`);
        });
    }
  };

  const onNewChat = () => {
    router.push(`${pageBaseUrl}/`);
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
      const chatData = await ChatController.getInstance().create(chatInput);
      if (!chatData) {
        console.error('Failed to create new chat');
        return;
      }

      if (chatData.id) {
        setChatId(chatData.id);
        chatIdRef.current = chatData.id;
        window.history.replaceState(null, '', `${pageBaseUrl}/${chatData.id}`);
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
          ...modelParams,
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
          ...modelParams,
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
    fetchGeneration(chatId).then((messages) => {
      if (!messages) {
        console.error('Failed to fetch chat messages');
        return;
      }

      setMessages(messages.map((obj: any) => generationToMessages(obj)).flat());
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
    isAiInferenceLoading,
    messages,
    chatInput,
    handleInputChange,
    handleEditMessage,
    submitEditedMessage,
    cancelEdit,
    editingMessageId,
    editedContent,
    setEditedContent,
  };
}
