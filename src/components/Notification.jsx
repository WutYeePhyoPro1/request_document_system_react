import React, { useState } from 'react';
import { FaBell } from 'react-icons/fa';
import finalLogo from "../assets/images/finallogo.png";
import { Link } from 'react-router-dom';

export default function Notification({ notifications }) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const hasNotifications = notifications && notifications.length > 0;

    const toggleDropdown = () => {
        setIsDropdownOpen(prev => !prev);
    };

    const handleNotificationClick = () => {
        setIsDropdownOpen(false);
    };


    return (
        <div className="relative">
            <div className="relative cursor-pointer" onClick={toggleDropdown}>
                <FaBell className="text-2xl text-gray-700" />
                {hasNotifications && (
                    <span className="absolute -top-3 -right-3 flex items-center justify-center 
                                    h-6 w-6 text-sm font-bold text-white bg-red-600 rounded-full
                                    border-2 border-white shadow-lg">
                        {notifications.length}
                    </span>
                )}
            </div>

            {isDropdownOpen && hasNotifications && (
                <div className="absolute -right-30 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="max-h-60 overflow-y-auto">
                        {notifications.map((noti, index) => (

                            <Link
                                key={index}
                                to={`/cctv-details/${noti.specific_form_id}`}
                                className="flex p-3 border-b border-gray-200 hover:bg-gray-200 cursor-pointer"
                                onClick={handleNotificationClick}
                            >
                                <img
                                    src={finalLogo}
                                    alt="Logo"
                                    className="w-12 h-12 object-contain rounded-full mr-3"
                                />
                                <div className="flex-1">
                                    {noti?.form_id === 15 && (
                                        <h3 className="text-xs font-bold uppercase tracking-wider  mb-1">
                                            {noti?.form_name || 'Unknown Form'}
                                        </h3>
                                    )}
                                    <p className="font-semibold text-sm">{noti?.form_doc_no || 'Unknown Document'}</p>
                                    <p className="font-semibold text-sm">{noti?.status || 'Unknown status'}</p>
                                    <p className="text-xs text-blue-500">
                                        {new Date(noti?.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>

                    <button
                        onClick={toggleDropdown}
                        className="w-full text-center text-blue-500 text-sm py-2 hover:bg-gray-100 border-t border-gray-200"
                    >
                        Close
                    </button>
                </div>
            )}
        </div>
    );
}
