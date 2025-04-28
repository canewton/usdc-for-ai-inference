import { useEffect, useRef, useState } from 'react';

import type { BaseMessage } from '@/utils/types';

import { MessageItem } from './MessageItem';

interface ChatMessagesProps<M> {
  messages: M[];
  isLoading: boolean;
  editingMessageId: string | null;
  editedContent: string;
  setEditedContent: (content: string) => void;
  onEditMessage: (messageId: string, content: string) => void;
  onCancelEdit: () => void;
  onSubmitEdit: (e: React.FormEvent<HTMLFormElement>) => void;
  handleInputChange: any;
}

export function ChatMessages<M extends BaseMessage>({
  messages,
  isLoading,
  editingMessageId,
  editedContent,
  setEditedContent,
  onEditMessage,
  onCancelEdit,
  onSubmitEdit,
  handleInputChange,
}: ChatMessagesProps<M>) {
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom of messages
    if (!editingMessageId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  console.log('ChatMessages', messages);

  return (
    <div className="space-y-[30px] flex-col text-headline max-w-[800px]">
      {messages.map((message: any) => (
        <MessageItem<M>
          message={message}
          editingMessageId={editingMessageId}
          editedContent={editedContent}
          setEditedContent={setEditedContent}
          onEditMessage={onEditMessage}
          onCancelEdit={onCancelEdit}
          onSubmitEdit={onSubmitEdit}
          handleInputChange={handleInputChange}
          hoveredMessageId={hoveredMessageId}
          setHoveredMessageId={setHoveredMessageId}
          isLoading={isLoading}
          key={message.id}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
