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
const getTokenFromStorage = () => localStorage.getItem("token") || null;

    export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(getUserFromStorage());
   const [token, setToken] = useState(getTokenFromStorage());
    const login = async (employee_number, password, remember = false) => {
        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ employee_number, password, remember }),
            });
            
            const data = await response.json();
            console.log("ApiData>>" , response.data) ;

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

   const logout = async () => {
    try {
        const token = localStorage.getItem("token");

        if (token) {
            await fetch("/api/logout", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                },
                credentials: "include",
            });
        }
                console.log("Logout request success" , user);

    } catch (e) {
        console.warn("Logout request failed:", e);
    } finally {
        setUser(null);
        setToken(null);

        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("notifications");
        window.location.replace("/login");
        console.log("Logout request success" , user);
    }
};
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
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            
            const response = await axios.post('/api/auto-login', { token }, {
                withCredentials: true 
            });
            
            if (response.data && response.data.user) {
                const enriched = { ...response.data.user };
                if (!enriched.user_type) {
                  if (enriched.employee_number === '666-666666' || enriched.emp_id === '666-666666') {
                    enriched.user_type = 'A2';
                  } else if (Number(enriched.role_id) === 3) {
                    enriched.user_type = 'A1';
                  }
                }
                
                // Store new user data
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(enriched));
                setUser(enriched);
                
                console.log('[AUTO-LOGIN] User logged in:', enriched.name, enriched.emp_id);
                return true;
            }
        } catch (error) {
            console.error('Auto-login failed:', error);
        }
        return false;
    };


    return (
        <AuthContext.Provider value={{ user, login, logout, loginWithToken , token}}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);