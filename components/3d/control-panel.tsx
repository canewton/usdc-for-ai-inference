import { useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import USDC from '@/public/usdc-circle.svg';
import UsdcBalanceCard from '../UsdcBalanceCard';

interface ControlPanelProps {
  imageDataUri: string;
  prompt: string;
  mode: boolean;
  isLoading: boolean;
  error: string | null;
  totalBilledAmount: number;
  modelUrl: string | null;
  remaining: number | null;
  demoLimitLoading: boolean;
  setImageDataUri: (uri: string) => void;
  setPrompt: (prompt: string) => void;
  setError: (error: string | null) => void;
  submitPrompt: (prompt: string) => void;
}

export default function ControlPanel({
  imageDataUri,
  prompt,
  mode,
  isLoading,
  error,
  totalBilledAmount,
  modelUrl,
  remaining,
  demoLimitLoading,
  setImageDataUri,
  setPrompt,
  setError,
  submitPrompt,
}: ControlPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDisabled = !!modelUrl;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isDisabled) return;
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      const maxSize = 20 * 1024 * 1024;
      if (!validTypes.includes(file.type)) {
        setError('Please upload a PNG, JPG, or JPEG file.');
        return;
      }
      if (file.size > maxSize) {
        setError('File size exceeds 20MB.');
        return;
      }

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
    }
  };

  useEffect(() => {
    if (!mode) {
      setPrompt('');
    }
  }, [mode, setPrompt]);

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
      {/* Balance Card */}
      <UsdcBalanceCard  direction="row"/>

      {/* Image Upload Section */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Image</label>
        <div
          className={`w-full h-[120px] bg-white rounded-md border border-dashed border-[#eaeaec] flex flex-col items-center justify-center cursor-pointer ${
            isDisabled
              ? 'opacity-50 pointer-events-none'
              : 'hover:border-gray-400'
          } overflow-hidden`}
          onClick={() =>
            !isDisabled && document.getElementById('image-upload')?.click()
          }
        >
          {imageDataUri ? (
            <div className="flex flex-col items-center justify-center w-full h-full p-2">
              <img
                src={imageDataUri}
                alt="Uploaded"
                className="w-full h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 w-[200px]">
              <img className="w-4 h-4" alt="Upload" src="/vector-1.svg" />
              <div className="text-center">
                <p className="text-gray-700 text-sm">Click or drag to upload</p>
                <p className="text-gray-500 text-xs">
                  Supported: png, jpg, jpeg
                </p>
                <p className="text-gray-500 text-xs">Max: 20MB</p>
              </div>
            </div>
          )}
          <input
            id="image-upload"
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            onChange={handleImageUpload}
            className="hidden"
            ref={fileInputRef}
          />
        </div>
      </div>

      {/* Prompt Section */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Prompt</label>
        <Input
          placeholder="Describe the model texture..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full border-[#E5E7EB] rounded-md p-2 text-gray-700 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          disabled={!mode || isDisabled}
          required
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

      {/* Generate Button */}
      <div>
        <Button
          onClick={() => submitPrompt(prompt)}
          className="w-full bg-gray-100 text-gray-700 py-2 rounded-full flex items-center justify-center space-x-2"
          disabled={isDisabled || isLoading || !imageDataUri || !prompt}
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

      {!demoLimitLoading && remaining !== null && (
        <div className="text-sm text-gray-500">
          {remaining === 0
            ? 'Demo limit reached'
            : `${remaining} generations remaining`}
        </div>
      )}
    </div>
  );
}
