import { isThisWeek, isYesterday, subDays } from 'date-fns';
import { useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import CancelIcon from '@/public/cancel.svg';
import RedCancelIcon from '@/public/red-cancel.svg';

interface Chat {
  id: string;
  title: string;
  created_at: string;
}

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
  const [cancelHovered, setCancelHovered] = useState<boolean>(false);
  const [open, setOpen] = useState(false);
  const [selectedChatTitle, setSelectedChatTitle] = useState<string>('');

  // Group chats by time period
  const groupChatsByTimePeriod = (chats: Chat[]) => {
    const today = new Date();
    const yesterday = subDays(today, 1);
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

  // Render a chat item
  const renderChatItem = (chat: Chat) => (
    <div
      key={chat.id}
      className={`p-2 mb-2 cursor-pointer flex justify-between items-center rounded-lg text-body ${
        chat.id === currentChatId
          ? 'bg-[#F1F0F5]'
          : 'hover:bg-[#F1F0F5] transition duration-300'
      }`}
      onClick={() => onSelectChat(chat.id)}
      onMouseEnter={() => setHoveredChatId(chat.id)}
      onMouseLeave={() => setHoveredChatId('')}
    >
      <span className="truncate">{chat.title || 'New Chat'}</span>
      <Dialog open={open} onOpenChange={setOpen}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger
                asChild
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedChatTitle(chat.title);
                }}
                onMouseEnter={() => setCancelHovered(true)}
                onMouseLeave={() => setCancelHovered(false)}
              >
                {(chat.id === currentChatId || chat.id === hoveredChatId) && (
                  <img
                    src={
                      chat.id === hoveredChatId
                        ? RedCancelIcon.src
                        : CancelIcon.src
                    }
                    alt="X inside circle"
                    className="w-6 h-6"
                  />
                )}
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="start">
              <p>Delete chat</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DialogContent className="z-50 bg-white">
          <DialogTitle>
            <p className="text-lg">
              Delete <b>{selectedChatTitle}</b> chat?
            </p>
          </DialogTitle>
          <DialogDescription>
            This will delete chat history and you will no longer be able to
            access it.
          </DialogDescription>
          <div className="flex flex-row justify-end">
            <button
              onClick={() => setOpen(false)}
              className="border py-3 px-4 text-body rounded-[10px] mr-4"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onDeleteChat(chat.id);
                setOpen(false);
              }}
              className="bg-[#D5666E] rounded-[10px] py-3 px-4 text-background"
            >
              Delete
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  // Render a group of chats with a header
  const renderChatGroup = (title: string, chats: Chat[]) => {
    if (chats.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="text-sm text-sub mb-2 uppercase tracking-wider">
          {title}
        </h3>
        {chats.map(renderChatItem)}
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-317px)] pt-4 pb-8 px-2 rounded-r-3xl border border-gray-200 bg-section">
      <div className="overflow-auto h-full px-2">
        <button
          onClick={onNewChat}
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
