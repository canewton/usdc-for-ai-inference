"use client";

import React, { useState, useRef } from 'react';
import axios from 'axios';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(2);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [modelType, setModelType] = useState('SVD-XT');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const NOVITA_API_KEY = process.env.NEXT_PUBLIC_NOVITA_API_KEY;
  
  const modelOptions = ['SVD-XT', 'SVD'];

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
    setVideoUrl(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(image);
      reader.onloadend = async () => {
        const base64Image = reader.result?.toString().split(',')[1];

        
        const framesNum = Math.round(duration * 6);

        const response = await axios.post(
          'https://api.novita.ai/v3/async/img2video',
          {
            model_name: modelType,
            image_file: base64Image,
            frames_num: modelType === 'SVD-XT' ? 25 : 14,
            frames_per_second: 6,
            image_file_resize_mode: 'ORIGINAL_RESOLUTION',
            steps: 20,
            seed: Math.floor(Math.random() * 10000),
            motion_bucket_id: 1,
            cond_aug: 1,
            enable_frame_interpolation: true,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${NOVITA_API_KEY}`,
            },
          }
        );

        const { task_id } = response.data;
        checkVideoStatus(task_id);
      };
    } catch (error) {
      console.error('Error generating video:', error);
      setLoading(false);
    }
  };

  const checkVideoStatus = async (taskId: string) => {
    try {
      const interval = setInterval(async () => {
        const result = await axios.get(
          `https://api.novita.ai/v3/async/task-result?task_id=${taskId}`,
          {
            headers: {
              Authorization: `Bearer ${NOVITA_API_KEY}`,
            },
          }
        );

        console.log('Task result:', result.data);
        
        // Extract the nested status from the task object
        const taskStatus = result.data.task?.status;
        const videos = result.data.videos || [];
        
        if (taskStatus === 'TASK_STATUS_SUCCEED' && videos.length > 0) {
          setVideoUrl(videos[0].video_url);
          setLoading(false);
          clearInterval(interval);
        } else if (taskStatus === 'TASK_STATUS_FAILED') {
          console.error('Video generation failed.');
          setLoading(false);
          clearInterval(interval);
        }
      }, 5000);
    } catch (error) {
      console.error('Error checking video status:', error);
      setLoading(false);
    }
  };

  const renderMainContent = () => {
    if (loading) {
      return (
        <div className="w-full flex flex-col items-center justify-center">
          <h2 className="text-xl font-semibold mb-4">Generating Your Video</h2>
          <div className="w-full max-w-sm mb-6">
            {imagePreview && (
              <div className="relative rounded-md overflow-hidden mb-4">
                <img 
                  src={imagePreview} 
                  alt="Source" 
                  className="w-full object-contain max-h-64" 
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              </div>
            )}
          </div>
          <p className="text-gray-500">This may take a minute or two...</p>
        </div>
      );
    }
    
    if (videoUrl) {
      return (
        <div className="w-full">
          <h2 className="text-xl font-semibold mb-4">Your Generated Video</h2>
          <div className="mb-6">
            <video controls autoPlay loop className="w-full rounded-md max-h-96 mx-auto">
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          <button 
            onClick={() => setVideoUrl(null)} 
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 mb-6"
          >
            Create Another Video
          </button>
        </div>
      );
    }
    
    return (
      <>
        <h1 className="text-2xl font-medium mb-2">What will you create?</h1>
        <p className="text-gray-500 mb-6">
          Generate videos from your own images
        </p>

        <div className="w-full grid grid-cols-2 gap-4 mb-4">
          <button className="p-4 border border-gray-200 rounded-md text-sm flex flex-col items-center hover:bg-gray-50">
            Create a video of a wallet
          </button>
          <button className="p-4 border border-gray-200 rounded-md text-sm flex flex-col items-center hover:bg-gray-50">
            Create a video explaining USDC
          </button>
        </div>

        <button className="w-full p-4 border border-gray-200 rounded-md text-sm mb-12 hover:bg-gray-50">
          Surprise me
        </button>
      </>
    );
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 p-8 flex">
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto">
          {renderMainContent()}
        </div>

        <div className="w-64 border-l border-gray-200 p-4">
          <input
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageUpload}
          />
          <div
            className="border border-gray-200 rounded-md h-32 mb-4 flex items-center justify-center text-sm text-gray-400 cursor-pointer overflow-hidden relative"
            onClick={handleImageClick}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {imagePreview ? (
              <>
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage();
                  }}
                >
                  ×
                </button>
              </>
            ) : (
              <span>Image</span>
            )}
          </div>
          <div className="text-center text-sm mb-6">
            <p>Click or drag to upload image</p>
            <p className="text-xs text-gray-400">Supported file types: jpg, png</p>
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700">Model Type</label>
            <div className="relative">
              <button
                className="w-full p-2 border border-gray-200 rounded-md text-left flex justify-between"
                onClick={() => setShowModelDropdown(!showModelDropdown)}
              >
                {modelType}
                <span className="ml-2">&#9660;</span>
              </button>
              {showModelDropdown && (
                <ul className="absolute w-full bg-white border border-gray-200 mt-1 rounded-md shadow-md z-10">
                  {modelOptions.map((option) => (
                    <li
                      key={option}
                      className="p-2 hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setModelType(option);
                        setShowModelDropdown(false);
                      }}
                    >
                      {option}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Duration: {duration} seconds
            </label>
            <input
              type="range"
              min="1"
              max="5"
              step="0.5"
              value={duration}
              onChange={(e) => setDuration(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <button
            className="w-full p-4 bg-blue-500 text-white rounded-md mb-6 hover:bg-blue-600"
            onClick={handleGenerateVideo}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Video'}
          </button>
        </div>
      </div>
    </div>
  );
}