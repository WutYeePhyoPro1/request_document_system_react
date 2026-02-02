import React from 'react';
import { DocumentIcon } from '@heroicons/react/24/solid';

const styles = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  .animate-fade-in { animation: fadeIn 0.6s ease-out; }
  .animate-float { animation: float 3s ease-in-out infinite; }
  .animate-pulse-slow { animation: pulse 2s ease-in-out infinite; }
`;

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
    <style>{styles}</style>
    
    <div className="relative mb-6">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-32 h-32 bg-blue-100 rounded-full animate-pulse-slow" />
      </div>
      <div className="relative animate-float">
        <DocumentIcon className="w-24 h-24 text-blue-400" />
      </div>
      <div className="absolute top-0 left-0 w-full h-full">
        {[0, 0.5, 1, 1.5].map((delay, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 bg-blue-300 rounded-full animate-pulse-slow ${
              i === 0 ? 'top-4 left-8' : i === 1 ? 'top-12 right-12' : i === 2 ? 'bottom-8 left-12' : 'bottom-4 right-8'
            }`}
            style={{ animationDelay: `${delay}s` }}
          />
        ))}
      </div>
    </div>
    
    <div className="text-center space-y-2">
      <h3 className="text-xl font-semibold text-gray-700">No Data Available</h3>
      <p className="text-sm text-gray-500 max-w-md">
        There are no damage issue records to display at the moment.
      </p>
    </div>
    
    <div className="mt-8 flex space-x-2">
      {[0, 0.3, 0.6].map((delay, i) => (
        <div
          key={i}
          className="w-2 h-2 bg-blue-400 rounded-full animate-pulse-slow"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </div>
  </div>
);

export default EmptyState;

