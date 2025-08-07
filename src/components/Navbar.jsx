

import React, { useState, useRef, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AiOutlineMenu } from "react-icons/ai";
import finalLogo from "../assets/images/finallogo.png";

import { useAuth } from '../context/AuthContext';
import NotificationIcon from './Notification';
import { NotificationContext } from "../context/NotificationContext"; // ✅

export default function Navbar({ toggleSidebar }) {
    const { user, logout } = useAuth();
    const { notifications, setNotifications } = useContext(NotificationContext); // ✅
    const token = localStorage.getItem("token");
    const userRoleId = user?.id;

    const [menuOpen, setMenuOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const subscribeToPush = async () => {
        if (!('serviceWorker' in navigator)) {
            console.error('Service Worker not supported');
            return;
        }

        // Register Service Worker
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log(registration);

        // Request Notification Permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            // console.error('Notification permission denied');
            return;
        }

        // Subscribe to Push
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: 'BCPKeVfYglhfqpsmmQXv-MP7oihVtZiVzRUXkVxojeQgAlGOWB07YI77J-A8awLcqv4ZKNPHVFQimsrutIIeRhM', // Replace with your VAPID_PUBLIC_KEY
        });

        // Send subscription to backend
        await fetch('/api/notifications/push/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(subscription),
        });

        console.log('Push subscription saved.');
    };


    useEffect(() => {
        const fetchNotifications = async () => {
            if (!user || !token) return;
            try {
                const res = await fetch(`/api/notifications/${userRoleId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) throw new Error("Unauthorized");

                const data = await res.json();

                const parsed = data.map(n => ({
                    form_id: n.data.form_id,
                    specific_form_id: n.data.specific_form_id,
                    form_doc_no: n.data.form_doc_no,
                    created_at: n.created_at,
                    form_name: n.form_name,
                    status: n.status,
                }));

                setNotifications(parsed); // ✅ context update
                localStorage.setItem("notifications", JSON.stringify(parsed)); // fallback store
            } catch (err) {
                console.error("Notification fetch error:", err);
            }
        };

        fetchNotifications();
        subscribeToPush();
        const interval = setInterval(fetchNotifications, 10000);
        return () => clearInterval(interval);
    }, [userRoleId, token, setNotifications]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-[#A9D8E9] text-gray-800 py-4 px-6 flex items-center justify-between relative">
            <Link to="/dashboard" className="flex items-center space-x-2">
                <img src={finalLogo} alt="homepage" className="h-8 sm:h-10 md:h-12 object-contain" />
            </Link>
            <span className="hidden sm:block text-xl sm:text-lg md:text-xl lg:text-2xl font-bold text-custom-blue sm:pl-4">
                REQUEST DOCUMENT SYSTEM
            </span>

            <div className="flex items-center space-x-4">
                <NotificationIcon notifications={notifications} />
                {/* <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="flex items-center space-x-2 bg-white px-2 py-1 rounded-md shadow-sm hover:bg-gray-100 text-sm cursor-pointer"
                    >
                        <span className="font-semibold">{user?.name || "User"}</span>
                        <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                    </button>

                    {menuOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                            <div className="p-3 font-semibold border-b border-gray-100">{user?.name}</div>
                            <ul className="text-sm text-gray-700">
                                <li>
                                    <Link to="/change-password" className="block px-4 py-2 hover:bg-gray-100">
                                        🔒 Change Password
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/head-office" className="block px-4 py-2 hover:bg-gray-100">
                                        🏢 Head Office
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/system-development" className="block px-4 py-2 hover:bg-gray-100">
                                        🖥️ System Development
                                    </Link>
                                </li>
                                <li>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                                    >
                                        🚪 Sign Out
                                    </button>
                                </li>
                            </ul>
                        </div>
                    )}
                </div> */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="flex items-center space-x-2 bg-white px-2 py-1 rounded-md shadow-sm hover:bg-gray-100 text-sm cursor-pointer"
                    >
                        {/* Human icon - shows on mobile only */}
                        <svg
                            className="w-5 h-5 md:hidden"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                        </svg>

                        {/* Username - shows on medium screens and up */}
                        <span className="hidden md:inline font-semibold">{user?.name || "User"}</span>

                        {/* Dropdown chevron */}
                        <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                    </button>

                    {menuOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                            <div className="p-3 font-semibold border-b border-gray-100 flex items-center">
                                {/* Human icon in dropdown header */}
                                <svg
                                    className="w-5 h-5 mr-2"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    />
                                </svg>
                                {user?.name}
                            </div>
                            <ul className="text-sm text-gray-700">
                                <li>
                                    <span className="block px-4 py-2 text-gray-400 cursor-not-allowed select-none">
                                        🔒 Change Password
                                    </span>
                                </li>
                                <li>
                                    <span className="block px-4 py-2 text-gray-400 cursor-not-allowed select-none">
                                        🏢 Head Office
                                    </span>
                                </li>
                                <li>
                                    <span className="block px-4 py-2 text-gray-400 cursor-not-allowed select-none">
                                        🖥️ System Development
                                    </span>
                                </li>
                                <li>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                                    >
                                        🚪 Sign Out
                                    </button>
                                </li>
                            </ul>


                        </div>
                    )}
                </div>

                <button onClick={toggleSidebar} className="block sm:hidden text-gray-700">
                    <AiOutlineMenu size={28} />
                </button>
            </div>
        </nav>
    );
}
