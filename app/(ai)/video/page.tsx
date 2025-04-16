'use client';

import { Link } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useRef, useState } from 'react';

import { useSession } from '@/app/contexts/SessionContext';
import AiHistoryPortal from '@/components/AiHistoryPortal';
import MainAiSection from '@/components/MainAiSection';
import RightAiSidebar from '@/components/RightAiSidebar';
import VideoHistory from '@/components/VideoHistory';
import Blurs from '@/public/blurs.svg';

export default function Home() {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [model, setModel] = useState('SVD-XT');
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [seed, setSeed] = useState('-1');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSeedInfo, setShowSeedInfo] = useState(false);

  const router = useRouter();
  const session = useSession();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleGenerateVideo = async () => {
    if (!image) {
      alert('Please upload an image.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(image);
      reader.onloadend = async () => {
        const base64Image = reader.result?.toString().split(',')[1];

        const response = await fetch('./api/generatevideo', {
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
            prompt: prompt,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate video');
        }

        const responseData = await response.json();
        const { task_id } = responseData;

        // Redirect to the new video details page
        router.push(`/video/${task_id}`);
      };
    } catch (error: any) {
      console.error('Error:', error);
      setLoading(false);
      setError(
        error.message ||
          'Failed to process payment or generate video. Please try again.',
      );
    }
  };

  return (
    <>
      <div
        className={`${!session.api_keys.video ? 'flex flex-row items-center justify-center text-white overlay fixed inset-0 bg-gray-800 bg-opacity-80 z-50 pointer-events-auto' : 'hidden'}`}
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
        <VideoHistory />
      </AiHistoryPortal>

      {/* Middle section */}
      <MainAiSection>
        {/* Home page content */}
        <div className="relative w-full h-full">
          <img
            src={Blurs.src}
            alt="blur background"
            className="w-1/2 object-contain mx-auto"
          />
          <div className="inset-0 flex items-center justify-center absolute">
            <div className="flex flex-col items-center justify-center w-1/2 text-center">
              <h1 className="text-5xl text-body mb-2">What will you create?</h1>
              <p className="text-lg text-gray-600">
                Generate videos from your own images
              </p>
            </div>
          </div>
        </div>
      </MainAiSection>

      {/* Right section with settings */}
      <RightAiSidebar isImageInput={true}>
        <div className="space-y-6 w-full">
          <div className="flex flex-col mb-6">
            <div className="text-gray-600 mb-2">Image</div>
            <div
              onClick={handleImageClick}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center h-40 cursor-pointer hover:border-blue-500 transition-colors"
            >
              {imagePreview ? (
                <div className="relative w-full h-full">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage();
                    }}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 text-xs"
                  >
                    X
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500 text-center">
                    Click or drag to upload image
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Supported files: png, jpg, jpeg
                  </p>
                  <p className="text-xs text-gray-400">Max size: 20MB</p>
                </>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

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
                    A <span className="text-blue-500 font-medium">seed</span> is
                    a number that makes AI-generated images repeatable—using the
                    same seed and settings will always create the same image.
                  </p>
                </div>
              </div>
            )}

            <div className="relative">
              <input
                type="text"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                className="border border-gray-200 rounded-lg p-3 w-full pr-10"
                placeholder="-1"
              />
            </div>
          </div>

          <div className="flex flex-col mb-4">
            <div className="text-gray-600 mb-2">Model Type</div>
            <div className="relative">
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="border border-gray-200 rounded-lg p-3 w-full"
              >
                <option value="SVD-XT">SVD-XT (4s) - $0.20</option>
                <option value="SVD">SVD (2s) - $0.15</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col mb-6">
            <div className="text-gray-600 mb-2">Title</div>
            <div className="relative">
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="border border-gray-200 rounded-lg p-3 w-full"
                placeholder="Name your generation!"
              />
            </div>
          </div>

          <button
            onClick={handleGenerateVideo}
            disabled={!image || loading}
            className={`w-full py-3 rounded-lg flex justify-center items-center space-x-2 ${
              !image || loading
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              <>
                <div className="w-6 h-6 relative rounded-full flex items-center justify-center">
                  <Image
                    src="/spark.svg"
                    alt="Circle USDC"
                    width={30}
                    height={30}
                  />
                </div>
                <span>Generate your video</span>
              </>
            )}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}
        </div>
      </RightAiSidebar>
    </>
  );
}
