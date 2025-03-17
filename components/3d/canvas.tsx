'use client';

import { OrbitControls, useGLTF } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';

import { Button } from '@/components/ui/button';
import DownloadIcon from '@/public/download.svg';

interface CanvasAreaProps {
  modelUrl: string | null;
  imageDataUri: string;
  mode: boolean;
  isLoading: boolean;
  setError: (error: string | null) => void;
  handlePromptSelect: (prompt: string) => void;
  error?: string | null;
}

export default function CanvasArea({
  modelUrl,
  imageDataUri,
  mode,
  isLoading,
  setError,
  handlePromptSelect,
  error,
}: CanvasAreaProps) {
  const { scene } = modelUrl ? useGLTF(modelUrl) : { scene: null };

  const handleDownload = async () => {
    if (!modelUrl || isLoading) return;

    try {
      const response = await fetch(modelUrl);
      if (!response.ok) throw new Error('Failed to fetch model file');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const filename = modelUrl.split('/').pop() || '3d_model.glb';

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setError(null);
    } catch (error) {
      setError(
        `Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  };

  return (
    <div className="w-2/4 flex items-center justify-center bg-white p-4">
      {modelUrl ? (
        <div className="w-full h-full flex flex-col items-center relative">
          <Suspense
            fallback={<div className="text-center mt-10">Loading model...</div>}
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
            <button
              onClick={handleDownload}
              className="absolute top-2 right-2 p-2 bg-blue-500 rounded-full hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
              disabled={isLoading}
              aria-label="Download 3D Model"
            >
              <img
                src={DownloadIcon}
                alt="Download Icon"
                className="w-6 h-6 text-white"
              />
            </button>
          </Suspense>
          <div className="mt-2">
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        </div>
      ) : (
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            What texture will you apply?
          </h1>
          <p className="text-gray-500 mb-6">
            Apply textures to 3D assets using your images
          </p>
          <div className="flex justify-center space-x-4">
            <Button
              onClick={() =>
                imageDataUri
                  ? handlePromptSelect('Glossy Metallic Shine')
                  : setError('Please upload an image first')
              }
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full flex items-center"
              disabled={!imageDataUri || !mode || isLoading}
            >
              <span className="mr-2">🪞</span> Glossy Metallic Shine
            </Button>
            <Button
              onClick={() =>
                imageDataUri
                  ? handlePromptSelect('Rough Stone Grain')
                  : setError('Please upload an image first')
              }
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full flex items-center"
              disabled={!imageDataUri || !mode || isLoading}
            >
              <span className="mr-2">🪨</span> Rough Stone Grain
            </Button>
            <Button
              onClick={() =>
                imageDataUri
                  ? handlePromptSelect('Soft Velvet Glow')
                  : setError('Please upload an image first')
              }
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full flex items-center"
              disabled={!imageDataUri || !mode || isLoading}
            >
              <span className="mr-2">✨</span> Soft Velvet Glow
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
