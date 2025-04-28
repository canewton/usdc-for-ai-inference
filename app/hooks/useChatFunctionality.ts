'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import type { Chat as AiChat } from '@/types/database.types';
import type { BaseMessage } from '@/utils/types';

import { useSession } from '../contexts/SessionContext';
import { ChatController } from '../controllers/chat.controller';
import { useDemoLimit } from './useDemoLimit';

interface ChatFunctionalityProps<G, M> {
  pageBaseUrl: 'chat' | '3d' | 'image' | 'video';
  currChat: string;
  fetchGeneration: (id: string) => Promise<G[] | null>;
  generationToMessages: (generation: G) => M[];
  messages: M[];
  chatInput: string;
  setMessages: (messagesInput: M[] | ((prevMsgs: M[]) => M[])) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  chatIdRef: React.RefObject<string | null>;
}

export function useChatFunctionality<G, M extends BaseMessage>({
  pageBaseUrl,
  currChat,
  fetchGeneration,
  generationToMessages,
  messages,
  chatInput,
  setMessages,
  handleSubmit,
  chatIdRef,
}: ChatFunctionalityProps<G, M>) {
  const { remaining } = useDemoLimit();
  const [currChatId, setCurrChatId] = useState(currChat || '');
  const [chats, setChats] = useState<AiChat[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [showLimitError, setShowLimitError] = useState(false);

  const session = useSession();
  const router = useRouter();

  const onSelectChat = async (id: string) => {
    const messages = await fetchGeneration(id);

    if (!messages) {
      console.error('Failed to fetch chat messages');
      return;
    }

    setMessages(messages.map((obj: any) => generationToMessages(obj)).flat());
    setCurrChatId(id);
    chatIdRef.current = id;
    window.history.replaceState(null, '', `/${pageBaseUrl}/${id}`);
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
          setCurrChatId('');
          router.push(`/${pageBaseUrl}/`);
        });
    }
  };

  const onNewChat = () => {
    router.push(`/${pageBaseUrl}/`);
    setCurrChatId('');
    setMessages([]);
  };

  const handleMessageSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (remaining === 0) {
      setShowLimitError(true);
      return;
    }

    console.log('messages submitted:', messages);

    setShowLimitError(false);
    var chatId = currChatId;
    if (!currChatId) {
      // Post new chat
      const chatData = await ChatController.getInstance().create(
        chatInput,
        pageBaseUrl,
      );
      if (!chatData) {
        console.error('Failed to create new chat');
        return;
      }

      if (chatData.id) {
        chatId = chatData.id;
        setCurrChatId(chatData.id);
        chatIdRef.current = chatData.id;
        window.history.replaceState(null, '', `/${pageBaseUrl}/${chatData.id}`);
        // Update chats
        if (chats.length > 0 && chats[0].id === '') {
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
      await handleSubmit(e);
    } catch (error) {
      console.error('Error in message submission:', error);
    }
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
      handleSubmit(e);
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
      .fetch(pageBaseUrl)
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
    if (!currChatId || messages.length == 1) return;
    fetchGeneration(currChatId).then((messages) => {
      if (!messages) {
        console.error('Failed to fetch chat messages');
        return;
      }

      setMessages(messages.map((obj: any) => generationToMessages(obj)).flat());
    });
  }, [currChatId]);

  return {
    currChatId,
    chats,
    showLimitError,
    onSelectChat,
    onDeleteChat,
    onNewChat,
    handleMessageSubmit,
    messages,
    chatInput,
    handleEditMessage,
    submitEditedMessage,
    cancelEdit,
    editingMessageId,
    editedContent,
    setEditedContent,
  };
}
