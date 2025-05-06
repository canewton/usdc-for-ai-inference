'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { usePolling } from '@/app/hooks/usePolling';
import AiHistoryPortal from '@/components/AiHistoryPortal';
import { ChatSidebar } from '@/components/ChatSidebar';
import LoadingBar from '@/components/loading-bar';
import MainAiSection from '@/components/MainAiSection';
import RightAiSidebar from '@/components/RightAiSidebar';
import type { Chat } from '@/types/database.types';

interface VideoData {
  task_id: string;
  video_url: string;
  prompt: string;
  seed: number | string;
  model_name: string;
  prompt_image_path: string;
  processing_status: string;
}

export default function VideoChatPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [model, setModel] = useState('SVD-XT');
  const [title, setTitle] = useState('');
  const [seed, setSeed] = useState('-1');

  const [chatHistory, setChatHistory] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(id || null);
  const [generationProgress, setGenerationProgress] = useState<number>(0);

  // Fetch current video data
  useEffect(() => {
    const fetchVideoData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/getvideochat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoId: id }),
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to load video data');
        }
        const data: VideoData = await response.json();
        setVideoData(data);
        setModel(data.model_name);
        setTitle(data.prompt);
        setSeed(data.seed.toString());
        setImagePreview(data.prompt_image_path);
      } catch (err: any) {
        console.error('Error fetching video data:', err);
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchVideoData();
  }, [id]);

  // Fetch chat sidebar history
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const response = await fetch('/api/videos', { method: 'GET' });
        if (!response.ok) throw new Error('Failed to fetch chat history');
        const data = await response.json();
        const formatted: Chat[] = (data.videoGenerations || []).map(
          (item: any) => ({
            id: item.id,
            title: item.prompt || 'Untitled',
            created_at: item.created_at || new Date().toISOString(),
            user_id: item.user_id || '',
          }),
        );
        setChatHistory(formatted);
      } catch (err) {
        console.error('Chat history error:', err);
      }
    };

    fetchChatHistory();
  }, []);

  usePolling({
    url: '/api/checkvideostatus',
    body: { task_id: videoData?.task_id },
    interval: 2000,
    isPolling:
      videoData?.processing_status === 'TASK_STATUS_PROCESSING' ||
      videoData?.processing_status === 'TASK_STATUS_QUEUED' ||
      videoData?.processing_status === 'pending',
    onCheckPollingFinished: (data) => {
      if (
        data.taskStatus !== 'TASK_STATUS_PROCESSING' &&
        data.taskStatus !== 'TASK_STATUS_QUEUED'
      ) {
        setVideoData((prev) =>
          prev
            ? {
                ...prev,
                video_url:
                  data.videos && data.videos.length > 0
                    ? data.videos[0].video_url
                    : prev.video_url,
                processing_status: data.taskStatus,
              }
            : prev,
        );
        return true;
      } else {
        setGenerationProgress(data.progressPercent);
      }

      return false;
    },
  });

  // ChatSidebar handlers
  const handleNewChat = () => {
    setCurrentChatId(null);
    router.push('/video');
  };

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    router.push(`/video/${chatId}`);
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      const res = await fetch(`/api/deletevideo?id=${chatId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete chat');
      setChatHistory((prev) => prev.filter((chat) => chat.id !== chatId));
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        router.push('/video');
      }
    } catch (err) {
      console.error('Delete chat error:', err);
    }
  };

  return (
    <>
      <AiHistoryPortal>
        <ChatSidebar
          chats={chatHistory}
          currentChatId={currentChatId}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
        />
      </AiHistoryPortal>

      <MainAiSection>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : !videoData ? (
          <div>No video data found.</div>
        ) : videoData.processing_status === 'TASK_STATUS_PROCESSING' ||
          videoData.processing_status === 'pending' ||
          videoData.processing_status === 'TASK_STATUS_QUEUED' ? (
          <div className="flex-grow flex flex-col items-center justify-center bg-white p-4 relative">
            <LoadingBar
              progress={generationProgress}
              message={'Generating your video'}
            />
          </div>
        ) : (
          <div className="flex justify-center items-center w-full h-full py-8">
            <video
              src={videoData.video_url}
              controls
              className="max-w-3xl w-full h-auto rounded shadow-lg object-contain"
            />
          </div>
        )}
      </MainAiSection>

      <RightAiSidebar isImageInput={true}>
        <div className="h-full flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex flex-col">
              <div className="text-gray-600 mb-2">Image</div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center h-40">
                {imagePreview ? (
                  <div className="w-full h-full">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 text-center">
                    No image available
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col">
              <div className="text-gray-600 mb-2">Seed (Optional)</div>
              <input
                type="text"
                value={seed}
                readOnly
                className="border border-gray-200 rounded-lg p-3 w-full bg-gray-100"
              />
            </div>
            <div className="flex flex-col">
              <div className="text-gray-600 mb-2">Model Type</div>
              <select
                value={model}
                disabled
                className="border border-gray-200 rounded-lg p-3 w-full bg-gray-100"
              >
                <option value="SVD-XT">SVD-XT (4s) - $0.20</option>
                <option value="SVD">SVD (2s) - $0.15</option>
              </select>
            </div>
            <div className="flex flex-col">
              <div className="text-gray-600 mb-2">Title</div>
              <input
                type="text"
                value={title}
                readOnly
                className="border border-gray-200 rounded-lg p-3 w-full bg-gray-100"
              />
            </div>
          </div>
          <button
            onClick={() => router.push('/video')}
            className="mt-6 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Generate new video
          </button>
        </div>
      </RightAiSidebar>
    </>
  );
}
