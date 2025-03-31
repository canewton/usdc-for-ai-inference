import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

  return (
    <div className="w-1/4 p-4 bg-gray-50 h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-medium">Total Billed:</span>
        <span className="ml-2">${totalBilledAmount.toFixed(4)}</span>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Image
        </label>
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400"
          onClick={() => document.getElementById('image-upload')?.click()}
        >
          {imageDataUri ? (
            <img
              src={imageDataUri}
              alt="Uploaded"
              className="max-h-40 mx-auto"
            />
          ) : (
            <>
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              <p className="mt-1 text-sm text-gray-600">
                Click or drag to upload image
              </p>
              <p className="text-xs text-gray-500">
                Supported files: .png, .jpg, .jpeg <br />
                Max size: 20MB
              </p>
            </>
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Prompt
        </label>
        <Input
          placeholder="Describe the model texture..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full"
          disabled={!mode}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Model Type
        </label>
        <select
          className="w-full p-2 border rounded text-gray-700 bg-white appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500"
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
          <option>FLUX.1 (WIP)</option>
        </select>
      </div>

      <div>
        <Button
          onClick={() => submitPrompt(prompt)}
          className="w-full bg-gray-100 text-gray-700 py-2 rounded-full flex items-center justify-center"
          disabled={isLoading || !imageDataUri}
        >
          <img
            className="w-12 h-12"
            alt="Generate"
            src="/icons/spark-jelly.svg"
          />
          {isLoading ? 'Generating...' : 'Generate your asset'}
        </Button>
        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
      </div>
    </div>
  );
}
