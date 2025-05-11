'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import type { Chat as AiChat } from '@/types/database.types';
import type { BaseMessage } from '@/utils/types';

import { useSession } from '../contexts/SessionContext';
import { ChatController } from '../controllers/chat.controller';

interface ChatFunctionalityProps<G, M> {
  pageBaseUrl: 'chat' | 'image';
  currChat: string;
  fetchGenerationById: (id: string) => Promise<G[] | null>;
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
  fetchGenerationById,
  generationToMessages,
  messages,
  chatInput,
  setMessages,
  handleSubmit,
  chatIdRef,
}: ChatFunctionalityProps<G, M>) {
  const [currChatId, setCurrChatId] = useState(currChat || '');

  const session = useSession();
  const router = useRouter();

  const setSessionChat = (chat: AiChat[]) => {
    if (pageBaseUrl === 'chat') {
      session.setTextChats(chat);
    } else {
      session.setImageChats(chat);
    }
  };

  const getSessionChat = () => {
    if (pageBaseUrl === 'chat') {
      return session.textChats;
    } else {
      return session.imageChats;
    }
  };
  const [chats, setChats] = useState<AiChat[]>(getSessionChat());

  useEffect(() => {
    setChats(getSessionChat());
  }, [session.textChats, session.imageChats]);

  const onSelectChat = async (id: string) => {
    const messages = await fetchGenerationById(id);

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
          setSessionChat(getSessionChat().filter((chat) => chat.id !== id));
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
          setSessionChat([chatData, ...getSessionChat().slice(1)]);
        } else {
          setSessionChat([chatData, ...getSessionChat()]);
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

  useEffect(() => {
    // Get all user's chats
    ChatController.getInstance()
      .fetch(pageBaseUrl)
      .then((chats) => {
        if (!chats) {
          console.error('Failed to fetch chats');
          return;
        }
        setSessionChat(chats);
      });
  }, []);

  useEffect(() => {
    // Get messages if chat changes
    if (!currChatId || messages.length == 1) return;
    fetchGenerationById(currChatId).then((messages) => {
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
    onSelectChat,
    onDeleteChat,
    onNewChat,
    handleMessageSubmit,
    messages,
    chatInput,
  };
}