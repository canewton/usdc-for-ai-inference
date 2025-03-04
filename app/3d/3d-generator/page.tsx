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
  const [mode, setMode] = useState('preview');
  const [isLoading, setIsLoading] = useState(false);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ModelHistoryItem[]>([]);
  const session = useSession();

  const { scene } = modelUrl ? useGLTF(modelUrl) : { scene: null };

  // load previous models from db; update on session change, new model
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

    fetchHistory();
  }, [session, modelUrl]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!prompt.trim() || !session) return;

    setIsLoading(true);
    setError(null);
    setModelUrl(null);

    try {
      const sessionToken = session.access_token;
      const response = await fetch('http://localhost:3000/api/generate3d', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ mode, prompt }),
      });

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

  // update model url for scene
  const handleHistoryClick = (url: string) => {
    setModelUrl(url);
    setError(null);
  };

  // delete handler
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

  return (
    <div className="w-full mx-auto p-4 flex h-screen">
      {/* History Sidebar */}
      <div className="w-1/4 pr-4 h-full flex flex-col">
        <h2 className="text-xl font-semibold mb-2">History</h2>
        <div className="flex-1 overflow-y-auto">
          {history.length > 0 ? (
            <ul className="space-y-2">
              {history.map((item) => (
                <li key={item.id} className="flex items-center justify-between">
                  <div>
                    <button
                      onClick={() => handleHistoryClick(item.url)}
                      className="text-blue-500 hover:underline text-left"
                    >
                      {item.prompt}
                    </button>
                    <p className="text-xs text-gray-500">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-500 hover:text-red-700"
                    aria-label="Delete model"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No previous models generated.</p>
          )}
        </div>
      </div>

      {/* Main Page: Text Box, Button, Canvas */}
      <div className="w-3/4 h-full flex flex-col">
        <h1 className="text-2xl font-bold mb-4">AI 3D Model Generator</h1>
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
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate Model'}
          </Button>
        </form>

        <div className="mt-6 flex-1" style={{ minHeight: 0 }}>
          <Suspense
            fallback={<div className="text-center mt-10">Loading model...</div>}
          >
            <Canvas
              camera={{ position: [0, 0, 5], fov: 50 }}
              gl={{ antialias: false, preserveDrawingBuffer: true }}
              onCreated={({ gl }) => {
                console.log('Canvas mounted');
                const canvas = gl.domElement;
                canvas.addEventListener('webglcontextlost', (e) => {
                  console.log('WebGL context lost', e);
                  e.preventDefault();
                });
                canvas.addEventListener('webglcontextrestored', () => {
                  console.log('WebGL context restored');
                });
              }}
            >
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} />
              {scene && <primitive object={scene} scale={1} />}
              <OrbitControls enableDamping={false} />
            </Canvas>
          </Suspense>
        </div>

        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>
    </div>
  );
}
