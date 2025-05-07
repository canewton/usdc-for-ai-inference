'use client';

import { useParams } from 'next/navigation';
import React from 'react';

import { VideoGenerator } from '@/components/video-generator';

export default function VideoPage() {
  const { id } = useParams() as { id: string };
  return <VideoGenerator currVideo={id} />;
}
