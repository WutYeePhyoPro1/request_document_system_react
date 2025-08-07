import React, { useEffect, useState } from 'react';
import loginPhoto from "../../assets/images/login.png";
import { DiVim } from 'react-icons/di';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import pro1Logo from "../../assets/images/finallogo.png";
import InstallButton from '../../components/ui/InstallButton';


export default function Login() {
    const { login } = useAuth();
    const [employee_number, setemployee_number] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const navigate = useNavigate();
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    const [isVisible, setIsVisible] = useState(false);
    const token = localStorage.getItem("token");

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
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
        };
        subscribeToPush();
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        const savedPrompt = sessionStorage.getItem('deferredPrompt');
        if (savedPrompt) {
            setDeferredPrompt(JSON.parse(savedPrompt));
            setIsVisible(true);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = () => {
        if (deferredPrompt) {
            alert('hiii')
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                } else {
                    console.log('User dismissed the install prompt');
                }
                setDeferredPrompt(null);
                setIsVisible(false);
                sessionStorage.removeItem('deferredPrompt');
            });
        }
    };

    useEffect(() => {
        if (deferredPrompt) {
            sessionStorage.setItem('deferredPrompt', JSON.stringify(deferredPrompt));
        }
    }, [deferredPrompt]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await login(employee_number, password, remember);
        if (success) {
            navigate('/dashboard');
        }
    };

    return (

        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gray-100">
            <div className="w-full max-w-4xl lg:max-w-6xl xl:max-w-7xl rounded-lg p-4 sm:p-6 lg:p-8 bg-[#ecfeff] shadow-lg" style={{ border: '1px solid rgb(46, 162, 209)' }}>
                <div className="flex flex-col sm:flex-row items-center justify-between mb-6 sm:mb-8 lg:mb-10 gap-4">
                    <img src={pro1Logo} alt="Pro1 Logo" className="h-10 sm:h-12 md:h-14 lg:h-16 xl:h-18" />
                    <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-custom-blue text-center">
                        Request Document System
                    </h1>
                    <div className="hidden sm:block h-16 w-16 lg:h-20 lg:w-20"></div>
                </div>

                <div className="flex flex-col lg:flex-row items-center gap-6 md:gap-8 lg:gap-10 xl:gap-12">
                    <div className="hidden lg:block flex-1">
                        <img
                            src={loginPhoto}
                            alt="Login Visual"
                            className="w-full h-auto max-h-[300px] sm:max-h-[350px] md:max-h-[400px] lg:max-h-[450px] xl:max-h-[500px] object-contain"
                        />
                    </div>

                    <div className="w-full sm:max-w-md lg:max-w-lg xl:max-w-xl">
                        <form onSubmit={handleSubmit} className="w-full p-4 sm:p-6 md:p-8 bg-white rounded-lg shadow-sm">
                            <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-3xl xl:text-4xl font-bold mb-4 sm:mb-6 md:mb-8 text-custom-blue text-center">
                                Login
                            </h3>

                            <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
                                <div>
                                    <label className='text-xs sm:text-sm md:text-base lg:text-lg text-slate-800 font-medium mb-1 sm:mb-2 block'>
                                        Employee Number
                                    </label>
                                    <input
                                        name="employee_number"
                                        type="text"
                                        required
                                        className="border p-2 sm:p-3 w-full rounded-md text-xs sm:text-sm md:text-base lg:text-lg focus:outline-none"
                                        style={{ borderColor: '#2ea2d1' }}
                                        placeholder="Enter your employee number"
                                        value={employee_number}
                                        onChange={(e) => setemployee_number(e.target.value)}
                                        onFocus={(e) => e.target.style.borderColor = '#6fc3df'}
                                        onBlur={(e) => e.target.style.borderColor = '#2ea2d1'}
                                    />
                                </div>


                                <div>
                                    <label className='text-xs sm:text-sm md:text-base lg:text-lg text-slate-800 font-medium mb-1 sm:mb-2 block'>
                                        Password
                                    </label>
                                    <input
                                        name="password"
                                        type="password"
                                        required
                                        className="border p-2 sm:p-3 w-full rounded-md text-xs sm:text-sm md:text-base lg:text-lg focus:outline-none"
                                        style={{ borderColor: '#2ea2d1' }}
                                        placeholder="Enter Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onFocus={(e) => e.target.style.borderColor = '#6fc3df'}
                                        onBlur={(e) => e.target.style.borderColor = '#2ea2d1'}
                                    />
                                </div>

                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center">
                                        <input
                                            id="remember-me"
                                            name="remember"
                                            type="checkbox"
                                            className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-[#2ea2d1] focus:outline-none border-slate-300 rounded"
                                            checked={remember}
                                            onChange={(e) => setRemember(e.target.checked)}
                                        />
                                        <label htmlFor="remember-me" className="ml-2 text-xs sm:text-sm md:text-base lg:text-lg text-slate-500">
                                            Remember me
                                        </label>
                                    </div>
                                </div>

                            </div>

                            <div className="mt-6 sm:mt-8 md:mt-10 lg:mt-12">

                                <InstallButton />
                                <button
                                    type="submit"
                                    className="w-full py-2 sm:py-3 px-4 text-xs sm:text-sm md:text-base lg:text-lg font-semibold rounded text-white focus:outline-none transition-colors duration-300 transform hover:scale-[1.01] cursor-pointer"
                                    style={{
                                        backgroundColor: '#2ea2d1',
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#6fc3df'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = '#2ea2d1'}
                                >
                                    Log in
                                </button>

                            </div>
                        </form>
                    </div>

                </div>
            </div>
        </div>
    );
}




