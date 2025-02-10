"use client";

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function ImagePage() {
  const supabase = createClient();

  const { imageid } = useParams();  
  const [imageData, setImageData] = useState<{ id: string; url: string; prompt: string; created_at: string }>({id: "", url: "", prompt: "", created_at: ""});
  const [session, setSession] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Get session
  useEffect(() => {
    const fetchSession = async () => {
      const { data: session } = await (await supabase).auth.getSession();
      setSession(session.session?.access_token || '');
    };
    fetchSession();
  }, []);

  // Fetch image
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch(`/api/getgeneratedimages?imageids=${imageid}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session}`,
          }
        });
        const data = await response.json();

        // Check if the response is successful
        if (response.ok) {
          setImageUrl(data.images[0].url);
        } else {
          console.error('Error fetching images:', data.error);
        }
      } catch (error) {
        console.error('Error fetching images:', error);
      }
    };
    if (session && imageid) {
      fetchImages();
    }
  }, [session]);

  if (!imageData) return <div>Loading...</div>;

  return (
    <div>
      <h1>{imageData.prompt}</h1>
      {imageUrl && <img src={imageData.url} alt={imageData.prompt} />}
    </div>
  );
};