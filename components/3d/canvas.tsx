import { OrbitControls, useGLTF } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';

import { Button } from '@/components/ui/button';

interface CanvasAreaProps {
  modelUrl: string | null;
  imageDataUri: string;
  mode: boolean;
  isLoading: boolean;
  setError: (error: string | null) => void;
  handlePromptSelect: (prompt: string) => void;
}

export default function CanvasArea({
  modelUrl,
  imageDataUri,
  mode,
  isLoading,
  setError,
  handlePromptSelect,
}: CanvasAreaProps) {
  const { scene } = modelUrl ? useGLTF(modelUrl) : { scene: null };

  return (
    <div className="w-2/4 flex items-center justify-center bg-white p-4">
      {modelUrl ? (
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
        </Suspense>
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
