import type { FormEvent } from 'react';
import React from 'react';

import DisabledSendIcon from '@/public/disabled-plane.svg';
import SendIcon from '@/public/plane.svg';

interface TextInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  onStopGeneration: () => void;
  editingMessage: boolean;
}

export function TextInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  onStopGeneration,
  editingMessage,
}: TextInputProps) {
  return (
    <div className="border-gray-200 rounded-3xl shadow-md">
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          type="text"
          value={editingMessage ? '' : input}
          onChange={handleInputChange}
          placeholder={
            isLoading ? 'Circle AI is thinking...' : 'Message Circle AI'
          }
          className="flex-1 p-4 bg-white rounded-3xl placeholder-transparent outline-none text-body"
          style={{
            background: 'linear-gradient(to right, #b090F5, #5fbfff, #5fbfff)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
          }}
        />
        {isLoading ? (
          <button
            type="button"
            className="px-4 py-2 text-gray-500 rounded-3xl border"
            onClick={onStopGeneration}
          >
            Stop
          </button>
        ) : !input.trim() ? (
          <button
            type="submit"
            className="px-4 py-2  rounded-3xl"
            disabled={!input.trim()}
          >
            <img
              src={DisabledSendIcon.src}
              alt="Send icon"
              className="w-10 h-10"
            />
          </button>
        ) : (
          <button
            type="submit"
            className="px-4 py-2  rounded-3xl"
            disabled={!input.trim()}
          >
            <img src={SendIcon.src} alt="Send icon" className="w-10 h-10" />
          </button>
        )}
      </form>
    </div>
  );
}
