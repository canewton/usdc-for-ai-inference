'use client';
import React, { useEffect, useState } from 'react';

interface PromptSuggestionsProps {
  onSelect: (prompt: string) => void;
}

const allSuggestions = [
  'Generate an image of a futuristic cityscape',
  'Create a portrait of a mythical creature',
  'Design a landscape with a sunset over mountains',
  'Illustrate a scene from a classic novel',
  'Visualize an abstract concept like time or space',
  'Render a surreal dream-like scenario',
  'Paint a natural scene with lush greenery and rivers',
  'Sketch a busy futuristic market place',
];

const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({ onSelect }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  useEffect(() => {
    const shuffled = [...allSuggestions].sort(() => Math.random() - 0.5);
    setSuggestions(shuffled.slice(0, 3));
  }, []);
  if (!suggestions.length) return null;
  return (
    <div className="flex justify-center space-x-4 mb-4">
      {suggestions.map((suggestion, index) => (
        <div
          key={index}
          className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg shadow-md cursor-pointer hover:bg-secondary/80 transition"
          onClick={() => onSelect(suggestion)}
        >
          {suggestion}
        </div>
      ))}
    </div>
  );
};

export default PromptSuggestions;
