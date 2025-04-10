'use client';
import { useSession } from '@/app/contexts/SessionContext';

export default function ImageToVideoPage() {
  const session = useSession();

  return (
    <>
      <div className={`${!session.api_key_status.video ? 'flex flex-row items-center justify-center text-white overlay fixed inset-0 bg-gray-800 bg-opacity-80 z-50 pointer-events-auto' : 'hidden'}`}>
        This page is not available during the hosted demo.
      </div>
    </>
  )
}