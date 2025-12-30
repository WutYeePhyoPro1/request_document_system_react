import axios from 'axios';
import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext';

export default function AutoLogin() {
    const { loginWithToken } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const redirect = params.get('redirect');

        if (token) {
            loginWithToken(token).then(success => {
                if (success) {
                    // Handle different redirect destinations
                    if (redirect === 'big-damage-issue') {
                        navigate('/big_damage_issue'); // Note: underscore in route
                    } else if (redirect === 'cctv') {
                        navigate('/cctv-index');
                    } else {
                        // Default redirect based on the redirect param or cctv-index
                        navigate(redirect ? `/${redirect}` : '/cctv-index');
                    }
                } else {
                    navigate('/login');
                }
            });
        } else {
            navigate('/login');
        }
    }, []);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-white text-lg">Logging in...</p>
            </div>
        </div>
    );
}
