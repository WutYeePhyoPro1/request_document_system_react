

// import { createContext, useContext, useState } from 'react';
// import { confirmAlert } from 'react-confirm-alert';
// import 'react-confirm-alert/src/react-confirm-alert.css';

// const AuthContext = createContext();

// const getUserFromStorage = () => {
//     try {
//         const user = localStorage.getItem('user');
//         return user ? JSON.parse(user) : null;
//     } catch {
//         localStorage.removeItem('user');
//         return null;
//     }
// };

// export const AuthProvider = ({ children }) => {
//     const [user, setUser] = useState(getUserFromStorage());

//     const login = async (employee_number, password, remember = false) => {
//         try {
//             const response = await fetch("/api/login", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ employee_number, password, remember }),
//             });

//             const data = await response.json();

//             if (response.ok) {
//                 localStorage.setItem('token', data.token);
//                 localStorage.setItem('user', JSON.stringify(data.user));
//                 setUser(data.user);
//                 return true;
//             } else {
//                 confirmAlert({
//                     title: "Login Failed",
//                     message: data.message || "Something went wrong.",
//                     buttons: [
//                         {
//                             label: "OK",
//                             onClick: () => { }
//                         }
//                     ],
//                 });
//                 return false;
//             }
//         } catch (error) {
//             console.error("Error during login:", error);
//             confirmAlert({
//                 title: "Error",
//                 message: "Network error or server issue.",
//                 buttons: [
//                     {
//                         label: "OK",
//                         onClick: () => { }
//                     }
//                 ],
//             });
//             return false;
//         }
//     };

//     const logout = () => {
//         setUser(null);
//         localStorage.removeItem('token');
//         localStorage.removeItem('user');
//         localStorage.removeItem('notifications');
//     };

//     return (
//         <AuthContext.Provider value={{ user, login, logout }}>
//             {children}
//         </AuthContext.Provider>
//     );
// };

// export const useAuth = () => useContext(AuthContext);


import { createContext, useContext, useEffect, useState } from 'react';
import { confirmAlert } from 'react-confirm-alert';
import { jwtDecode } from 'jwt-decode';
import 'react-confirm-alert/src/react-confirm-alert.css';

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
                showError(data.message || "Something went wrong.");
                return false;
            }
        } catch (error) {
            showError("Network error or server issue.");
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('notifications');
    };

    const showError = (message) => {
        confirmAlert({
            title: "Error",
            message,
            buttons: [{ label: "OK", onClick: () => { } }],
        });
    };

    // ⏰ Set up auto-logout timer
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        let timeoutId;

        try {
            const decoded = jwtDecode(token);
            const expirationTime = decoded.exp * 1000; // Convert to milliseconds
            const currentTime = Date.now();
            const timeLeft = expirationTime - currentTime;

            if (timeLeft <= 0) {
                logout();
                return;
            }

            // Set timeout to auto-logout when token expires
            timeoutId = setTimeout(() => {
                logout();
                confirmAlert({
                    title: "Session Expired",
                    message: "Your session has expired. Please log in again.",
                    buttons: [{ label: "OK", onClick: () => { } }],
                });
            }, timeLeft);
        } catch (err) {
            logout(); // Invalid token
        }

        return () => clearTimeout(timeoutId);
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
