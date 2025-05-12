import { Link } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useSession } from '@/app/contexts/SessionContext';
import { usePolling } from '@/app/hooks/usePolling';
import type { Ai3dGeneration, Chat } from '@/types/database.types';

import { AiHistoryPortal } from '../common/ai-history-portal';
import { ChatSidebar } from '../common/chat-sidebar';
import { RightAiSidebar } from '../common/right-ai-sidebar';
import CanvasArea from './canvas';
import ControlPanel from './control-panel';
import type { ModelHistoryItem } from './types';

interface Model3dGeneratorProps {
  curr3dModel: string;
}

export const Model3dGenerator = ({ curr3dModel }: Model3dGeneratorProps) => {
  const [prompt, setPrompt] = useState('');
  const [imageDataUri, setImageDataUri] = useState('');
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<ModelHistoryItem[]>([]);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [title, setTitle] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(
    curr3dModel || null,
  );
  const [submittedPrompt, setSubmittedPrompt] = useState<boolean>(false);

  const router = useRouter();
  const session = useSession();

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/3d-generation', {
        method: 'GET',
      });
      const data: Ai3dGeneration[] = await response.json();

      if (response.ok) {
        session.setAi3dGenerations(data);
      } else {
        toast.error('Failed to load history.');
        setHistory([]);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
      toast.error('An error occurred while loading history.');
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

  useEffect(() => {
    const fetch3dModelData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/3d-generation/${curr3dModel}`, {
          method: 'GET',
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to load video data');
        }
        const data: Ai3dGeneration = await response.json();
        setPrompt(data.prompt ?? '');
        setTitle(data.title);
        setImageDataUri(data.image_url);
        setTitle(data.title);
        setTaskId(data.task_id);
        setModelUrl(data.url);
      } catch (err: any) {
        console.error('Error fetching 3d generation data:', err);
        toast.error('Error fetching 3d generation data.');
      } finally {
        setLoading(false);
      }
    };

    if (curr3dModel) {
      fetch3dModelData();
    }
  }, [curr3dModel]);

  const submitPrompt = async (selectedPrompt: string) => {
    if (!imageDataUri) {
      toast.error('Session or image data is missing.');
      return;
    }
    setSubmittedPrompt(true);

    try {
      const response = await fetch('/api/3d-generation/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: imageDataUri,
          circle_wallet_id: session.circleWalletId,
          title: title,
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

      router.push(`/3d/${data.id}`);
    } catch (err: any) {
      console.error('Generation error:', err);
    }
  };

  usePolling({
    url: '/api/3d-generation/generation-status',
    body: {
      taskId,
      title: title,
    },
    interval: 5000,
    isPolling: !modelUrl && taskId !== null,
    onCheckPollingFinished: (input: any) => {
      console.log('check polling finished:', input);
      if (input.status === 'SUCCEEDED') {
        setModelUrl(input.url);
        setTaskId(null);
        session.setDemoLimit(session.demoLimit - 1);
        fetchHistory();
        return true;
      } else if (input.status === 'FAILED') {
        toast.error('Generation failed.');
        setTaskId(null);
        session.setDemoLimit(session.demoLimit - 1);
        return true;
      } else {
        setGenerationProgress(input.progress);
      }
      return false;
    },
  });

  const handleNewChat = () => {
    setCurrentChatId(null);
    router.push('/3d');
  };

  const handleSelectHistoryItem = (id: string) => {
    setCurrentChatId(id);
    router.push(`/3d/${id}`);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/3d-generation/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete model');
      setHistory((prev) => prev.filter((chat) => chat.id !== id));
      if (currentChatId === id) {
        setCurrentChatId(null);
        router.push('/3d');
      }
    } catch (err) {
      console.error('Delete chat error:', err);
      toast.error('Failed to delete model.');
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
        isLoading={loading}
        setPrompt={setPrompt}
        generationProgress={generationProgress}
        taskId={taskId}
      />

      {/* --- Right Sidebar --- */}
      <RightAiSidebar isImageInput={true}>
        <ControlPanel
          imageDataUri={imageDataUri}
          prompt={prompt}
          isLoading={!modelUrl && taskId !== null}
          setImageDataUri={setImageDataUri}
          setPrompt={setPrompt}
          submitPrompt={submitPrompt}
          title={title}
          setTitle={setTitle}
          isDisabled={!!(modelUrl || taskId || submittedPrompt)}
        />
      </RightAiSidebar>
    </>
  );
};
