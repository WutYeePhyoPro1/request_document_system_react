import React from 'react';

const Pagination = ({ totalRows, rowsPerPage, currentPage, onPageChange }) => {
  const total = Number(totalRows) || 0;
  const perPage = Number(rowsPerPage) || 1;
  const current = Number(currentPage) || 1;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const getPageNumbers = () => {
    const pages = [];

    if (totalPages <= 12) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    
    pages.push(1);
    
    if (current <= 6) {
      for (let i = 2; i <= 10; i++) pages.push(i);
      pages.push('ellipsis', totalPages - 1, totalPages);
    } else if (current > 6 && current < totalPages - 5) {
      pages.push('ellipsis-start');
      for (let i = current - 2; i <= current + 2; i++) pages.push(i);
      pages.push('ellipsis-end', totalPages - 1, totalPages);
    } else {
      pages.push('ellipsis');
      for (let i = totalPages - 9; i <= totalPages; i++) pages.push(i);
    }
    
    return pages;
  };

  return (
    <div className="flex items-center space-x-1">
      <button
        className="px-3 py-2 text-[#0dcaf0] hover:bg-[#0dcaf0]/10 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => onPageChange?.(Math.max(1, current - 1))}
        disabled={current <= 1}
      >
        &lt;
      </button>
      
      {getPageNumbers().map((page, index) => {
        if (typeof page === 'string') {
          return <span key={`ellipsis-${index}`} className="px-2 py-2 text-[#0dcaf0]">...</span>;
        }
        
        return (
          <button
            key={page}
            className={`px-4 py-2 text-sm font-semibold rounded ${
              page === current ? 'bg-[#0dcaf0] text-white' : 'text-[#0dcaf0] hover:bg-[#0dcaf0]/10'
            }`}
            onClick={() => onPageChange?.(page)}
          >
            {page}
          </button>
        );
      })}
      
      <button
        className="px-3 py-2 text-[#0dcaf0] hover:bg-[#0dcaf0]/10 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => onPageChange?.(Math.min(totalPages, current + 1))}
        disabled={current >= totalPages}
      >
        &gt;
      </button>
    </div>
  );
};

export default Pagination;

