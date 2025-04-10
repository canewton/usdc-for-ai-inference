'use client';
import React, { useEffect, useState } from 'react';

interface PromptSuggestionsProps {
  onSelect: (suggestion: { title: string; icon: any }) => void;
  suggestions: { title: string; icon: any }[];
  disabled?: boolean;
}

const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({
  onSelect,
  suggestions,
  disabled = false,
}) => {
  const [shuffledSuggestions, setShuffledSuggestions] = useState<
    { title: string; icon: any }[]
  >([]);
  useEffect(() => {
    const shuffled = [...suggestions].sort(() => Math.random() - 0.5);
    setShuffledSuggestions(shuffled.slice(0, 3));
  }, []);
  if (!suggestions.length) return null;
  return (
    <div className="flex justify-center space-x-4 mb-4 text-body">
      {shuffledSuggestions.map((suggestion, index) => (
        <div
          key={index}
          className={`bg-white border border-blue-200 px-4 py-2 rounded-3xl shadow-md transition flex flex-row items-center ${
            disabled
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer hover:bg-blue-50'
          }`}
          onClick={() => !disabled && onSelect(suggestion)}
        >
          <img
            src={suggestion.icon.src}
            alt={suggestion.title}
            className="w-6 h-6 mr-2"
          />
          <span className="overflow-hidden text-ellipsis min-w-0">
            {suggestion.title}
          </span>
        </div>
      ))}
    </div>
  );
};

export default PromptSuggestions;
