import { PlusIcon, TrashIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface ChatSidebarProps {
  chats: { id: string; title: string }[];
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
  return (
    <div className="w-full p-4 flex flex-col h-full">
      <Button onClick={onNewChat} className="mb-4">
        <PlusIcon className="mr-2 h-4 w-4" />
        New Chat
      </Button>
      <div className="flex-1 overflow-y-scroll">
        {chats && chats.length > 0 ? (
          chats.map((chat: any) => (
            <div
              key={chat.id}
              className={`p-2 mb-2 cursor-pointer flex justify-between items-center rounded-lg ${
                chat.id === currentChatId ? 'bg-gray-800' : 'hover:bg-gray-700'
              }`}
              onClick={() => onSelectChat(chat.id)}
            >
              <span className="truncate">{chat.title || 'New Chat'}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(chat.id);
                }}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500">No chats yet</div>
        )}
      </div>
    </div>
  );
}
