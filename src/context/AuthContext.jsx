import { createContext, useContext, useState } from 'react';
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const login = async (employee_number, password, remember = false) => {
        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ employee_number, password, remember }),
            });
            const data = await response.json();
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            if (response.ok) {
                setUser(data.user);
                return true;
            } else {
                console.error("Login failed:", response.data.message);
                return false;
            }
        } catch (error) {
            console.error("Error during login:", error);
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('notifications');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);