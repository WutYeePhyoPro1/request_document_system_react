// context/NotificationContext.js
import { createContext, useState, useEffect } from "react";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem('notifications');
        if (stored) {
            setNotifications(JSON.parse(stored));
        }
        setLoading(false);
    }, []);
// console.log("Hello Testing>>" , notifications)
    return (
        <NotificationContext.Provider value={{ notifications, setNotifications, loading }}>
            {children}
        </NotificationContext.Provider>
    );
};
