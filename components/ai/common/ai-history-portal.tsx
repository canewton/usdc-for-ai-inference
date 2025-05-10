'use client';
import type React from 'react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface AiHistoryPortalProps {
  children: React.ReactNode;
}

export function AiHistoryPortal({ children }: AiHistoryPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Client-side only
  if (!mounted) return null;

  const sidebarSlot = document.getElementById('ai-history');
  if (!sidebarSlot) return null;

  return createPortal(children, sidebarSlot);
}
