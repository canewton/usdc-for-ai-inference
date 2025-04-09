'use client';

import { OrbitControls, useGLTF } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';

import Blurs from '@/public/blurs.svg';
import WalletIcon from '@/public/digital-wallet.svg';
import SparkIcon from '@/public/spark.svg';
import UsdcIcon from '@/public/usdc.svg';

import MainAiSection from '../MainAiSection';
import PromptSuggestions from '../PromptSuggestions';

const promptSuggestions = [
  { title: 'Worn leather with subtle creases', icon: WalletIcon },
  { title: 'Aged metal with fine engravings', icon: UsdcIcon },
  { title: 'Surprise me', icon: SparkIcon },
];

interface CanvasAreaProps {
  modelUrl: string | null;
  imageDataUri: string;
  mode: boolean;
  isLoading: boolean;
  prompt: string;
  setMode: (mode: boolean) => void;
  setPrompt: (prompt: string) => void;
  setError: (error: string | null) => void;
  error: string | null;
  remaining: number | null;
  demoLimitLoading: boolean;
}

export default function CanvasArea({
  modelUrl,
  imageDataUri,
  mode,
  isLoading,
  prompt,
  setMode,
  setPrompt,
  setError,
  error,
  remaining,
  demoLimitLoading,
}: CanvasAreaProps) {
  // scene to render 3d model
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { scene } = modelUrl ? useGLTF(modelUrl) : { scene: null };

  // download model
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

  const handleLocalInputChange = (suggestion: { title: string; icon: any }) => {
    setPrompt(suggestion.title);
  };

  return (
    <MainAiSection>
      {/* Header component will be used to select preview/refine modes, not currently used. */}
      {/* <Header mode={mode} setMode={setMode} /> */}
      <div className="flex-grow flex flex-col items-center justify-center bg-white p-4 relative">
        {!demoLimitLoading && remaining !== null && (
          <div className="text-sm text-gray-500 mb-4">
            {remaining === 0
              ? 'Demo limit reached'
              : `${remaining} generations remaining`}
          </div>
        )}
        {/* Show canvas if model is selected, otherwise display initial screen. */}
        {modelUrl ? (
          <div className="w-full h-full flex flex-col items-center relative">
            <Suspense
              fallback={
                <div className="text-center mt-10">Loading model...</div>
              }
            >
              <Canvas
                camera={{ position: [0, 0, 5], fov: 50 }}
                gl={{ antialias: true, preserveDrawingBuffer: true }}
                className="w-full h-[calc(100%-40px)]"
              >
                <ambientLight intensity={1.0} />
                <directionalLight position={[10, 10, 5]} intensity={1.5} />
                {scene && <primitive object={scene} scale={1} />}
                <OrbitControls enableDamping={true} dampingFactor={0.1} />
              </Canvas>
              <button
                onClick={handleDownload}
                className="absolute top-2 right-2 z-10 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
                disabled={isLoading}
                aria-label="Download 3D Model"
              >
                {/* Download SVG */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </button>
            </Suspense>
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-full px-4 text-center">
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full">
            <img
              src={Blurs.src}
              alt="blur background"
              className="w-1/2 object-contain mx-auto"
            />
            <div className="inset-0 flex items-center justify-center absolute">
              <div className="flex flex-col items-center justify-center w-1/3 text-center">
                <h1 className="text-5xl text-body mb-2">
                  What will you create?
                </h1>
                <p className="text-xl text-sub">
                  Generate 3D assets from your own images
                </p>
              </div>
            </div>
            <div className="relative z-20 mt-40">
              <PromptSuggestions
                onSelect={handleLocalInputChange}
                suggestions={promptSuggestions}
                disabled={!mode}
              />
            </div>
            <div className="w-full mt-4">
              {!imageDataUri && (
                <p className="text-center text-sm text-gray-500">
                  Please upload an image in the control panel first.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </MainAiSection>
  );
}
