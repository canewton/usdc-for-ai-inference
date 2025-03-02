'use client';
import { useParams } from 'next/navigation';

import Chat from '../../chat/page';

export default function ChatPage() {
  const params = useParams();
  const id = params.id?.toString();
  return <Chat currChat={id || ''} />;
}
