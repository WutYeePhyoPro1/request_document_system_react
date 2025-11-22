import React, { useState } from 'react';
import { Hash, Search } from 'lucide-react';


export default function AddDamageItem({ onSearch, branchName, isSearching }) {
  const [productCode, setProductCode] = useState('');
  const [selectedCase, setSelectedCase] = useState('Other income sell');
  
  const INPUT_TEXT_SIZE = { fontSize: '0.8rem' };
  
  const INPUT_CONTROL_BASE = `w-full p-2 border border-gray-300 focus:ring-blue-500 focus:border-blue-500`;
  const SELECT_CONTROL_BASE = `w-full p-2 border border-gray-300 rounded-md appearance-none bg-white pr-8 focus:ring-blue-500 focus:border-blue-500`;

  const caseOptions = [
    'Other income sell',
    'Not sell'
  ];

  const handleSearch = () => {
    if (onSearch) {
      onSearch(productCode, selectedCase);
    }
  };

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm m-2 sm:m-4">
      
      <div className="flex items-center space-x-2 mb-4">
        <Hash className="w-5 h-5 text-blue-500 bg-blue-200 p-0.5 rounded-md" />
        <h3 className="text-gray-800 font-medium">Add damage item</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        
        <div className="col-span-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">Branch</label>
          <input
            type="text"
            value={branchName || 'Lanthit'} 
            readOnly
            disabled
            style={INPUT_TEXT_SIZE}
            className={`${INPUT_CONTROL_BASE} rounded-md bg-gray-100 text-gray-600 focus:outline-none`}
          />
        </div>
        
        <div className="col-span-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">Product Code</label>
          <div className="flex">
            <input
              type="text"
              value={productCode}
              style={INPUT_TEXT_SIZE}
              onChange={(e) => setProductCode(e.target.value)}
              placeholder="Enter product code"
              className={`${INPUT_CONTROL_BASE} flex-grow rounded-l-md text-sm bg-white focus:outline-none`}
            />
            <button
              style={INPUT_TEXT_SIZE}
              onClick={handleSearch}
              disabled={isSearching}
              className={`flex items-center justify-center px-3 py-2 text-white rounded-r-md transition-colors text-sm ${
                isSearching 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-700'
              }`}
            >
              {isSearching ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-1" />
                  Search
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className="col-span-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">Case</label>
          <select
            style={INPUT_TEXT_SIZE}
            value={selectedCase}
            onChange={(e) => setSelectedCase(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md appearance-none bg-white pr-8 
             focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            {caseOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        
      </div>
    </div>
  );
}