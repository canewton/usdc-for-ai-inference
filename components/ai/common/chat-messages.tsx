import { useEffect, useRef, useState } from 'react';

import type { BaseMessage } from '@/utils/types';

import { MessageItem } from './message-item';

interface ChatMessagesProps<M> {
  messages: M[];
  handleInputChange: any;
  handleSubmit: (e: any) => void;
  setIsEditing: (isEditing: boolean) => void;
  aiGenerate?: (input: string) => Promise<void>;
  isAiInferenceLoading: boolean;
}

export function ChatMessages<M extends BaseMessage>({
  messages,
  handleInputChange,
  handleSubmit,
  setIsEditing,
  aiGenerate,
  isAiInferenceLoading,
}: ChatMessagesProps<M>) {
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');

  useEffect(() => {
    // Scroll to bottom of messages
    if (!editingMessageId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleEditMessage = (messageId: string, content: string) => {
    setIsEditing(true);
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
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditedContent('');
    setIsEditing(false);
  };

  return (
    <div className="space-y-[30px] flex flex-col text-headline w-full max-w-[800px]">
      {messages.map((message: any) => (
        <MessageItem<M>
          message={message}
          editingMessageId={editingMessageId}
          editedContent={editedContent}
          setEditedContent={setEditedContent}
          onEditMessage={handleEditMessage}
          onCancelEdit={cancelEdit}
          onSubmitEdit={submitEditedMessage}
          handleInputChange={handleInputChange}
          hoveredMessageId={hoveredMessageId}
          setHoveredMessageId={setHoveredMessageId}
          key={message.id}
          aiGenerate={aiGenerate}
          isAiInferenceLoading={isAiInferenceLoading}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
