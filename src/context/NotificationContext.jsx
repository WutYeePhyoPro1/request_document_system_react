// context/NotificationContext.js
import React, { createContext, useState, useEffect } from "react";
import { badgeNoti } from "../api/badgeNoti";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    // useEffect(() => {
    //     const stored = localStorage.getItem('notifications');
    //     if (stored) {
    //         setNotifications(JSON.parse(stored));
    //     }
    //     setLoading(false);
    // }, []);
     useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;
    
        const fetchNoti = async () => {
          try {
            const response = await badgeNoti(token);
            setNotifications(response);
          } catch (error) {
            console.error(error);
          }
        };
    
        fetchNoti();
      }, []);
     
console.log("Hello Testing>>" , notifications)
    return (
        <NotificationContext.Provider value={{ notifications, setNotifications, loading }}>
            {children}
        </NotificationContext.Provider>
    );
};
