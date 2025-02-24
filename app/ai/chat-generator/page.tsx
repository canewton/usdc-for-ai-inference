'use client';

import { useSession } from '@/app/contexts/SessionContext';
import { useChat } from '@ai-sdk/react';
import { useRef, useState, useEffect } from 'react';
 
export default function Chat() {

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [prevMessages, setPrevMessages] = useState([]);
  const session = useSession();

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/generatetext",
    onFinish: async(message:any) => {
      try {
        const response = await fetch('/api/postchatgeneration', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            user_text: input,
            ai_text: message.content,
          }),
        });
        if (!response.ok) throw new Error(await response.text());
      } catch (error) {
        console.error('Error saving chat:', error);
      }
    }
  });


  useEffect(() => {
    // Load previous messages
    const fetchMessages = async () => {
      if (!session) return;
      try {
        const response = await fetch(`/api/getchatgenerations`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        const data = await response.json();

        // Check if the response is successful
        if (response.ok) {
          // Rearrange the chats to individual messages
          const msgs = data.chats.map((obj: any) => [
            {
              id: obj.id + "user",
              role: "user",
              content: obj.user_text,
            },
            {
              id: obj.id + "assistant",
              role: "assistant",
              content: obj.ai_text,
            }
          ])
          // Store the fetched messages
          setPrevMessages(msgs.flat());
        } else {
          console.error('Error fetching messages:', data.error);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };
    if (session) {
      fetchMessages();
    }

  }, [session]);

  useEffect(() => {
    // Scroll to bottom of messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  return (
    <div className="flex flex-col h-[500px] min-w-96">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {prevMessages.concat(messages).map((message: any) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`p-2 rounded-lg ${message.role === "user" ? "bg-gray-200 text-black" : "bg-gray-800 text-white"}`}>
                {message.content}
              </div>
            </div>
          ))}
        </div>
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Type a message"
            className="flex-1 p-2 border rounded"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-white text-black rounded disabled:bg-gray-600"
          >
            {isLoading? "Loading": "Generate"}
          </button>
        </form>
      </div>
    </div>
  );
};
