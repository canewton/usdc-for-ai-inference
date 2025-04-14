'use client';
import React, { useEffect, useState } from 'react';

interface PromptSuggestionsProps {
  onSelect: (prompt: string) => void;
  suggestions: string[];
}

const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({
  onSelect,
  suggestions,
}) => {
  const [shuffledSuggestions, setShuffledSuggestions] = useState<string[]>([]);
  useEffect(() => {
    const shuffled = [...suggestions].sort(() => Math.random() - 0.5);
    setShuffledSuggestions(shuffled.slice(0, 3));
  }, []);
  if (!suggestions.length) return null;
  return (
    <div className="flex justify-center space-x-4 mb-[20px] text-black">
      {suggestions.map((suggestion, index) => (
        <div
          key={index}
          className="bg-white border border-blue-200 px-4 py-2 rounded-lg shadow-md cursor-pointer hover:bg-blue-50 transition"
          onClick={() => onSelect(suggestion)}
        >
          {suggestion}
        </div>
      ))}
    </div>
  );
};

export default PromptSuggestions;
