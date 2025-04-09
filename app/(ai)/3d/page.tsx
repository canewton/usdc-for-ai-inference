'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useSession } from '@/app/contexts/SessionContext';
import { useDemoLimit } from '@/app/hooks/useDemoLimit';
import CanvasArea from '@/components/3d/canvas';
import ControlPanel from '@/components/3d/control-panel';
import type { ModelHistoryItem } from '@/components/3d/types';
import AiHistoryPortal from '@/components/AiHistoryPortal';
import { ChatSidebar } from '@/components/ChatSidebar';
import RightAiSidebar from '@/components/RightAiSidebar';

interface Chat {
  id: string;
  title: string;
  created_at: string;
}

export default function Generate3DModelPage() {
  const { remaining, loading: demoLimitLoading } = useDemoLimit();
  const [prompt, setPrompt] = useState('');
  const [imageDataUri, setImageDataUri] = useState('');
  const [mode, setMode] = useState(true); // not currently used -> always on refine mode (true)
  const [isLoading, setIsLoading] = useState(false);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ModelHistoryItem[]>([]);
  const [totalBilledAmount, setTotalBilledAmount] = useState(0);
  const session = useSession();

  useEffect(() => {
    if (!mode) {
      setPrompt('');
    }
  }, [mode]);

  const fetchTotalBilledAmount = async () => {
    if (!session) return;
    const sessionToken = session.access_token;
    try {
      const response = await fetch(
        `/api/gettotalbilledamount?table=3d_generations`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        },
      );
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

  const fetchHistory = async () => {
    if (!session) return;
    console.log('Fetching history...');
    setIsLoading(true);
    const sessionToken = session.access_token;
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
        const formattedHistory: ModelHistoryItem[] = (data.models || [])
          .map(
            (item: any): ModelHistoryItem => ({
              id: item.id || `missing-id-${Math.random()}`,
              url: item.url || '',
              prompt: item.prompt || '',
              created_at: item.created_at
                ? new Date(item.created_at).toISOString()
                : new Date().toISOString(),
              ...item,
            }),
          )
          .sort(
            (a: any, b: any) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          );

        setHistory(formattedHistory);
        console.log('Fetched and formatted history:', formattedHistory);
      } else {
        console.error('Failed to fetch history:', data.error);
        setError('Failed to load history.');
        setHistory([]);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
      setError('An error occurred while loading history.');
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchTotalBilledAmount();
      fetchHistory();
    }
  }, [session]);

  const submitPrompt = async (selectedPrompt: string) => {
    if (!session || !imageDataUri) {
      setError('Session or image data is missing.');
      return;
    }
    if (remaining === 0) {
      toast.error('Demo limit reached. Please upgrade to continue.');
      return;
    }
    setIsLoading(true);
    setError(null);

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
            texture_prompt: selectedPrompt,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          toast.error('Demo limit reached. Please upgrade to continue.');
        } else {
          toast.error(errorData.error || 'Failed to generate model');
        }
        throw new Error(errorData.error || 'Failed to generate model');
      }

      const data = await response.json();
      if (data.modelUrl) {
        setModelUrl(data.modelUrl);
        console.log('Generated model URL:', data.modelUrl);
        fetchHistory();
        fetchTotalBilledAmount();
      } else {
        setError(data.error || 'Failed to generate model');
        console.error('Generation failed:', data);
      }
    } catch (err: any) {
      setError(`An error occurred: ${err.message || 'Unknown error'}`);
      console.error('Generation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistoryItem = (id: string) => {
    const selectedItem = history.find((item) => item.id === id);
    if (selectedItem?.url) {
      console.log(
        `Selecting history item via ChatSidebar: ${id}, URL: ${selectedItem.url}`,
      );
      setModelUrl(selectedItem.url);
      setError(null);
    } else {
      console.warn(`History item with id ${id} not found or has no URL.`);
      setError(`Could not load selected history item (ID: ${id}).`);
    }
  };

  const handleNewChat = () => {
    setModelUrl('');
  };

  const handleDelete = async (modelId: string) => {
    if (!session) return;
    console.log(`Attempting to delete model via ChatSidebar: ${modelId}`);

    const itemToDelete = history.find((item) => item.id === modelId);
    const urlToDelete = itemToDelete?.url;

    setIsLoading(true);
    setError(null);

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
        console.log('Model deleted successfully:', data.message);
        await fetchHistory();
        if (modelUrl === urlToDelete) {
          setModelUrl(null);
        }
        fetchTotalBilledAmount();
      } else {
        setError(data.error || 'Failed to delete model');
        console.error('Deletion failed:', data);
      }
    } catch (err: any) {
      setError(
        `An error occurred while deleting: ${err.message || 'Unknown error'}`,
      );
      console.error('Delete error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const chatsDataForSidebar: Chat[] = useMemo(() => {
    console.log('Transforming history for ChatSidebar:', history);
    return history.map(
      (item): Chat => ({
        id: item.id,
        title: item.prompt || `Model ${item.id.substring(0, 6)}`,
        created_at: item.created_at,
      }),
    );
  }, [history]);

  const currentChatId = useMemo(() => {
    if (!modelUrl) return null;
    const currentItem = history.find((item) => item.url === modelUrl);
    console.log(
      `Derived currentChatId: ${currentItem?.id ?? 'null'} for modelUrl: ${modelUrl}`,
    );
    return currentItem ? currentItem.id : null;
  }, [modelUrl, history]);

  return (
    <>
      {/* --- Sidebar Area --- */}
      <AiHistoryPortal>
        <ChatSidebar
          chats={chatsDataForSidebar}
          currentChatId={currentChatId}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectHistoryItem}
          onDeleteChat={handleDelete}
        />
      </AiHistoryPortal>

      {/* --- Main Content Area --- */}
      <CanvasArea
        modelUrl={modelUrl}
        imageDataUri={imageDataUri}
        mode={mode}
        isLoading={isLoading}
        prompt={prompt}
        setMode={setMode}
        setPrompt={setPrompt}
        setError={setError}
        error={error}
        remaining={remaining}
        demoLimitLoading={demoLimitLoading}
      />

      {/* --- Right Sidebar, TODO --- */}
      <RightAiSidebar isImageInput={true}>
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
          totalBilledAmount={totalBilledAmount}
          remaining={remaining}
          demoLimitLoading={demoLimitLoading}
        />
      </RightAiSidebar>
    </>
  );
}
