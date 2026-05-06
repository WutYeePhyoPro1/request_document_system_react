import React from "react";

interface StatusBadgeProps {
  status?: string | null;
  count?: number | null;
}

const TsStatusBadge: React.FC<StatusBadgeProps> = ({ status, count }) => {
  const normalized = status?.toLowerCase() ?? "";

  const getBadgeClass = (): string => {
    // Count-based styling
    if (count !== undefined && count !== null) {
      if (count > 0) return "bg-red-500 text-white";
    }

    // Status-based styling
    switch (normalized) {
      case "default":
        return "bg-[#3c7cc1] text-[#fff]";
      case "ongoing":
        return "bg-[#fbb193] text-[#e1341e]";
      case "checked":
      case "check":
        return "bg-[#fedec3] text-[#fb923c]";
      case "unchecked":
        return "bg-red-500 text-[#fff]";
      case "bm approved":
      case "bmapproved":
        return "bg-[#ffeaab] text-[#e6ac00]";
      case "approved":
      case "opapproved":
      case "op approved":
        return "bg-[#e9f9cf] text-[#a3e635]";
      case "completed":
      case "issued":
      case "supervisorissued":
        return "bg-[#adebbb] text-[#28a745]";
      case "cancel":
      case "cancelled":
        return "bg-[#fda19d] text-[#f91206]";
      case "acknowledged":
        return "bg-[#2e4702ff] text-[#fff]";
      case "ac_acknowledged":
        return "bg-[#e9f9cf] text-[#a3e635]";
      case "already changed":
        return "bg-[#14b8a6] text-white font-semibold";
      case "partial":
        return "bg-[#ffb703] text-[#7c2d12] font-bold";
      case "pass approval":
        return "bg-[#007bff1a] text-[#007bff]";
      case "failed":
        return "bg-[#fecaca] text-[#991b1b]";
      default:
        return "bg-gray-200 text-gray-600";
    }
  };

  const getDisplayText = (): string | undefined => {
    if (count !== undefined && count !== null) {
      return `Total Count: ${count} items`;
    }
    return status ?? "";
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
};

export default TsStatusBadge;
