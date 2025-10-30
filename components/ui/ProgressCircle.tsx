import React from 'react';

interface ProgressCircleProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

const ProgressCircle: React.FC<ProgressCircleProps> = ({ percentage, size = 32, strokeWidth = 4 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const getProgressColor = () => {
    if (percentage < 40) return 'text-red-500';
    if (percentage < 80) return 'text-yellow-500';
    return 'text-green-500';
  };

  const colorClass = getProgressColor();

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="absolute" width={size} height={size}>
        <circle
          className="text-gray-200 dark:text-gray-600"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`transform -rotate-90 origin-center transition-all duration-500 ${colorClass}`}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <span className="absolute text-xs font-medium text-gray-700 dark:text-gray-200">
        {`${Math.round(percentage)}%`}
      </span>
    </div>
  );
};

export default ProgressCircle;
