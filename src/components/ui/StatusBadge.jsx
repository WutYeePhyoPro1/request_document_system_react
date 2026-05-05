import React from "react";

export default function StatusBadge({ status, count }) {
  const normalized = status?.toLowerCase();

  const getBadgeClass = () => {
    // If count is provided, use count-based styling
    if (count !== undefined && count !== null) {
      if (count > 0) return "bg-red-500 text-white";
     
    }
    
    // Match Laravel blade badge colors exactly from custom.css
    switch (normalized) {
      case "default":
        return "bg-[#3c7cc1] text-[#fff]";
      case "ongoing":
        return "bg-[#fbb193] text-[#e1341e]";
      case "checked":
        // custom-badge-bg-checked: bg #fedec3, text #fb923c
        return "bg-[#fedec3] text-[#fb923c]";
      case "unchecked":
        return "bg-red-500 text-[#fff]";
      case "check":
        // custom-badge-bg-checked: bg #fedec3, text #fb923c
        return "bg-[#fedec3] text-[#fb923c]";
      case "bm approved":
      case "bmapproved":
        // custom-badge-bg-bm-approved: bg #ffeaab, text #e6ac00
        return "bg-[#ffeaab] text-[#e6ac00]";
      case "approved":
      case "opapproved":
      case "op approved":
        // custom-badge-bg-approved: bg #e9f9cf, text #a3e635
        return "bg-[#e9f9cf] text-[#a3e635]";
      case "completed":
      case "issued":
      case "supervisorissued":
        // custom-badge-bg-completed: bg #adebbb, text #28a745
        return "bg-[#adebbb] text-[#28a745]";
      case "cancel":
      case "cancelled":
        // custom-badge-bg-cancel: bg #fda19d, text #f91206
        return "bg-[#fda19d] text-[#f91206]";
      case "acknowledged":
         return "bg-[#2e4702ff] text-[#fff]";
      case "ac_acknowledged":
        // custom-badge-bg-acknowledged: use OP Approved colors bg #e9f9cf, text #2e4702ff
        return "bg-[#e9f9cf] text-[#a3e635]";
      case "already changed":
          return "bg-[#14b8a6] text-white font-semibold";
      case "partial":
          return "bg-[#ffb703] text-[#7c2d12] font-bold";
      case "pass approval":
          return "bg-[#007bff1a] text-[#007bff]";
      case "failed":
             return "bg-[#fecaca] text-[#991b1b]";
      case "success":
        return "bg-[#adebbb] text-[#28a745]";
      default:
        return "bg-gray-200 text-gray-600";
    }
  };

  // Map status to display text
  const getDisplayText = () => {
    if (count !== undefined && count !== null) {
      return `Total Count:${count} items`;
    }
    
    // Map Ac_Acknowledged to "Operation Manager Approved"
    // if (normalized === 'ac_acknowledged' || normalized === 'acknowledged') {
    //   return 'Operation Manager Approved';
    // }
    
    return status;
  };

  return (
    <div className="flex flex-col mb-2">
      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold w-fit ${getBadgeClass()}`}
      >
        {getDisplayText()}
      </span>
    </div>
  );
}