import { isThisWeek, isYesterday, subDays } from 'date-fns';
import { useState } from 'react';
import { toast } from 'sonner';

import { useSession } from '@/app/contexts/SessionContext';
import type { Chat } from '@/types/database.types';

import { ChatSidebarItem } from './chat-sidebar-item';

interface ChatSidebarProps {
  chats: Chat[];
  currentChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
}

export function ChatSidebar({
  chats,
  currentChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
}: ChatSidebarProps) {
  const [hoveredChatId, setHoveredChatId] = useState<string>('');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

  const session = useSession();

  // Group chats by time period
  const groupChatsByTimePeriod = (chats: Chat[]) => {
    const today = new Date();
    const oneWeekAgo = subDays(today, 7);

    const groups = {
      today: [] as Chat[],
      yesterday: [] as Chat[],
      pastWeek: [] as Chat[],
      older: [] as Chat[],
    };

    chats.forEach((chat) => {
      const chatDate = new Date(chat.created_at);

      if (chatDate.toDateString() === today.toDateString()) {
        groups.today.push(chat);
      } else if (isYesterday(chatDate)) {
        groups.yesterday.push(chat);
      } else if (isThisWeek(chatDate) && chatDate > oneWeekAgo) {
        groups.pastWeek.push(chat);
      } else {
        groups.older.push(chat);
      }
    });

    return groups;
  };

  const chatGroups = groupChatsByTimePeriod(chats);

  // Render a group of chats with a header
  const renderChatGroup = (title: string, chats: Chat[]) => {
    if (chats.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="text-sm text-sub mb-2 uppercase tracking-wider">
          {title}
        </h3>
        {chats.map((chat) => (
          <ChatSidebarItem
            key={chat.id}
            chat={chat}
            currentChatId={currentChatId}
            onSelectChat={onSelectChat}
            onDeleteChat={onDeleteChat}
            setHoveredChatId={setHoveredChatId}
            hoveredChatId={hoveredChatId}
            selectedChat={selectedChat}
            setSelectedChat={setSelectedChat}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-317px)] pt-4 pb-8 px-2 rounded-r-3xl border border-gray-200 bg-section">
      <div className="overflow-auto h-full px-2">
        <button
          onClick={() => {
            if (!session.is_ai_inference_loading) {
              onNewChat();
            } else {
              toast.info('Please wait for the current generation to finish.');
            }
          }}
          className="p-2 mb-4 text-left w-full h-fit hover:bg-gray-50 transition rounded-lg text-headline"
        >
          New Chat
        </button>
        {chats && chats.length > 0 ? (
          <>
            {renderChatGroup('Today', chatGroups.today)}
            {renderChatGroup('Yesterday', chatGroups.yesterday)}
            {renderChatGroup('Past Week', chatGroups.pastWeek)}
            {renderChatGroup('Older', chatGroups.older)}
          </>
        ) : (
          <div className="text-center text-gray-500">No chats yet</div>
        )}
      </div>
    </div>
  );
}
