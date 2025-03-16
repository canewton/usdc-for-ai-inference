'use client';
import React, { useEffect, useState } from 'react';

interface PromptSuggestionsProps {
  onSelect: (prompt: any) => void;
  suggestions: { title: string; icon: any }[];
}

const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({
  onSelect,
  suggestions,
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
          className="bg-white border border-blue-200 px-4 py-2 rounded-3xl shadow-md cursor-pointer hover:bg-blue-50 transition flex flex-row items-center"
          onClick={() => onSelect(suggestion)}
        >
          <img
            src={suggestion.icon.src}
            alt={suggestion.title}
            className="w-6 h-6 mr-2"
          />
          {suggestion.title}
        </div>
      ))}
    </div>
  );
};

export default PromptSuggestions;
