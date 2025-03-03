'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useSession } from '@/app/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import PromptSuggestions from '../../components/PromptSuggestions';

export default function ImageGeneratorPage() {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [quality, setQuality] = useState(80);
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showTryAgain, setShowTryAgain] = useState(false);
  const [model, setModel] = useState('flux-schnell');
  const [history, setHistory] = useState<
    { id: string; url: string; prompt: string; created_at: string }[]
  >([]);
  const [totalBilledAmount, setTotalBilledAmount] = useState(0);
  const router = useRouter();
  const session = useSession();

  const fetchTotalBilledAmount = async () => {
    if (!session) return;
    const sessionToken = session.access_token;
    try {
      const response = await fetch(`/api/gettotalbilledamount`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });
      const data = await response.json();

      if (response.ok) {
        const total = data.totalBilledAmount;
        setTotalBilledAmount(total);
      } else {
        console.error('Error fetching billed amount:', data.error);
      }
    } catch (error) {
      console.error('Error fetching billed amount:', error);
    }
  };

  // Fetch user's images
  useEffect(() => {
    const fetchImages = async () => {
      if (!session) return;
      const sessionToken = session.access_token;
      try {
        const response = await fetch(`/api/getgeneratedimages`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        });
        const data = await response.json();

        // Check if the response is successful
        if (response.ok) {
          // Store the fetched images
          setHistory(data.images);
        } else {
          console.error('Error fetching images:', data.error);
        }
      } catch (error) {
        console.error('Error fetching images:', error);
      }
    };
    if (session) {
      fetchImages();
      fetchTotalBilledAmount();
    }
  }, [session, imageUrl]);

  const submitPrompt = async (promptToSubmit: string) => {
    if (!promptToSubmit.trim()) return;
    setIsLoading(true);
    setShowTryAgain(false);
    try {
      const response = await fetch('/api/generateimagedalle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          prompt: promptToSubmit,
          aspect_ratio: aspectRatio,
          output_quality: quality,
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      const { imageUrl } = await response.json();
      setImageUrl(imageUrl);
      setShowTryAgain(true);
      await fetchTotalBilledAmount();
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await submitPrompt(prompt);
  };

  const handlePromptSelect = async (selectedPrompt: string) => {
    setPrompt(selectedPrompt);
    await submitPrompt(selectedPrompt);
  };

  const handleTryAgain = async () => {
    await submitPrompt(prompt);
  };

  const handleDeleteImage = (image_id: string) => {
    const deleteImage = async (image_id: string) => {
      try {
        const response = await fetch(`/api/deleteimage?imageid=${image_id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        const result = await response.json();
        if (response.ok) {
          // Remove deleted image from state
          setHistory((prevImages) =>
            prevImages.filter((img) => img.id !== image_id),
          );
        } else {
          console.error('Error deleting image:', result.error);
        }
      } catch (error) {
        console.error('Delete request failed:', error);
      }
    };

    if (session) {
      deleteImage(image_id);
    }
  };

  // Function to navigate to image page
  const handleImageClick = (image_id: string) => {
    router.push(`/image/${image_id}`);
  };

  return (
    <div className="w-full mx-auto">
      <h1 className="text-2xl font-bold mb-8">AI Image Generator</h1>
      <div className="flex w-full justify-between space-x-6">
        <div className="w-1/3 flex flex-col border-r-2 border-gray">
          <h1 className="text-xl font-bold">History</h1>
          <div className="h-96 overflow-y-auto mt-2">
            {history.map((image) => (
              <div
                key={image.id}
                className="image-item p-2 rounded hover:bg-gray-700"
              >
                <div className="flex flex-row justify-between">
                  <p className="text-lg">{image.prompt}</p>
                  <button
                    onClick={() => handleDeleteImage(image.id)}
                    className="border border-white m-1 p-1 rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
                <img
                  src={image.url}
                  alt={image.prompt}
                  className="image hover:cursor-pointer"
                  onClick={() => handleImageClick(image.id)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="w-2/3 flex flex-col">
          <PromptSuggestions onSelect={handlePromptSelect} />
          {imageUrl && (
            <div className="mb-8">
              <img
                src={imageUrl}
                alt="Generated image"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Describe the image you want to generate..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full"
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Generating...' : 'Generate Image'}
            </Button>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <span className="font-medium">Aspect Ratio:</span>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="border rounded p-2"
                >
                  <option value="1:1">1:1</option>
                  <option value="3:2">3:2</option>
                  <option value="4:3">4:3</option>
                  <option value="16:9">16:9</option>
                  <option value="21:9">21:9</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">Image Quality:</span>
                <select
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="border rounded p-2"
                >
                  <option value={50}>Low (50)</option>
                  <option value={80}>Medium (80)</option>
                  <option value={100}>High (100)</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">Model:</span>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="border rounded p-2"
                >
                  <option value="flux-schnell">FLUX.1</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">Total Billed Amount:</span>
                <span>${totalBilledAmount.toFixed(4)}</span>
              </div>
            </div>
          </form>

          {showTryAgain && (
            <div
              onClick={handleTryAgain}
              className="w-full mt-4 text-center text-xs hover:underline cursor-pointer"
            >
              Try Again?
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
