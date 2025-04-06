import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import USDC from '@/public/usdc-circle.svg';

interface ControlPanelProps {
  imageDataUri: string;
  prompt: string;
  mode: boolean;
  isLoading: boolean;
  error: string | null;
  totalBilledAmount: number | 0;
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
  setImageDataUri,
  setPrompt,
  setError,
  submitPrompt,
}: ControlPanelProps) {
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  return (
    <div className="flex flex-col gap-6 w-full min-w-0">
      {/* Balance Card */}
      <Card className="w-full h-20 bg-white border-[#eaeaec]">
        <CardContent className="flex items-center p-5">
          <img src={USDC.src} className="w-12 h-12 mr-4" alt="USDC Icon" />
          <div className="overflow-hidden">
            <h3 className="[font-family:'SF_Pro-Regular',Helvetica] font-normal text-gray-900 text-xl tracking-[-0.22px] leading-[30px] truncate">
              ${totalBilledAmount.toFixed(2)}
            </h3>
            <p className="[font-family:'SF_Pro-Regular',Helvetica] font-normal text-gray-500 text-sm tracking-[-0.15px] leading-[21px] truncate">
              USDC Balance
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Image Upload Section */}
      <div className="flex flex-col gap-1">
        <label className="[font-family:'SF_Pro-Regular',Helvetica] font-normal text-gray-500 text-base tracking-[-0.18px] leading-6 truncate">
          Image
        </label>
        <div
          className="w-full h-[150px] bg-white rounded-[10px] border border-dashed border-[#eaeaec] flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 overflow-hidden"
          onClick={() => document.getElementById('image-upload')?.click()}
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
            <div className="flex flex-col items-center gap-[30px] w-[217px]">
              <img
                className="w-[18px] h-[18px]"
                alt="Upload"
                src="/icons/vector-1.svg"
              />
              <div className="text-center">
                <p className="[font-family:'SF_Pro-Regular',Helvetica] font-normal text-gray-700 text-base tracking-[-0.18px] leading-6 truncate">
                  Click or drag to upload image
                </p>
                <p className="[font-family:'SF_Pro-Regular',Helvetica] font-normal text-gray-500 text-sm tracking-[-0.15px] leading-[21px] truncate">
                  Supported files: png, jpg, jpeg
                </p>
                <p className="[font-family:'SF_Pro-Regular',Helvetica] font-normal text-gray-500 text-sm tracking-[-0.15px] leading-[21px] truncate">
                  Max size: 20MB
                </p>
              </div>
            </div>
          )}
          <input
            id="image-upload"
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Prompt Section */}
      <div>
        <label className="[font-family:'SF_Pro-Regular',Helvetica] font-normal text-gray-500 text-sm tracking-[-0.15px] leading-[21px] mb-1 block truncate">
          Prompt
        </label>
        <Input
          placeholder="Describe the model texture..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full border-[#E5E7EB] rounded-[8px] p-2 text-gray-700 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 truncate"
          disabled={!mode}
          required
        />
      </div>

      {/* Model Type Section */}
      <div>
        <label className="[font-family:'SF_Pro-Regular',Helvetica] font-normal text-gray-500 text-sm tracking-[-0.15px] leading-[21px] mb-1 block truncate">
          Model Type
        </label>
        <select
          className="w-full p-2 border rounded-[8px] text-gray-700 bg-white appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 truncate"
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
        >
          <option>OpenAI</option>
        </select>
      </div>

      {/* Generate Button */}
      <div>
        <Button
          onClick={() => submitPrompt(prompt)}
          className="w-full bg-gray-100 text-gray-700 py-2 rounded-full flex items-center justify-center space-x-2"
          disabled={isLoading || !imageDataUri || !prompt}
        >
          <img
            className="w-6 h-6"
            alt="Generate"
            src="/icons/spark-jelly.svg"
          />
          <span className="truncate">
            {isLoading ? 'Generating...' : 'Generate your asset'}
          </span>
        </Button>
        {error && <p className="text-red-500 mt-2 text-sm truncate">{error}</p>}
      </div>
    </div>
  );
}
