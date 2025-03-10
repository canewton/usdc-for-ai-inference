import type { Message } from 'ai';
import { PencilIcon } from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Textarea } from '@/components/ui/textarea';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  editingMessageId: string | null;
  editedContent: string;
  setEditedContent: (content: string) => void;
  onEditMessage: (messageId: string, content: string) => void;
  onCancelEdit: () => void;
  onSubmitEdit: (e: React.FormEvent<HTMLFormElement>) => void;
  handleInputChange: any,
}

export function ChatMessages({ 
  messages, 
  isLoading,
  editingMessageId,
  editedContent,
  setEditedContent,
  onEditMessage,
  onCancelEdit,
  onSubmitEdit,
  handleInputChange,
}: ChatMessagesProps) {
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  
  return (
    <div className="space-y-4">
      {messages.map((message: any) => (
        <div
          key={message.id}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start '}`}
        >
          <div
            onMouseEnter={() => message.role === "user" && setHoveredMessageId(message.id)}
            onMouseLeave={() => setHoveredMessageId(null)}
            className='flex flex-row'
          >
            {message.role === "user" && hoveredMessageId === message.id && (
              <button
                className="h-8 w-8 text-white"
                onClick={() => onEditMessage(message.id, message.content)}
              >
                <PencilIcon className="h-5 w-5" />
              </button>
            )}
            <div
              className={`p-2 rounded-lg ${message.role === 'user' ? 'bg-gray-200 text-black' : 'bg-gray-800 text-white'}`}
            >
              {editingMessageId === message.id ? (
                <div className="space-y-2 w-full">
                  <Textarea
                    value={editedContent}
                    onChange={(e: any) => {setEditedContent(e.target.value); handleInputChange(e)}}
                    className=" text-black bg-gray-200"
                    
                  />
                  <form onSubmit={onSubmitEdit} className="flex justify-end space-x-2">
                    <button onClick={onCancelEdit}>
                      Cancel
                    </button>
                    <button type='submit'>
                      Send
                    </button>
                  </form>
                </div>
              ) : (
                <>
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                  <div className="text-right text-gray-500">
                    Tokens: {message.tokens}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
      {isLoading && <div className="text-center">AI is thinking...</div>}
    </div>
  );
}
