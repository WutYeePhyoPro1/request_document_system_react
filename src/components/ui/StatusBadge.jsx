import React from "react";

export default function StatusBadge({ status, count }) {
  const normalized = status?.toLowerCase();

  const getBadgeClass = () => {
    // If count is provided, use count-based styling
    if (count !== undefined && count !== null) {
      if (count > 0) return "bg-red-500 text-white";
     
    }
    
    // Otherwise use status-based styling
    switch (normalized) {
      case "ongoing":
        return "bg-[#fbb193] text-[#e1341e]";
      case "checked":
        return "bg-[#28a745] text-[#fff]";
      case "unchecked":
        return "bg-red-500 text-[#fff]";
      case "check":
        return "bg-[#fedec3] text-[#fb923c]";
      case "bm approved":
        return "bg-blue-100 text-blue-700";
      case "approved":
        return "bg-[#ffeaab] text-[#e6ac00]";
      case "completed":
        return "bg-[#adebbb] text-[#28a745]";
      case "cancel":
        return "bg-[#fda19d] text-[#f91206]";
      case "acknowledged": 
        return "bg-[#ffeaab] text-[#28a745]";
      default:
        return "bg-gray-200 text-gray-600";
    }
  };

  const displayText = count !== undefined && count !== null ? `Total Count:${count} items` : status;

  return (
    <div className="flex flex-col mb-2">
      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold w-fit ${getBadgeClass()}`}
      >
        {displayText}
      </span>
    </div>
  );
}