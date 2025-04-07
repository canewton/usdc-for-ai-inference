import { isThisWeek, isYesterday, subDays } from 'date-fns';
import { TrashIcon } from 'lucide-react';

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
        chat.id === currentChatId ? 'bg-gray-50' : 'hover:bg-gray-50 transition'
      }`}
      onClick={() => onSelectChat(chat.id)}
    >
      <span className="truncate">{chat.title || 'New Chat'}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDeleteChat(chat.id);
        }}
      >
        {chat.id === currentChatId && (
          <TrashIcon className="h-4 w-4 ml-auto" color="#4D4861" />
        )}
      </button>
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
