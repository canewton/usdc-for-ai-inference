'use client';

import { OrbitControls, useGLTF } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useRef, useState } from 'react';

import Blurs from '@/public/blurs.svg';
import WalletIcon from '@/public/digital-wallet.svg';
import ModelIcon from '@/public/Group.svg';
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
  const [trustHovered, setTrustHovered] = useState<boolean>(false);
  const modelTooltip =
    'Rotate the 3D model by clicking and dragging in the canvas.';

  // scene to render 3d model
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { scene } = modelUrl ? useGLTF(modelUrl) : { scene: null };

  // reset camera position when a new modelUrl is loaded
  const orbitControlsRef = useRef<any>(null);

  useEffect(() => {
    if (orbitControlsRef.current) {
      orbitControlsRef.current.reset();
    }
  }, [modelUrl]);

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
            <div className="absolute top-0 left-0 flex items-center space-x-2 z-20 pointer-events-auto">
              <img
                src={ModelIcon.src}
                alt="Orbit/rotate icon"
                className="w-6 h-6"
                onMouseEnter={() => setTrustHovered(true)}
                onMouseLeave={() => setTrustHovered(false)}
              />
              <div
                className={`${trustHovered ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 cursor-default flex w-fit border border-gray-200 rounded-3xl h-10 justify-center items-center p-4 shadow-md text-body text-xs`}
              >
                {modelTooltip}
              </div>
            </div>
            <Suspense
              fallback={
                <div className="text-center mt-10">Loading model...</div>
              }
            >
              <Canvas
                camera={{ position: [0, 0, 5], fov: 50 }}
                gl={{ antialias: true, preserveDrawingBuffer: true }}
                className="w-full h-[calc(100% - 40px)]"
              >
                <ambientLight intensity={1.0} />
                <directionalLight position={[10, 10, 5]} intensity={1.5} />
                {scene && <primitive object={scene} scale={1} />}
                <OrbitControls
                  ref={orbitControlsRef}
                  enableRotate={true}
                  enableZoom={true}
                  enablePan={false} // prevent user from moving camera -- ensures the model stays in canvas center
                  enableDamping={true}
                  dampingFactor={0.1}
                />
              </Canvas>
              <button
                onClick={handleDownload}
                className="absolute top-2 right-2 z-10 p-2 bg-transparent text-[#1AA3FF] rounded-full hover:bg-blue-100 disabled:text-gray-400 transition-colors"
                disabled={isLoading}
                aria-label="Download 3D Model"
              >
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
            </Suspense>
          </div>
        ) : (
          <div
            className="relative w-full h-full bg-contain bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${Blurs.src})` }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-start pt-8">
              <div className="flex flex-col items-center justify-center w-1/3 text-center">
                <h1 className="text-5xl text-body mb-2">
                  What will you create?
                </h1>
                <p className="text-xl text-sub">
                  Generate 3D assets from your own images
                </p>
              </div>
              <div className="relative z-20 mt-4">
                <PromptSuggestions
                  onSelect={handleLocalInputChange}
                  suggestions={promptSuggestions}
                  disabled={!mode}
                />
              </div>
              <div className="w-full mt-4">
                <p
                  className={`text-center text-sm text-gray-500 ${imageDataUri ? 'invisible' : 'visible'}`}
                >
                  Please upload an image in the control panel first.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainAiSection>
  );
}
