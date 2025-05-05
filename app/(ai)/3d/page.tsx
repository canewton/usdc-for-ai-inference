'use client';

import { Link } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useSession } from '@/app/contexts/SessionContext';
import { usePolling } from '@/app/hooks/usePolling';
import CanvasArea from '@/components/3d/canvas';
import ControlPanel from '@/components/3d/control-panel';
import type { ModelHistoryItem } from '@/components/3d/types';
import AiHistoryPortal from '@/components/AiHistoryPortal';
import { ChatSidebar } from '@/components/ChatSidebar';
import RightAiSidebar from '@/components/RightAiSidebar';
import type { Ai3dGeneration, Chat } from '@/types/database.types';

export default function Generate3DModelPage() {
  const [prompt, setPrompt] = useState('');
  const [imageDataUri, setImageDataUri] = useState('');
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ModelHistoryItem[]>([]);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [title, setTitle] = useState<string>('');

  const session = useSession();

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/getgeneratedmodels', {
        method: 'GET',
      });
      const data: Ai3dGeneration[] = await response.json();

      if (response.ok) {
        session.setAi3dGenerations(data);
      } else {
        setError('Failed to load history.');
        setHistory([]);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
      setError('An error occurred while loading history.');
      setHistory([]);
    }
  };

  useEffect(() => {
    const formattedHistory: ModelHistoryItem[] = session.ai3dGenerations
      .map(
        (item: any): ModelHistoryItem => ({
          id: item.id || `missing-id-${Math.random()}`,
          url: item.url || '',
          prompt: item.prompt || '',
          user_id: item.user_id || '',
          title: item.title || '',
          created_at: item.created_at
            ? new Date(item.created_at).toISOString()
            : new Date().toISOString(),
          ...item,
        }),
      )
      .sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

    setHistory(formattedHistory);
  }, [session.ai3dGenerations]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const submitPrompt = async (selectedPrompt: string) => {
    if (!imageDataUri) {
      setError('Session or image data is missing.');
      return;
    }
    session.setIsAiInferenceLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate3d-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: imageDataUri,
          circle_wallet_id: session.circleWalletId,
          ...(selectedPrompt !== ''
            ? { should_texture: true, texture_prompt: selectedPrompt }
            : {}),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          toast.error('Demo limit reached.');
        } else {
          toast.error(errorData.error || 'Failed to generate model');
        }
        throw new Error(errorData.error || 'Failed to generate model');
      }

      const data: any = await response.json();
      setTaskId(data.taskId);
    } catch (err: any) {
      setError(`An error occurred: ${err.message || 'Unknown error'}`);
      console.error('Generation error:', err);
    }
  };

  usePolling(
    `/api/generation3d-status?taskId=${taskId}`,
    {
      taskId,
      texture_prompt: prompt,
      image_url: imageDataUri,
      title: title,
    },
    5000,
    taskId !== null,
    (input: any) => {
      if (input.status === 'SUCCEEDED') {
        setModelUrl(input.url);
        setTaskId(null);
        setError(null);
        session.setIsAiInferenceLoading(false);
        session.setDemoLimit(session.demoLimit - 1);
        fetchHistory();
        return true;
      } else if (input.status === 'FAILED') {
        setError('Generation failed.');
        setTaskId(null);
        session.setIsAiInferenceLoading(false);
        session.setDemoLimit(session.demoLimit - 1);
        return true;
      } else {
        setGenerationProgress(input.progress);
      }
      return false;
    },
  );

  const handleSelectHistoryItem = (id: string) => {
    const selectedItem = history.find((item) => item.id === id);
    if (selectedItem?.url) {
      setModelUrl(selectedItem.url);
      setError(null);
    } else {
      console.warn(`History item with id ${id} not found or has no URL.`);
      setError(`Could not load selected history item (ID: ${id}).`);
    }
  };

  const resetGenerationState = () => {
    setModelUrl(null);
    setPrompt('');
    setImageDataUri('');
    setError(null);
  };

  const handleNewChat = () => {
    resetGenerationState();
  };

  const handleDelete = async (modelId: string) => {
    const itemToDelete = history.find((item) => item.id === modelId);
    const urlToDelete = itemToDelete?.url;
    setError(null);

    try {
      const response = await fetch(`/api/deletemodel?modelid=${modelId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (response.ok) {
        await fetchHistory();
        if (modelUrl === urlToDelete) {
          setModelUrl(null);
        }
      } else {
        setError(data.error || 'Failed to delete model');
        console.error('Deletion failed:', data);
      }
    } catch (err: any) {
      setError(
        `An error occurred while deleting: ${err.message || 'Unknown error'}`,
      );
      console.error('Delete error:', err);
    }
  };

  const chatsDataForSidebar: Chat[] = useMemo(() => {
    return history.map(
      (item): Chat => ({
        id: item.id,
        title: item.title || `Model ${item.id.substring(0, 6)}`,
        created_at: item.created_at,
        user_id: item.user_id,
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
      <div
        className={`${!session.apiKeyStatus.text ? 'flex flex-row items-center justify-center text-white overlay fixed inset-0 bg-gray-800 bg-opacity-80 z-50 pointer-events-auto' : 'hidden'}`}
      >
        <div className="flex flex-col items-center">
          <div className="mb-4">
            This page is not available during the hosted demo.
          </div>
          <Link href="/dashboard">
            <button className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-md text-zinc-300 border-[0.5px] border-zinc-600 transition-colors">
              Go Back
            </button>
          </Link>
        </div>
      </div>

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
        isLoading={session.isAiInferenceLoading}
        setPrompt={setPrompt}
        setError={setError}
        generationProgress={generationProgress}
      />

      {/* --- Right Sidebar --- */}
      <RightAiSidebar isImageInput={true}>
        <ControlPanel
          imageDataUri={imageDataUri}
          prompt={prompt}
          isLoading={session.isAiInferenceLoading}
          error={error}
          setImageDataUri={setImageDataUri}
          setPrompt={setPrompt}
          setError={setError}
          submitPrompt={submitPrompt}
          modelUrl={modelUrl}
          title={title}
          setTitle={setTitle}
        />
      </RightAiSidebar>
    </>
  );
}
