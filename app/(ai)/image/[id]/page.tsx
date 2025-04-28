'use client';
import { useParams } from 'next/navigation';

import { ImageChat } from '@/components/image-chat';

export default function ChatPage() {
  const params = useParams();
  const id = params.id?.toString();
  return <ImageChat currChat={id || ''} />;
}
