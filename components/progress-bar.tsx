import React from 'react';

interface ProgressBarProps {
  progress: number;
  height?: number;
  color?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  color = 'indigo',
}) => {
  // Ensure progress is between 0 and 100
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  const colorClasses = {
    indigo: 'from-indigo-200 to-indigo-500',
    blue: 'from-blue-200 to-blue-500',
    purple: 'from-purple-200 to-purple-500',
    pink: 'from-pink-200 to-pink-500',
    green: 'from-green-200 to-green-500',
  };

  const colorClass =
    colorClasses[color as keyof typeof colorClasses] || colorClasses.indigo;

  return (
    <div className="w-full">
      <div
        className="w-full bg-gray-200 rounded-full overflow-hidden"
        style={{ height: `${height}px` }}
      >
        <div
          className={`h-full bg-gradient-to-r ${colorClass} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
