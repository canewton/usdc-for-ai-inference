'use client';

import { OrbitControls, useGLTF } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useState } from 'react';
import { Suspense } from 'react';

import { useSession } from '@/app/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Generate3DModelPage() {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState('preview');
  const [isLoading, setIsLoading] = useState(false);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const session = useSession();

  const { scene } = modelUrl ? useGLTF(modelUrl) : { scene: null };

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

  return (
    <div className="w-full mx-auto p-4">
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

      <div className="mt-6" style={{ height: '500px', width: '100%' }}>
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
                // gl.init();
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
  );
}
