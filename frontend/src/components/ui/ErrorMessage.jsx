import React from 'react';

const ErrorMessage = ({ 
  message = 'Ein Fehler ist aufgetreten.', 
  details = null,
  onRetry = null 
}) => {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
      <h3 className="font-bold mb-2">Fehler</h3>
      <p className="mb-2">{message}</p>
      
      {details && (
        <div className="mt-2 p-2 bg-red-100 rounded text-sm overflow-auto max-h-32">
          <pre>{details}</pre>
        </div>
      )}
      
      {onRetry && (
        <button 
          onClick={onRetry} 
          className="mt-3 px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
        >
          Erneut versuchen
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
