'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { useSession } from '@/app/contexts/SessionContext';
import AiHistoryPortal from '@/components/AiHistoryPortal';
import MainAiSection from '@/components/MainAiSection';
import RightAiSidebar from '@/components/RightAiSidebar';
import VideoHistory from '@/components/VideoHistory';

export default function VideoDetailPage() {
  const [loading, setLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoDetails, setVideoDetails] = useState<any>(null);

  const [prompt, setPrompt] = useState<string>('');
  const [modelName, setModelName] = useState<string>('');
  const [seed, setSeed] = useState<string>('');
  const [showSeedInfo, setShowSeedInfo] = useState(false);

  const params = useParams();
  const router = useRouter();
  const session = useSession();

  const videoId = typeof params?.id === 'string' ? params.id : '';

  if (!session) return null;
  const sessionToken = session.access_token;

  useEffect(() => {
    const fetchVideoDetails = async () => {
      if (!videoId || !sessionToken) {
        setError('Invalid video ID or missing authentication');
        setLoading(false);
        return;
      }

      try {
        console.log(`Fetching video details for ID: ${videoId}`);

        const response = await fetch(`/api/videos/${videoId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionToken}`,
          },
          // Ensure we're not using cached data
          cache: 'no-store',
        });

        if (!response.ok) {
          console.error(`API error: ${response.status} ${response.statusText}`);
          throw new Error(
            `Failed to fetch video details: ${response.statusText}`,
          );
        }

        const data = await response.json();
        console.log('Video details received:', data);

        if (data.error) {
          throw new Error(data.error);
        }

        // Set the video details
        setVideoDetails(data);
        setVideoUrl(data.video_url);
        setImagePreview(data.prompt_image_path);

        // Set the parameters from the video details
        setPrompt(data.prompt || '');
        setModelName(data.model_name || '');
        setSeed(data.seed ? data.seed.toString() : '-1');

        setLoading(false);
      } catch (error) {
        console.error('Error fetching video details:', error);
        setError(
          error instanceof Error
            ? error.message
            : 'Failed to load video details. Please try again.',
        );
        setLoading(false);
      }
    };

    fetchVideoDetails();
  }, [videoId, sessionToken]);

  const handleCreateNewVideo = () => {
    router.push('/video');
  };

  return (
    <>
      {/* Left history section */}
      <AiHistoryPortal>
        <VideoHistory />
      </AiHistoryPortal>

      {/* Middle section */}
      <MainAiSection>
        {loading ? (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md">
              <h2 className="text-xl font-medium mb-6">
                Loading your video details
              </h2>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                <div
                  className="bg-blue-500 h-2 rounded-full animate-pulse"
                  style={{ width: '50%' }}
                ></div>
              </div>
              <p className="text-gray-600 text-sm">
                Please wait while we fetch your video details...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="w-full h-full p-8 flex flex-col items-center justify-center">
            <h2 className="text-2xl font-semibold mb-4 text-red-500">Error</h2>
            <p className="text-gray-700 mb-6">{error}</p>
            <button
              onClick={handleCreateNewVideo}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Create New Video
            </button>
          </div>
        ) : videoUrl ? (
          <div className="w-full h-full p-8 flex flex-col items-center justify-center">
            <div className="w-full max-w-3xl">
              <div className="mb-8">
                <div className="relative">
                  <video
                    controls
                    autoPlay
                    loop
                    className="w-full rounded-xl shadow-lg max-h-[80vh] mx-auto"
                  >
                    <source src={videoUrl} type="video/mp4" />
                  </video>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full p-8 flex flex-col items-center justify-center text-center text-gray-500">
            <p>No video data available. Please try again.</p>
            <button
              onClick={handleCreateNewVideo}
              className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Create New Video
            </button>
          </div>
        )}
      </MainAiSection>

      {/* Right section with details */}
      <RightAiSidebar isImageInput={false}>
        <div className="space-y-6 w-full">
          {!loading && videoDetails && (
            <>
              {/* Image Preview */}
              {imagePreview && (
                <div className="flex flex-col mb-6">
                  <div className="text-gray-600 mb-2">Source Image</div>
                  <div className="border border-gray-200 rounded-lg p-3 bg-white">
                    <div className="rounded-lg overflow-hidden border border-gray-100">
                      <img
                        src={imagePreview}
                        alt="Source image"
                        className="w-full h-44 object-contain bg-gray-50"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Seed Parameter */}
              <div className="flex flex-col mb-4 relative">
                <div
                  className="text-gray-600 mb-2 flex items-center"
                  onMouseEnter={() => setShowSeedInfo(true)}
                  onMouseLeave={() => setShowSeedInfo(false)}
                >
                  <span>Seed (Optional)</span>
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
                  <div className="absolute top-0 left-0 transform -translate-x-[110%] -translate-y-1/4 bg-white rounded-lg shadow-lg p-3 border border-gray-200 z-10 w-64">
                    <div className="flex items-start">
                      <svg
                        className="w-5 h-5 text-blue-500 mr-2 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-sm text-gray-600">
                        A{' '}
                        <span className="text-blue-500 font-medium">seed</span>{' '}
                        is a number that makes AI-generated images
                        repeatable—using the same seed and settings will always
                        create the same image.
                      </p>
                    </div>
                  </div>
                )}

                <div className="relative">
                  <input
                    type="text"
                    value={seed}
                    disabled
                    className="border border-gray-200 rounded-lg p-3 w-full bg-gray-50 text-gray-700"
                    placeholder="-1"
                  />
                </div>
              </div>

              {/* Model Parameter */}
              <div className="flex flex-col mb-4">
                <div className="text-gray-600 mb-2">Model Type</div>
                <div className="relative">
                  <select
                    value={modelName}
                    disabled
                    className="border border-gray-200 rounded-lg p-3 w-full bg-gray-50 text-gray-700"
                  >
                    <option value={modelName}>{modelName}</option>
                  </select>
                </div>
              </div>

              {/* Title */}
              <div className="flex flex-col mb-4">
                <div className="text-gray-600 mb-2">Title</div>
                <div className="relative">
                  <input
                    value={prompt}
                    disabled
                    className="border border-gray-200 rounded-lg p-3 w-full bg-gray-50 text-gray-700 resize-y"
                    placeholder="No Title provided"
                  />
                </div>
              </div>
            </>
          )}

          <button
            onClick={handleCreateNewVideo}
            className="w-full py-3 rounded-lg flex justify-center items-center bg-blue-500 text-white hover:bg-blue-600 transition"
          >
            Create New Video
          </button>
        </div>
      </RightAiSidebar>
    </>
  );
}
