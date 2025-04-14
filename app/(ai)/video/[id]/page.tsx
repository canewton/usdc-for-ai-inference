'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { useSession } from '@/app/contexts/SessionContext';
import AiHistoryPortal from '@/components/AiHistoryPortal';
import MainAiSection from '@/components/MainAiSection';
import RightAiSidebar from '@/components/RightAiSidebar';
import VideoHistory from '@/components/VideoHistory';

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
  const session = useSession();
  const sessionToken = session?.access_token;

  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [model, setModel] = useState('SVD-XT');
  const [title, setTitle] = useState('');
  const [seed, setSeed] = useState('-1');

  useEffect(() => {
    if (!sessionToken) return;
    const fetchVideoData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/getvideochat', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionToken}`,
          },
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
  }, [id, sessionToken]);

  useEffect(() => {
    if (!videoData || !sessionToken) return;
    if (videoData.processing_status !== 'TASK_STATUS_PROCESSING') return;
    const pollStatus = async () => {
      try {
        const response = await fetch('/api/checkvideostatus', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({ task_id: videoData.task_id }),
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to check video status');
        }
        const data = await response.json();
        if (data.taskStatus === 'TASK_STATUS_PROCESSING') {
          setTimeout(pollStatus, 5000);
        } else {
          if (data.videos && data.videos.length > 0) {
            setVideoData((prev) =>
              prev
                ? {
                    ...prev,
                    video_url: data.videos[0].video_url,
                    processing_status: data.taskStatus,
                  }
                : prev,
            );
          } else {
            setVideoData((prev) =>
              prev ? { ...prev, processing_status: data.taskStatus } : prev,
            );
          }
        }
      } catch (err: any) {
        console.error('Error polling video status:', err);
      }
    };
    pollStatus();
  }, [videoData, sessionToken]);

  return (
    <>
      <AiHistoryPortal>
        <VideoHistory />
      </AiHistoryPortal>
      <MainAiSection>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : !videoData ? (
          <div>No video data found.</div>
        ) : videoData.processing_status === 'TASK_STATUS_PROCESSING' ||
          videoData.processing_status === 'pending' ? (
          <div className="flex flex-col items-center justify-center w-full h-full py-8">
            <div className="bg-white border border-gray-200 shadow-md rounded-lg p-6 max-w-lg text-center">
              <p className="text-xl font-semibold mb-4">
                Generating your video...
              </p>
              <p className="text-gray-600 text-sm">
                Did you know USDC transactions can settle in seconds worldwide.
                All day, every day.
              </p>
            </div>
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
