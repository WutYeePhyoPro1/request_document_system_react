import { createContext, useContext, useEffect, useState } from 'react';
import { confirmAlert } from 'react-confirm-alert';
import { jwtDecode } from 'jwt-decode';
import 'react-confirm-alert/src/react-confirm-alert.css';
import axios from 'axios';

const AuthContext = createContext();

const getUserFromStorage = () => {
    try {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    } catch {
        localStorage.removeItem('user');
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(getUserFromStorage());

    const login = async (employee_number, password, remember = false) => {
        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ employee_number, password, remember }),
            });
            
            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                setUser(data.user);
                return true;
            } else {
                confirmAlert({
                    title: "Login Failed",
                    message: data.message || "Something went wrong.",
                    buttons: [{ label: "OK", onClick: () => { } }],
                });
                return false;
            }
        } catch (error) {
            console.error("Error during login:", error);
            confirmAlert({
                title: "Error",
                message: "Network error or server issue.",
                buttons: [{ label: "OK", onClick: () => { } }],
            });
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('notifications');
        window.location.href = "/login"; // ✅ Safe redirect
    };

    // ⏰ Auto logout when JWT token expires
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        let timeoutId;

        try {
            const decoded = jwtDecode(token);
            const expTime = decoded.exp * 1000; // ms
            const now = Date.now();
            const timeLeft = expTime - now;

            if (timeLeft <= 0) {
                logout();
                return;
            }

            timeoutId = setTimeout(() => {
                logout();
                confirmAlert({
                    title: "Session Expired",
                    message: "Your session has expired. Please log in again.",
                    buttons: [{ label: "OK", onClick: () => window.location.href = "/login" }]
                });
            }, timeLeft);
        } catch (err) {
            console.error("Invalid token. Logging out...");
            logout();
        }

        return () => clearTimeout(timeoutId);
    }, [user]);


    const loginWithToken = async (token) => {
        try {
            const response = await axios.post('/api/auto-login', { token }); // Adjust endpoint as needed
            if (response.data && response.data.user) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                setUser(response.data.user);
                return true;

                // setUser(response.data.user);
                // localStorage.setItem('authToken', token); // optional
                // return true;
            }
        } catch (error) {
            console.error('Auto-login failed:', error);
        }
        return false;
    };


    return (
        <AuthContext.Provider value={{ user, login, logout, loginWithToken }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
