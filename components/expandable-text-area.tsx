import React, { useEffect, useRef } from 'react';

interface ExpandableTextAreaProps {
  value: string;
  placeholder?: string;
  initialValue?: string;
  maxLength?: number;
  showCharCount?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
  minHeight?: number;
  maxHeight?: number;
}

const ExpandableTextArea: React.FC<ExpandableTextAreaProps> = ({
  value,
  placeholder = 'Type your message...',
  maxLength,
  showCharCount = true,
  onChange,
  className = '',
  minHeight = 15,
  maxHeight = 300,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Function to adjust height based on content
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';

    // Calculate new height based on content
    const newHeight = Math.min(
      Math.max(textarea.scrollHeight, minHeight),
      maxHeight,
    );

    textarea.style.height = `${newHeight}px`;
  };

  // Adjust height when value changes
  useEffect(() => {
    adjustHeight();
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;

    // If maxLength is defined and exceeded, don't update
    if (maxLength && newValue.length > maxLength) {
      return;
    }
    onChange?.(e);
  };

  const charCount = value.length;
  const isMaxReached = maxLength ? charCount >= maxLength : false;

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          style={{
            minHeight: `${minHeight}px`,
            maxHeight: `${maxHeight}px`,
            background: 'linear-gradient(to right, #b090F5, #5fbfff, #5fbfff)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
          }}
          className={`w-full resize-none overflow-y-auto placeholder-transparent
                    focus:outline-none focus:ring-none bg-transparent pb-3
                    ${isMaxReached ? 'text-red-500' : 'text-gray-800'}`}
        />

        {showCharCount && maxLength && (
          <div
            className={`absolute bottom-2 right-3 text-xs transition-colors
                      ${
                        isMaxReached
                          ? 'text-red-500'
                          : charCount > maxLength * 0.8
                            ? 'text-amber-500'
                            : 'text-gray-400'
                      }`}
          >
            {charCount}/{maxLength}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpandableTextArea;
