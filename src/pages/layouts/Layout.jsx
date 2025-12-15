import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthContext'
import Sidebar from '../../components/Siderbar'
import Navbar from '../../components/Navbar'
import PushNotificationManager from '../../components/common/PushNotificationManager'

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('/sw.js').then(function (registration) {
            console.log('ServiceWorker registration successful');
        }, function (err) {
            // console.log('ServiceWorker registration failed: ', err);
        });
    });
}

export const subscribeUser = async (registration) => {
    console.log('Subscribing user to push notifications...');
    if (!registration || !registration.pushManager) {
        console.error('Push manager not available.');
        return;
    }
    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'BCPKeVfYglhfqpsmmQXv-MP7oihVtZiVzRUXkVxojeQgAlGOWB07YI77J-A8awLcqv4ZKNPHVFQimsrutIIeRhM',
    });

    console.log('User subscribed:', subscription);
    return subscription;
};

export const requestNotificationPermission = async () => {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
        console.log('Notification permission granted.');
    } else {
        console.log('Notification permission denied.');
    }
};

export default function Layout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <AuthProvider>
            <div className="h-screen flex flex-col">
                {/* Navbar at top */}
                <Navbar toggleSidebar={toggleSidebar} />

                {/* Sidebar + Page content */}
                <div className="flex flex-1 overflow-hidden">
                    <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

                    <div className="flex-1 overflow-y-auto p-3">
                        <Outlet />
                    </div>
                </div>

                {/* Footer */}
                <footer className="bg-[#A9D8E9] text-gray text-center py-2">
                    <p className="text-sm">
                        &copy; {new Date().getFullYear()} Pro1 Global Home Center. All rights reserved.
                    </p>
                </footer>
                
                {/* Push Notification Manager */}
                <PushNotificationManager />
            </div>
        </AuthProvider>
    )
}
