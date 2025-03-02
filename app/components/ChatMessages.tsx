import type { Message } from 'ai';
import ReactMarkdown from 'react-markdown';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  return (
    <div className="space-y-4">
      {messages.map((message: any) => (
        <div
          key={message.id}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start '}`}
        >
          <div
            className={`p-2 rounded-lg ${message.role === 'user' ? 'bg-gray-200 text-black' : 'bg-gray-800 text-white'}`}
          >
            <ReactMarkdown>{message.content}</ReactMarkdown>
            <div className="text-right text-gray-500">
              Tokens: {message.tokens}
            </div>
          </div>
        </div>
      ))}
      {isLoading && <div className="text-center">AI is thinking...</div>}
    </div>
  );
}
