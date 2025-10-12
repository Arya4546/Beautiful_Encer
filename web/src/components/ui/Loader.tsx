/**
 * Professional Loader Component
 * Reusable loading spinner used across the application
 */

import React from 'react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullScreen?: boolean;
  message?: string;
}

export const Loader: React.FC<LoaderProps> = ({ 
  size = 'md', 
  fullScreen = false,
  message 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
    xl: 'w-24 h-24 border-4',
  };

  const loader = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        {/* Outer spinning ring */}
        <div
          className={`${sizeClasses[size]} rounded-full border-gray-200 border-t-magenta animate-spin`}
        ></div>
        {/* Inner pulsing dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`${size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-6 h-6'} bg-magenta rounded-full animate-pulse`}></div>
        </div>
      </div>
      {message && (
        <p className="text-sm text-text-secondary font-medium animate-pulse">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-large p-8 border border-border">
          {loader}
        </div>
      </div>
    );
  }

  return loader;
};

// Page Loader - For full page loading states
export const PageLoader: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader size="lg" message={message} />
  </div>
);

// Button Loader - For loading states in buttons
export const ButtonLoader: React.FC = () => (
  <div className="inline-flex items-center gap-2">
    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
  </div>
);
