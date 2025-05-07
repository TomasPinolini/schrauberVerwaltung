import React from 'react';

const LoadingSpinner = ({ size = 'medium', message = 'Daten werden geladen...' }) => {
  const sizeClasses = {
    small: 'h-6 w-6 border-2',
    medium: 'h-10 w-10 border-3',
    large: 'h-16 w-16 border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div 
        className={`${sizeClasses[size]} rounded-full border-t-blue-500 border-r-blue-500 border-b-gray-200 border-l-gray-200 animate-spin`}
      />
      {message && <p className="mt-3 text-gray-600">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
