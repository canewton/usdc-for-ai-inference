import { useState } from 'react';
import { toast } from 'sonner';

import { useSession } from '@/app/contexts/SessionContext';
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
import type { Chat } from '@/types/database.types';

interface ChatSideBarItemProps {
  chat: Chat;
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  setSelectedChat: (chat: Chat | null) => void;
  setHoveredChatId: (id: string) => void;
  hoveredChatId: string;
  selectedChat: Chat | null;
}

export const ChatSidebarItem = ({
  chat,
  currentChatId,
  onSelectChat,
  onDeleteChat,
  setHoveredChatId,
  hoveredChatId,
  selectedChat,
  setSelectedChat,
}: ChatSideBarItemProps) => {
  const [open, setOpen] = useState(false);

  const session = useSession();

  return (
    <div
      key={chat.id}
      className={`p-2 mb-2 cursor-pointer flex justify-between items-center rounded-lg text-body ${
        chat.id === currentChatId
          ? 'bg-[#F1F0F5]'
          : 'hover:bg-[#F1F0F5] transition duration-300'
      }`}
      onClick={() => {
        if (!session.isAiInferenceLoading) {
          onSelectChat(chat.id);
        } else {
          toast.info('Please wait for the current generation to finish.');
        }
      }}
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
                  setSelectedChat(chat);
                }}
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
              Delete <b>{selectedChat?.title}</b> chat?
            </p>
          </DialogTitle>
          <DialogDescription>
            This will delete chat history and you will no longer be able to
            access it.
          </DialogDescription>
          <div className="flex flex-row justify-end">
            <button
              onClick={() => {
                setOpen(false);
              }}
              className="border py-3 px-4 text-body rounded-[10px] mr-4"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onDeleteChat(selectedChat?.id || '');
                setOpen(false);
                setSelectedChat(null);
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
};
