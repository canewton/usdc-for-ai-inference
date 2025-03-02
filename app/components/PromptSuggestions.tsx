'use client';
import React, { useEffect, useState } from 'react';

interface PromptSuggestionsProps {
  onSelect: (prompt: string) => void;
}

const allSuggestions = [
  'A sleek, futuristic USDC crypto debit card with neon blue accents and a cyber-inspired design',
  'A premium black metal USDC debit card with engraved details and a brushed finish',
  'A dynamic 3D render of a non-custodial crypto wallet with a glowing USDC logo and secure encryption visuals',
  'A futuristic digital bank vault storing USDC securely, with glowing security layers and blockchain encryption',
  'An abstract visualization of decentralized finance with floating USDC coins, blockchain connections, and liquidity pools.',
  'A futuristic stock photo of a person making a seamless cross-border payment using USDC via a mobile wallet',
  'A global-themed USDC card with a world map, blockchain icons, and futuristic typography',
  'A luxury-tier USDC card with holographic details and a cutting-edge, Web3-inspired look',
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
