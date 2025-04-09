'use client';
import * as React from 'react';

export type TimePeriod = '1D' | '7D' | '1M' | '3M' | '1Y';

interface Props {
  periods?: TimePeriod[];
  selectedPeriod: TimePeriod;
  setSelectedPeriod: (period: TimePeriod) => void;
}

export const TimePeriodOptions = ({
  periods = ['1D', '7D', '1M', '3M', '1Y'],
  selectedPeriod,
  setSelectedPeriod,
}: Props) => {
  return (
    <div className="flex gap-2 bg-white rounded-md p-2 border border-gray-200">
      {periods.map((period) => (
        <button
          key={period}
          onClick={() => setSelectedPeriod(period)}
          className={`px-3 py-1 rounded-md text-sm transition-colors ${
            period === selectedPeriod
              ? 'bg-blue-100 text-blue-600'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {period}
        </button>
      ))}
    </div>
  );
};
