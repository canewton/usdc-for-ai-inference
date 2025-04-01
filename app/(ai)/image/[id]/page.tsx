'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useSession } from '@/app/contexts/SessionContext';
import { Spinner } from '@/components/Spinner';

export default function ImagePage() {
  const params = useParams();
  const imageid = params.id;
  const [imageData, setImageData] = useState<{
    id: string;
    url: string;
    prompt: string;
    created_at: string;
  }>({ id: '', url: '', prompt: '', created_at: '' });
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const session = useSession();

  useEffect(() => {
    const getImage = async () => {
      if (!session) return;
      const sessionToken = session.access_token;
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/getgeneratedimages?imageids=${encodeURIComponent(JSON.stringify([imageid]))}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${sessionToken}`,
            },
          },
        );
        const data = await response.json();

        // Check if the response is successful
        if (response.ok) {
          setImageData(data.images[0]);
        } else {
          console.error('Error fetching images:', data.error);
        }
      } catch (error) {
        console.error('Error fetching images:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getImage();
  }, [imageid]);

  const handleDownload = async () => {
    if (imageData) {
      try {
        setIsDownloading(true);
        const response = await fetch(imageData.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${imageData.prompt}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error downloading image:', error);
      } finally {
        setIsDownloading(false);
      }
    }
  };

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div>
      <h1>{imageData.prompt}</h1>
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className="border border-white m-1 p-1 rounded"
      >
        Download
      </button>
      {imageData && (
        <img src={imageData.url || undefined} alt={imageData.prompt} />
      )}
    </div>
  );
}
