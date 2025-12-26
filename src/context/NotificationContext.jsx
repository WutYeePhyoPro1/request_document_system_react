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
            // Debug: log badgeNoti response
            // eslint-disable-next-line no-console
            console.log('[NotificationContext] fetching badgeNoti, token present');
            const response = await badgeNoti(token);
            // eslint-disable-next-line no-console
            console.log('[NotificationContext] badgeNoti response:', response);

            // Normalize incoming noti array
            const incomingNoti = Array.isArray(response) ? response : response.getUnreadNoti || [];

            setNotifications((prev) => {
              // If incoming empty and prev exists, preserve
              if ((!incomingNoti || incomingNoti.length === 0) && prev && prev.length > 0) {
                // eslint-disable-next-line no-console
                console.log('[NotificationContext] preserving existing notifications because incoming is empty');
                return prev;
              }

              // Merge by id
              const map = new Map();
              (prev || []).forEach((n) => map.set(n.id || JSON.stringify(n), n));
              (incomingNoti || []).forEach((n) => map.set(n.id || JSON.stringify(n), n));
              return Array.from(map.values());
            });
          } catch (error) {
            console.error(error);
          }
        };

        fetchNoti();
      }, []);
    return (
        <NotificationContext.Provider value={{ notifications, setNotifications, loading }}>
            {children}
        </NotificationContext.Provider>
    );
};
