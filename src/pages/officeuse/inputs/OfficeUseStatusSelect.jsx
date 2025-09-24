import React, { useState } from 'react';
import Select from 'react-select'; // Changed from 'react-select/base'

export default function OfficeUseStatusSelect({ availableStatuses = [], defaultSelected = [] }) {
    const statusOptions = [
        { value: "All", label: "All" },
        { value: "Default", label: "Default" },
        { value: "Ongoing", label: "Ongoing" },
        { value: "Checked", label: "Checked" },
        { value: "MerMgr Approved", label: "MerMgr Approved" },
        { value: "Mgr Approved", label: "Mgr Approved" },
        { value: "BM Approved", label: "BM Approved" },
        { value: "Acknowledged", label: "Acknowledged" },
        { value: "Approved", label: "Approved" },
        { value: "OpApproved", label: "Operation Manager Approved" },
        { value: "Recommend", label: "Recommend" },
        { value: "Issued", label: "Issued" },
        { value: "Received", label: "Received" },
        { value: "Completed", label: "Completed" },
        { value: "Cancel", label: "Cancel" },
    ];

    // Use the defaultSelected prop instead of hardcoding
    const [selectedStatuses, setSelectedStatuses] = useState(
        defaultSelected.map(status => ({ value: status, label: status }))
    );

    return (
        <div className="flex flex-col">
            <label htmlFor="status" className="mb-1 font-medium text-gray-700">
                Status
            </label>
            <Select
                isMulti
                options={statusOptions}
                value={selectedStatuses}
                onChange={(selected) => {
                    setSelectedStatuses(selected || []);
                }}
                className="basic-multi-select"
                classNamePrefix="select"
            />
        </div>
    );
}