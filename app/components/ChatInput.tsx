import type { FormEvent } from 'react';
import React from 'react';

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}

export function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
}: ChatInputProps) {
  return (
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
        {isLoading ? 'Loading' : 'Generate'}
      </button>
    </form>
  );
}
