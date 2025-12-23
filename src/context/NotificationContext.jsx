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
            // The API may return an object with multiple fields (e.g. { formData, getUnreadNoti }).
            // Many components expect `notifications` to be an array of unread notifications,
            // so prefer `getUnreadNoti` if present. Otherwise, if the response itself is an array,
            // use it directly. Fallback to an empty array.
            if (response && Array.isArray(response.getUnreadNoti)) {
              setNotifications(response.getUnreadNoti);
            } else if (Array.isArray(response)) {
              setNotifications(response);
            } else if (response && Array.isArray(response.getUnreadNoti?.data)) {
              // In some cases the API may wrap data inside a `data` field.
              setNotifications(response.getUnreadNoti.data);
            } else {
              console.warn('[NotificationContext] Unexpected notifications payload, normalizing to empty array', response);
              setNotifications([]);
            }
          } catch (error) {
            console.error('[NotificationContext] Failed to fetch notifications:', error);
            setNotifications([]);
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
