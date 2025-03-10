import type { FormEvent } from 'react';
import React from 'react';

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  onStopGeneration: () => void;
  editingMessage: boolean;
}

export function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  onStopGeneration,
  editingMessage,
}: ChatInputProps) {
  return (
    <form onSubmit={handleSubmit} className="flex space-x-2">
      <input
        type="text"
        value={editingMessage ? '' : input}
        onChange={handleInputChange}
        placeholder="Type a message"
        className="flex-1 p-2 border rounded"
      />
      {isLoading ? (
        <button
          type="button"
          className="px-4 py-2 bg-gray-600 text-black rounded"
          onClick={onStopGeneration}
        >
          Stop
        </button>
      ) : (
        <button
          type="submit"
          className="px-4 py-2 bg-white text-black rounded"
          disabled={!input.trim()}
        >
          Generate
        </button>
      )}
    </form>
  );
}
