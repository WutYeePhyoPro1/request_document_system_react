import React from 'react'

export default function StatusBadge({ status }) {

    const normalized = status?.toLowerCase();

    // Determine badge style based on status
    const getBadgeClass = () => {
        switch (normalized) {
            case 'ongoing':
                return 'bg-[#fbb193] text-[#e1341e]';
            case 'check':
                return 'bg-[#fedec3] text-[#fb923c]';
            case 'bm approved':
                return 'bg-[#ffeaab] text-[#e6ac00]';
            case 'approved':
                return 'bg-[#ffeaab] text-[#e6ac00]';
            case 'completed':
                return 'bg-[#adebbb] text-[#28a745]';
            case 'cancel':
                return 'bg-[#fda19d] text-[#f91206]';
            default:
                return 'bg-gray-200 text-gray-600';
        }
    };
    return (
        <div className="flex flex-col mb-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold w-fit ${getBadgeClass()}`}>
                {status}
            </span>
        </div>
    )
}
