'use client';

import { TrashIcon } from '@heroicons/react/24/outline';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useEffect, useState } from 'react';
import { Suspense } from 'react';

import { useSession } from '@/app/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ModelHistoryItem {
  id: string;
  url: string;
  prompt: string;
  created_at: string;
}

export default function Generate3DModelPage() {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [mode, setMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ModelHistoryItem[]>([]);
  const [totalBilledAmount, setTotalBilledAmount] = useState(0);
  const session = useSession();

  const { scene } = modelUrl ? useGLTF(modelUrl) : { scene: null };

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
        setTotalBilledAmount(data.totalBilledAmount);
      } else {
        console.error('Error fetching billed amount:', data.error);
      }
    } catch (error) {
      console.error('Error fetching billed amount:', error);
    }
  };

  useEffect(() => {
    if (!session) return;
    const sessionToken = session.access_token;
    const fetchHistory = async () => {
      try {
        const response = await fetch(
          'http://localhost:3000/api/getgeneratedmodels',
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${sessionToken}`,
            },
          },
        );

        const data = await response.json();
        if (response.ok) {
          setHistory(data.models || []);
          console.log(data.models);
        } else {
          console.error('Failed to fetch history:', data.error);
        }
      } catch (err) {
        console.error('Error fetching history:', err);
      }
    };
    fetchTotalBilledAmount();
    fetchHistory();
  }, [session, modelUrl]);

  const submitPrompt = async (prompt: string) => {
    if (!prompt.trim() || !session) return;

    setIsLoading(true);
    setError(null);
    setModelUrl(null);

    try {
      const sessionToken = session.access_token;
      const response = await fetch(
        'http://localhost:3000/api/generate3d-image',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({
            image_url: imageUrl,
            should_texture: mode,
            texture_prompt: prompt,
          }),
        },
      );

      const data = await response.json();
      if (response.ok) {
        setModelUrl(data.modelUrl);
        console.log('Generated model URL:', data.modelUrl);
      } else {
        setError(data.error || 'Failed to generate model');
      }
    } catch (err) {
      setError('An error occurred while generating the model.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitPrompt(prompt);
  };

  const handleHistoryClick = (url: string) => {
    setModelUrl(url);
    setError(null);
  };

  const handlePromptSelect = async (prompt: string) => {
    setPrompt(prompt);
    await submitPrompt(prompt);
  };

  const handleDelete = async (modelId: string) => {
    if (!session) return;

    try {
      const sessionToken = session.access_token;
      const response = await fetch(
        `http://localhost:3000/api/deletemodel?modelid=${modelId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        },
      );

      const data = await response.json();
      if (response.ok) {
        // remove the deleted model from the history state
        setHistory(history.filter((item) => item.id !== modelId));

        // clear model from canvas if it was being displayed
        if (modelUrl === history.find((item) => item.id === modelId)?.url) {
          setModelUrl(null);
        }
        console.log('Model deleted successfully:', data.message);
      } else {
        setError(data.error || 'Failed to delete model');
      }
    } catch (err) {
      setError('An error occurred while deleting the model.');
      console.error('Delete error:', err);
    }
  };

  const groupHistoryByDay = (history: ModelHistoryItem[]) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);

    const grouped: { [key: string]: ModelHistoryItem[] } = {
      Today: [],
      Yesterday: [],
      'Past Week': [],
      Older: [],
    };

    history.forEach((item) => {
      const itemDate = new Date(item.created_at);
      const isToday =
        itemDate.getDate() === today.getDate() &&
        itemDate.getMonth() === today.getMonth() &&
        itemDate.getFullYear() === today.getFullYear();
      const isYesterday =
        itemDate.getDate() === yesterday.getDate() &&
        itemDate.getMonth() === yesterday.getMonth() &&
        itemDate.getFullYear() === yesterday.getFullYear();
      const isWithinPastWeek = itemDate > oneWeekAgo && itemDate < yesterday;

      if (isToday) {
        grouped.Today.push(item);
      } else if (isYesterday) {
        grouped.Yesterday.push(item);
      } else if (isWithinPastWeek) {
        grouped['Past Week'].push(item);
      } else {
        grouped.Older.push(item);
      }
    });

    return grouped;
  };

  const groupedHistory = groupHistoryByDay(history);

  return (
    <div className="w-full h-screen flex flex-col font-sf-pro">
      <div className="p-4 flex justify-start">
        <Button
          onClick={() => setMode(false)}
          className={`mr-2 ${
            !mode ? 'bg-blue-500 text-white' : 'bg-gray-200'
          } rounded-full px-4 py-2`}
        >
          Preview
        </Button>
        <Button
          onClick={() => setMode(true)}
          className={`mr-2 ${
            mode ? 'bg-blue-500 text-white' : 'bg-gray-200'
          } rounded-full px-4 py-2`}
        >
          Refine
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/4 p-4 bg-gray-50 h-full overflow-y-auto">
          {Object.keys(groupedHistory).map((day) =>
            groupedHistory[day].length > 0 ? (
              <div key={day} className="mb-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                  {day}
                </h3>
                <ul className="space-y-1">
                  {groupedHistory[day].map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between group"
                    >
                      <button
                        onClick={() => handleHistoryClick(item.url)}
                        className="text-gray-700 text-sm text-left py-1 px-2 rounded-full group-hover:bg-gray-200 transition-colors"
                      >
                        {item.prompt}
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Delete model"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null,
          )}
          {history.length === 0 && (
            <p className="text-gray-500 text-sm">
              No previous models generated.
            </p>
          )}
        </div>

        {/* Center Canvas / Placeholder */}
        <div className="w-2/4 flex items-center justify-center bg-white p-4">
          {modelUrl ? (
            <Suspense
              fallback={
                <div className="text-center mt-10">Loading model...</div>
              }
            >
              <Canvas
                camera={{ position: [0, 0, 5], fov: 50 }}
                gl={{ antialias: false, preserveDrawingBuffer: true }}
                className="w-full h-full"
              >
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                {scene && <primitive object={scene} scale={1} />}
                <OrbitControls enableDamping={false} />
              </Canvas>
            </Suspense>
          ) : (
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                What will you create?
              </h1>
              <p className="text-gray-500 mb-6">
                Generate 3D assets from your own images
              </p>
              <div className="flex justify-center space-x-4">
                <Button
                  onClick={() => handlePromptSelect('Create a 3D wallet')}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full flex items-center"
                >
                  <span className="mr-2">📧</span> Create a 3D wallet
                </Button>
                <Button
                  onClick={() => handlePromptSelect('Create a USDC coin')}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full flex items-center"
                >
                  <span className="mr-2">💰</span> Create a USDC coin
                </Button>
                <Button
                  onClick={() => handlePromptSelect('Surprise me')}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full flex items-center"
                >
                  <span className="mr-2">✨</span> Surprise me
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-1/4 p-4 bg-gray-50 h-full flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-4">AI 3D Model Generator</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Describe the 3D model you want to generate..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full"
              />
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="preview">Preview</option>
                <option value="refine">Refine</option>
              </select>
            </form>
          </div>
          <div>
            <Button
              type="submit"
              onClick={handleSubmit}
              className="w-full mt-4"
              disabled={isLoading}
            >
              {isLoading ? 'Generating...' : 'Generate Model'}
            </Button>
            {error && <p className="text-red-500 mt-2">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
