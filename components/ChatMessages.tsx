import type { Message } from 'ai';
import { PencilIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

import { Textarea } from '@/components/ui/textarea';
import UsdcIcon from '@/public/usdc-circle.svg';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  editingMessageId: string | null;
  editedContent: string;
  setEditedContent: (content: string) => void;
  onEditMessage: (messageId: string, content: string) => void;
  onCancelEdit: () => void;
  onSubmitEdit: (e: React.FormEvent<HTMLFormElement>) => void;
  handleInputChange: any;
}

export function ChatMessages({
  messages,
  editingMessageId,
  editedContent,
  setEditedContent,
  onEditMessage,
  onCancelEdit,
  onSubmitEdit,
  handleInputChange,
}: ChatMessagesProps) {
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const tokensPerDollar = 0.000125;

  useEffect(() => {
    // Scroll to bottom of messages
    if (!editingMessageId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="space-y-4 overflow-auto flex-col mb-4 h-[calc(100vh-335px)] text-headline">
      {messages.map((message: any) => (
        <div
          key={message.id}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start '}`}
        >
          <div
            onMouseEnter={() =>
              message.role === 'user' && setHoveredMessageId(message.id)
            }
            onMouseLeave={() => setHoveredMessageId(null)}
            className="flex flex-col"
          >
            <div className="flex flex-row">
              {message.role === 'user' && hoveredMessageId === message.id && (
                <button
                  className="h-8 w-8"
                  onClick={() => onEditMessage(message.id, message.content)}
                >
                  <PencilIcon className="h-4 w-4 text" color="black" />
                </button>
              )}
              <div
                className={`${message.role !== 'user' && 'border-none'} p-2 rounded-3xl bg-white border border-blue-200 px-4 py-2`}
              >
                {editingMessageId === message.id ? (
                  <div className="space-y-2 w-full">
                    <Textarea
                      value={editedContent}
                      onChange={(e: any) => {
                        setEditedContent(e.target.value);
                        handleInputChange(e);
                      }}
                      className=" text-black bg-gray-200"
                    />
                    <form
                      onSubmit={onSubmitEdit}
                      className="flex justify-end space-x-2"
                    >
                      <button onClick={onCancelEdit}>Cancel</button>
                      <button type="submit">Send</button>
                    </form>
                  </div>
                ) : (
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                )}
              </div>
            </div>
            {message.role === 'assistant' && (
              <div className="mr-auto border border-blue-200 mt-2 pl-2 pr-3 py-1 rounded-3xl flex flex-row items-center">
                <img
                  src={UsdcIcon.src}
                  alt="USDC symbol"
                  className="h-10 w-10 mr-1"
                />
                $ -{message.tokens * tokensPerDollar}
              </div>
            )}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
