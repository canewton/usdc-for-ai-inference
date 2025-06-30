'use client';

import { useParams } from 'next/navigation';
import React from 'react';

import { Model3dGenerator } from '@/components/ai/3d-generation/model-3d-generator';

export default function Generate3DModelPage() {
  const { id } = useParams() as { id: string };
  return <Model3dGenerator curr3dModel={id} />;
}
