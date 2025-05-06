'use client';
import { motion } from 'framer-motion';
import { useEffect } from 'react';

interface GenerationPopupProps {
  amount: string;
  onClose: () => void;
}

const GenerationPopup = ({ amount, onClose }: GenerationPopupProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000); // auto-dismiss
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white shadow-xl border border-gray-200 rounded-xl px-6 py-4 flex items-center gap-4 z-50"
    >
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-blue-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 1.343-3 3m6 0c0-1.657-1.343-3-3-3m-4 3a4 4 0 108 0 4 4 0 00-8 0z"
          />
        </svg>
        <span className="font-medium">Cost:</span>
        <span className="text-red-500 font-semibold">-${amount}</span>
      </div>
    </motion.div>
  );
};

export default GenerationPopup;