'use client';
import { useParams } from 'next/navigation';

import { TextChat } from '@/components/ai/common/text-chat';

export default function ChatPage() {
  const params = useParams();
  const id = params.id?.toString();
  return <TextChat currChat={id || ''} />;
}
