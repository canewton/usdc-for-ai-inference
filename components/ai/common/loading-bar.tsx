import React, { useEffect, useState } from 'react';

import ProgressBar from './progress-bar';

interface LoadingBarProps {
  progress?: number;
  message?: string;
}

export const LoadingBar: React.FC<LoadingBarProps> = ({
  progress = 0,
  message = 'Loading',
}) => {
  const [displayedProgress, setDisplayedProgress] = useState<number>(0);

  // Smoothly animate the progress
  useEffect(() => {
    const animationDuration = 800; // ms
    const steps = 20;
    const stepTime = animationDuration / steps;
    const increment = (progress - displayedProgress) / steps;

    if (Math.abs(progress - displayedProgress) < 1) {
      setDisplayedProgress(progress);
      return;
    }

    const timer = setInterval(() => {
      setDisplayedProgress((prev) => {
        const next = prev + increment;
        // Check if we're close enough to the target to just set it directly
        if (Math.abs(next - progress) < 1) {
          clearInterval(timer);
          return progress;
        }
        return next;
      });
    }, stepTime);

    return () => clearInterval(timer);
  }, [progress, displayedProgress]);

  return (
    <div className="w-full max-w-lg mx-auto my-8 px-4 sm:px-6">
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
        <div className="flex flex-col items-center text-center">
          <h2 className="text-2xl font-medium text-gray-700 mb-6">
            {message}...{Math.round(displayedProgress)}%
          </h2>

          <ProgressBar progress={displayedProgress} />

          <div className="mt-6 text-gray-500 text-center">
            <p className="transition-opacity duration-300">
              Did you know USDC transactions can settle in seconds worldwide.
              All day, every day.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
