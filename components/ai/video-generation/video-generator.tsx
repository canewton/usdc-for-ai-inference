'use client';

import { Link } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { useSession } from '@/app/contexts/SessionContext';
import { usePolling } from '@/app/hooks/usePolling';
import { AiGenerationIntro } from '@/components/ai/common/ai-generation-intro';
import { AiHistoryPortal } from '@/components/ai/common/ai-history-portal';
import { ChatSidebar } from '@/components/ai/common/chat-sidebar';
import { ImageUploader } from '@/components/ai/common/image-uploader';
import { LoadingBar } from '@/components/ai/common/loading-bar';
import { MainAiSection } from '@/components/ai/common/main-ai-section';
import { RightAiSidebar } from '@/components/ai/common/right-ai-sidebar';
import { Spinner } from '@/components/common/spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Chat, VideoGeneration } from '@/types/database.types';
import { VIDEO_MODEL_PRICING } from '@/utils/constants';

interface VideoGeneratorProps {
  currVideo: string;
}

export const VideoGenerator = ({ currVideo }: VideoGeneratorProps) => {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [model, setModel] = useState('SVD-XT');
  const [loading, setLoading] = useState(false);
  const [seed, setSeed] = useState('-1');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSeedInfo, setShowSeedInfo] = useState(false);

  const [chatHistory, setChatHistory] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(
    currVideo || null,
  );
  const [imageWidth, setImageWidth] = useState<number>(0);
  const [imageHeight, setImageHeight] = useState<number>(0);

  const [title, setTitle] = useState('');
  const [videoData, setVideoData] = useState<VideoGeneration | null>(null);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const isInputDisabled = currVideo !== '' && currVideo !== null;

  const router = useRouter();
  const session = useSession();

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const response = await fetch('/api/video-generation', {
          method: 'GET',
        });
        if (!response.ok) throw new Error('Failed to fetch chat history');
        const data = await response.json();
        session.setVideoGenerations(data);
      } catch (err) {
        toast.error('Error fetching chat history.');
        console.error('Chat history error:', err);
      }
    };

    fetchChatHistory();
  }, []);

  useEffect(() => {
    const formatted: Chat[] = (session.videoGenerations || []).map(
      (item: any) => ({
        id: item.id,
        title: item.prompt || 'Untitled',
        created_at: item.created_at || new Date().toISOString(),
        user_id: item.user_id || '',
      }),
    );
    setChatHistory(formatted);
  }, [session.videoGenerations]);

  useEffect(() => {
    const fetchVideoData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/video-generation/${currVideo}`, {
          method: 'GET',
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to load video data');
        }
        const data: VideoGeneration = await response.json();
        setVideoData(data);
        setModel(data.model_name);
        setTitle(data.prompt);
        setSeed(data.seed.toString());
        setImagePreview(data.prompt_image_path);
      } catch (err: any) {
        toast.error('Error fetching video data.');
      } finally {
        setLoading(false);
      }
    };

    if (currVideo) {
      fetchVideoData();
    }
  }, [currVideo]);

  usePolling({
    url: '/api/video-generation/generation-status',
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

  const handleNewChat = () => {
    setCurrentChatId(null);
    router.push('/video');
  };

  const handleSelectChat = (id: string) => {
    setCurrentChatId(id);
    router.push(`/video/${id}`);
  };

  const handleDeleteChat = async (id: string) => {
    try {
      const res = await fetch(`/api/video-generation/delete/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete chat');
      setChatHistory((prev) => prev.filter((chat) => chat.id !== id));
      if (currentChatId === id) {
        setCurrentChatId(null);
        router.push('/video');
      }
    } catch (err) {
      console.error('Delete chat error:', err);
    }
  };

  const handleImageUpload = (
    file: File,
    imageWidth: number,
    imageHeight: number,
  ) => {
    setImageHeight(imageHeight);
    setImageWidth(imageWidth);
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateVideo = async () => {
    if (!image || imageWidth === 0 || imageHeight === 0) {
      toast.error('Please upload an image.');
      return;
    }
    setLoading(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(image);
      reader.onloadend = async () => {
        const base64Image = reader.result?.toString().split(',')[1];

        const response = await fetch('./api/video-generation/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model_name: model,
            image_file: base64Image,
            seed:
              seed === '-1'
                ? Math.floor(Math.random() * 10000)
                : parseInt(seed),
            prompt: title,
            image_file_resize_mode:
              imageWidth <= 1024 && imageHeight <= 576
                ? 'ORIGINAL_RESOLUTION'
                : 'CROP_TO_ASPECT_RATIO',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate video');
        }

        const data = await response.json();
        router.push(`/video/${data.id}`);
      };
    } catch (error: any) {
      setLoading(false);
      toast.error(
        'Error generating video. This AI model may be unable to process your uploaded image.',
      );
    }
  };

  return (
    <>
      <div
        className={`${!session.apiKeyStatus.video ? 'flex flex-row items-center justify-center text-white overlay fixed inset-0 bg-gray-800 bg-opacity-80 z-50 pointer-events-auto' : 'hidden'}`}
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

      {/* Left history section */}
      <AiHistoryPortal>
        <ChatSidebar
          chats={chatHistory}
          currentChatId={currentChatId}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
        />
      </AiHistoryPortal>

      {/* Middle section */}
      {!currVideo || currVideo == '' ? (
        <MainAiSection>
          <AiGenerationIntro
            title="What will you create?"
            description="Generate videos from your own images"
          />
        </MainAiSection>
      ) : (
        <MainAiSection>
          {loading ? (
            <Spinner />
          ) : !videoData ? (
            <div>No video data found.</div>
          ) : videoData.processing_status === 'TASK_STATUS_PROCESSING' ||
            videoData.processing_status === 'pending' ||
            videoData.processing_status === 'TASK_STATUS_QUEUED' ? (
            <div className="flex-grow flex flex-col items-center justify-center bg-white p-4 relative">
              <LoadingBar
                progress={
                  generationProgress == 0 &&
                  videoData.processing_status === 'TASK_STATUS_PROCESSING'
                    ? 1
                    : generationProgress
                }
                message={'Generating your video'}
              />
            </div>
          ) : (
            <div className="flex justify-center items-center w-full h-full py-8">
              <video
                src={videoData.video_url ?? ''}
                controls
                className="max-w-3xl w-full h-auto rounded shadow-lg object-contain"
              />
            </div>
          )}
        </MainAiSection>
      )}

      {/* Right section with settings */}
      <RightAiSidebar isImageInput={true}>
        <div className="space-y-4 w-full">
          <div>
            <label className="block text-sm text-gray-500 mb-1">Image</label>
            <ImageUploader
              inputRef={fileInputRef}
              preview={imagePreview}
              setPreview={setImagePreview}
              maxSizeMB={20}
              onImageUpload={handleImageUpload}
              isDisabled={isInputDisabled}
            />
          </div>

          <div className="relative">
            <div
              className="text-gray-500 flex items-center"
              onMouseEnter={() => setShowSeedInfo(true)}
              onMouseLeave={() => setShowSeedInfo(false)}
            >
              <label className="block text-sm text-gray-500 mb-1">
                Seed (Optional)
              </label>
              <div className="ml-1 text-gray-400 cursor-help">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>

            {showSeedInfo && (
              <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-[60] p-4">
                <p className="text-sm text-gray-600">
                  A <span className="text-blue-500 font-medium">seed</span> is a
                  number that makes AI-generated images repeatable—using the
                  same seed and settings will always create the same image.
                </p>
              </div>
            )}

            <Input
              type="text"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              className="border border-gray-200 rounded-lg p-3 w-full pr-10"
              placeholder="-1"
              disabled={isInputDisabled}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">
              Model Type
            </label>
            <select
              className="w-full p-2 border rounded-md text-gray-700 bg-white appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={{
                borderColor: '#E5E7EB',
                fontSize: '14px',
                color: '#374151',
                paddingRight: '2.5rem',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23374151' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.2rem',
              }}
              disabled={isInputDisabled}
              onChange={(e) => setModel(e.target.value)}
            >
              <option value="SVD-XT">
                SVD-XT (4s) - $
                {VIDEO_MODEL_PRICING['SVD-XT'].userBilledPrice.toFixed(2)}
              </option>
              <option value="SVD">
                SVD (2s) - $
                {VIDEO_MODEL_PRICING['SVD'].userBilledPrice.toFixed(2)}
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">Title</label>
            <div className="relative">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border border-gray-200 rounded-lg p-3 w-full"
                placeholder="Name your generation!"
                disabled={isInputDisabled}
              />
            </div>
          </div>

          <Button
            onClick={() => {
              if (session.demoLimit > 0 && (session.walletBalance ?? 0) > 0) {
                handleGenerateVideo();
              } else if (session.demoLimit <= 0) {
                toast.error('Demo limit reached.');
              } else if (
                (session.walletBalance ?? 0) -
                  (VIDEO_MODEL_PRICING[
                    model as keyof typeof VIDEO_MODEL_PRICING
                  ]?.userBilledPrice ?? 0) <
                0
              ) {
                toast.error('Insufficient wallet balance.');
              }
            }}
            className="w-full bg-gray-100 text-gray-700 py-2 rounded-full flex items-center justify-center space-x-2"
            disabled={isInputDisabled || !image || loading || !title}
          >
            <img className="w-6 h-6" alt="Generate" src="/spark-jelly.svg" />
            <span className="text-sm">
              {loading ? 'Generating...' : 'Generate your video'}
            </span>
          </Button>
        </div>
      </RightAiSidebar>
    </>
  );
};
