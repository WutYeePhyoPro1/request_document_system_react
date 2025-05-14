import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import finallogo from "../assets/images/finallogo.png";
import { AiOutlineMenu } from "react-icons/ai";
import { FaBell } from "react-icons/fa";
import { useAuth } from '../context/AuthContext';

export default function Navbar({ toggleSidebar }) {
    const { user, logout } = useAuth();

    const [menuOpen, setMenuOpen] = useState(false);
    const userRoleId = user ? user.id : null;
    console.log(userRoleId);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState(() => {
        const savedNotifications = localStorage.getItem('notifications');
        return savedNotifications ? JSON.parse(savedNotifications) : [];
    });
    const hasNotifications = notifications.length > 0;
    const token = localStorage.getItem('token');

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const subscribeToPush = async () => {
        try {
            if (!('serviceWorker' in navigator)) {
                console.error('Service Worker not supported');
                return;
            }

            const registration = await navigator.serviceWorker.register('/sw.js');
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                console.warn('Notification permission denied');
                return;
            } React

            let subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
                // console.log('Old subscription removed');
            }

            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(
                    'BCPKeVfYglhfqpsmmQXv-MP7oihVtZiVzRUXkVxojeQgAlGOWB07YI77J-A8awLcqv4ZKNPHVFQimsrutIIeRhM'
                ),
            });


            const response = await fetch('/api/notifications/push/subscribe', {

                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(subscription),
            });

            if (!response.ok) {
                throw new Error('Failed to save subscription');
            }

            // console.log('Push Subscription saved successfully!');
        } catch (error) {
            console.error('Error in subscribeToPush:', error);
        }
    };

    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!user || !token) return;
            try {
                const response = await fetch(`/api/notifications/${userRoleId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) throw new Error("Unauthorized access");

                const data = await response.json();
                const newNotifications = data.map(notification => ({
                    id: notification.id,
                    message: notification.data.message,
                    document_id: notification.data.document_id,
                    createdAt: notification.created_at,
                    readAt: notification.read_at,
                }));

                if (newNotifications.length > notifications.length) {
                    setNotifications(newNotifications);
                    localStorage.setItem("notifications", JSON.stringify(newNotifications));
                }
            } catch (error) {
                console.error("Error fetching notifications:", error);
            }
        };

        fetchNotifications();
        subscribeToPush();
        const interval = setInterval(fetchNotifications, 10000);

        return () => clearInterval(interval);
    }, [userRoleId, token]);

    return (
        <nav className="bg-[#A9D8E9] text-gray-800 py-4 px-6 flex items-center justify-between relative">
            <Link to="/admin/home" className="flex items-center space-x-2">
                <img src={finallogo} alt="homepage" className="h-12" />
            </Link>
            <span className="text-xl font-bold text-blue-600">REQUEST DOCUMENT SYSTEM</span>

            <div className="flex items-center space-x-6">
                <div className="relative">
                    <FaBell className="text-xl cursor-pointer" />
                    {hasNotifications && (
                        <span className="absolute top-0 right-0 inline-flex items-center justify-center h-4 w-4 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                            {notifications.length}
                        </span>
                    )}
                </div>
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="flex items-center space-x-2 bg-white px-3 py-2 rounded-md shadow-sm hover:bg-gray-100"
                    >
                        <span className="font-semibold text-sm">
                            {user?.name || "Miss.Wut Yee Phyo"}
                        </span>
                        <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                    </button>

                    {menuOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                            <div className="p-3 font-semibold border-b border-gray-100">
                                {user?.name}
                            </div>
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
                </div>

                <button onClick={toggleSidebar} className="md:hidden text-gray-700">
                    <AiOutlineMenu size={28} />
                </button>
            </div>
        </nav>
    );
}
