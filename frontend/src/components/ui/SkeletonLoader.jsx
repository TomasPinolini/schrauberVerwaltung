import React from 'react';

const SkeletonLoader = ({ rows = 5, showHeader = true }) => {
  return (
    <div className="animate-pulse">
      {showHeader && (
        <div className="flex space-x-4 mb-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        </div>
      )}
      
      <div className="border rounded overflow-hidden">
        {showHeader && (
          <div className="flex bg-gray-100 p-3">
            <div className="h-4 bg-gray-300 rounded w-1/12 mr-2"></div>
            <div className="h-4 bg-gray-300 rounded w-1/6 mr-2"></div>
            <div className="h-4 bg-gray-300 rounded w-1/4 mr-2"></div>
            <div className="h-4 bg-gray-300 rounded w-1/5 mr-2"></div>
            <div className="h-4 bg-gray-300 rounded w-1/6"></div>
          </div>
        )}
        
        {Array(rows).fill().map((_, i) => (
          <div key={i} className="flex p-3 border-t">
            <div className="h-4 bg-gray-200 rounded w-1/12 mr-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/6 mr-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mr-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/5 mr-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/6"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkeletonLoader;
