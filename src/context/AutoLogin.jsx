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

        if (token) {
            loginWithToken(token).then(success => {
                if (success) {
                    navigate('/cctv-index');
                } else {
                    navigate('/login');
                }
            });
        } else {
            navigate('/login');
        }
    }, []);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <p>Logging in...</p>
        </div>
    );
}
