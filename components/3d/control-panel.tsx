import { useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import ImageUploader from '../image-uploader';

interface ControlPanelProps {
  imageDataUri: string;
  prompt: string;
  title: string;
  isLoading: boolean;
  error: string | null;
  modelUrl: string | null;
  remaining: number | null;
  demoLimitLoading: boolean;
  setImageDataUri: (uri: string) => void;
  setPrompt: (prompt: string) => void;
  setTitle: (title: string) => void;
  setError: (error: string | null) => void;
  submitPrompt: (prompt: string) => void;
}

export default function ControlPanel({
  imageDataUri,
  prompt,
  title,
  isLoading,
  error,
  modelUrl,
  remaining,
  demoLimitLoading,
  setImageDataUri,
  setPrompt,
  setTitle,
  setError,
  submitPrompt,
}: ControlPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDisabled = !!modelUrl;

  const uploadImage = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUri = reader.result as string;
      setImageDataUri(dataUri);
      setError(null);
    };
    reader.onerror = () => {
      setError('Error reading the image file.');
    };
    reader.readAsDataURL(file);
  };

  const resetGenerationState = () => {
    setPrompt('');
    setImageDataUri('');
    setError(null);
  };

  useEffect(() => {
    if (isDisabled) {
      resetGenerationState();
    }
  }, [isDisabled, modelUrl]);

  useEffect(() => {
    if (!imageDataUri && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [imageDataUri]);

  return (
    <div className="flex flex-col space-y-4 w-full min-w-0 text-left">
      {/* Image Upload Section */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Image</label>
        <ImageUploader
          setPreview={setImageDataUri}
          preview={imageDataUri}
          isDisabled={isDisabled}
          inputRef={fileInputRef}
          onImageUpload={uploadImage}
          maxSizeMB={20}
        />
      </div>

      {/* Prompt Section */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">
          Prompt (Optional)
        </label>
        <Input
          placeholder="Describe the model texture..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full border-[#E5E7EB] rounded-md p-2 text-gray-700 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          disabled={isDisabled}
          required={false}
          maxLength={300}
        />
      </div>

      {/* Model Type Section */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Model Type</label>
        <select
          className="w-full p-2 border rounded-md text-gray-700 bg-white appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500"
          style={{
            borderColor: '#E5E7EB',
            fontSize: '14px',
            color: '#374151',
            paddingRight: '2.5rem',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23374151' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
            backgroundPosition: 'right 0.5rem center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1.2rem',
          }}
          disabled={isDisabled}
        >
          <option>OpenAI</option>
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Title</label>
        <Input
          placeholder="Name of your model"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border-[#E5E7EB] rounded-md p-2 text-gray-700 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          disabled={isDisabled}
          required={true}
          maxLength={300}
        />
      </div>

      {/* Generate Button */}
      <div>
        <Button
          onClick={() => submitPrompt(prompt)}
          className="w-full bg-gray-100 text-gray-700 py-2 rounded-full flex items-center justify-center space-x-2"
          disabled={isDisabled || isLoading || !imageDataUri || !title}
        >
          <img className="w-6 h-6" alt="Generate" src="/spark-jelly.svg" />
          <span className="text-sm">
            {isLoading ? 'Generating...' : 'Generate your asset'}
          </span>
        </Button>
        {error && (
          <p className="text-red-500 mt-2 text-xs text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
