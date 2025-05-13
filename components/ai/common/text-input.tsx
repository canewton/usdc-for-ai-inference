import type { FormEvent } from 'react';
import React from 'react';

import DisabledSendIcon from '@/public/disabled-plane.svg';
import PauseIcon from '@/public/pause-gumdrop.svg';
import SendIcon from '@/public/plane.svg';

import ExpandableTextArea from './expandable-text-area';

interface TextInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  onStopGeneration: () => void;
  editingMessage: boolean;
  maxLength?: number;
}

export function TextInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  onStopGeneration,
  editingMessage,
  maxLength,
}: TextInputProps) {
  return (
    <div className="border-gray-200 rounded-3xl shadow-md">
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <ExpandableTextArea
          value={editingMessage ? '' : input}
          placeholder={
            isLoading ? 'Circle AI is thinking...' : 'Message Circle AI'
          }
          className="flex-1 p-4 pb-1 rounded-3xl placeholder-transparent outline-none text-body w-full overflow-x-auto whitespace-nowrap"
          maxLength={maxLength}
          onChange={handleInputChange}
        />
        {isLoading ? (
          <button
            type="button"
            className="px-4 py-2"
            onClick={onStopGeneration}
          >
            <img src={PauseIcon.src} alt="Pause icon" className="w-10 h-10" />
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
