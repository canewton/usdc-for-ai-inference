'use client';

import { useEffect, useState } from 'react';

import { useSession } from '@/app/contexts/SessionContext';
import CanvasArea from '@/components/3d/canvas';
import ControlPanel from '@/components/3d/control-panel';
import Header from '@/components/3d/header';
import HistorySidebar from '@/components/3d/history-sidebar';
import type { ModelHistoryItem } from '@/components/3d/types';
import { groupHistoryByDay } from '@/components/3d/utils';

export default function Generate3DModelPage() {
  const [prompt, setPrompt] = useState('');
  const [imageDataUri, setImageDataUri] = useState('');
  const [mode, setMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ModelHistoryItem[]>([]);
  const [totalBilledAmount, setTotalBilledAmount] = useState(0);
  const session = useSession();

  // clear prompt when switching between refine and preview modes
  useEffect(() => {
    if (!mode) {
      setPrompt('');
    }
  }, [mode]);

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
    if (!session || !imageDataUri) return;

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
            image_url: imageDataUri,
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
        setHistory(history.filter((item) => item.id !== modelId));
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
    <div className="w-full h-screen flex flex-col font-sf-pro">
      <Header mode={mode} setMode={setMode} />
      <div className="flex flex-1 overflow-hidden">
        <HistorySidebar
          history={history}
          onHistoryClick={handleHistoryClick}
          onDelete={handleDelete}
          groupHistoryByDay={groupHistoryByDay}
        />
        <CanvasArea
          modelUrl={modelUrl}
          imageDataUri={imageDataUri}
          mode={mode}
          isLoading={isLoading}
          setError={setError}
          handlePromptSelect={handlePromptSelect}
        />
        <ControlPanel
          imageDataUri={imageDataUri}
          prompt={prompt}
          mode={mode}
          isLoading={isLoading}
          error={error}
          setImageDataUri={setImageDataUri}
          setPrompt={setPrompt}
          setError={setError}
          submitPrompt={submitPrompt}
        />
      </div>
    </div>
  );
}
