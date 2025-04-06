'use client';

import { type FunctionComponent } from 'react';

import { ScanIcon } from '@/app/icons/ScanIcon';
import { Button } from '@/components/ui/button';

export const ScanButton: FunctionComponent = ({}) => {
  return (
    <Button className="flex items-center gap-2 bg-white hover:bg-gray-50 text-blue-500 rounded-lg transition-colors border border-gray-200">
      <ScanIcon />
      Scan to Deposit
    </Button>
  );
};
